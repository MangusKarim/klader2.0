'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart3, Calendar, Download, Printer, 
  ChevronRight, RefreshCw, TrendingUp, TrendingDown,
  ShoppingBag, Package, DollarSign, Users, Award
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function ReportsPage() {
  const { user } = useAuth();
  
  // Data States
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date Filter defaults (Current month)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [activeReport, setActiveReport] = useState('sales'); // 'sales', 'profit', 'expenses', 'inventory', 'dividend', 'stock'
  const [timeframe, setTimeframe] = useState('daily'); // 'daily', 'weekly', 'monthly'

  const fetchData = async () => {
    try {
      setLoading(true);
      const salesRes = await fetch('/api/sales');
      const salesData = await salesRes.json();

      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();

      const expRes = await fetch('/api/expenses');
      const expData = await expRes.json();

      const partRes = await fetch('/api/partners');
      const partData = await partRes.json();

      if (salesRes.ok && prodRes.ok && expRes.ok && partRes.ok) {
        setSales(salesRes.ok ? salesData.sales : []);
        setProducts(prodRes.ok ? prodData.products : []);
        setExpenses(expRes.ok ? expData.expenses : []);
        setPartners(partRes.ok ? partData.partners : []);
      } else {
        setError('Failed to query reporting dataset.');
      }
    } catch (e) {
      console.error(e);
      setError('Communication with DB failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatBDT = (amount) => {
    return `৳${parseFloat(amount || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
  };

  // Filter lists based on selected dates
  const getFilteredData = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredSales = sales.filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end && s.deliveryStatus !== 'Cancelled';
    });

    const filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    return { filteredSales, filteredExpenses };
  };

  const { filteredSales, filteredExpenses } = getFilteredData();

  // 1. Sales Report Calculations
  const salesRevenue = filteredSales.reduce((sum, s) => {
    const itemRev = s.sellingPrice * s.quantity;
    const printRev = (s.isPrinted ? s.printCost : 0) * s.quantity;
    return sum + itemRev + printRev;
  }, 0);
  const salesProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const totalSalesCount = filteredSales.length;

  // 2. Profit Report
  const totalExpensesAmt = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = salesRevenue - totalExpensesAmt;

  // 3. Inventory Assets Report
  const totalProductsCount = products.length;
  const totalStockCount = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const assetCostValue = products.reduce((sum, p) => sum + (p.buyingPrice * p.stockQuantity), 0);
  const assetRetailValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stockQuantity), 0);

  // Grouping datasets for charts based on filtered dates
  const getTimelineChartData = () => {
    const daysMap = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Initialize day map
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      daysMap[dateStr] = { date: dateStr, name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0, profit: 0, expenses: 0 };
    }

    filteredSales.forEach(s => {
      const dateStr = s.date.split('T')[0];
      if (daysMap[dateStr]) {
        const itemRev = s.sellingPrice * s.quantity;
        const printRev = (s.isPrinted ? s.printCost : 0) * s.quantity;
        daysMap[dateStr].revenue += itemRev + printRev;
        daysMap[dateStr].profit += s.profit;
      }
    });

    filteredExpenses.forEach(e => {
      const dateStr = e.date;
      if (daysMap[dateStr]) {
        daysMap[dateStr].expenses += e.amount;
      }
    });

    return Object.values(daysMap);
  };

  const timelineChartData = getTimelineChartData();

  // Export report to CSV
  const handleExportSpreadsheet = () => {
    let headers = [];
    let rows = [];
    let filename = `Klader_${activeReport}_Report.csv`;

    if (activeReport === 'sales') {
      headers = ['Invoice ID', 'Customer Name', 'Phone', 'Product', 'Qty', 'Selling Price', 'Printed', 'Print Cost', 'Delivery Charge', 'Remaining Due', 'Date'];
      rows = filteredSales.map(s => [
        s.id, s.customerName, s.customerPhone, s.productName, s.quantity, s.sellingPrice, s.isPrinted ? 'Yes' : 'No', s.printCost, s.deliveryCharge, s.remainingDue, s.date.split('T')[0]
      ]);
    } else if (activeReport === 'expenses') {
      headers = ['Expense ID', 'Category', 'Description', 'Amount', 'Date', 'Payment Record'];
      rows = filteredExpenses.map(e => [
        e.id, e.category, e.description, e.amount, e.date, e.paymentRecord
      ]);
    } else if (activeReport === 'dividend') {
      headers = ['Partner Name', 'Type', 'Ownership Share', 'Investment Amount', 'Dividend Profit Share', 'Remaining Balance'];
      rows = partners.map(p => [
        p.name, p.type, `${p.ownershipPercentage}%`, p.investmentAmount, netProfit * (p.ownershipPercentage / 100), p.remainingBalance
      ]);
    } else if (activeReport === 'inventory' || activeReport === 'stock') {
      headers = ['Product SKU', 'Name', 'Category', 'Color', 'Size', 'Buying Price', 'Selling Price', 'Stock Level', 'Asset Valuation'];
      rows = products.map(p => [
        p.sku, p.name, p.category, p.color, p.size, p.buyingPrice, p.sellingPrice, p.stockQuantity, p.buyingPrice * p.stockQuantity
      ]);
    } else {
      // General profit
      headers = ['Summary Metric', 'Value'];
      rows = [
        ['Total Sales Revenue', salesRevenue],
        ['Total Operating Expenses', totalExpensesAmt],
        ['Net Net Profit', netProfit]
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Enterprise Reporting Hub</h2>
          <p className="text-xs text-slate-400 font-medium">Export audit lists, verify profit dividends, and analyze financial reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
          
          <button 
            onClick={handleExportSpreadsheet}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-klader-burgundy/10 cursor-pointer shadow-sm transition-all"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date filter & reports panel selectors (no-print) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm space-y-6 no-print">
        
        {/* Dates selection */}
        <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-slate-50">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-slate-500">From Date:</span>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="p-2 border border-slate-100 rounded-xl text-slate-700 bg-slate-50/50" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">To Date:</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="p-2 border border-slate-100 rounded-xl text-slate-700 bg-slate-50/50" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-klader-burgundy" title="Re-fetch database">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Report Types Tab Buttons */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {[
            { id: 'sales', name: 'Sales Report', icon: ShoppingBag },
            { id: 'profit', name: 'Profit Report', icon: TrendingUp },
            { id: 'expenses', name: 'Expense Report', icon: TrendingDown },
            { id: 'inventory', name: 'Inventory Report', icon: Package },
            { id: 'dividend', name: 'Partner Dividend', icon: Users },
            { id: 'stock', name: 'Stock Assets Valuation', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-klader-burgundy text-white shadow-md shadow-klader-burgundy/10' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Printable Report Output Container */}
      <div className="bg-white p-8 rounded-3xl border border-slate-50 shadow-sm print-card space-y-8">
        
        {/* Header block (Visible during printing) */}
        <div className="hidden print:flex justify-between items-start pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Klader Logo" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="font-display font-bold text-lg text-klader-burgundy">KLADER BUSINESS</h2>
              <p className="text-[9px] text-slate-400 font-semibold tracking-widest">Premium fashion brand</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="font-display font-bold text-sm uppercase text-slate-600">{activeReport} report</h3>
            <p className="text-[9px] text-slate-400 mt-1">Period: {startDate} to {endDate}</p>
          </div>
        </div>

        {/* 1. Dynamic Summary Card Widget row based on report type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {activeReport === 'sales' && (
            <>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Period Sales Revenue</span>
                <h4 className="text-xl font-bold text-slate-800">{formatBDT(salesRevenue)}</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Period Sales Profit</span>
                <h4 className="text-xl font-bold text-klader-burgundy">{formatBDT(salesProfit)}</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Sales Orders</span>
                <h4 className="text-xl font-bold text-slate-800">{totalSalesCount} Invoiced Orders</h4>
              </div>
            </>
          )}

          {activeReport === 'profit' && (
            <>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Period Sales Revenue</span>
                <h4 className="text-xl font-bold text-slate-800">{formatBDT(salesRevenue)}</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Period Operating Costs</span>
                <h4 className="text-xl font-bold text-red-600">{formatBDT(totalExpensesAmt)}</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Net Yield Profit</span>
                <h4 className="text-xl font-bold text-emerald-600">{formatBDT(netProfit)}</h4>
              </div>
            </>
          )}

          {activeReport === 'expenses' && (
            <>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Disbursements</span>
                <h4 className="text-xl font-bold text-red-600">{formatBDT(totalExpensesAmt)}</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Logged Transactions</span>
                <h4 className="text-xl font-bold text-slate-800">{filteredExpenses.length} categories logged</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Average Daily outflow</span>
                <h4 className="text-xl font-bold text-slate-850">{formatBDT(totalExpensesAmt / Math.max(1, timelineChartData.length))}</h4>
              </div>
            </>
          )}

          {(activeReport === 'inventory' || activeReport === 'stock') && (
            <>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Products / Stock count</span>
                <h4 className="text-xl font-bold text-slate-800">{totalProductsCount} items / {totalStockCount} pcs</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Inventory Cost Valuation</span>
                <h4 className="text-xl font-bold text-slate-800">{formatBDT(assetCostValue)}</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Retail Selling Valuation</span>
                <h4 className="text-xl font-bold text-klader-burgundy">{formatBDT(assetRetailValue)}</h4>
              </div>
            </>
          )}

          {activeReport === 'dividend' && (
            <>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Gross Net Profit</span>
                <h4 className="text-xl font-bold text-emerald-600">{formatBDT(netProfit)}</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Distributed profits</span>
                <h4 className="text-xl font-bold text-klader-burgundy">{formatBDT(netProfit * (partners.reduce((sum,p)=>sum+p.ownershipPercentage,0) / 100))}</h4>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Retained Business Reserves</span>
                <h4 className="text-xl font-bold text-slate-800">{formatBDT(netProfit - (netProfit * (partners.reduce((sum,p)=>sum+p.ownershipPercentage,0) / 100)))}</h4>
              </div>
            </>
          )}

        </div>

        {/* 2. Visual Reporting Chart (no-print) */}
        <div className="h-[280px] bg-slate-50/30 p-4 border border-slate-100 rounded-3xl no-print">
          <ResponsiveContainer width="100%" height="100%">
            {activeReport === 'expenses' ? (
              <BarChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip formatter={(val) => [formatBDT(val)]} />
                <Bar name="Expenses" dataKey="expenses" fill="#b6142c" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeReport === 'profit' ? (
              <AreaChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip formatter={(val) => [formatBDT(val)]} />
                <Legend iconType="circle" fontSize={10} />
                <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#7b0a1c" fill="#7b0a1c" fillOpacity={0.03} />
                <Area type="monotone" name="Net Profit" dataKey="profit" stroke="#e77e4e" fill="#e77e4e" fillOpacity={0.03} />
              </AreaChart>
            ) : (
              <LineChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip formatter={(val) => [formatBDT(val)]} />
                <Line type="monotone" name="Revenue" dataKey="revenue" stroke="#7b0a1c" strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 3. Detailed Data Table (Prints beautifully) */}
        <div>
          <h4 className="font-display font-semibold text-sm mb-4 border-b border-slate-100 pb-2">Detailed Ledger Report Items</h4>
          
          <div className="overflow-x-auto">
            {activeReport === 'sales' && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-2 pl-2">Date</th>
                    <th className="py-2">Order ID</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Product</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2 text-right pr-2">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">No transactions recorded.</td>
                    </tr>
                  ) : (
                    filteredSales.map(s => {
                      const totalBill = (s.sellingPrice + (s.isPrinted ? s.printCost : 0)) * s.quantity + s.deliveryCharge;
                      return (
                        <tr key={s.id}>
                          <td className="py-2.5 pl-2 text-slate-400">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="py-2.5 font-mono">{s.id}</td>
                          <td className="py-2.5 font-bold text-slate-700">{s.customerName}</td>
                          <td className="py-2.5">{s.productName}</td>
                          <td className="py-2.5">{s.quantity}</td>
                          <td className="py-2.5 text-right pr-2 font-bold text-slate-700">{formatBDT(totalBill)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {activeReport === 'expenses' && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-2 pl-2">Date</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Payment Mode</th>
                    <th className="py-2 text-right pr-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">No expenses recorded.</td>
                    </tr>
                  ) : (
                    filteredExpenses.map(e => (
                      <tr key={e.id}>
                        <td className="py-2.5 pl-2 text-slate-400">{e.date}</td>
                        <td className="py-2.5 font-semibold text-slate-700">{e.category}</td>
                        <td className="py-2.5 italic text-slate-400">{e.description || 'N/A'}</td>
                        <td className="py-2.5 capitalize">{e.paymentRecord}</td>
                        <td className="py-2.5 text-right pr-2 font-bold text-red-600">{formatBDT(e.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeReport === 'dividend' && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-2 pl-2">Partner Name</th>
                    <th className="py-2">Partner Type</th>
                    <th className="py-2">Ownership Percentage</th>
                    <th className="py-2">Investment Total</th>
                    <th className="py-2 text-right pr-2">Profit Share Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {partners.map(p => {
                    const yieldShare = netProfit * (p.ownershipPercentage / 100);
                    return (
                      <tr key={p.id}>
                        <td className="py-2.5 pl-2 font-bold text-slate-700">{p.name}</td>
                        <td className="py-2.5">{p.type}</td>
                        <td className="py-2.5 font-semibold text-slate-500">{p.ownershipPercentage}%</td>
                        <td className="py-2.5">{formatBDT(p.investmentAmount)}</td>
                        <td className="py-2.5 text-right pr-2 font-bold text-klader-burgundy">{formatBDT(yieldShare)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {(activeReport === 'inventory' || activeReport === 'stock' || activeReport === 'profit') && (
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-2 pl-2">SKU Code</th>
                    <th className="py-2">Clothing Item</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Buying Price (Cost)</th>
                    <th className="py-2">Selling Price (Retail)</th>
                    <th className="py-2 font-bold">Stock</th>
                    <th className="py-2 text-right pr-2">Inventory Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="py-2.5 pl-2 font-mono">{p.sku}</td>
                      <td className="py-2.5 font-bold text-slate-700">{p.name}</td>
                      <td className="py-2.5">{p.category}</td>
                      <td className="py-2.5">{formatBDT(p.buyingPrice)}</td>
                      <td className="py-2.5 text-klader-burgundy">{formatBDT(p.sellingPrice)}</td>
                      <td className="py-2.5 font-bold text-slate-800">{p.stockQuantity} pcs</td>
                      <td className="py-2.5 text-right pr-2 font-bold text-slate-750">{formatBDT(p.buyingPrice * p.stockQuantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>

        {/* Footer print stamp */}
        <div className="hidden print:flex justify-between items-center pt-8 border-t border-slate-100 text-[8px] text-slate-400">
          <span>Generated by Klader ERP Platform • Target host: klader.life</span>
          <span>Date printed: {new Date().toLocaleDateString()}</span>
        </div>

      </div>

    </div>
  );
}
