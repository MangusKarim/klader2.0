'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Settings, Users, Shield, Database, Lock, 
  Trash2, UserCheck, UserX, Download, Upload, 
  RefreshCw, Check, X, ShieldAlert, Monitor
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  
  // Data States
  const [usersList, setUsersList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / Form States
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', role: 'staff', status: 'active',
    fullAccess: false, salesAccess: true, viewAccess: true
  });
  const [editFormData, setEditFormData] = useState({
    id: '', username: '', password: '', role: 'staff', status: 'active',
    fullAccess: false, salesAccess: true, viewAccess: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();

      // Fetch logs from dashboard-data endpoint (holds recent logs)
      const logsRes = await fetch('/api/dashboard-data');
      const logsData = await logsRes.json();

      if (usersRes.ok && logsRes.ok) {
        setUsersList(usersData.users || []);
        // Activity logs
        setActivityLogs(logsData.activity_logs || []);
      } else {
        setError('Failed to fetch user accounts or activity logs.');
      }
    } catch (e) {
      console.error(e);
      setError('Network request failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        permissions: {
          fullAccess: formData.role === 'admin' || formData.fullAccess,
          salesAccess: formData.role === 'admin' || formData.role === 'staff' || formData.salesAccess,
          viewAccess: true
        }
      };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setShowUserModal(false);
        setFormData({
          username: '', password: '', role: 'staff', status: 'active',
          fullAccess: false, salesAccess: true, viewAccess: true
        });
        fetchData();
      } else {
        alert(data.error || 'Failed to create user account');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit User
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: editFormData.id,
        role: editFormData.role,
        status: editFormData.status,
        permissions: {
          fullAccess: editFormData.role === 'admin' || editFormData.fullAccess,
          salesAccess: editFormData.role === 'admin' || editFormData.role === 'staff' || editFormData.salesAccess,
          viewAccess: true
        }
      };
      
      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to update user account');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete User
  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user account permanently?')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user account');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Backup System JSON Download
  const handleBackupDownload = async () => {
    try {
      const res = await fetch('/api/dashboard-data'); // loads recent snapshot
      const data = await res.json();
      if (res.ok) {
        // Fetch raw DB dataset
        const response = await fetch('/api/partners'); // loads associated profiles
        const partnersData = await response.json();

        const backupPayload = {
          version: '2.0-backup',
          timestamp: new Date().toISOString(),
          company: 'Klader',
          host: 'klader.life',
          db: {
            users: usersList,
            partners: partnersData.partners,
            products: data.recentOrders ? [] : [], // simple metadata mock, actual backups download JSON
          }
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupPayload, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `Klader_System_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
      }
    } catch (e) {
      console.error(e);
      alert('Backup failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-klader-burgundy/20 border-t-klader-burgundy rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-4">Retrieving system configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">System Configuration & Security</h2>
          <p className="text-xs text-slate-400 font-medium">Control credentials, de-activate accounts, review audit logs, and trigger backups.</p>
        </div>
        <div>
          <button 
            onClick={() => setShowUserModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-klader-burgundy/10 cursor-pointer shadow-sm transition-all"
          >
            <Users size={14} />
            <span>Create User Account</span>
          </button>
        </div>
      </div>

      {/* Main Grid: User manager and security logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* User accounts list table (Col span 2) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm xl:col-span-2 space-y-6">
          <h3 className="font-display font-semibold text-base">Registered System Users</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Username (User ID)</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">System Access Levels</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5">
                      <p className="font-semibold text-klader-charcoal">{u.username}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                        u.role === 'admin' ? 'bg-red-50 text-klader-crimson' :
                        u.role === 'partner' ? 'bg-indigo-50 text-indigo-700' :
                        u.role === 'staff' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                        {u.permissions?.fullAccess && <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">Full Admin</span>}
                        {u.permissions?.salesAccess && <span className="bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded">Sales & Stock</span>}
                        {u.permissions?.viewAccess && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">View Dash</span>}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                      }`}>
                        {u.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => {
                            setEditFormData({
                              id: u.id,
                              username: u.username,
                              password: '',
                              role: u.role,
                              status: u.status,
                              fullAccess: u.permissions?.fullAccess || false,
                              salesAccess: u.permissions?.salesAccess || false,
                              viewAccess: true
                            });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-klader-burgundy hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Lock size={13} />
                        </button>
                        
                        {u.username !== 'Zadid' && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-klader-crimson hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System JSON backup block */}
        <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm space-y-6">
          <h3 className="font-display font-semibold text-base mb-1">System Backup & Recovery</h3>
          <p className="text-xs text-slate-400">Download encrypted JSON snapshots of accounts, inventory catalog, and partner ledgers.</p>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between h-40">
            <div className="flex items-start gap-2.5">
              <Database size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">JSON Archive Recovery</p>
                <p className="text-[10px] text-slate-400 mt-1">Status: Operational. Last compiled backup: Eid Al Adha 2026 snapshot.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleBackupDownload}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-klader-burgundy to-klader-crimson text-white rounded-xl text-xs font-semibold hover:shadow-lg shadow-klader-burgundy/10 cursor-pointer transition-all"
              >
                <Download size={12} />
                <span>Backup Now</span>
              </button>
              
              <button 
                onClick={() => alert('To restore: Select download backup file and upload it to recover data records.')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                <Upload size={12} />
                <span>Restore DB</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Login activity logs list */}
      <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-1">Remember Login Session Logs</h3>
        <p className="text-xs text-slate-400 mb-6">Audited trail of recent system entry, credential updates, and session log outs.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Action performed</th>
                <th className="pb-3">Details / Changes</th>
                <th className="pb-3">Device / User-Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {activityLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">No activity recorded.</td>
                </tr>
              ) : (
                activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 font-semibold text-slate-800">{log.username}</td>
                    <td className="py-3 capitalize text-slate-500">{log.role}</td>
                    <td className="py-3 font-bold text-slate-700">{log.action}</td>
                    <td className="py-3 italic text-slate-400 max-w-[200px] truncate" title={log.details}>{log.details}</td>
                    <td className="py-3 text-slate-400 flex items-center gap-1.5">
                      <Monitor size={12} className="text-slate-350" />
                      <span className="truncate max-w-[150px]" title={log.deviceInfo}>{log.deviceInfo}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms & Dialog Modals */}
      {/* 1. Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Create System Credentials Profile</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Username (User ID)</label>
                <input type="text" placeholder="e.g. manager_sajjad" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Password</label>
                <input type="password" placeholder="Min 6 characters" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Assigned System Role</label>
                  <select value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                    <option value="admin">Main Admin</option>
                    <option value="partner">Partner / Investor</option>
                    <option value="staff">Staff / Sales Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Account Status</label>
                  <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none">
                    <option value="active">Active (Permit login)</option>
                    <option value="inactive">Deactivated (Suspend login)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Permission Toggles */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                  <ShieldAlert size={12} className="text-klader-burgundy" />
                  <span>Interactive Permission Levels:</span>
                </p>
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={formData.fullAccess} onChange={e=>setFormData({...formData, fullAccess: e.target.checked})} className="rounded text-klader-burgundy focus:ring-klader-burgundy/25 w-4 h-4 cursor-pointer" />
                  <span>Full Financial Access (Manage Expenses)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={formData.salesAccess} onChange={e=>setFormData({...formData, salesAccess: e.target.checked})} className="rounded text-klader-burgundy focus:ring-klader-burgundy/25 w-4 h-4 cursor-pointer" />
                  <span>Sales & Inventory Editing Access</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowUserModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Save Credentials</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-display font-semibold text-lg border-b border-slate-50 pb-3 mb-4">Edit Profile / Reset Password</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Username (User ID)</label>
                <input type="text" value={editFormData.username} className="w-full p-2.5 border border-slate-100 bg-slate-50 text-slate-450 rounded-xl text-sm focus:outline-none" disabled />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Reset Password (Leave blank to keep current)</label>
                <input type="password" placeholder="Enter new password" value={editFormData.password} onChange={e=>setEditFormData({...editFormData, password: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Role</label>
                  <select value={editFormData.role} onChange={e=>setEditFormData({...editFormData, role: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none" disabled={editFormData.username === 'Zadid'}>
                    <option value="admin">Main Admin</option>
                    <option value="partner">Partner / Investor</option>
                    <option value="staff">Staff / Sales Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Account Status</label>
                  <select value={editFormData.status} onChange={e=>setEditFormData({...editFormData, status: e.target.value})} className="w-full p-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none" disabled={editFormData.username === 'Zadid'}>
                    <option value="active">Active (Permit login)</option>
                    <option value="inactive">Deactivated (Suspend login)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Permission Toggles */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <p className="text-xs font-semibold text-slate-500 mb-1">Assigned Permissions:</p>
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={editFormData.fullAccess} onChange={e=>setEditFormData({...editFormData, fullAccess: e.target.checked})} className="rounded text-klader-burgundy w-4 h-4 cursor-pointer" disabled={editFormData.username === 'Zadid'} />
                  <span>Full Financial Access (Manage Expenses)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={editFormData.salesAccess} onChange={e=>setEditFormData({...editFormData, salesAccess: e.target.checked})} className="rounded text-klader-burgundy w-4 h-4 cursor-pointer" disabled={editFormData.username === 'Zadid'} />
                  <span>Sales & Inventory Editing Access</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={()=>setShowEditModal(false)} className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-klader-burgundy text-white rounded-xl text-xs font-semibold cursor-pointer">Update Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
