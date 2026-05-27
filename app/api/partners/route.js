import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDbData, writeDbData, dbInsert, dbUpdate, dbDelete } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDbData();
    
    // If the logged in user is a partner, they should only see their own details!
    if (user.role === 'partner') {
      const myPartner = data.partners.filter(p => p.username === user.username);
      return NextResponse.json({ partners: myPartner });
    }

    return NextResponse.json({ partners: data.partners });
  } catch (error) {
    console.error('Partners API GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Requires Admin Access' }, { status: 403 });
    }

    const body = await request.json();
    const { name, phone, email, username, password, type, investmentAmount, ownershipPercentage, notes, accessLevel } = body;

    if (!name || !username || !password || !type) {
      return NextResponse.json({ error: 'Name, Username, Password, and Type are required' }, { status: 400 });
    }

    const data = await getDbData();
    const existingUser = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    // 1. Create User
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const permissions = {
      fullAccess: accessLevel === 'full',
      salesAccess: accessLevel === 'sales' || accessLevel === 'full',
      viewAccess: true
    };

    const newUser = {
      id: `usr_${Date.now()}`,
      username,
      password: hashedPassword,
      role: 'partner',
      permissions,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    await dbInsert('users', newUser);

    // 2. Create Partner
    const partnerId = `part_${Date.now()}`;
    const initialInvestment = parseFloat(investmentAmount || 0);
    const newPartner = {
      id: partnerId,
      name,
      phone: phone || '',
      email: email || '',
      username,
      type,
      investmentAmount: initialInvestment,
      ownershipPercentage: parseFloat(ownershipPercentage || 0),
      totalWithdrawals: 0,
      remainingBalance: initialInvestment,
      activityLog: initialInvestment > 0 ? [
        {
          id: `act_${Date.now()}`,
          action: 'Initial Investment',
          amount: initialInvestment,
          date: new Date().toISOString()
        }
      ] : [],
      notes: notes || ''
    };
    await dbInsert('partners', newPartner);

    // Record system log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: adminUser.username,
      role: adminUser.role,
      action: 'Create Partner',
      details: `Created partner ${name} and linked user ${username}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, partner: newPartner });
  } catch (error) {
    console.error('Partners API POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Requires Admin Access' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, phone, email, type, ownershipPercentage, notes, additionalInvestment, withdrawalAmount } = body;

    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const partner = data.partners.find(p => p.id === id);
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Apply updates
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (type !== undefined) updates.type = type;
    if (ownershipPercentage !== undefined) updates.ownershipPercentage = parseFloat(ownershipPercentage);
    if (notes !== undefined) updates.notes = notes;

    const activityLog = [...(partner.activityLog || [])];
    let investmentAmount = partner.investmentAmount || 0;
    let totalWithdrawals = partner.totalWithdrawals || 0;

    if (additionalInvestment && parseFloat(additionalInvestment) > 0) {
      const addAmt = parseFloat(additionalInvestment);
      investmentAmount += addAmt;
      activityLog.push({
        id: `act_${Date.now()}_add`,
        action: 'Additional Investment',
        amount: addAmt,
        date: new Date().toISOString()
      });
      updates.investmentAmount = investmentAmount;
    }

    if (withdrawalAmount && parseFloat(withdrawalAmount) > 0) {
      const wdrAmt = parseFloat(withdrawalAmount);
      totalWithdrawals += wdrAmt;
      activityLog.push({
        id: `act_${Date.now()}_wdr`,
        action: 'Withdrawal',
        amount: wdrAmt,
        date: new Date().toISOString()
      });
      updates.totalWithdrawals = totalWithdrawals;
    }

    updates.remainingBalance = investmentAmount - totalWithdrawals;
    updates.activityLog = activityLog;

    const updatedPartner = await dbUpdate('partners', id, updates);

    // Record system log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: adminUser.username,
      role: adminUser.role,
      action: 'Update Partner',
      details: `Updated partner ${partner.name}. Added: inv ${additionalInvestment || 0}, wdr ${withdrawalAmount || 0}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, partner: updatedPartner });
  } catch (error) {
    console.error('Partners API PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const adminUser = await getUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Requires Admin Access' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const partner = data.partners.find(p => p.id === id);
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Delete partner record
    await dbDelete('partners', id);

    // Deactivate or delete associated user
    const userIndex = data.users.findIndex(u => u.username === partner.username);
    if (userIndex !== -1) {
      await dbDelete('users', data.users[userIndex].id);
    }

    // Record system log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: adminUser.username,
      role: adminUser.role,
      action: 'Delete Partner',
      details: `Deleted partner ${partner.name} and removed user account`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partners API DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
