'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, DollarSign, PieChart, TrendingUp, Plus, 
  Trash2, Edit, Check, X, Shield, Phone, Mail, 
  Clock, CheckCircle, XCircle, FileText, ChevronRight
} from 'lucide-react';

export default function PartnersPage() {
  const { user } = useAuth();
  
  // States
  const [partners, setPartners] = useState([]);
  const [requests, setRequests] = useState([]);
  const [netProfit, setNetProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals / Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', username: '', password: '',
    type: 'Investor', investmentAmount: 0, ownershipPercentage: 0,
    notes: '', accessLevel: 'view'
  });

  const [editFormData, setEditFormData] = useState({
    id: '', name: '', phone: '', email: '', type: 'Investor',
    ownershipPercentage: 0, notes: '', additionalInvestment: 0, withdrawalAmount: 0
  });

  const [requestFormData, setRequestFormData] = useState({
    type: 'Withdrawal', amount: 0, notes: ''
  });

  const [selectedPartnerTimeline, setSelectedPartnerTimeline] = useState(null);

  // Fetch partners & requests
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get partners
      const partnersRes = await fetch('/api/partners');
      const partnersData = await partnersRes.json();
      
      // Get requests
      const requestsRes = await fetch('/api/requests');
      const requestsData = await requestsRes.json();

      // Get dashboard financials (for net profit)
      const dashRes = await fetch('/api/dashboard-data');
      const dashData = await dashRes.json();

      if (partnersRes.ok && requestsRes.ok && dashRes.ok) {
        setPartners(partnersData.partners || []);
        setRequests(requestsData.requests || []);
        setNetProfit(dashData.metrics?.netProfit || 0);
      } else {
        setError('Failed to fetch partners/requests metadata.');
      }
    } catch (e) {
      console.error(e);
      setError('Network communication failed.');
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

  // Add Partner
  const handleAddPartner = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          name: '', phone: '', email: '', username: '', password: '',
          type: 'Investor', investmentAmount: 0, ownershipPercentage: 0,
          notes: '', accessLevel: 'view'
        });
        fetchData();
      } else {
        alert(data.error || 'Failed to create partner');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Partner
  const handleEditPartner = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        setEditFormData({
          id: '', name: '', phone: '', email: '', type: 'Investor',
          ownershipPercentage: 0, notes: '', additionalInvestment: 0, withdrawalAmount: 0
        });
        fetchData();
      } else {
        alert(data.error || 'Failed to update partner');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Partner
  const handleDeletePartner = async (id) => {
    if (!confirm('Are you sure you want to delete this partner? This deletes their ledger and associated user account.')) return;
    try {
      const res = await fetch(`/api/partners?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete partner');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit request (invest/withdrawal)
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestFormData)
      });
      const d = await res.json();
      if (res.ok) {
        setShowRequestModal(false);
        setRequestFormData({ type: 'Withdrawal', amount: 0, notes: '' });
        fetchData();
      } else {
        alert(d.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Process request (Approve/Reject)
  const handleProcessRequest = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this request?`)) return;
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      const d = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(d.error || 'Failed to process request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-klader-burgundy/20 border-t-klader-burgundy rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-4">Loading partners profile...</p>
      </div>
    );
  }

  // Derived Admin Calculations
  const totalInvested = partners.reduce((sum, p) => sum + p.investmentAmount, 0);
  const totalWithdrawn = partners.reduce((sum, p) => sum + p.totalWithdrawals, 0);
  const totalRemainingBalance = totalInvested - totalWithdrawn;
  const totalOwnershipPercentage = partners.reduce((sum, p) => sum + p.ownershipPercentage, 0);
  const totalDistributedProfit = netProfit * (totalOwnershipPercentage / 100);
  const undistributedReserve = netProfit - totalDistributedProfit;

  return (
    <div className="space-y-8">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Partner & Investor Ledger</h2>
          <p className="text-xs text-slate-400 font-medium">Manage investment capital, ownership logs, and distributed yields.</p>
        </div>
        <div>
          {user.role === 'admin' ? (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-klader-burgundy/10 cursor-pointer shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>Add Partner</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-klader-burgundy/10 cursor-pointer shadow-sm transition-all"
            >
              <DollarSign size={14} />
              <span>Request Withdrawal/Investment</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview Cards (Admin View) */}
      {user.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Capital Invested</span>
            <h3 className="text-2xl font-display font-semibold">{formatBDT(totalInvested)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Sum of all partner contributions</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Distributed Profit Share</span>
            <h3 className="text-2xl font-display font-semibold text-klader-burgundy">{formatBDT(totalDistributedProfit)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Based on {totalOwnershipPercentage}% total ownership</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Undistributed Reserve</span>
            <h3 className="text-2xl font-display font-semibold text-emerald-600">{formatBDT(undistributedReserve)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Retained within company balance</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Active Capital Balance</span>
            <h3 className="text-2xl font-display font-semibold">{formatBDT(totalRemainingBalance)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Investments minus approved withdrawals</p>
          </div>
        </div>
      )}

      {/* Partners List & Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Partners table list (Col span 2) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm xl:col-span-2">
          <h3 className="font-display font-semibold text-base mb-6">Partners & Profit Distribution</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Partner Details</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Investment</th>
                  <th className="pb-3">Share %</th>
                  <th className="pb-3">Profit Yield</th>
                  <th className="pb-3">Net Balance</th>
                  {user.role === 'admin' && <th className="pb-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">No partners records found.</td>
                  </tr>
                ) : (
                  partners.map((p) => {
                    const yieldShare = netProfit * (p.ownershipPercentage / 100);
                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          selectedPartnerTimeline?.id === p.id ? 'bg-slate-50' : ''
                        }`}
                        onClick={() => setSelectedPartnerTimeline(p)}
                      >
                        <td className="py-4">
                          <p className="font-semibold text-klader-charcoal">{p.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                            <span className="flex items-center gap-0.5"><Phone size={10} />{p.phone}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><Mail size={10} />{p.email}</span>
                          </div>
                        </td>
                        <td className="py-4 font-semibold text-slate-500">{p.type}</td>
                        <td className="py-4">{formatBDT(p.investmentAmount)}</td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-slate-100 rounded-full font-bold text-slate-700">
                            {p.ownershipPercentage}%
                          </span>
                        </td>
                        <td className="py-4 font-semibold text-klader-burgundy">{formatBDT(yieldShare)}</td>
                        <td className="py-4 font-semibold text-slate-800">{formatBDT(p.remainingBalance)}</td>
                        {user.role === 'admin' && (
                          <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  setEditFormData({
                                    id: p.id,
                                    name: p.name,
                                    phone: p.phone,
                                    email: p.email,
                                    type: p.type,
                                    ownershipPercentage: p.ownershipPercentage,
                                    notes: p.notes || '',
                                    additionalInvestment: 0,
                                    withdrawalAmount: 0
                                  });
                                  setShowEditModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-klader-burgundy hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeletePartner(p.id)}
                                className="p-1.5 text-slate-400 hover:text-klader-crimson hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Partner Ledger Timeline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm flex flex-col h-[480px]">
          <h3 className="font-display font-semibold text-base mb-1">Financial Timeline</h3>
          <p className="text-xs text-slate-400 mb-6">Select a partner row to view audit history logs.</p>
          
          {selectedPartnerTimeline ? (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="pb-4 border-b border-slate-50 mb-2">
                <h4 className="font-semibold text-sm">{selectedPartnerTimeline.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 capitalize">Access Linked Profile: {selectedPartnerTimeline.username}</p>
                {selectedPartnerTimeline.notes && (
                  <p className="text-xs italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-500 mt-3">{selectedPartnerTimeline.notes}</p>
                )}
              </div>

              <div className="space-y-4 pl-3 relative border-l border-slate-100">
                {(selectedPartnerTimeline.activityLog || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 pl-2">No transaction history recorded yet.</p>
                ) : (
                  selectedPartnerTimeline.activityLog.map((log, i) => (
                    <div key={log.id || i} className="relative pl-4">
                      {/* Timeline dot */}
                      <span className="absolute left-[-17.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-klader-burgundy ring-4 ring-white"></span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{log.action}</p>
                        <p className="text-xs font-bold text-klader-burgundy mt-1">{formatBDT(log.amount)}</p>
                        {log.notes && <p className="text-[10px] text-slate-400 mt-0.5">{log.notes}</p>}
                        <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={8} />
                          {new Date(log.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-slate-100 rounded-3xl p-6 text-center text-slate-400 text-xs">
              Click a partner on the table to view their individual transaction ledger & history timeline.
            </div>
          )}
        </div>

      </div>

      {/* Requests Approvals workflow (Admin View or Partner View) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-1">
          {user.role === 'admin' ? 'Pending Financial Request Approvals' : 'My Financial Requests History'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          {user.role === 'admin' ? 'Verify and authorize partner withdrawal or additional investment claims.' : 'Track approvals of your pending capital deposits and withdrawals.'}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Partner</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Notes</th>
                <th className="pb-3">Submitted</th>
                <th className="pb-3">Status</th>
                {user.role === 'admin' && <th className="pb-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">No recent requests recorded.</td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-semibold text-slate-800">{r.partnerName}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        r.type === 'Investment' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-800">{formatBDT(r.amount)}</td>
                    <td className="py-3.5 italic text-slate-400 max-w-[200px] truncate" title={r.notes}>{r.notes || 'No description'}</td>
                    <td className="py-3.5 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800 animate-pulse'
                      }`}>
                        {r.status}
                      </span>
                      {r.approvedBy && (
                        <p className="text-[8px] text-slate-400 mt-1">Processed by {r.approvedBy}</p>
                      )}
                    </td>
                    {user.role === 'admin' && (
                      <td className="py-3.5 text-right">
                        {r.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleProcessRequest(r.id, 'Approve')}
                              className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleProcessRequest(r.id, 'Reject')}
                              className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Forms */}
      {/* 1. Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Add Partner & Setup Auth Login</h3>
            <form onSubmit={handleAddPartner} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Partner Name</label>
                  <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-klader-burgundy" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Partner Type</label>
                  <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-klader-burgundy bg-white">
                    <option value="Investor">Investor</option>
                    <option value="Non-investing Partner">Non-investing Partner</option>
                    <option value="Silent Partner">Silent Partner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Phone Number</label>
                  <input type="text" placeholder="017xxxxxxxx" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Email Address</label>
                  <input type="email" placeholder="partner@klader.life" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Username (User ID)</label>
                  <input type="text" placeholder="For login access" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Password</label>
                  <input type="password" placeholder="For login access" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Investment Amount (৳ BDT)</label>
                  <input type="number" value={formData.investmentAmount} onChange={e=>setFormData({...formData, investmentAmount: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Ownership share (%)</label>
                  <input type="number" step="0.01" value={formData.ownershipPercentage} onChange={e=>setFormData({...formData, ownershipPercentage: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">System Access Level</label>
                <select value={formData.accessLevel} onChange={e=>setFormData({...formData, accessLevel: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none bg-white">
                  <option value="view">View Access Only (Read-Only Dashboard & Reports)</option>
                  <option value="sales">Sales Access (Sales, Deliveries, Stock)</option>
                  <option value="full">Full Access (Manage Inventory, Expenses, Requests)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Admin Notes</label>
                <textarea rows={2} value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowAddModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Partner Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Edit Partner Ledger Profile</h3>
            <form onSubmit={handleEditPartner} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Partner Name</label>
                  <input type="text" value={editFormData.name} onChange={e=>setEditFormData({...editFormData, name: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Partner Type</label>
                  <select value={editFormData.type} onChange={e=>setEditFormData({...editFormData, type: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none bg-white">
                    <option value="Investor">Investor</option>
                    <option value="Non-investing Partner">Non-investing Partner</option>
                    <option value="Silent Partner">Silent Partner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Phone Number</label>
                  <input type="text" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Email Address</label>
                  <input type="email" value={editFormData.email} onChange={e=>setEditFormData({...editFormData, email: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Ownership Share (%)</label>
                  <input type="number" step="0.01" value={editFormData.ownershipPercentage} onChange={e=>setEditFormData({...editFormData, ownershipPercentage: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Add Capital (৳ BDT)</label>
                  <input type="number" placeholder="Enter amount to add" value={editFormData.additionalInvestment} onChange={e=>setEditFormData({...editFormData, additionalInvestment: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none text-emerald-600 font-semibold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Record Withdrawal (৳ BDT)</label>
                  <input type="number" placeholder="Enter amount to withdraw" value={editFormData.withdrawalAmount} onChange={e=>setEditFormData({...editFormData, withdrawalAmount: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none text-red-600 font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Admin Notes</label>
                <textarea rows={2} value={editFormData.notes} onChange={e=>setEditFormData({...editFormData, notes: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowEditModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Update Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Partner Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Submit Financial Request</h3>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Request Type</label>
                <select value={requestFormData.type} onChange={e=>setRequestFormData({...requestFormData, type: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none bg-white">
                  <option value="Withdrawal">Withdrawal (Request payout from remaining balance)</option>
                  <option value="Investment">Investment (Declare intent to invest additional funds)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Amount (৳ BDT)</label>
                <input type="number" min="1" value={requestFormData.amount} onChange={e=>setRequestFormData({...requestFormData, amount: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Reason / Description</label>
                <textarea rows={3} placeholder="Please provide reasoning for admin review..." value={requestFormData.notes} onChange={e=>setRequestFormData({...requestFormData, notes: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowRequestModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
