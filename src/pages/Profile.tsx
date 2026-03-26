import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/api';
import { User, Shield, Calendar, Mail, Clock, RefreshCw, LogOut, Edit3, Check, X, ChevronRight } from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [fullName, setFullName] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('erp_user') || '';
    const fn = localStorage.getItem('erp_full_name') || '';
    setUser(u);
    setFullName(fn);
    setEditName(fn);
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    setLoadingInfo(true);
    try {
      const info = await erpService.getUserInfo();
      setUserInfo(info);
    } catch { setUserInfo(null); }
    finally { setLoadingInfo(false); }
  };

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    localStorage.setItem('erp_full_name', trimmed);
    setFullName(trimmed);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(fullName);
    setEditing(false);
  };

  const handleLogout = async () => {
    await erpService.logout();
    navigate('/login');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  };

  const avatarLetter = (fullName || user || 'U').charAt(0).toUpperCase();
  const avatarColor = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
  ][avatarLetter.charCodeAt(0) % 5];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tài khoản</h1>
        <p className="text-sm text-gray-400 mt-0.5">Quản lý thông tin cá nhân</p>
      </div>

      {/* Grid layout: 2 columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Avatar & Name Card */}
        <div className="card overflow-hidden animate-slide-up stagger-1">
          <div className={`bg-gradient-to-br ${avatarColor} px-6 py-8 lg:py-10 flex flex-col items-center`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/30">
              <span className="text-3xl font-bold text-white">{avatarLetter}</span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">{fullName || user}</h2>
            <p className="text-sm text-white/70">{user}</p>
          </div>

          {/* Edit Name */}
          <div className="px-6 py-4 border-b border-gray-100">
            {editing ? (
              <div className="flex items-center space-x-2">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="input-field !rounded-xl flex-1" placeholder="Nhập họ và tên..." autoFocus />
                <button onClick={handleSaveName} className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-colors">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={handleCancelEdit} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-500">Họ và tên</span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-semibold text-gray-900">{fullName || 'Chưa có'}</span>
                  <Edit3 className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            )}
          </div>

          <div className="px-6 py-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user}</p>
            </div>
          </div>
        </div>

        {/* ERPNext Info */}
        <div className="card overflow-hidden animate-slide-up stagger-2">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Thông tin từ ERPNext</h3>
            <button onClick={loadUserInfo} disabled={loadingInfo}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingInfo ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingInfo ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : userInfo ? (
            <div className="p-4 space-y-3">
              <InfoRow icon={Shield} label="Loại tài khoản" value={userInfo.user_type || 'System User'} />
              <InfoRow icon={Clock} label="Trạng thái" value={userInfo.enabled ? 'Đang hoạt động' : 'Đã vô hiệu'}
                valueColor={userInfo.enabled ? 'text-green-600' : 'text-red-500'} />
              <InfoRow icon={Calendar} label="Ngày tạo tài khoản" value={formatDate(userInfo.creation)} />
              <InfoRow icon={Clock} label="Đăng nhập gần nhất" value={formatDate(userInfo.last_login)} />
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-400">Không thể tải thông tin ERPNext.</p>
              <button onClick={loadUserInfo} className="btn-ghost !text-sm mt-2">Thử lại</button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up stagger-3">
        <button onClick={() => navigate('/settings')} className="card p-4 flex items-center justify-between card-press">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Cài đặt hệ thống</p>
              <p className="text-xs text-gray-400">Kết nối ERPNext & thông tin app</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>

        <button onClick={handleLogout}
          className="card p-4 flex items-center justify-center space-x-2 card-press border-red-100 hover:bg-red-50">
          <LogOut className="w-5 h-5 text-red-500" />
          <span className="text-sm font-semibold text-red-500">Đăng xuất</span>
        </button>
      </div>

      <div className="text-center animate-slide-up stagger-4">
        <p className="text-xs text-gray-300">Kho Tân Tiến • TTStock v1.0</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueColor = 'text-gray-900' }: {
  icon: any; label: string; value: string; valueColor?: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}
