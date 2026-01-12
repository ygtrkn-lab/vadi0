import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'drwgfnwdp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET() {
  try {
    const results: Record<string, string> = {};

    // Ana logo (logo.webp -> PNG'ye dönüştür)
    const logoPath = path.join(process.cwd(), 'public', 'logo.webp');
    if (fs.existsSync(logoPath)) {
      const logoResult = await cloudinary.uploader.upload(logoPath, {
        public_id: 'vadiler-logo',
        folder: 'branding',
        format: 'png',
        overwrite: true,
      });
      results.logo = logoResult.secure_url;
      console.log('Logo uploaded:', logoResult.secure_url);
    }

    // Band logo yükle
    const bandLogoPath = path.join(process.cwd(), 'public', 'logo_band_colored@2x.png');
    if (fs.existsSync(bandLogoPath)) {
      const bandResult = await cloudinary.uploader.upload(bandLogoPath, {
        public_id: 'vadiler-logo-band',
        folder: 'branding',
        overwrite: true,
      });
      results.bandLogo = bandResult.secure_url;
      console.log('Band logo uploaded:', bandResult.secure_url);
    }

    // Garanti Bankası logosu yükle (SVG -> PNG)
    const garantiLogoPath = path.join(process.cwd(), 'public', 'TR', 'garanti.svg');
    if (fs.existsSync(garantiLogoPath)) {
      const garantiResult = await cloudinary.uploader.upload(garantiLogoPath, {
        public_id: 'garanti-bank-logo',
        folder: 'branding',
        format: 'png',
        overwrite: true,
      });
      results.garantiLogo = garantiResult.secure_url;
      console.log('Garanti logo uploaded:', garantiResult.secure_url);
    }

    // Güvenli Ödeme logosu yükle
    const guvenliOdemePath = path.join(process.cwd(), 'public', 'TR', 'guvenli-odeme.png');
    if (fs.existsSync(guvenliOdemePath)) {
      const guvenliResult = await cloudinary.uploader.upload(guvenliOdemePath, {
        public_id: 'guvenli-odeme',
        folder: 'branding',
        overwrite: true,
      });
      results.guvenliOdeme = guvenliResult.secure_url;
      console.log('Guvenli Odeme uploaded:', guvenliResult.secure_url);
    }

    return NextResponse.json({
      success: true,
      message: 'Logolar Cloudinary\'e yüklendi',
      urls: results,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
