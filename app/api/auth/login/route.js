import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDbData, dbInsert } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const data = await getDbData();
    const user = data.users.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact Main Admin.' },
        { status: 403 }
      );
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Set cookie
    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }
    });

    // Set JWT in HTTP-Only Cookie
    response.cookies.set({
      name: 'klader_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Record activity log
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      username: user.username,
      role: user.role,
      action: 'Login',
      details: 'User successfully logged in',
      timestamp: new Date().toISOString(),
      deviceInfo: userAgent.substring(0, 100)
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
