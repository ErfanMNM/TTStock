import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { BarChart3, Package, TrendingUp, FileText, CheckCircle } from 'lucide-react';

interface KPICard {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export function StockAnalytics() {
  const [loading, setLoading] = useState(true);
  const [totalQty, setTotalQty] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [entriesThisMonth, setEntriesThisMonth] = useState(0);
  const [activeItems, setActiveItems] = useState(0);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balance, entries, items] = await Promise.all([
        erpService.getStockBalance(),
        erpService.getStockEntries(100),
        erpService.getItems(100, 0, ''),
      ]);

      const qty = balance.reduce((sum: number, b: any) => sum + (b.actual_qty || 0), 0);
      const value = balance.reduce((sum: number, b: any) => sum + (b.stock_value || 0), 0);
      setTotalQty(qty);
      setTotalValue(value);

      // Count entries this month
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEntries = entries.filter((e: any) => e.posting_date >= firstOfMonth);
      setEntriesThisMonth(monthEntries.length);

      setActiveItems(items.length);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const kpiCards: KPICard[] = [
    {
      label: 'Tổng SL tồn',
      value: totalQty.toLocaleString(),
      sub: 'đơn vị',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Tổng giá trị',
      value: formatCurrency(totalValue),
      sub: 'VND',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Phiếu tháng này',
      value: entriesThisMonth,
      sub: 'phiếu',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Items active',
      value: activeItems,
      sub: 'vật tư',
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Phân tích kho</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">Tổng quan các chỉ số kho hàng</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up stagger-1">
        {kpiCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Tổng quan kho</p>
                <p className="text-xs text-gray-400">Dữ liệu cập nhật theo thời gian thực</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{totalQty.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Tổng tồn kho</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Giá trị tồn kho</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-600">{entriesThisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">Phiếu tháng này</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{activeItems}</p>
                <p className="text-xs text-gray-500 mt-1">Vật tư đang dùng</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
