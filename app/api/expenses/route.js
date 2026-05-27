import { NextResponse } from 'next/server';
import { getDbData, dbInsert, dbUpdate, dbDelete } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDbData();
    return NextResponse.json({ expenses: data.expenses });
  } catch (error) {
    console.error('Expenses API GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only Admin and Partners with Full Access can log expenses
    const canManageExpenses = 
      user.role === 'admin' || 
      (user.role === 'partner' && user.permissions?.fullAccess);

    if (!canManageExpenses) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { category, amount, description, date, paymentRecord } = body;

    if (!category || amount === undefined || !date) {
      return NextResponse.json({ error: 'Category, Amount, and Date are required' }, { status: 400 });
    }

    const newExpense = {
      id: `exp_${Date.now()}`,
      category,
      amount: parseFloat(amount),
      description: description || '',
      date,
      paymentRecord: paymentRecord || 'Cash'
    };

    await dbInsert('expenses', newExpense);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Create Expense',
      details: `Added expense ${newExpense.id} - ${category}: ৳${amount}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, expense: newExpense });
  } catch (error) {
    console.error('Expenses API POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageExpenses = 
      user.role === 'admin' || 
      (user.role === 'partner' && user.permissions?.fullAccess);

    if (!canManageExpenses) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { id, category, amount, description, date, paymentRecord } = body;

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const expense = data.expenses.find(e => e.id === id);
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const updates = {};
    if (category !== undefined) updates.category = category;
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.date = date;
    if (paymentRecord !== undefined) updates.paymentRecord = paymentRecord;

    const updatedExpense = await dbUpdate('expenses', id, updates);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Update Expense',
      details: `Updated expense ${id} - ${updates.category || expense.category}: ৳${updates.amount || expense.amount}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, expense: updatedExpense });
  } catch (error) {
    console.error('Expenses API PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageExpenses = 
      user.role === 'admin' || 
      (user.role === 'partner' && user.permissions?.fullAccess);

    if (!canManageExpenses) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const expense = data.expenses.find(e => e.id === id);
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await dbDelete('expenses', id);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Delete Expense',
      details: `Deleted expense ${id} (৳${expense.amount})`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Expenses API DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
