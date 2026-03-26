import React from 'react';
import { Server, Package, Info } from 'lucide-react';

export function Settings() {
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
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Server</span>
              <span className="text-xs font-medium text-gray-900">https://erp.mte.vn</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Trạng thái</span>
              <span className="text-xs font-medium text-green-600">Đã kết nối</span>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="card p-4 animate-slide-up stagger-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Kho Tân Tiến</p>
              <p className="text-xs text-gray-400">TTStock v1.0</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Ứng dụng</span>
              <span className="text-xs font-medium text-gray-900">Quản lý Kho Tân Tiến</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Phiên bản</span>
              <span className="text-xs font-medium text-gray-900">1.0.0</span>
            </div>
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
        <p className="text-xs text-gray-300">Kho Tân Tiến • TTStock v1.0</p>
      </div>
    </div>
  );
}
