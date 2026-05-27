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
    return NextResponse.json({ products: data.products });
  } catch (error) {
    console.error('Products API GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role validation: Admin, Staff, or Partner with Sales/Full access can manage stock
    const canManageStock = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      (user.role === 'partner' && (user.permissions?.fullAccess || user.permissions?.salesAccess));

    if (!canManageStock) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { name, sku, category, color, size, buyingPrice, sellingPrice, stockQuantity, supplierName } = body;

    if (!name || !sku || !category || buyingPrice === undefined || sellingPrice === undefined || stockQuantity === undefined) {
      return NextResponse.json({ error: 'Name, SKU, Category, Prices, and Stock Quantity are required' }, { status: 400 });
    }

    const data = await getDbData();
    const existingProduct = data.products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
    if (existingProduct) {
      return NextResponse.json({ error: 'A product with this SKU already exists' }, { status: 400 });
    }

    const newProduct = {
      id: `prod_${Date.now()}`,
      name,
      sku: sku.toUpperCase(),
      category,
      color: color || 'N/A',
      size: size || 'N/A',
      buyingPrice: parseFloat(buyingPrice),
      sellingPrice: parseFloat(sellingPrice),
      stockQuantity: parseInt(stockQuantity),
      supplierName: supplierName || 'Unknown',
      dateAdded: new Date().toISOString().split('T')[0],
      status: parseInt(stockQuantity) > 0 ? 'In Stock' : 'Out of Stock'
    };

    await dbInsert('products', newProduct);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Create Product',
      details: `Added new product ${name} (SKU: ${newProduct.sku}) with stock ${stockQuantity}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Products API POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageStock = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      (user.role === 'partner' && (user.permissions?.fullAccess || user.permissions?.salesAccess));

    if (!canManageStock) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, sku, category, color, size, buyingPrice, sellingPrice, stockQuantity, supplierName } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const product = data.products.find(p => p.id === id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sku !== undefined) updates.sku = sku.toUpperCase();
    if (category !== undefined) updates.category = category;
    if (color !== undefined) updates.color = color;
    if (size !== undefined) updates.size = size;
    if (buyingPrice !== undefined) updates.buyingPrice = parseFloat(buyingPrice);
    if (sellingPrice !== undefined) updates.sellingPrice = parseFloat(sellingPrice);
    if (stockQuantity !== undefined) {
      updates.stockQuantity = parseInt(stockQuantity);
      updates.status = parseInt(stockQuantity) > 0 ? 'In Stock' : 'Out of Stock';
    }
    if (supplierName !== undefined) updates.supplierName = supplierName;

    const updatedProduct = await dbUpdate('products', id, updates);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Update Product',
      details: `Updated product ${product.name} (SKU: ${product.sku})`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Products API PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageStock = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      (user.role === 'partner' && (user.permissions?.fullAccess || user.permissions?.salesAccess));

    if (!canManageStock) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const product = data.products.find(p => p.id === id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await dbDelete('products', id);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Delete Product',
      details: `Deleted product ${product.name} (SKU: ${product.sku})`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products API DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
