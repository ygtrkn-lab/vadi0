import { NextRequest, NextResponse } from 'next/server';
import { SettingsManager } from '@/lib/settings/settingsManager';

// GET - Get all settings (including private ones)
export async function GET(request: NextRequest) {
  // Development mode: No auth required
  // In production, add proper JWT verification here

  try {
    const category = request.nextUrl.searchParams.get('category');

    if (category) {
      const settings = await SettingsManager.getCategory(category, false);
      return NextResponse.json({ category, settings });
    }

    // Get all settings
    const categories = ['site', 'delivery', 'payment', 'promotions', 'social', 'seo'];
    const allSettings: Record<string, any> = {};

    for (const cat of categories) {
      allSettings[cat] = await SettingsManager.getCategory(cat, false);
    }

    return NextResponse.json({ settings: allSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update a setting
export async function PUT(request: NextRequest) {
  // Development mode: No auth required

  try {
    const body = await request.json();
    const { category, key, value, updates } = body;

    // Handle bulk updates (multiple keys in one category)
    if (category && updates && typeof updates === 'object') {
      const results = [];
      for (const [updateKey, updateValue] of Object.entries(updates)) {
        const result = await SettingsManager.set(category, updateKey, updateValue);
        results.push(result);
      }
      return NextResponse.json({ success: true, data: results });
    }

    // Handle single key update
    if (!category || !key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: category with updates object, or category, key, and value' },
        { status: 400 }
      );
    }

    const result = await SettingsManager.set(category, key, value);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

// POST - Clear cache
export async function POST(request: NextRequest) {
  // Development mode: No auth required

  try {
    const body = await request.json();
    const { category } = body;

    if (category) {
      SettingsManager.clearCategoryCache(category);
    } else {
      SettingsManager.clearCache();
    }

    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
