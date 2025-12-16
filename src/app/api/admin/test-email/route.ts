import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  // Development mode: No auth required

  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address (to) is required' },
        { status: 400 }
      );
    }

    const success = await EmailService.sendTestEmail(to);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${to}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send test email', details: errorMessage },
      { status: 500 }
    );
  }
}
