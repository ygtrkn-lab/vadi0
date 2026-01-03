import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'Vadiler Çiçek';
    const description = searchParams.get('description') || 'Online Çiçek Siparişi';
    const image = searchParams.get('image');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
            position: 'relative',
          }}
        >
          {/* Brand Section */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#ec4899',
                display: 'flex',
              }}
            >
              🌸 Vadiler Çiçek
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 60px',
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            {image && (
              <img
                src={image}
                alt={title}
                width={300}
                height={300}
                style={{
                  borderRadius: '16px',
                  marginBottom: '40px',
                  boxShadow: '0 20px 60px rgba(236, 72, 153, 0.3)',
                }}
              />
            )}
            
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: 24,
                lineHeight: 1.2,
                display: 'flex',
              }}
            >
              {title}
            </div>
            
            <div
              style={{
                fontSize: 36,
                color: '#4b5563',
                lineHeight: 1.4,
                display: 'flex',
              }}
            >
              {description}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 28,
              color: '#6b7280',
            }}
          >
            <span>🚀</span>
            <span>Aynı Gün Teslimat</span>
            <span>•</span>
            <span>☎️</span>
            <span>0850 307 4876</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
