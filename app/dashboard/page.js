'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Taka, TrendingUp, TrendingDown, DollarSign, 
  ShoppingBag, Package, AlertTriangle, Users, 
  Layers, ArrowUpRight, ArrowDownRight, RefreshCw,
  PlusCircle, Download, FileText, CheckCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, 
  Cell, BarChart, Bar, Legend 
} from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard-data');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      } else {
        setError('Failed to load dashboard metrics.');
      }
    } catch (e) {
      console.error(e);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-klader-burgundy/20 border-t-klader-burgundy rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-4">Assembling Analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-100 rounded-3xl text-red-800">
        <p className="font-semibold">{error || 'An error occurred.'}</p>
        <button onClick={() => fetchDashboardData()} className="mt-4 px-4 py-2 bg-klader-burgundy text-white rounded-xl text-sm font-semibold cursor-pointer">
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, charts, alerts, recentOrders, recentExpenses } = data;

  // Format currency helper
  const formatBDT = (amount) => {
    return `৳${parseFloat(amount).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
  };

  // Pie colors
  const COLORS = ['#7b0a1c', '#b6142c', '#e77e4e', '#161f28', '#64748b', '#94a3b8'];

  return (
    <div className="space-y-8">
      
      {/* Upper Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Assalamu Alaikum, {user?.username}</h2>
          <p className="text-xs text-slate-400 font-medium">Here is the current operational state of Klader today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchDashboardData(true)} 
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-semibold text-slate-500 hover:text-klader-burgundy hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          
          {(user?.role === 'admin' || user?.role === 'staff' || user?.permissions?.salesAccess) && (
            <Link 
              href="/dashboard/sales" 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-klader-burgundy/10 cursor-pointer transition-all"
            >
              <PlusCircle size={14} />
              <span>Create Order</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-semibold text-klader-charcoal">{formatBDT(metrics.totalRevenue)}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-600">
              <ArrowUpRight size={14} />
              <span>+12% vs last month</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <span className="p-2 bg-red-50 text-klader-crimson rounded-xl">
              <TrendingDown size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-semibold text-klader-charcoal">{formatBDT(metrics.totalExpenses)}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-slate-400">
              <span>Operational disbursements</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-semibold text-klader-burgundy">{formatBDT(metrics.netProfit)}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-blue-600">
              <ArrowUpRight size={14} />
              <span>Net business margin</span>
            </div>
          </div>
        </div>

        {/* Inventory Cost Value */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Asset Value</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Package size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-semibold text-klader-charcoal">{formatBDT(metrics.inventoryCostValue)}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-slate-400">
              <span>Total value of stock (Cost price)</span>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products / Orders</span>
            <span className="p-2 bg-yellow-50 text-yellow-600 rounded-xl">
              <ShoppingBag size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-semibold text-klader-charcoal">
              {metrics.totalProducts} <span className="text-sm font-medium text-slate-400">Items</span> / {metrics.totalSalesOrders} <span className="text-sm font-medium text-slate-400">Orders</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-600">
              <AlertTriangle size={12} />
              <span>{alerts.lowStock.length} Low stock alerts</span>
            </div>
          </div>
        </div>

        {/* Company Reserve Balance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Reserve Balance</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-semibold text-klader-burgundy">{formatBDT(metrics.companyReserveBalance)}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-indigo-600">
              <span>Reserve & capital balance</span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Col span 2) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm lg:col-span-2 flex flex-col h-[400px]">
          <h3 className="font-display font-semibold text-base mb-1">Sales & Profit Trend</h3>
          <p className="text-xs text-slate-400 mb-6">Revenue and Net Profit comparison over the last 7 days.</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7b0a1c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#7b0a1c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e77e4e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#e77e4e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.96)', 
                    border: 'none', 
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [formatBDT(val)]}
                />
                <Legend iconType="circle" fontSize={12} wrapperStyle={{ paddingTop: '10px' }} />
                <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#7b0a1c" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" name="Net Profit" dataKey="profit" stroke="#e77e4e" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Allocation Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm flex flex-col h-[400px]">
          <h3 className="font-display font-semibold text-base mb-1">Expense Allocation</h3>
          <p className="text-xs text-slate-400 mb-6">Disbursement categories breakdown.</p>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {charts.expenseAllocation.length === 0 ? (
              <p className="text-xs text-slate-400">No expenses recorded this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.expenseAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.expenseAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(255, 255, 255, 0.96)', 
                      border: 'none', 
                      borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                      fontSize: '11px'
                    }}
                    formatter={(val) => [formatBDT(val)]}
                  />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Secondary Tables and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Invoices Table (Col span 2) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display font-semibold text-base">Recent Sales Orders</h3>
              <p className="text-xs text-slate-400">The latest customer orders placed recently.</p>
            </div>
            <Link href="/dashboard/sales" className="text-xs font-semibold text-klader-burgundy hover:text-klader-crimson transition-all flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3">Remaining Due</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5">
                      <p className="font-semibold text-klader-charcoal">{o.customerName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{o.customerPhone}</p>
                    </td>
                    <td className="py-3.5">
                      <p>{o.productName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{o.size} / {o.color}</p>
                    </td>
                    <td className="py-3.5">{o.quantity}</td>
                    <td className="py-3.5 font-semibold text-slate-800">{formatBDT(o.remainingDue)}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        o.deliveryStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-800' :
                        o.deliveryStatus === 'Cancelled' ? 'bg-red-50 text-red-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {o.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">{new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts and Quick Lists Panel */}
        <div className="space-y-6">
          
          {/* Low Stock Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
            <h3 className="font-display font-semibold text-base mb-1 flex items-center gap-2 text-klader-burgundy">
              <AlertTriangle size={16} className="text-klader-crimson" />
              <span>Low Stock Alerts</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Products with stock quantities below 15 units.</p>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {alerts.lowStock.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">All stock levels are optimal.</p>
              ) : (
                alerts.lowStock.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 bg-red-50/30 rounded-2xl border border-red-100/20">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{p.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">SKU: {p.sku}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-red-50 text-klader-crimson rounded-full text-[10px] font-bold">
                      {p.stock} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Receivables / Payments */}
          <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
            <h3 className="font-display font-semibold text-base mb-1 flex items-center gap-2 text-indigo-600">
              <DollarSign size={16} />
              <span>Pending Receivables</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Outstanding partial or unpaid dues.</p>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {alerts.pendingPayments.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">All payments settled.</p>
              ) : (
                alerts.pendingPayments.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{p.customerName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {formatBDT(p.due)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
