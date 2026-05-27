'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Package, Search, PlusCircle, AlertTriangle, 
  Trash2, Edit, Download, Plus, Shield, UserPlus, 
  Tag, Barcode, DollarSign, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const { user } = useAuth();
  
  // Data States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Category management states
  const [categoriesList, setCategoriesList] = useState(['Punjabi', 'Saree', 'Kurti', 'Polo', 'Sherwani', 'Pant', 'T-Shirt', 'Shoe']);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false); // Quick Admin Partner Shortcut

  // Forms & Multi-Variant States
  const [baseProductInfo, setBaseProductInfo] = useState({
    name: '', sku: '', category: 'Punjabi', supplierName: '', sellingPrice: ''
  });

  const [variants, setVariants] = useState([
    { color: '', size: 'L', stockQuantity: '', buyingPrice: '', sellingPrice: '', sku: '', customSku: false }
  ]);

  const [editFormData, setEditFormData] = useState({
    id: '', name: '', sku: '', category: 'Punjabi', color: '', size: 'L',
    buyingPrice: '', sellingPrice: '', stockQuantity: '', supplierName: ''
  });

  const [partnerFormData, setPartnerFormData] = useState({
    name: '', phone: '', email: '', username: '', password: '',
    type: 'Investor', investmentAmount: 0, ownershipPercentage: 0,
    notes: '', accessLevel: 'view'
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        setError('Failed to load inventory.');
      }
    } catch (e) {
      console.error(e);
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok) {
        setCategoriesList(data.categories || []);
        // Also update initial category of baseProductInfo if it's not set
        if (data.categories && data.categories.length > 0) {
          setBaseProductInfo(prev => ({ ...prev, category: prev.category || data.categories[0] }));
        }
      } else {
        console.error('Failed to load categories');
      }
    } catch (e) {
      console.error('Network error fetching categories:', e);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    
    // Check if query parameters have search terms (redirected search)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const search = params.get('search');
      if (search) setSearchQuery(search);
    }
  }, []);

  const formatBDT = (amount) => {
    return `৳${parseFloat(amount || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
  };

  // Open Add Modal Helper
  const handleOpenAddModal = () => {
    setBaseProductInfo({
      name: '',
      sku: '',
      category: categoriesList[0] || 'Punjabi',
      supplierName: '',
      sellingPrice: ''
    });
    setVariants([
      { color: '', size: 'L', stockQuantity: '', buyingPrice: '', sellingPrice: '', sku: '', customSku: false }
    ]);
    setShowAddModal(true);
  };

  // Helper to generate dynamic variant SKU
  const getGeneratedSku = (baseSku, color, size, index) => {
    if (!baseSku) return '';
    const cleanColor = color ? color.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const cleanSize = size ? size.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    
    if (!cleanColor && !cleanSize) {
      return `${baseSku}-${index + 1}`;
    }
    
    let parts = [baseSku];
    if (cleanColor) parts.push(cleanColor);
    if (cleanSize) parts.push(cleanSize);
    return parts.join('-');
  };

  // Helper to update individual variant field
  const updateVariantField = (index, field, value) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      
      // If color or size is being updated, auto-generate sku if it's not custom
      if (field === 'color' || field === 'size') {
        if (!next[index].customSku) {
          const colorVal = field === 'color' ? value : next[index].color;
          const sizeVal = field === 'size' ? value : next[index].size;
          next[index].sku = getGeneratedSku(baseProductInfo.sku, colorVal, sizeVal, index);
        }
      }
      
      if (field === 'sku') {
        next[index].customSku = true; // User manually edited it
      }
      
      return next;
    });
  };

  // Helper to update base SKU and refresh non-custom variant SKUs
  const handleBaseSkuChange = (val) => {
    setBaseProductInfo(prev => ({ ...prev, sku: val }));
    setVariants(currVariants => 
      currVariants.map((v, idx) => {
        if (!v.customSku) {
          return { ...v, sku: getGeneratedSku(val, v.color, v.size, idx) };
        }
        return v;
      })
    );
  };

  // Helper to update base selling price and default it to empty variants
  const handleBaseSellingPriceChange = (val) => {
    setBaseProductInfo(prev => ({ ...prev, sellingPrice: val }));
    setVariants(currVariants => 
      currVariants.map(v => {
        if (!v.sellingPrice) {
          return { ...v, sellingPrice: val };
        }
        return v;
      })
    );
  };

  // Helper to append a variant row
  const handleAddVariantRow = () => {
    setVariants(prev => [
      ...prev,
      {
        color: '',
        size: 'L',
        stockQuantity: '',
        buyingPrice: '',
        sellingPrice: baseProductInfo.sellingPrice || '',
        sku: getGeneratedSku(baseProductInfo.sku, '', 'L', prev.length),
        customSku: false
      }
    ]);
  };

  // Helper to remove a variant row
  const handleRemoveVariantRow = (index) => {
    if (variants.length === 1) return;
    setVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  // Add Product (Processes parallel variant creations)
  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!baseProductInfo.name || !baseProductInfo.sku || !baseProductInfo.category) {
      alert('Product Name, Base SKU, and Category are required.');
      return;
    }

    // Validation
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.sku) {
        alert(`SKU is required for all variants (row ${i + 1}).`);
        return;
      }
      if (v.buyingPrice === '' || v.sellingPrice === '' || v.stockQuantity === '') {
        alert(`Buying price, Selling price, and Qty are required for all variants (row ${i + 1}).`);
        return;
      }
    }

    try {
      setLoading(true);
      
      const promises = variants.map(v => {
        const productPayload = {
          name: baseProductInfo.name,
          sku: v.sku,
          category: baseProductInfo.category,
          color: v.color || '',
          size: v.size || '',
          buyingPrice: parseFloat(v.buyingPrice),
          sellingPrice: parseFloat(v.sellingPrice),
          stockQuantity: parseInt(v.stockQuantity),
          supplierName: baseProductInfo.supplierName || ''
        };
        
        return fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload)
        });
      });
      
      const responses = await Promise.all(promises);
      let successCount = 0;
      let errors = [];
      
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        const data = await res.json();
        if (res.ok) {
          successCount++;
        } else {
          errors.push(`Variant ${variants[i].sku}: ${data.error || 'Unknown error'}`);
        }
      }
      
      if (errors.length > 0) {
        alert(`Added ${successCount} variants successfully.\nFailed variants:\n${errors.join('\n')}`);
      } else {
        setShowAddModal(false);
      }
      
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving products.');
    } finally {
      setLoading(false);
    }
  };

  // Add Product Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategorySubmitting(true);
    setCategoryError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      const data = await res.json();
      if (res.ok) {
        setNewCategoryName('');
        await fetchCategories();
      } else {
        setCategoryError(data.error || 'Failed to add category.');
      }
    } catch (err) {
      console.error(err);
      setCategoryError('Network connection error.');
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Delete Product Category
  const handleDeleteCategory = async (name) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;
    setCategoryError('');
    try {
      const res = await fetch(`/api/categories?name=${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        await fetchCategories();
      } else {
        setCategoryError(data.error || 'Failed to delete category.');
      }
    } catch (err) {
      console.error(err);
      setCategoryError('Network connection error.');
    }
  };

  // Edit Product
  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to update product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Partner Shortcut
  const handleAddPartnerShortcut = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerFormData)
      });
      const d = await res.json();
      if (res.ok) {
        setShowPartnerModal(false);
        setPartnerFormData({
          name: '', phone: '', email: '', username: '', password: '',
          type: 'Investor', investmentAmount: 0, ownershipPercentage: 0,
          notes: '', accessLevel: 'view'
        });
        alert('Partner profile and login credentials created successfully.');
      } else {
        alert(d.error || 'Failed to create partner');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (products.length === 0) return;
    
    const headers = ['Product ID', 'Product Name', 'SKU', 'Category', 'Color', 'Size', 'Buying Price', 'Selling Price', 'Stock Qty', 'Supplier', 'Status'];
    const rows = products.map(p => [
      p.id, p.name, p.sku, p.category, p.color, p.size, p.buyingPrice, p.sellingPrice, p.stockQuantity, p.supplierName, p.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Klader_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-klader-burgundy/20 border-t-klader-burgundy rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-4">Counting inventory catalog...</p>
      </div>
    );
  }

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'In Stock') matchesStock = p.stockQuantity > 0;
    else if (stockFilter === 'Low Stock') matchesStock = p.stockQuantity > 0 && p.stockQuantity < 15;
    else if (stockFilter === 'Out of Stock') matchesStock = p.stockQuantity === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Financial aggregates
  const totalValuation = products.reduce((sum, p) => sum + (p.buyingPrice * p.stockQuantity), 0);
  const potentialRevenue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stockQuantity), 0);
  const potentialProfit = potentialRevenue - totalValuation;
  const totalItemsCount = products.reduce((sum, p) => sum + p.stockQuantity, 0);

  // Categories list
  const categories = ['All', ...new Set([...categoriesList, ...products.map(p => p.category)])];

  return (
    <div className="space-y-8">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Stock & Inventory Catalog</h2>
          <p className="text-xs text-slate-400 font-medium">Add, track, and analyze clothing products and valuations.</p>
        </div>
        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <button 
              onClick={() => {
                setCategoryError('');
                setShowCategoriesModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
            >
              <Tag size={14} className="text-slate-400" />
              <span>Manage Categories</span>
            </button>
          )}

          {user.role === 'admin' && (
            <button 
              onClick={() => setShowPartnerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm"
            >
              <UserPlus size={14} className="text-slate-400" />
              <span>Create Partner Account</span>
            </button>
          )}
          
          {(user.role === 'admin' || user.role === 'staff' || user.permissions?.salesAccess) && (
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-klader-burgundy/10 cursor-pointer transition-all"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Asset Valuation Info Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Inventory Cost Valuation</span>
          <h3 className="text-2xl font-display font-semibold text-slate-800">{formatBDT(totalValuation)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Capital currently locked in assets</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Potential Revenue</span>
          <h3 className="text-2xl font-display font-semibold text-klader-burgundy">{formatBDT(potentialRevenue)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Sum of selling prices</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Estimated Yield Profit</span>
          <h3 className="text-2xl font-display font-semibold text-emerald-600">{formatBDT(potentialProfit)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">If all current stock is sold</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm glass-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Units in Stock</span>
          <h3 className="text-2xl font-display font-semibold text-indigo-600">
            {totalItemsCount} <span className="text-sm font-medium text-slate-400">Pcs</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Sum of all clothing stock quantities</p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex items-center w-full md:w-80">
          <Search className="absolute left-3.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search SKU, product or supplier..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-klader-burgundy"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 border border-slate-100 rounded-xl text-xs bg-white text-slate-500 font-semibold focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <select 
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="p-2 border border-slate-100 rounded-xl text-xs bg-white text-slate-500 font-semibold focus:outline-none"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock (&lt; 15 pcs)</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <button 
            onClick={handleExportCSV}
            disabled={filteredProducts.length === 0}
            className="flex items-center gap-2 p-2 border border-slate-100 hover:border-klader-burgundy hover:text-klader-burgundy text-slate-500 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
            title="Export spreadsheet report"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main table catalog */}
      <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Product Name</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Color / Size</th>
                <th className="pb-3">Buying Price</th>
                <th className="pb-3">Selling Price</th>
                <th className="pb-3">Stock Quantity</th>
                <th className="pb-3">Supplier</th>
                <th className="pb-3">Status</th>
                {(user.role === 'admin' || user.role === 'staff' || user.permissions?.salesAccess) && <th className="pb-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">No products found matching filters.</td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-semibold text-klader-charcoal">{p.name}</td>
                    <td className="py-3.5">
                      <span className="font-mono bg-slate-50 px-2 py-0.5 border border-slate-100 rounded text-slate-600 font-semibold">
                        {p.sku}
                      </span>
                    </td>
                    <td className="py-3.5">{p.category}</td>
                    <td className="py-3.5 text-slate-500">{p.color} / {p.size}</td>
                    <td className="py-3.5">{formatBDT(p.buyingPrice)}</td>
                    <td className="py-3.5 text-klader-burgundy font-semibold">{formatBDT(p.sellingPrice)}</td>
                    <td className="py-3.5">
                      <span className={`font-bold ${
                        p.stockQuantity === 0 ? 'text-red-600' :
                        p.stockQuantity < 15 ? 'text-amber-600' : 'text-slate-800'
                      }`}>
                        {p.stockQuantity} pcs
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">{p.supplierName}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        p.stockQuantity === 0 ? 'bg-red-50 text-red-800' :
                        p.stockQuantity < 15 ? 'bg-amber-50 text-amber-800' :
                        'bg-emerald-50 text-emerald-800'
                      }`}>
                        {p.stockQuantity === 0 ? 'Out of Stock' : p.stockQuantity < 15 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    {(user.role === 'admin' || user.role === 'staff' || user.permissions?.salesAccess) && (
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditFormData({
                                id: p.id, name: p.name, sku: p.sku, category: p.category,
                                color: p.color, size: p.size, buyingPrice: p.buyingPrice,
                                sellingPrice: p.sellingPrice, stockQuantity: p.stockQuantity,
                                supplierName: p.supplierName
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-klader-burgundy hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
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
      {/* 1. Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Add Product (with Variants)</h3>
            <form onSubmit={handleAddProduct} className="space-y-6">
              
              {/* Section 1: General Info */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. General Information (Shared)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Product Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Royal Navy Velvet Punjabi" 
                      value={baseProductInfo.name} 
                      onChange={e=>setBaseProductInfo({...baseProductInfo, name: e.target.value})} 
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:outline-none" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Category</label>
                    <select 
                      value={baseProductInfo.category} 
                      onChange={e=>setBaseProductInfo({...baseProductInfo, category: e.target.value})} 
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:outline-none"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      {categoriesList.length === 0 && <option value="Punjabi">Punjabi</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Base SKU Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. PNJ-VEL-001" 
                      value={baseProductInfo.sku} 
                      onChange={e=>handleBaseSkuChange(e.target.value)} 
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:outline-none font-semibold" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Base Selling Price (Default)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1500" 
                      value={baseProductInfo.sellingPrice} 
                      onChange={e=>handleBaseSellingPriceChange(e.target.value)} 
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:outline-none font-semibold text-klader-burgundy" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Supplier Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dhaka Fabrics" 
                      value={baseProductInfo.supplierName} 
                      onChange={e=>setBaseProductInfo({...baseProductInfo, supplierName: e.target.value})} 
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Variants */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Product Variants (Add separate sizes & colors)</span>
                  <button 
                    type="button" 
                    onClick={handleAddVariantRow} 
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Plus size={12} className="text-slate-400" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-semibold">
                          <th className="p-3 w-[15%]">Color</th>
                          <th className="p-3 w-[12%]">Size</th>
                          <th className="p-3 w-[12%]">Stock Qty</th>
                          <th className="p-3 w-[15%]">Buying (Cost)</th>
                          <th className="p-3 w-[15%]">Selling (Retail)</th>
                          <th className="p-3 w-[25%]">Variant SKU</th>
                          <th className="p-3 w-[6%] text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {variants.map((v, index) => (
                          <tr key={index} className="hover:bg-slate-50/20">
                            <td className="p-2">
                              <input 
                                type="text" 
                                placeholder="Black / Blue" 
                                value={v.color} 
                                onChange={e=>updateVariantField(index, 'color', e.target.value)} 
                                className="w-full p-2 border border-slate-100 rounded-lg text-xs focus:outline-none" 
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="text" 
                                placeholder="M / L / Free" 
                                value={v.size} 
                                onChange={e=>updateVariantField(index, 'size', e.target.value)} 
                                className="w-full p-2 border border-slate-100 rounded-lg text-xs focus:outline-none font-semibold text-slate-700" 
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                placeholder="Qty" 
                                value={v.stockQuantity} 
                                onChange={e=>updateVariantField(index, 'stockQuantity', e.target.value)} 
                                className="w-full p-2 border border-slate-100 rounded-lg text-xs focus:outline-none font-bold" 
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                placeholder="Cost" 
                                value={v.buyingPrice} 
                                onChange={e=>updateVariantField(index, 'buyingPrice', e.target.value)} 
                                className="w-full p-2 border border-slate-100 rounded-lg text-xs focus:outline-none font-semibold text-slate-600" 
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                placeholder="Retail" 
                                value={v.sellingPrice} 
                                onChange={e=>updateVariantField(index, 'sellingPrice', e.target.value)} 
                                className="w-full p-2 border border-slate-100 rounded-lg text-xs focus:outline-none font-semibold text-klader-burgundy" 
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="text" 
                                placeholder="Generated SKU" 
                                value={v.sku} 
                                onChange={e=>updateVariantField(index, 'sku', e.target.value)} 
                                className="w-full p-2 border border-slate-100 rounded-lg text-xs focus:outline-none font-mono text-slate-500 bg-slate-50/50" 
                                required
                              />
                            </td>
                            <td className="p-2 text-center">
                              {variants.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={()=>handleRemoveVariantRow(index)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={()=>setShowAddModal(false)} 
                  className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer transition-all hover:shadow-lg hover:shadow-klader-burgundy/10"
                >
                  Save Product & Variants
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Edit Product Parameters</h3>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Product Title</label>
                <input type="text" value={editFormData.name} onChange={e=>setEditFormData({...editFormData, name: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">SKU Code</label>
                  <input type="text" value={editFormData.sku} onChange={e=>setEditFormData({...editFormData, sku: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Category</label>
                  <select value={editFormData.category} onChange={e=>setEditFormData({...editFormData, category: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {categoriesList.length === 0 && <option value="Punjabi">Punjabi</option>}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Color</label>
                  <input type="text" value={editFormData.color} onChange={e=>setEditFormData({...editFormData, color: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Size Variation</label>
                  <input type="text" value={editFormData.size} onChange={e=>setEditFormData({...editFormData, size: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Buying Price</label>
                  <input type="number" value={editFormData.buyingPrice} onChange={e=>setEditFormData({...editFormData, buyingPrice: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-semibold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Selling Price</label>
                  <input type="number" value={editFormData.sellingPrice} onChange={e=>setEditFormData({...editFormData, sellingPrice: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-semibold text-klader-burgundy" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Stock Quantity</label>
                  <input type="number" value={editFormData.stockQuantity} onChange={e=>setEditFormData({...editFormData, stockQuantity: parseInt(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none font-bold" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Supplier Name</label>
                <input type="text" value={editFormData.supplierName} onChange={e=>setEditFormData({...editFormData, supplierName: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowEditModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Update Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Partner Modal Shortcut */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Quick Partner & User Login Setup</h3>
            <form onSubmit={handleAddPartnerShortcut} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Partner Name</label>
                  <input type="text" value={partnerFormData.name} onChange={e=>setPartnerFormData({...partnerFormData, name: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Partner Type</label>
                  <select value={partnerFormData.type} onChange={e=>setPartnerFormData({...partnerFormData, type: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none bg-white">
                    <option value="Investor">Investor</option>
                    <option value="Non-investing Partner">Non-investing Partner</option>
                    <option value="Silent Partner">Silent Partner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Phone Number</label>
                  <input type="text" placeholder="017xxxxxxxx" value={partnerFormData.phone} onChange={e=>setPartnerFormData({...partnerFormData, phone: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Email Address</label>
                  <input type="email" placeholder="partner@klader.life" value={partnerFormData.email} onChange={e=>setPartnerFormData({...partnerFormData, email: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Username (User ID)</label>
                  <input type="text" value={partnerFormData.username} onChange={e=>setPartnerFormData({...partnerFormData, username: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Password</label>
                  <input type="password" value={partnerFormData.password} onChange={e=>setPartnerFormData({...partnerFormData, password: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Investment (৳ BDT)</label>
                  <input type="number" value={partnerFormData.investmentAmount} onChange={e=>setPartnerFormData({...partnerFormData, investmentAmount: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Ownership Share (%)</label>
                  <input type="number" step="0.01" value={partnerFormData.ownershipPercentage} onChange={e=>setPartnerFormData({...partnerFormData, ownershipPercentage: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">System Access Level</label>
                <select value={partnerFormData.accessLevel} onChange={e=>setPartnerFormData({...partnerFormData, accessLevel: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none bg-white">
                  <option value="view">View Access Only (Read-Only)</option>
                  <option value="sales">Sales Access (Sales, Deliveries, Stock)</option>
                  <option value="full">Full Access (Manage Inventory, Expenses, Requests)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowPartnerModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Save Partner Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Manage Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-display font-semibold text-lg text-slate-800">Manage Product Categories</h3>
              <button 
                onClick={() => setShowCategoriesModal(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Error message */}
            {categoryError && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-xs flex items-start gap-2 animate-shake">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{categoryError}</span>
              </div>
            )}

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="mb-6 flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="New category name (e.g. Pant)..." 
                  value={newCategoryName} 
                  onChange={e => setNewCategoryName(e.target.value)} 
                  disabled={categorySubmitting}
                  className="w-full px-3 py-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-klader-burgundy" 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={categorySubmitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold hover:bg-klader-burgundy/90 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {categorySubmitting ? 'Adding...' : 'Add'}
              </button>
            </form>

            <div className="flex-1 overflow-y-auto mb-4 min-h-[200px] border border-slate-50 rounded-2xl p-2 bg-slate-50/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">Active Categories</span>
              {categoriesLoading && categoriesList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading categories...</div>
              ) : categoriesList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No categories added yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {categoriesList.map(cat => (
                    <div key={cat} className="flex justify-between items-center py-2 px-2 hover:bg-white rounded-xl transition-all group">
                      <span className="text-xs font-semibold text-slate-700">{cat}</span>
                      <button 
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                        title={`Delete ${cat}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 border-t border-slate-50 pt-3">
              <span className="font-semibold text-amber-600">Note:</span> Categories currently assigned to active products in your inventory cannot be deleted.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
