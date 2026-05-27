import { NextResponse } from 'next/server';
import { getDbData, dbInsert, dbUpdate } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDbData();

    if (user.role === 'partner') {
      const myRequests = data.requests.filter(r => r.partnerName === user.username || r.partnerId === user.id);
      return NextResponse.json({ requests: myRequests });
    }

    return NextResponse.json({ requests: data.requests });
  } catch (error) {
    console.error('Requests API GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only partners (and admins representing themselves) can submit requests
    if (user.role !== 'partner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only partners can submit financial requests' }, { status: 403 });
    }

    const body = await request.json();
    const { type, amount, notes } = body;

    if (!type || amount === undefined || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Type (Investment/Withdrawal) and valid positive Amount are required' }, { status: 400 });
    }

    const data = await getDbData();
    // Find associated partner profile
    const partner = data.partners.find(p => p.username === user.username);
    if (!partner && user.role === 'partner') {
      return NextResponse.json({ error: 'Associated partner profile not found' }, { status: 404 });
    }

    const reqId = `req_${Date.now()}`;
    const newRequest = {
      id: reqId,
      partnerId: partner ? partner.id : 'part_admin',
      partnerName: partner ? partner.name : user.username,
      type, // 'Investment' or 'Withdrawal'
      amount: parseFloat(amount),
      status: 'Pending',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      approvedBy: '',
      approvedAt: ''
    };

    await dbInsert('requests', newRequest);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: `Request ${type}`,
      details: `Submitted a request to ${type.toLowerCase()} ৳${amount}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Requests API POST error:', error);
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
    const { id, action } = body; // action is 'Approve' or 'Reject'

    if (!id || !action) {
      return NextResponse.json({ error: 'Request ID and Action (Approve/Reject) are required' }, { status: 400 });
    }

    const data = await getDbData();
    const reqIndex = data.requests.findIndex(r => r.id === id);
    if (reqIndex === -1) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const reqObj = data.requests[reqIndex];
    if (reqObj.status !== 'Pending') {
      return NextResponse.json({ error: 'This request has already been processed' }, { status: 400 });
    }

    const targetStatus = action === 'Approve' ? 'Approved' : 'Rejected';

    // If Approved, update the partner ledger
    if (action === 'Approve') {
      const partnerIndex = data.partners.findIndex(p => p.id === reqObj.partnerId);
      if (partnerIndex !== -1) {
        const partner = data.partners[partnerIndex];
        const activityLog = [...(partner.activityLog || [])];
        let investmentAmount = partner.investmentAmount || 0;
        let totalWithdrawals = partner.totalWithdrawals || 0;

        if (reqObj.type === 'Investment') {
          investmentAmount += reqObj.amount;
          activityLog.push({
            id: `act_${Date.now()}_req`,
            action: 'Additional Investment',
            amount: reqObj.amount,
            date: new Date().toISOString(),
            notes: `Approved request ${reqObj.id}`
          });
        } else if (reqObj.type === 'Withdrawal') {
          // Verify they have enough remaining balance
          if (partner.remainingBalance < reqObj.amount) {
            return NextResponse.json({ error: `Partner balance too low. Remaining: ৳${partner.remainingBalance}` }, { status: 400 });
          }
          totalWithdrawals += reqObj.amount;
          activityLog.push({
            id: `act_${Date.now()}_req`,
            action: 'Withdrawal',
            amount: reqObj.amount,
            date: new Date().toISOString(),
            notes: `Approved request ${reqObj.id}`
          });
        }

        const remainingBalance = investmentAmount - totalWithdrawals;

        // Perform Postgres/JSON updates
        await dbUpdate('partners', partner.id, {
          investmentAmount,
          totalWithdrawals,
          remainingBalance,
          activityLog
        });
      }
    }

    // Update Request status
    const updatedRequest = await dbUpdate('requests', id, {
      status: targetStatus,
      approvedBy: adminUser.username,
      approvedAt: new Date().toISOString()
    });

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: adminUser.username,
      role: adminUser.role,
      action: `${action} Request`,
      details: `${action}d ${reqObj.type} request ${id} of ৳${reqObj.amount} for partner ${reqObj.partnerName}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Requests API PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
