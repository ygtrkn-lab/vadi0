import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz dosya tipi. Sadece JPEG, PNG, GIF ve WebP desteklenir.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 5MB\'dan büyük olamaz.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique public ID
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const originalName = file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const publicId = `${originalName}-${uniqueId}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, 'uploads', publicId);

    if (!result.success) {
      console.error('Cloudinary upload failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Dosya yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        originalName: file.name,
        size: file.size,
        type: file.type,
        width: result.width,
        height: result.height,
        format: result.format,
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Dosya yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
