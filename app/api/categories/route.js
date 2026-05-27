import { NextResponse } from 'next/server';
import { getDbData, writeDbData, dbInsert, dbDelete } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Pool } from 'pg';

const isPostgres = !!process.env.DATABASE_URL;
let pool = null;
if (isPostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDbData();
    return NextResponse.json({ categories: data.categories || [] });
  } catch (error) {
    console.error('Categories API GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Requires Admin Access' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const data = await getDbData();
    const categories = data.categories || [];

    if (categories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    if (isPostgres) {
      await pool.query('INSERT INTO categories (name) VALUES ($1)', [trimmedName]);
    } else {
      categories.push(trimmedName);
      data.categories = categories;
      await writeDbData(data);
    }

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Create Category',
      details: `Added new product category: ${trimmedName}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, category: trimmedName });
  } catch (error) {
    console.error('Categories API POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Requires Admin Access' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const data = await getDbData();
    const categories = data.categories || [];
    const index = categories.findIndex(c => c.toLowerCase() === name.toLowerCase());

    if (index === -1 && !isPostgres) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if category is currently used by any product in inventory
    const inUse = data.products.some(p => p.category.toLowerCase() === name.toLowerCase());
    if (inUse) {
      return NextResponse.json({ error: 'Cannot delete category: It is currently assigned to products in your inventory. Delete or reassign those products first.' }, { status: 400 });
    }

    if (isPostgres) {
      const res = await pool.query('DELETE FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
      if (res.rowCount === 0) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    } else {
      categories.splice(index, 1);
      data.categories = categories;
      await writeDbData(data);
    }

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Delete Category',
      details: `Deleted product category: ${name}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categories API DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
