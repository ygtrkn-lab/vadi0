import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB

// Body size limit'i 30MB'a çıkar (25MB video + ekstra margin)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
  },
};

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

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz dosya tipi. Sadece MP4, WebM ve MOV desteklenir.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 25MB\'ı aşamaz.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const originalName = file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const publicId = `${originalName}-${uniqueId}`;

    const result = await uploadToCloudinary(buffer, {
      folder: 'uploads/videos',
      publicId,
      resourceType: 'video',
      mimeType: file.type
    });

    if (!result.success) {
      console.error('Cloudinary video upload failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Video yüklenirken bir hata oluştu' },
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
    console.error('Video upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Video yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
