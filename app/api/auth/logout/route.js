import { NextResponse } from 'next/server';
import { dbInsert } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (user) {
      // Record activity log
      const userAgent = request.headers.get('user-agent') || 'Unknown Device';
      await dbInsert('activity_logs', {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        username: user.username,
        role: user.role,
        action: 'Logout',
        details: 'User successfully logged out',
        timestamp: new Date().toISOString(),
        deviceInfo: userAgent.substring(0, 100)
      });
    }

    const response = NextResponse.json({ success: true });
    
    // Clear session cookie
    response.cookies.set({
      name: 'klader_session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
