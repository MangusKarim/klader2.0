import { NextResponse } from 'next/server';
import { getDbData } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDbData();

    // 1. Calculations
    const validOrders = data.sales_orders.filter(o => o.deliveryStatus !== 'Cancelled');
    
    // Revenue: (sellingPrice + printCost) * quantity
    const totalRevenue = validOrders.reduce((sum, o) => {
      const itemRev = o.sellingPrice * o.quantity;
      const printRev = (o.isPrinted ? (o.printCost || 0) : 0) * o.quantity;
      return sum + itemRev + printRev;
    }, 0);

    // Total Expenses
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);

    // Net Profit
    const netProfit = totalRevenue - totalExpenses;

    // Inventory Cost Value
    const inventoryCostValue = data.products.reduce((sum, p) => sum + (p.buyingPrice * p.stockQuantity), 0);

    // Total Sales Orders count
    const totalSalesOrders = validOrders.length;

    // Total unique products
    const totalProducts = data.products.length;

    // Pending Deliveries
    const pendingDeliveries = validOrders.filter(
      o => ['Pending', 'Processing', 'Shipped'].includes(o.deliveryStatus)
    ).length;

    // Partner Investments
    const partnerInvestmentTotal = data.partners.reduce((sum, p) => sum + (p.investmentAmount || 0), 0);
    const partnerWithdrawalTotal = data.partners.reduce((sum, p) => sum + (p.totalWithdrawals || 0), 0);

    // Company Reserve Balance = Total Investments - Total Withdrawals + Net Profit
    const companyReserveBalance = partnerInvestmentTotal - partnerWithdrawalTotal + netProfit;

    // 2. Charts Data
    // A. Sales & Profit Trend (Last 7 Days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      
      const dayOrders = data.sales_orders.filter(
        o => o.date.startsWith(dateStr) && o.deliveryStatus !== 'Cancelled'
      );

      const dayRevenue = dayOrders.reduce((sum, o) => {
        const itemRev = o.sellingPrice * o.quantity;
        const printRev = (o.isPrinted ? (o.printCost || 0) : 0) * o.quantity;
        return sum + itemRev + printRev;
      }, 0);

      const dayCost = dayOrders.reduce((sum, o) => {
        const itemCost = (data.products.find(p => p.id === o.productId)?.buyingPrice || o.sellingPrice * 0.5) * o.quantity;
        const printCost = (o.isPrinted ? (o.printCost || 0) * 0.4 : 0) * o.quantity; // Assume print material cost is 40%
        return sum + itemCost + printCost;
      }, 0);

      // Simple day profit
      const dayProfit = dayRevenue - dayCost;

      last7Days.push({
        name: dateLabel,
        revenue: dayRevenue,
        profit: dayProfit,
        date: dateStr
      });
    }

    // B. Expense Allocation Pie Chart
    const expenseCategories = {};
    data.expenses.forEach(e => {
      expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
    });
    const expenseAllocation = Object.keys(expenseCategories).map(cat => ({
      name: cat,
      value: expenseCategories[cat]
    }));

    // C. Best Selling Products
    const productSales = {};
    validOrders.forEach(o => {
      if (!productSales[o.productName]) {
        productSales[o.productName] = {
          name: o.productName,
          quantity: 0,
          revenue: 0,
          color: o.color,
          size: o.size
        };
      }
      productSales[o.productName].quantity += o.quantity;
      productSales[o.productName].revenue += (o.sellingPrice + (o.isPrinted ? (o.printCost || 0) : 0)) * o.quantity;
    });
    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // D. Partner Ownership Breakdown
    const partnerOwnerships = data.partners.map(p => ({
      name: p.name,
      percentage: p.ownershipPercentage,
      profitShare: netProfit * (p.ownershipPercentage / 100),
      balance: p.remainingBalance
    }));

    // E. Alerts (Low stock < 15)
    const lowStockAlerts = data.products
      .filter(p => p.stockQuantity < 15)
      .map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stockQuantity
      }));

    // F. Pending Payments
    const pendingPayments = validOrders
      .filter(o => o.paymentStatus !== 'Paid' && o.remainingDue > 0)
      .map(o => ({
        id: o.id,
        customerName: o.customerName,
        due: o.remainingDue,
        date: o.date
      }));

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalExpenses,
        netProfit,
        inventoryCostValue,
        totalSalesOrders,
        totalProducts,
        pendingDeliveries,
        partnerInvestmentTotal,
        companyReserveBalance
      },
      charts: {
        salesTrend: last7Days,
        expenseAllocation,
        bestSellers,
        partnerOwnerships
      },
      alerts: {
        lowStock: lowStockAlerts,
        pendingPayments
      },
      recentOrders: data.sales_orders.slice(0, 5),
      recentExpenses: data.expenses.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard data API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
