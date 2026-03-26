import React, { useEffect, useState } from 'react';
import { erpService } from '../services/api';
import { Package, Warehouse, ArrowLeftRight, AlertCircle, Plus, ArrowDownLeft, ArrowUpRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState({ items: 0, warehouses: 0, recentTransfers: 0, totalStock: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [items, warehouses, transfers, stockBalance] = await Promise.all([
          erpService.getItems(1),
          erpService.getWarehouses(),
          erpService.getStockEntries(5),
          erpService.getStockBalance(''),
        ]);
        const totalStock = (stockBalance || []).reduce((sum: number, b: any) => sum + (b.actual_qty || 0), 0);
        setStats({ items: items.length > 0 ? '100+' : 0, warehouses: warehouses.length, recentTransfers: transfers.length, totalStock });
      } catch {
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl p-4 flex items-start space-x-3 animate-scale-in">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Vật tư', value: stats.items, icon: Package, color: 'bg-blue-50 text-blue-500' },
    { label: 'Kho', value: stats.warehouses, icon: Warehouse, color: 'bg-purple-50 text-purple-500' },
    { label: 'Nhập xuất', value: stats.recentTransfers, icon: ArrowLeftRight, color: 'bg-green-50 text-green-500' },
    { label: 'Tổng tồn', value: stats.totalStock > 999 ? `${(stats.totalStock / 1000).toFixed(1)}K` : stats.totalStock, icon: Activity, color: 'bg-orange-50 text-orange-500' },
  ];

  const quickActions = [
    { label: 'Điều chuyển kho', desc: 'Chuyển hàng giữa các kho', icon: ArrowUpRight, color: 'bg-blue-50 text-blue-500', path: '/transfers/new' },
    { label: 'Nhập kho', desc: 'Ghi nhận vật tư nhập vào', icon: ArrowDownLeft, color: 'bg-green-50 text-green-500', path: '/stock/receive' },
    { label: 'Tạo vật tư mới', desc: 'Thêm vật tư vào hệ thống', icon: Plus, color: 'bg-purple-50 text-purple-500', path: '/items/new' },
    { label: 'Lịch sử nhập xuất', desc: 'Xem các phiếu gần đây', icon: Activity, color: 'bg-orange-50 text-orange-500', path: '/transfers' },
  ];

  const navLinks = [
    { label: 'Danh sách vật tư', desc: 'Xem và tìm kiếm vật tư', icon: Package, color: 'bg-blue-50 text-blue-500', path: '/items' },
    { label: 'Tồn kho', desc: 'Xem số lượng tồn kho', icon: Warehouse, color: 'bg-purple-50 text-purple-500', path: '/stock' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Xin chào!</h1>
        <p className="text-sm text-gray-500 mt-0.5">Chào mừng đến với Kho Tân Tiến</p>
      </div>

      {/* Stat Cards - responsive grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up stagger-1">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4 lg:p-5 text-center">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${card.color}`}>
              <card.icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs lg:text-sm text-gray-400 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up stagger-2">
        <h2 className="text-base lg:text-lg font-semibold text-gray-700 mb-3">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.path} className="card p-4 flex flex-col items-start space-y-2 card-press">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-gray-900">{action.label}</div>
              <div className="text-xs text-gray-400 hidden lg:block">{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-slide-up stagger-3">
        {navLinks.map((link) => (
          <Link key={link.path} to={link.path} className="card p-4 flex items-center space-x-4 card-press">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${link.color}`}>
              <link.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-gray-900">{link.label}</div>
              <div className="text-sm text-gray-400">{link.desc}</div>
            </div>
            <svg className="w-5 h-5 text-gray-300 flex-shrink-0 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
