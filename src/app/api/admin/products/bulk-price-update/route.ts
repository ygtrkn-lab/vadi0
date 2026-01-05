import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';
import { transformProducts } from '@/lib/transformers';

interface BulkPriceUpdateRequest {
  operation: 'increase' | 'decrease';
  percentage: number;
  filters?: {
    category?: string;
    inStock?: boolean;
    priceRange?: {
      min?: number;
      max?: number;
    };
  };
  productIds?: number[]; // Optional: specific product IDs
}

interface BulkPriceUpdateResponse {
  success: boolean;
  message: string;
  stats: {
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
  };
  errors?: Array<{
    productId: number;
    productName: string;
    error: string;
  }>;
  preview?: Array<{
    id: number;
    name: string;
    currentPrice: number;
    newPrice: number;
    currentOldPrice: number;
    newOldPrice: number;
  }>;
}

/**
 * Calculate new price based on percentage adjustment
 */
function calculateNewPrice(
  currentPrice: number,
  operation: 'increase' | 'decrease',
  percentage: number
): number {
  const multiplier = operation === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);
  return Math.round(currentPrice * multiplier);
}

/**
 * POST /api/admin/products/bulk-price-update
 * Bulk price adjustment for products
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkPriceUpdateRequest & { preview?: boolean } = await request.json();
    const { operation, percentage, filters, productIds, preview = false } = body;

    // Validation
    if (!operation || !['increase', 'decrease'].includes(operation)) {
      return NextResponse.json(
        { success: false, message: 'Invalid operation. Must be "increase" or "decrease"' },
        { status: 400 }
      );
    }

    if (!percentage || percentage <= 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid percentage. Must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from('products')
      .select('id, name, slug, price, old_price, discount, category, in_stock');

    // Apply filters
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    } else {
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.inStock !== undefined) {
        query = query.eq('in_stock', filters.inStock);
      }

      if (filters?.priceRange?.min !== undefined) {
        query = query.gte('price', filters.priceRange.min);
      }

      if (filters?.priceRange?.max !== undefined) {
        query = query.lte('price', filters.priceRange.max);
      }
    }

    // Fetch products
    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch products', error: fetchError.message },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products match the specified filters',
        stats: {
          totalProcessed: 0,
          successCount: 0,
          failedCount: 0,
          skippedCount: 0,
        },
      });
    }

    // Calculate new prices
    const updates = products.map((product) => {
      const newPrice = calculateNewPrice(product.price, operation, percentage);
      const newOldPrice = calculateNewPrice(product.old_price || product.price, operation, percentage);
      
      // Calculate new discount percentage if oldPrice exists
      let newDiscount = 0;
      if (newOldPrice > newPrice) {
        newDiscount = Math.round((1 - newPrice / newOldPrice) * 100);
      }

      return {
        id: product.id,
        name: product.name,
        currentPrice: product.price,
        currentOldPrice: product.old_price,
        newPrice,
        newOldPrice,
        newDiscount,
      };
    });

    // Preview mode: just return the calculations without updating
    if (preview) {
      return NextResponse.json({
        success: true,
        message: `Preview: ${updates.length} products will be updated`,
        stats: {
          totalProcessed: updates.length,
          successCount: 0,
          failedCount: 0,
          skippedCount: 0,
        },
        preview: updates,
      });
    }

    // Batch update products (100 at a time)
    const BATCH_SIZE = 100;
    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ productId: number; productName: string; error: string }> = [];

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      
      // Update each product in the batch
      const batchPromises = batch.map(async (update) => {
        try {
          const { error: updateError } = await supabaseAdmin
            .from('products')
            .update({
              price: update.newPrice,
              old_price: update.newOldPrice,
              discount: update.newDiscount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', update.id);

          if (updateError) {
            throw updateError;
          }
          
          return { success: true, id: update.id };
        } catch (error) {
          return {
            success: false,
            id: update.id,
            name: update.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const results = await Promise.all(batchPromises);
      
      results.forEach((result) => {
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push({
            productId: result.id,
            productName: result.name || 'Unknown',
            error: result.error || 'Unknown error',
          });
        }
      });
    }

    // Save to pricing history in settings
    try {
      await supabaseAdmin.from('site_settings').upsert({
        category: 'pricing_history',
        key: `bulk_update_${Date.now()}`,
        value: {
          timestamp: new Date().toISOString(),
          operation,
          percentage,
          filters,
          productIds: productIds || null,
          stats: {
            totalProcessed: updates.length,
            successCount,
            failedCount,
          },
        },
        is_public: false,
        updated_at: new Date().toISOString(),
      });
    } catch (historyError) {
      console.error('Failed to save pricing history:', historyError);
      // Don't fail the request if history save fails
    }

    const response: BulkPriceUpdateResponse = {
      success: failedCount === 0,
      message:
        failedCount === 0
          ? `Successfully updated ${successCount} products`
          : `Updated ${successCount} products, ${failedCount} failed`,
      stats: {
        totalProcessed: updates.length,
        successCount,
        failedCount,
        skippedCount: 0,
      },
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Bulk price update error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/products/bulk-price-update
 * Get pricing history
 */
export async function GET(request: NextRequest) {
  try {
    const { data: history, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('category', 'pricing_history')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      history: history || [],
    });
  } catch (error) {
    console.error('Error fetching pricing history:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch pricing history',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
