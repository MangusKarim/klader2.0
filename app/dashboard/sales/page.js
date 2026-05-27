'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, Search, PlusCircle, Trash2, 
  Edit, Download, Printer, Check, X, FileText, 
  DollarSign, Truck, Calendar, Sparkles
} from 'lucide-react';

export default function SalesPage() {
  const { user } = useAuth();
  
  // Data States
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // Print invoice popup

  // Forms
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', customerAddress: '',
    productId: '', color: '', size: '', quantity: 1, sellingPrice: 0,
    isPrinted: false, printSize: 'A4', printCost: 0,
    deliveryCharge: 120, advancePayment: 0,
    paymentMethod: 'bKash', paymentStatus: 'Unpaid', deliveryStatus: 'Pending'
  });

  const [editFormData, setEditFormData] = useState({
    id: '', customerName: '', customerPhone: '', customerAddress: '',
    productId: '', color: '', size: '', quantity: 1, sellingPrice: 0,
    isPrinted: false, printSize: 'A4', printCost: 0,
    deliveryCharge: 120, advancePayment: 0,
    paymentMethod: 'bKash', paymentStatus: 'Unpaid', deliveryStatus: 'Pending'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const salesRes = await fetch('/api/sales');
      const salesData = await salesRes.json();
      
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();

      if (salesRes.ok && prodRes.ok) {
        setSales(salesData.sales || []);
        // Only show in-stock products for dropdown selection, or products matching
        setProducts(prodData.products || []);
      } else {
        setError('Failed to fetch sales/products metadata.');
      }
    } catch (e) {
      console.error(e);
      setError('Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const search = params.get('search');
      if (search) setSearchQuery(search);
    }
  }, []);

  const formatBDT = (amount) => {
    return `৳${parseFloat(amount || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
  };

  // Auto-load product details when product is selected in Add Form
  const handleProductChange = (prodId, isEdit = false) => {
    const selectedProd = products.find(p => p.id === prodId);
    if (!selectedProd) return;

    if (isEdit) {
      setEditFormData({
        ...editFormData,
        productId: prodId,
        sellingPrice: selectedProd.sellingPrice,
        color: selectedProd.color || '',
        size: selectedProd.size || ''
      });
    } else {
      setFormData({
        ...formData,
        productId: prodId,
        sellingPrice: selectedProd.sellingPrice,
        color: selectedProd.color || '',
        size: selectedProd.size || ''
      });
    }
  };

  // Add Sales Order
  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          customerName: '', customerPhone: '', customerAddress: '',
          productId: '', color: '', size: '', quantity: 1, sellingPrice: 0,
          isPrinted: false, printSize: 'A4', printCost: 0,
          deliveryCharge: 120, advancePayment: 0,
          paymentMethod: 'bKash', paymentStatus: 'Unpaid', deliveryStatus: 'Pending'
        });
        fetchData();
      } else {
        alert(data.error || 'Failed to create sales order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Sales Order
  const handleEditOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Sales Order
  const handleDeleteOrder = async (id) => {
    if (!confirm('Are you sure you want to delete this sales order? Stock will be restored to inventory.')) return;
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Sales Order Status Inline
  const handleUpdateStatus = async (orderId, updates) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, ...updates })
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating status.');
    }
  };

  // Print invoice helper
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-klader-burgundy/20 border-t-klader-burgundy rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-4">Retreiving sales invoices...</p>
      </div>
    );
  }

  // Filter orders
  const filteredSales = sales.filter(o => {
    const matchesSearch = 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || o.deliveryStatus === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-8">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Sales Orders Management</h2>
          <p className="text-xs text-slate-400 font-medium">Create invoices, check print options, and monitor courier delivery states.</p>
        </div>
        <div>
          {(user.role === 'admin' || user.role === 'staff' || user.permissions?.salesAccess) && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-klader-burgundy/10 cursor-pointer shadow-sm transition-all"
            >
              <PlusCircle size={14} />
              <span>Create Sales Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        
        {/* Search */}
        <div className="relative flex items-center w-full md:w-80">
          <Search className="absolute left-3.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search invoice ID, customer phone or product..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-klader-burgundy"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-slate-100 rounded-xl text-xs bg-white text-slate-500 font-semibold focus:outline-none"
            >
              <option value="All">All Courier Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select 
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="p-2 border border-slate-100 rounded-xl text-xs bg-white text-slate-500 font-semibold focus:outline-none"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main orders table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Invoice ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Qty</th>
                <th className="pb-3">Total Bill</th>
                <th className="pb-3">Advance / Due</th>
                <th className="pb-3">Courier Delivery</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No sales orders found matching filters.</td>
                </tr>
              ) : (
                filteredSales.map((o) => {
                  const itemPrice = o.sellingPrice * o.quantity;
                  const printPrice = (o.isPrinted ? o.printCost : 0) * o.quantity;
                  const totalBill = itemPrice + printPrice + o.deliveryCharge;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-mono text-[10px] text-slate-500 font-bold">{o.id}</td>
                      <td className="py-3.5">
                        <p className="font-semibold text-klader-charcoal">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{o.customerPhone}</p>
                      </td>
                      <td className="py-3.5">
                        <p>{o.productName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px]">
                          <span className="text-slate-400">Size: {o.size}</span>
                          <span className="text-slate-200">|</span>
                          <span className="text-slate-400">Color: {o.color}</span>
                          {o.isPrinted && (
                            <>
                              <span className="text-slate-200">|</span>
                              <span className="text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">Printed</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 font-bold">{o.quantity} pcs</td>
                      <td className="py-3.5 font-semibold text-slate-800">{formatBDT(totalBill)}</td>
                      <td className="py-3.5">
                        <p className="text-emerald-600 font-semibold">{formatBDT(o.advancePayment)}</p>
                        <p className={`font-semibold mt-0.5 ${o.remainingDue > 0 ? 'text-red-500' : 'text-slate-400'}`}>{formatBDT(o.remainingDue)}</p>
                      </td>
                      <td className="py-3.5">
                        {user.role === 'admin' || user.role === 'staff' || user.permissions?.salesAccess ? (
                          <select
                            value={o.deliveryStatus}
                            onChange={(e) => handleUpdateStatus(o.id, { deliveryStatus: e.target.value })}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border border-transparent focus:outline-none focus:border-slate-300 cursor-pointer transition-colors ${
                              o.deliveryStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-800' :
                              o.deliveryStatus === 'Cancelled' ? 'bg-red-50 text-red-800' :
                              o.deliveryStatus === 'Shipped' ? 'bg-indigo-50 text-indigo-800' :
                              'bg-amber-50 text-amber-800'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            o.deliveryStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-800' :
                            o.deliveryStatus === 'Cancelled' ? 'bg-red-50 text-red-800' :
                            o.deliveryStatus === 'Shipped' ? 'bg-indigo-50 text-indigo-800' :
                            'bg-amber-50 text-amber-800'
                          }`}>
                            {o.deliveryStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="flex flex-col gap-0.5">
                          {user.role === 'admin' || user.role === 'staff' || user.permissions?.salesAccess ? (
                            <select
                              value={o.paymentStatus}
                              onChange={(e) => handleUpdateStatus(o.id, { paymentStatus: e.target.value })}
                              className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-bold border border-transparent focus:outline-none focus:border-slate-300 cursor-pointer transition-colors ${
                                o.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                o.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Partial">Partial</option>
                              <option value="Paid">Paid</option>
                            </select>
                          ) : (
                            <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              o.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              o.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {o.paymentStatus}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 pl-1 capitalize">{o.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setSelectedInvoice(o)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="Print Invoice"
                          >
                            <Printer size={14} />
                          </button>
                          
                          {(user.role === 'admin' || user.role === 'staff' || user.permissions?.salesAccess) && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditFormData({
                                    id: o.id, customerName: o.customerName, customerPhone: o.customerPhone,
                                    customerAddress: o.customerAddress, productId: o.productId,
                                    color: o.color || '', size: o.size || '', quantity: o.quantity,
                                    sellingPrice: o.sellingPrice, isPrinted: o.isPrinted, printSize: o.printSize || 'A4',
                                    printCost: o.printCost || 0, deliveryCharge: o.deliveryCharge,
                                    advancePayment: o.advancePayment, paymentMethod: o.paymentMethod,
                                    paymentStatus: o.paymentStatus, deliveryStatus: o.deliveryStatus
                                  });
                                  setShowEditModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-klader-burgundy hover:bg-slate-50 rounded-lg cursor-pointer"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteOrder(o.id)}
                                className="p-1.5 text-slate-400 hover:text-klader-crimson hover:bg-red-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms & Dialog Modals */}
      {/* 1. Add Sales Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Create Sales Invoice</h3>
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Customer Name</label>
                  <input type="text" value={formData.customerName} onChange={e=>setFormData({...formData, customerName: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Phone Number</label>
                  <input type="text" placeholder="01xxxxxxxxx" value={formData.customerPhone} onChange={e=>setFormData({...formData, customerPhone: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Courier Delivery Address</label>
                <textarea rows={2} placeholder="House, Road, Area, District" value={formData.customerAddress} onChange={e=>setFormData({...formData, customerAddress: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Select Clothing Product</label>
                  <select 
                    value={formData.productId} 
                    onChange={e => handleProductChange(e.target.value, false)}
                    className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none" 
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                        {p.name} (SKU: {p.sku}) [Stock: {p.stockQuantity} pcs]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Quantity</label>
                  <input type="number" min="1" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Customer Preferred Color</label>
                  <input type="text" placeholder="e.g. Black / Navy" value={formData.color} onChange={e=>setFormData({...formData, color: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Customer Preferred Size</label>
                  <input type="text" placeholder="e.g. L / XL / M" value={formData.size} onChange={e=>setFormData({...formData, size: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Selling Price (৳ / Unit)</label>
                  <input type="number" value={formData.sellingPrice} onChange={e=>setFormData({...formData, sellingPrice: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-semibold text-klader-burgundy" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Delivery Charge (৳ BDT)</label>
                  <input type="number" value={formData.deliveryCharge} onChange={e=>setFormData({...formData, deliveryCharge: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>

              {/* Printing options toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <label className="flex items-center gap-2 font-semibold text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={formData.isPrinted} onChange={e=>setFormData({...formData, isPrinted: e.target.checked})} className="rounded text-klader-burgundy focus:ring-klader-burgundy/20 w-4 h-4 cursor-pointer" />
                  <span className="flex items-center gap-1"><Sparkles size={12} className="text-klader-burgundy" />Requires Custom Fabric Printing?</span>
                </label>
                
                {formData.isPrinted && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Print Size / Design ID</label>
                      <input type="text" placeholder="e.g. Chest Pocket / A4 Back" value={formData.printSize} onChange={e=>setFormData({...formData, printSize: e.target.value})} className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Printing Cost (৳ / Unit)</label>
                      <input type="number" placeholder="৳ BDT" value={formData.printCost} onChange={e=>setFormData({...formData, printCost: parseFloat(e.target.value)})} className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold" />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Advance Payment (৳)</label>
                  <input type="number" value={formData.advancePayment} onChange={e=>setFormData({...formData, advancePayment: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none text-emerald-600 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Method</label>
                  <select value={formData.paymentMethod} onChange={e=>setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Payment Status</label>
                  <select value={formData.paymentStatus} onChange={e=>setFormData({...formData, paymentStatus: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Courier Delivery Status</label>
                <select value={formData.deliveryStatus} onChange={e=>setFormData({...formData, deliveryStatus: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowAddModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Sales Order Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Edit Sales Invoice Details</h3>
            <form onSubmit={handleEditOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Customer Name</label>
                  <input type="text" value={editFormData.customerName} onChange={e=>setEditFormData({...editFormData, customerName: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Phone Number</label>
                  <input type="text" value={editFormData.customerPhone} onChange={e=>setEditFormData({...editFormData, customerPhone: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Courier Delivery Address</label>
                <textarea rows={2} value={editFormData.customerAddress} onChange={e=>setEditFormData({...editFormData, customerAddress: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Select Clothing Product</label>
                  <select 
                    value={editFormData.productId} 
                    onChange={e => handleProductChange(e.target.value, true)}
                    className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none" 
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku}) [Stock: {p.stockQuantity} pcs]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Quantity</label>
                  <input type="number" min="1" value={editFormData.quantity} onChange={e=>setEditFormData({...editFormData, quantity: parseInt(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Customer Preferred Color</label>
                  <input type="text" value={editFormData.color} onChange={e=>setEditFormData({...editFormData, color: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Customer Preferred Size</label>
                  <input type="text" value={editFormData.size} onChange={e=>setEditFormData({...editFormData, size: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Selling Price (৳ / Unit)</label>
                  <input type="number" value={editFormData.sellingPrice} onChange={e=>setEditFormData({...editFormData, sellingPrice: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-semibold text-klader-burgundy" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Delivery Charge (৳ BDT)</label>
                  <input type="number" value={editFormData.deliveryCharge} onChange={e=>setEditFormData({...editFormData, deliveryCharge: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>

              {/* Printing options toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <label className="flex items-center gap-2 font-semibold text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={editFormData.isPrinted} onChange={e=>setEditFormData({...editFormData, isPrinted: e.target.checked})} className="rounded text-klader-burgundy focus:ring-klader-burgundy/20 w-4 h-4 cursor-pointer" />
                  <span>Requires Custom Fabric Printing?</span>
                </label>
                
                {editFormData.isPrinted && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Print Size / Design ID</label>
                      <input type="text" placeholder="Chest / A4 Back" value={editFormData.printSize} onChange={e=>setEditFormData({...editFormData, printSize: e.target.value})} className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Printing Cost (৳ / Unit)</label>
                      <input type="number" placeholder="৳ BDT" value={editFormData.printCost} onChange={e=>setEditFormData({...editFormData, printCost: parseFloat(e.target.value)})} className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold" />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Advance Payment (৳)</label>
                  <input type="number" value={editFormData.advancePayment} onChange={e=>setEditFormData({...editFormData, advancePayment: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none text-emerald-600 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Method</label>
                  <select value={editFormData.paymentMethod} onChange={e=>setEditFormData({...editFormData, paymentMethod: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Payment Status</label>
                  <select value={editFormData.paymentStatus} onChange={e=>setEditFormData({...editFormData, paymentStatus: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Courier Delivery Status</label>
                <select value={editFormData.deliveryStatus} onChange={e=>setEditFormData({...editFormData, deliveryStatus: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowEditModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Update Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Invoice Printable Modal Display */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[95vh] overflow-y-auto flex flex-col">
            
            {/* Invoice Header (Interactive panel hidden during printing) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6 no-print">
              <h3 className="font-display font-semibold text-sm text-slate-500">Retail Sales Invoice</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-klader-burgundy hover:bg-klader-crimson text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-klader-burgundy/10"
                >
                  <Printer size={14} />
                  <span>Print Invoice / Save PDF</span>
                </button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Page */}
            <div className="flex-1 print-card p-4">
              
              {/* Branded Title Row */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center p-2 relative">
                    <img src="/logo.svg" alt="Klader Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-klader-burgundy tracking-wide leading-none">KLADER</h2>
                    <p className="text-[9px] tracking-widest text-slate-400 uppercase font-semibold mt-1">Luxury Clothing Brand</p>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="font-display font-bold text-lg text-slate-700 leading-none">INVOICE</h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-2">No: {selectedInvoice.id}</p>
                </div>
              </div>

              {/* Billed To / From Row */}
              <div className="grid grid-cols-2 gap-8 my-6 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider mb-2">Billed To:</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedInvoice.customerName}</p>
                  <p className="text-slate-500 mt-1">{selectedInvoice.customerPhone}</p>
                  {selectedInvoice.customerAddress && (
                    <p className="text-slate-400 mt-1 max-w-[220px] leading-relaxed">{selectedInvoice.customerAddress}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider mb-2">Billed From:</p>
                  <p className="font-bold text-slate-800 text-sm">Klader Business</p>
                  <p className="text-slate-500 mt-1">admin@klader.life</p>
                  <p className="text-slate-400 mt-1">Dhaka, Bangladesh</p>
                  <p className="text-slate-500 mt-3 flex items-center justify-end gap-1.5">
                    <Calendar size={12} className="text-slate-400" />
                    {new Date(selectedInvoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left border-collapse text-xs my-6">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-2.5 pl-3">Description</th>
                    <th className="py-2.5">Unit Price</th>
                    <th className="py-2.5">Qty</th>
                    <th className="py-2.5 text-right pr-3">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  <tr>
                    <td className="py-4 pl-3">
                      <p className="font-semibold text-slate-800">{selectedInvoice.productName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Size: {selectedInvoice.size} | Color: {selectedInvoice.color}</p>
                    </td>
                    <td className="py-4">{formatBDT(selectedInvoice.sellingPrice)}</td>
                    <td className="py-4 font-bold">{selectedInvoice.quantity}</td>
                    <td className="py-4 text-right pr-3 font-semibold">{formatBDT(selectedInvoice.sellingPrice * selectedInvoice.quantity)}</td>
                  </tr>
                  
                  {/* Print cost as sub-item if applicable */}
                  {selectedInvoice.isPrinted && (
                    <tr className="bg-slate-50/20 text-slate-500">
                      <td className="py-3 pl-3">
                        <p className="font-medium">Fabric Custom Printing Service</p>
                        <p className="text-[10px] text-slate-400">Design Size: {selectedInvoice.printSize}</p>
                      </td>
                      <td className="py-3">{formatBDT(selectedInvoice.printCost)}</td>
                      <td className="py-3 font-bold">{selectedInvoice.quantity}</td>
                      <td className="py-3 text-right pr-3 font-semibold">{formatBDT(selectedInvoice.printCost * selectedInvoice.quantity)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Calculations Block */}
              <div className="border-t border-slate-100 pt-6 flex justify-end">
                <div className="w-64 space-y-2 text-xs text-slate-500 font-medium">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="text-slate-800 font-semibold">{formatBDT((selectedInvoice.sellingPrice + (selectedInvoice.isPrinted ? selectedInvoice.printCost : 0)) * selectedInvoice.quantity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Courier Delivery:</span>
                    <span className="text-slate-800 font-semibold">{formatBDT(selectedInvoice.deliveryCharge)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-50 pt-2 font-bold text-slate-800 text-sm">
                    <span>Total Bill:</span>
                    <span className="text-klader-burgundy">{formatBDT(((selectedInvoice.sellingPrice + (selectedInvoice.isPrinted ? selectedInvoice.printCost : 0)) * selectedInvoice.quantity) + selectedInvoice.deliveryCharge)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Advance Payment:</span>
                    <span className="font-semibold">{formatBDT(selectedInvoice.advancePayment)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-sm text-slate-900 bg-slate-50/50 p-2 rounded-xl">
                    <span>Due Balance:</span>
                    <span className={selectedInvoice.remainingDue > 0 ? 'text-red-500' : 'text-slate-500'}>
                      {formatBDT(selectedInvoice.remainingDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details footer */}
              <div className="my-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 grid grid-cols-3 gap-4 text-[10px] text-slate-500">
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-400 mb-1">Courier Status</p>
                  <p className="font-bold text-slate-700">{selectedInvoice.deliveryStatus}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment Method</p>
                  <p className="font-bold text-slate-700 capitalize">{selectedInvoice.paymentMethod}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment State</p>
                  <p className={`font-bold ${selectedInvoice.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {selectedInvoice.paymentStatus}
                  </p>
                </div>
              </div>

              {/* Signatures / Terms */}
              <div className="mt-12 flex justify-between items-end text-[9px] text-slate-400">
                <div>
                  <p className="font-semibold">Thank you for your business with Klader!</p>
                  <p className="mt-1">For support, contact support@klader.life or call +8801912345678</p>
                </div>
                <div className="text-right w-40 border-t border-slate-200 pt-1">
                  <p className="font-bold text-slate-500">Authorized Signature</p>
                  <p className="mt-1">Klader ERP Billing System</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
