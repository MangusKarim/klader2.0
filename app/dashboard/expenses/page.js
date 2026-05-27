'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  CreditCard, Search, PlusCircle, Trash2, 
  Edit, ArrowUpRight, FileText, Upload, Check, X,
  TrendingDown, Calendar, Receipt, Briefcase
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ExpensesPage() {
  const { user } = useAuth();
  
  // Data States
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    category: 'Online Boosting', amount: '', description: '',
    date: new Date().toISOString().split('T')[0], paymentRecord: 'Cash'
  });

  const [editFormData, setEditFormData] = useState({
    id: '', category: 'Online Boosting', amount: '', description: '',
    date: '', paymentRecord: 'Cash'
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses || []);
      } else {
        setError('Failed to fetch expenses.');
      }
    } catch (e) {
      console.error(e);
      setError('Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const formatBDT = (amount) => {
    return `৳${parseFloat(amount || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
  };

  // Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          category: 'Online Boosting', amount: '', description: '',
          date: new Date().toISOString().split('T')[0], paymentRecord: 'Cash'
        });
        fetchExpenses();
      } else {
        alert(data.error || 'Failed to record expense');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Expense
  const handleEditExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        fetchExpenses();
      } else {
        alert(data.error || 'Failed to update expense');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExpenses();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete expense');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-klader-burgundy/20 border-t-klader-burgundy rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-4">Auditing expense balances...</p>
      </div>
    );
  }

  // Filter lists
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paymentRecord.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalExpensesAmt = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for Recharts
  const categoriesGroup = {};
  expenses.forEach(e => {
    categoriesGroup[e.category] = (categoriesGroup[e.category] || 0) + e.amount;
  });
  const chartData = Object.keys(categoriesGroup).map(cat => ({
    name: cat,
    amount: categoriesGroup[cat]
  })).sort((a,b) => b.amount - a.amount);

  const colors = ['#7b0a1c', '#b6142c', '#e77e4e', '#161f28', '#475569', '#64748b'];

  const categories = [
    'Online Boosting', 'Packaging', 'Accessories', 'Marketing', 'Transport', 'Salary', 'Utilities', 'Others'
  ];

  // Auth limits
  const canManage = user.role === 'admin' || (user.role === 'partner' && user.permissions?.fullAccess);

  return (
    <div className="space-y-8">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Expense Management</h2>
          <p className="text-xs text-slate-400 font-medium">Record and track operational costs, advertising campaigns, and logistics bills.</p>
        </div>
        <div>
          {canManage && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-klader-burgundy/10 cursor-pointer shadow-sm transition-all"
            >
              <PlusCircle size={14} />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-tr from-klader-burgundy to-klader-crimson p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute right-[-10%] bottom-[-15%] w-32 h-32 rounded-full bg-white/5 blur-lg"></div>
            
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-white/10 rounded-xl">
                <CreditCard size={18} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Total Outflows</span>
            </div>
            
            <div className="mt-6">
              <h3 className="text-3xl font-display font-bold">{formatBDT(totalExpensesAmt)}</h3>
              <p className="text-[10px] text-white/60 mt-1">Accumulated operating expenses</p>
            </div>

            <div className="mt-8 flex items-center gap-1.5 text-xs text-white/80 font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full">
              <TrendingDown size={14} />
              <span>Checking account funds</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
            <h4 className="font-display font-semibold text-sm mb-4">Outflow Distribution</h4>
            <div className="space-y-3">
              {chartData.slice(0, 4).map((d, i) => (
                <div key={d.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">{d.name}</span>
                    <span className="text-slate-700">{formatBDT(d.amount)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-klader-burgundy" 
                      style={{ width: `${(d.amount / (totalExpensesAmt || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Recharts Category Bar Chart (Col span 2) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm lg:col-span-2 flex flex-col h-[350px]">
          <h3 className="font-display font-semibold text-base mb-1">Expenses by Category</h3>
          <p className="text-xs text-slate-400 mb-6">Bar breakdown of all operational expenses.</p>
          <div className="flex-1 min-h-0">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-100 rounded-2xl">
                No recorded expense data to graph
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
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
                  <Bar dataKey="amount" fill="#7b0a1c" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Filter and table list */}
      <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative flex items-center w-full sm:w-80">
            <Search className="absolute left-3.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search description, payment info..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-klader-burgundy"
            />
          </div>

          <div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 border border-slate-100 rounded-xl text-xs bg-white text-slate-500 font-semibold focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Date</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment mode</th>
                <th className="pb-3">Attachment</th>
                {canManage && <th className="pb-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No expense records found.</td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 text-slate-400 flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 max-w-[250px] truncate" title={e.description}>{e.description || 'No description'}</td>
                    <td className="py-3.5 font-bold text-slate-800">{formatBDT(e.amount)}</td>
                    <td className="py-3.5 text-slate-500 capitalize">{e.paymentRecord}</td>
                    <td className="py-3.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded w-fit">
                        <FileText size={10} />
                        <span>e-Receipt.pdf</span>
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditFormData({
                                id: e.id, category: e.category, amount: e.amount,
                                description: e.description, date: e.date, paymentRecord: e.paymentRecord
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-klader-burgundy hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1.5 text-slate-400 hover:text-klader-crimson hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms & Dialog Modals */}
      {/* 1. Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Record Business Outlay</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Category</label>
                <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Amount (৳ BDT)</label>
                  <input type="number" min="1" value={formData.amount} onChange={e=>setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Disbursed Date</label>
                  <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Payment Method</label>
                <select value={formData.paymentRecord} onChange={e=>setFormData({...formData, paymentRecord: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="bKash Merchant Payment">bKash Merchant Payment</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Description</label>
                <textarea rows={2} placeholder="Online campaign name, utility bills..." value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
              </div>
              
              {/* Attachment upload mock */}
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-400 text-xs">
                <Upload size={18} />
                <span>Upload Invoice/Receipt Scan (Image/PDF)</span>
                <span className="text-[9px] text-slate-300">Supported files: JPG, PNG, PDF up to 5MB</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowAddModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Record Outflow</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Expense Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Edit Outlay Record</h3>
            <form onSubmit={handleEditExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Category</label>
                <select value={editFormData.category} onChange={e=>setEditFormData({...editFormData, category: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Amount (৳ BDT)</label>
                  <input type="number" min="1" value={editFormData.amount} onChange={e=>setEditFormData({...editFormData, amount: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Disbursed Date</label>
                  <input type="date" value={editFormData.date} onChange={e=>setEditFormData({...editFormData, date: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Payment Method</label>
                <select value={editFormData.paymentRecord} onChange={e=>setEditFormData({...editFormData, paymentRecord: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="bKash Merchant Payment">bKash Merchant Payment</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Description</label>
                <textarea rows={2} value={editFormData.description} onChange={e=>setEditFormData({...editFormData, description: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowEditModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Update Outflow</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
