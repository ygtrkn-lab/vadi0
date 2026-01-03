import { NextRequest, NextResponse } from 'next/server';
import { SettingsManager } from '@/lib/settings/settingsManager';

// GET - Ayarları getir (public settings only)
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');

    if (category) {
      // Get specific category
      const settings = await SettingsManager.getCategory(category, true);
      return NextResponse.json({ category, settings });
    }

    // Get all public settings grouped by category
    const categories = ['site', 'delivery', 'payment', 'promotions', 'social', 'seo'];
    const allSettings: Record<string, any> = {};

    for (const cat of categories) {
      allSettings[cat] = await SettingsManager.getCategory(cat, true);
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
