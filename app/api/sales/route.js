import { NextResponse } from 'next/server';
import { getDbData, writeDbData, dbInsert, dbUpdate, dbDelete } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDbData();
    return NextResponse.json({ sales: data.sales_orders });
  } catch (error) {
    console.error('Sales API GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageSales = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      (user.role === 'partner' && (user.permissions?.fullAccess || user.permissions?.salesAccess));

    if (!canManageSales) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      customerName, customerPhone, customerAddress, 
      productId, color, size, quantity, sellingPrice, 
      isPrinted, printSize, printCost, 
      deliveryCharge, advancePayment, paymentMethod, paymentStatus, deliveryStatus 
    } = body;

    if (!customerName || !customerPhone || !productId || !quantity || sellingPrice === undefined) {
      return NextResponse.json({ error: 'Customer Name, Phone, Product, Quantity, and Selling Price are required' }, { status: 400 });
    }

    const data = await getDbData();
    const product = data.products.find(p => p.id === productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found in inventory' }, { status: 404 });
    }

    const qty = parseInt(quantity);
    if (product.stockQuantity < qty) {
      return NextResponse.json({ error: `Insufficient stock. Only ${product.stockQuantity} items remaining.` }, { status: 400 });
    }

    // Calculations
    const sellPrice = parseFloat(sellingPrice);
    const prCost = isPrinted ? parseFloat(printCost || 0) : 0;
    const delCharge = parseFloat(deliveryCharge || 0);
    const advPayment = parseFloat(advancePayment || 0);

    const totalBill = (sellPrice * qty) + (prCost * qty) + delCharge;
    const remainingDue = Math.max(0, totalBill - advPayment);

    // Sales Profit = (sellingPrice - buyingPrice) * qty + printProfit (assume 50% margin on printCost)
    const itemProfit = (sellPrice - product.buyingPrice) * qty;
    const printProfit = isPrinted ? (prCost * 0.5 * qty) : 0;
    const totalProfit = itemProfit + printProfit;

    // 1. Deduct Stock in Inventory
    const newStock = product.stockQuantity - qty;
    await dbUpdate('products', productId, {
      stockQuantity: newStock,
      status: newStock > 0 ? 'In Stock' : 'Out of Stock'
    });

    // 2. Create Order
    const newOrder = {
      id: `ord_${Date.now()}`,
      customerName,
      customerPhone,
      customerAddress: customerAddress || '',
      productId,
      productName: product.name,
      color: color || product.color,
      size: size || product.size,
      quantity: qty,
      sellingPrice: sellPrice,
      isPrinted: !!isPrinted,
      printSize: isPrinted ? (printSize || '') : '',
      printCost: prCost,
      deliveryCharge: delCharge,
      advancePayment: advPayment,
      remainingDue,
      paymentStatus: paymentStatus || 'Unpaid',
      paymentMethod: paymentMethod || 'Cash',
      deliveryStatus: deliveryStatus || 'Pending',
      profit: totalProfit,
      date: new Date().toISOString()
    };

    await dbInsert('sales_orders', newOrder);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Create Sales Order',
      details: `Created order ${newOrder.id} for ${customerName} - Deducted ${qty} of ${product.name}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    console.error('Sales API POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageSales = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      (user.role === 'partner' && (user.permissions?.fullAccess || user.permissions?.salesAccess));

    if (!canManageSales) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      id, customerName, customerPhone, customerAddress, 
      productId, color, size, quantity, sellingPrice, 
      isPrinted, printSize, printCost, 
      deliveryCharge, advancePayment, paymentMethod, paymentStatus, deliveryStatus 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const orderIndex = data.sales_orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existingOrder = data.sales_orders[orderIndex];
    const targetProductId = productId || existingOrder.productId;
    const targetProduct = data.products.find(p => p.id === targetProductId);

    if (!targetProduct) {
      return NextResponse.json({ error: 'Product not found in inventory' }, { status: 404 });
    }

    // Revert old stock if order was NOT cancelled and now it is, or if order is modified
    let stockDelta = 0; // Negative means we deduct more stock, positive means we add back stock
    const oldQty = existingOrder.quantity;
    const newQty = quantity !== undefined ? parseInt(quantity) : oldQty;

    const oldStatus = existingOrder.deliveryStatus;
    const newStatus = deliveryStatus || oldStatus;

    if (oldStatus !== 'Cancelled' && newStatus === 'Cancelled') {
      // Order cancelled: Add back all stock
      stockDelta = oldQty;
    } else if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
      // Order un-cancelled: Deduct new stock
      stockDelta = -newQty;
    } else if (oldStatus !== 'Cancelled' && newStatus !== 'Cancelled') {
      // General qty update: adjust differences
      stockDelta = oldQty - newQty;
    }

    // Check inventory capacity
    if (stockDelta < 0 && targetProduct.stockQuantity < Math.abs(stockDelta)) {
      return NextResponse.json({ error: `Insufficient stock to adjust. Only ${targetProduct.stockQuantity} items in inventory.` }, { status: 400 });
    }

    // Update Product Stock
    if (stockDelta !== 0) {
      const finalStock = targetProduct.stockQuantity + stockDelta;
      await dbUpdate('products', targetProductId, {
        stockQuantity: finalStock,
        status: finalStock > 0 ? 'In Stock' : 'Out of Stock'
      });
    }

    // Recalculate bill & profit
    const finalQty = newQty;
    const sellPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : existingOrder.sellingPrice;
    const finalIsPrinted = isPrinted !== undefined ? !!isPrinted : existingOrder.isPrinted;
    const prCost = finalIsPrinted ? (printCost !== undefined ? parseFloat(printCost) : existingOrder.printCost) : 0;
    const delCharge = deliveryCharge !== undefined ? parseFloat(deliveryCharge) : existingOrder.deliveryCharge;
    const advPayment = advancePayment !== undefined ? parseFloat(advancePayment) : existingOrder.advancePayment;

    const totalBill = (sellPrice * finalQty) + (prCost * finalQty) + delCharge;
    const remainingDue = Math.max(0, totalBill - advPayment);

    const itemProfit = (sellPrice - targetProduct.buyingPrice) * finalQty;
    const printProfit = finalIsPrinted ? (prCost * 0.5 * finalQty) : 0;
    const totalProfit = itemProfit + printProfit;

    const updates = {
      customerName: customerName || existingOrder.customerName,
      customerPhone: customerPhone || existingOrder.customerPhone,
      customerAddress: customerAddress !== undefined ? customerAddress : existingOrder.customerAddress,
      productId: targetProductId,
      productName: targetProduct.name,
      color: color !== undefined ? color : existingOrder.color,
      size: size !== undefined ? size : existingOrder.size,
      quantity: finalQty,
      sellingPrice: sellPrice,
      isPrinted: finalIsPrinted,
      printSize: finalIsPrinted ? (printSize || existingOrder.printSize) : '',
      printCost: prCost,
      deliveryCharge: delCharge,
      advancePayment: advPayment,
      remainingDue,
      paymentStatus: paymentStatus || existingOrder.paymentStatus,
      paymentMethod: paymentMethod || existingOrder.paymentMethod,
      deliveryStatus: newStatus,
      profit: newStatus === 'Cancelled' ? 0 : totalProfit // cancelled orders yield 0 profit
    };

    const updatedOrder = await dbUpdate('sales_orders', id, updates);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Update Sales Order',
      details: `Updated sales order ${id}. Status: ${newStatus}, Payment: ${updates.paymentStatus}`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Sales API PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageSales = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      (user.role === 'partner' && (user.permissions?.fullAccess || user.permissions?.salesAccess));

    if (!canManageSales) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const data = await getDbData();
    const order = data.sales_orders.find(o => o.id === id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Revert stock if order was NOT cancelled (it was active)
    if (order.deliveryStatus !== 'Cancelled') {
      const product = data.products.find(p => p.id === order.productId);
      if (product) {
        const finalStock = product.stockQuantity + order.quantity;
        await dbUpdate('products', order.productId, {
          stockQuantity: finalStock,
          status: finalStock > 0 ? 'In Stock' : 'Out of Stock'
        });
      }
    }

    await dbDelete('sales_orders', id);

    // Record activity log
    await dbInsert('activity_logs', {
      id: `log_${Date.now()}`,
      username: user.username,
      role: user.role,
      action: 'Delete Sales Order',
      details: `Deleted order ${id} (Customer: ${order.customerName})`,
      timestamp: new Date().toISOString(),
      deviceInfo: request.headers.get('user-agent') || 'Server'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sales API DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
