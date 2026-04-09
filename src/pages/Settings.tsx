import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Package, Info, RefreshCw, Github, ExternalLink } from 'lucide-react';
import { erpService } from '../services/api';
import { APP_VERSION } from '../components/WhatsNew';

export function Settings() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      await erpService.ping();
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleLogout = async () => {
    await erpService.logout();
    navigate('/login');
  };

  return (
    <div className="space-y-4">
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-sm text-gray-400 mt-0.5">Thông tin kết nối và ứng dụng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ERPNext Connection */}
        <div className="card p-4 animate-slide-up stagger-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Server className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Kết nối ERPNext</p>
              <p className="text-xs text-gray-400">Quản lý kết nối hệ thống</p>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${connected === true ? 'bg-green-500 animate-pulse' : connected === false ? 'bg-red-500' : 'bg-gray-300'}`} />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Server</span>
              <span className="text-xs font-medium text-gray-900">https://erp.mte.vn</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Trạng thái</span>
              <div className="flex items-center space-x-1.5">
                <span className={`text-xs font-medium ${connected === true ? 'text-green-600' : connected === false ? 'text-red-500' : 'text-gray-400'}`}>
                  {connected === true ? 'Đã kết nối' : connected === false ? 'Mất kết nối' : 'Đang kiểm tra...'}
                </span>
                <div className={`w-2 h-2 rounded-full ${connected === true ? 'bg-green-500' : connected === false ? 'bg-red-500' : 'bg-gray-300'} ${connected === true ? 'animate-pulse' : ''}`} />
              </div>
            </div>
          </div>
          <button onClick={checkConnection} disabled={checking}
            className="w-full mt-2 flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
          </button>
        </div>

        {/* App Info */}
        <div className="card p-4 animate-slide-up stagger-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Kho Tân Tiến</p>
              <p className="text-xs text-gray-400">TTStock</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Ứng dụng</span>
              <span className="text-xs font-medium text-gray-900">Quản lý Kho Tân Tiến</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Phiên bản</span>
              <span className="text-xs font-medium text-gray-900">{APP_VERSION}</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('ttstock_whatsnew_version');
                alert('Đã reset thông báo. Refresh trang để hiện lại popup tính năng mới.');
              }}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition-colors"
            >
              <Info className="w-3 h-3" />
              Xem lại thông báo cập nhật
            </button>
          </div>
        </div>

        {/* About */}
        <div className="card p-4 animate-slide-up stagger-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Về ứng dụng</p>
              <p className="text-xs text-gray-400">Thông tin chung</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
            Ứng dụng quản lý kho hàng kết nối ERPNext, tối ưu cho thiết bị di động và máy tính.
          </p>
        </div>
      </div>

      <div className="text-center animate-slide-up">
        <p className="text-xs text-gray-300">Kho Tân Tiến · TTStock {APP_VERSION}</p>
      </div>
    </div>
  );
}
