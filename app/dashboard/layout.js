'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, Users, Package, ShoppingBag, 
  CreditCard, BarChart3, Settings, LogOut, 
  Menu, X, Search, Bell, Shield, Circle, User
} from 'lucide-react';
import Image from 'next/image';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Close mobile menu on path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white gradient-bg-accent">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-24 h-24 animate-pulse-subtle">
            <Image 
              src="/logo.svg" 
              alt="Klader Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="w-12 h-1 bg-klader-burgundy/10 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-gradient-to-r from-klader-burgundy via-klader-crimson to-klader-peach animate-infinite animate-duration-1000 origin-left" style={{
              animation: 'loading-bar 1.5s infinite ease-in-out'
            }}></div>
          </div>
          <span className="text-sm font-medium text-klader-charcoal/60 tracking-widest font-display">KLADER</span>
          <style jsx global>{`
            @keyframes loading-bar {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // AuthContext handles redirecting to /login
  }

  // Determine navigation menu based on user role/permissions
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, visible: true },
    { 
      name: 'Partners', 
      href: '/dashboard/partners', 
      icon: Users, 
      visible: user.role === 'admin' || user.role === 'partner'
    },
    { 
      name: 'Inventory', 
      href: '/dashboard/inventory', 
      icon: Package, 
      visible: user.role === 'admin' || user.role === 'staff' || (user.role === 'partner' && user.permissions?.salesAccess)
    },
    { 
      name: 'Sales Orders', 
      href: '/dashboard/sales', 
      icon: ShoppingBag, 
      visible: user.role === 'admin' || user.role === 'staff' || (user.role === 'partner' && user.permissions?.salesAccess)
    },
    { 
      name: 'Expenses', 
      href: '/dashboard/expenses', 
      icon: CreditCard, 
      visible: user.role === 'admin' || (user.role === 'partner' && user.permissions?.fullAccess)
    },
    { 
      name: 'Reports', 
      href: '/dashboard/reports', 
      icon: BarChart3, 
      visible: user.role === 'admin' || user.role === 'partner'
    },
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: Settings, 
      visible: user.role === 'admin'
    },
  ];

  const activeItem = navItems.find(item => pathname === item.href) || navItems[0];

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Redirect to relevant sub-dashboard queries
    const q = searchQuery.toLowerCase().trim();
    if (q.includes('order') || q.includes('ord-') || q.includes('sale')) {
      router.push(`/dashboard/sales?search=${q}`);
    } else if (q.includes('product') || q.includes('stock') || q.includes('sku')) {
      router.push(`/dashboard/inventory?search=${q}`);
    } else if (q.includes('partner') || q.includes('invest')) {
      router.push(`/dashboard/partners?search=${q}`);
    } else if (q.includes('expense') || q.includes('bill')) {
      router.push(`/dashboard/expenses?search=${q}`);
    } else {
      // Default to search everywhere
      router.push(`/dashboard/inventory?search=${q}`);
    }
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fbfbfc] text-klader-charcoal overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-100 shrink-0 z-30 shadow-sm glass-panel">
        
        {/* Logo and Brand Title */}
        <div className="h-20 flex items-center px-8 border-b border-slate-50 gap-3">
          <div className="relative w-10 h-10">
            <Image 
              src="/logo.svg" 
              alt="Klader Logo" 
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-semibold tracking-wide text-lg text-klader-burgundy leading-none">Klader</span>
            <span className="text-[10px] tracking-widest text-slate-400 font-display font-bold uppercase mt-1">Dashboard</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            if (!item.visible) return null;
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white shadow-md shadow-klader-burgundy/10 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-klader-burgundy'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-klader-burgundy'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Identity and Status */}
        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-klader-peach via-klader-crimson to-klader-burgundy p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <User size={18} className="text-klader-burgundy" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" title="Online"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{user.username}</p>
              <p className="text-xs text-slate-400 font-medium capitalize flex items-center gap-1 mt-0.5">
                <Shield size={10} className="text-klader-crimson" />
                {user.role}
              </p>
            </div>
            <button 
              onClick={logout} 
              className="p-2 text-slate-400 hover:text-klader-crimson hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Slide-out Panel */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${
        mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} onClick={() => setMobileMenuOpen(false)}>
        <aside 
          className={`w-72 max-w-xs h-full bg-white flex flex-col z-50 transform transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image src="/logo.svg" alt="Klader Logo" fill className="object-contain" />
              </div>
              <span className="font-display font-semibold tracking-wide text-lg text-klader-burgundy">Klader</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-klader-charcoal">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (!item.visible) return null;
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white font-semibold' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-klader-burgundy'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-50">
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl">
              <div className="relative w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                <User size={16} className="text-klader-burgundy" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-none">{user.username}</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize mt-1">{user.role}</p>
              </div>
              <button onClick={logout} className="p-2 text-slate-400 hover:text-klader-crimson">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 shrink-0 z-20 glass-panel no-print">
          
          {/* Menu toggles & Page Title */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h1 className="font-display font-semibold text-xl text-klader-charcoal capitalize">
                {activeItem ? activeItem.name : 'Business Management'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">Klader Premium Fashion Enterprise Dashboard</p>
            </div>
            {/* Mobile Brand Name center on top */}
            <div className="flex items-center gap-2 sm:hidden">
              <div className="relative w-6 h-6">
                <Image src="/logo.svg" alt="Klader Logo" fill className="object-contain" />
              </div>
              <span className="font-display font-bold text-sm tracking-widest text-klader-burgundy uppercase">KLADER</span>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-4">
            
            {/* Search Input */}
            <form onSubmit={handleGlobalSearch} className="hidden lg:flex items-center relative w-64">
              <Search className="absolute left-3 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search orders, stock, partners..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-100 rounded-xl bg-slate-50/50 text-sm focus:outline-none focus:border-klader-burgundy/40 focus:bg-white transition-all text-slate-600"
              />
            </form>

            {/* Offline/Online indicators */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-xs font-semibold text-slate-500">
              <Circle size={8} className="fill-emerald-500 stroke-emerald-500" />
              <span>Live System</span>
            </div>

            {/* Notification Icon */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 hover:text-klader-burgundy hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-klader-crimson"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4">
                  <h3 className="font-semibold text-sm border-b border-slate-50 pb-2 mb-2 flex justify-between items-center">
                    <span>Recent Notifications</span>
                    {notifications.length > 0 && <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-bold">New</span>}
                  </h3>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No new notifications</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n, i) => (
                        <div key={i} className="text-xs p-2 bg-slate-50 rounded-lg">
                          <p className="font-medium text-slate-700">{n.title}</p>
                          <p className="text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 animate-fade-in-up">
          {children}
        </main>
      </div>

    </div>
  );
}
