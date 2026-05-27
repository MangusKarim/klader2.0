import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDbData, dbInsert, dbUpdate, dbDelete } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const data = await getDbData();
    // Exclude password hashes from response
    const safeUsers = data.users.map(({ password, ...u }) => u);
    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('Users API GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, role, permissions, status } = body;

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, Password, and Role are required' }, { status: 400 });
    }

    const data = await getDbData();
    const existing = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `usr_${Date.now()}`,
      username,
      password: hashedPassword,
      role,
      permissions: permissions || { fullAccess: false, salesAccess: true, viewAccess: true },
      status: status || 'active',
      createdAt: new Date().toISOString()
    };

    await dbInsert('users', newUser);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: adminUser.username,
      role: adminUser.role,
      action: 'Create User',
      details: `Created new user ${username} with role ${role}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Users API POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, password, role, permissions, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const user = data.users.find(u => u.id === id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Main admin cannot deactivate themselves
    if (user.username === 'Zadid' && status === 'inactive') {
      return NextResponse.json({ error: 'Cannot deactivate the primary Main Admin account' }, { status: 400 });
    }

    const updates = {};
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      updates.password = bcrypt.hashSync(password, salt);
    }
    if (role !== undefined) updates.role = role;
    if (permissions !== undefined) updates.permissions = permissions;
    if (status !== undefined) updates.status = status;

    const updatedUser = await dbUpdate('users', id, updates);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: adminUser.username,
      role: adminUser.role,
      action: 'Update User',
      details: `Updated user profile/credentials for ${user.username}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    const { password: _, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Users API PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const user = data.users.find(u => u.id === id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Main admin cannot delete themselves
    if (user.username === 'Zadid') {
      return NextResponse.json({ error: 'Cannot delete the primary Main Admin account' }, { status: 400 });
    }

    await dbDelete('users', id);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: adminUser.username,
      role: adminUser.role,
      action: 'Delete User',
      details: `Deleted user account ${user.username}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Users API DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
