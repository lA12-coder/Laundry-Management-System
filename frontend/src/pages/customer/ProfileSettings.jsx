import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, MapPin, Bell, Shield, Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../API/axios';
import { useNotificationStore } from '../../stores/notificationStore';
// Note: assuming redux userSlice has an updateProfile action if needed, or query invalidate handles it.

function ProfileForm({ user }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    home_address: user?.home_address || '', // Assuming model has this or will save in profile block
  });

  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch('/accounts/me/', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      // If using React Query for user profile:
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (err) => toast.error('Failed to update profile: ' + (err.response?.data?.message || err.message))
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate({
      full_name: form.full_name,
      phone_number: form.phone_number,
      home_address: form.home_address
    });
  };

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4c84a4]/30 focus:border-[#4c84a4] focus:bg-white outline-none transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
        <input type="text" className={inputCls} value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
          <input type="email" className={`${inputCls} opacity-60 cursor-not-allowed`} value={form.email} disabled />
          <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Phone Number</label>
          <input type="tel" className={inputCls} value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} required />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Primary Address</label>
        <textarea className={`${inputCls} resize-none h-24`} value={form.home_address} onChange={e => setForm({...form, home_address: e.target.value})} placeholder="123 Laundry Lane..." />
      </div>
      <button 
        type="submit" 
        disabled={updateProfile.isPending}
        className="flex items-center gap-2 px-6 py-3 bg-[#4c84a4] text-white rounded-xl text-sm font-bold hover:bg-[#3a6680] transition-colors shadow-md shadow-blue-900/10 disabled:opacity-50"
      >
        {updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save Changes
      </button>
    </form>
  );
}

function SecurityForm() {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });

  const changePassword = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/accounts/change-password/', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setForm({ old_password: '', new_password: '', confirm: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Password change failed')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) return toast.error('New passwords do not match');
    changePassword.mutate({ old_password: form.old_password, new_password: form.new_password });
  };

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4c84a4]/30 focus:border-[#4c84a4] focus:bg-white outline-none transition-all";

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Current Password</label>
          <input type="password" className={inputCls} value={form.old_password} onChange={e => setForm({...form, old_password: e.target.value})} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">New Password</label>
            <input type="password" className={inputCls} value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})} minLength={8} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
            <input type="password" className={inputCls} value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} minLength={8} required />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={changePassword.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-md disabled:opacity-50"
        >
          {changePassword.isPending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
          Update Password
        </button>
      </form>

      <div className="pt-8 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield size={16} className="text-emerald-500" /> Multi-Factor Authentication (MFA)
            </h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">Add an extra layer of security to your account. We will send a verification code to your phone.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4c84a4]"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function PreferencesForm() {
  const { preferences, updatePreferences } = useNotificationStore();

  const toggle = (key) => {
    updatePreferences({ [key]: !preferences[key] });
    toast.success('Preferences updated', { icon: '⚙️' });
  };

  const Option = ({ id, title, desc }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={preferences[id]} onChange={() => toggle(id)} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
      </label>
    </div>
  );

  return (
    <div className="space-y-3">
      <Option id="sms" title="SMS Notifications" desc="Get real-time texts when your driver is nearby." />
      <Option id="email" title="Email Receipts" desc="Receive itemized digital receipts after delivery." />
      <Option id="marketing" title="Marketing Updates" desc="Promotions, discounts, and FuaLaundry news." />
    </div>
  );
}

export default function ProfileSettings() {
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('profile');

  const TABS = [
    { id: 'profile', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, security, and preferences.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 p-4 sm:p-6 flex flex-col gap-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                  isActive ? 'bg-white text-[#4c84a4] shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#4c84a4]' : 'text-gray-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 sm:p-8 md:p-10">
          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h2>
              <ProfileForm user={user} />
            </div>
          )}
          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Password & Security</h2>
              <SecurityForm />
            </div>
          )}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Alert Preferences</h2>
              <PreferencesForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
