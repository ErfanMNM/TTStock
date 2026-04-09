import React, { useEffect, useState, useMemo } from 'react';
import { erpService } from '../services/api';
import { Package, Warehouse, ArrowLeftRight, AlertCircle, Plus, ArrowDownLeft, ArrowUpRight, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Dashboard() {
  const [stats, setStats] = useState({ items: 0, warehouses: 0, recentTransfers: 0, totalStock: 0 });
  const [stockByWarehouse, setStockByWarehouse] = useState<{ name: string; qty: number }[]>([]);
  const [stockByGroup, setStockByGroup] = useState<{ name: string; value: number }[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; qty: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; count: number }[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, warehouses, transfers, stockBalance, itemGroups] = await Promise.all([
          erpService.getItems(10000, 0, ''),
          erpService.getWarehouses(),
          erpService.getStockEntries(50),
          erpService.getStockBalance(),
          erpService.getItemGroups(),
        ]);

        setAllItems(items);

        const totalStock = (stockBalance || []).reduce((sum: number, b: any) => sum + (b.actual_qty || 0), 0);
        setStats({
          items: items.length,
          warehouses: warehouses.filter((w: any) => !w.is_group).length,
          recentTransfers: transfers.length,
          totalStock,
        });

        // Stock by warehouse
        const whMap: Record<string, number> = {};
        for (const bin of stockBalance || []) {
          if (bin.warehouse && bin.actual_qty) {
            whMap[bin.warehouse] = (whMap[bin.warehouse] || 0) + bin.actual_qty;
          }
        }
        const whData = Object.entries(whMap)
          .map(([name, qty]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, qty }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 8);
        setStockByWarehouse(whData);

        // Stock by item group
        const groupMap: Record<string, number> = {};
        const itemGroupMap: Record<string, string> = {};
        for (const item of items) {
          if (item.item_group) itemGroupMap[item.name] = item.item_group;
        }
        for (const bin of stockBalance || []) {
          if (bin.item_code && bin.actual_qty) {
            const group = itemGroupMap[bin.item_code] || 'Khác';
            groupMap[group] = (groupMap[group] || 0) + bin.actual_qty;
          }
        }
        const groupData = Object.entries(groupMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);
        setStockByGroup(groupData);

        // Top 8 items by qty
        const itemQtyMap: Record<string, number> = {};
        for (const bin of stockBalance || []) {
          if (bin.item_code && bin.actual_qty) {
            itemQtyMap[bin.item_code] = (itemQtyMap[bin.item_code] || 0) + bin.actual_qty;
          }
        }
        const itemNameMap: Record<string, string> = {};
        for (const item of items) {
          itemNameMap[item.name] = item.item_name || item.name;
        }
        const topData = Object.entries(itemQtyMap)
          .map(([code, qty]) => ({
            name: itemNameMap[code]?.length > 15 ? itemNameMap[code].slice(0, 15) + '…' : (itemNameMap[code] || code),
            qty,
          }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 8);
        setTopItems(topData);

        // Recent transfer activity by type
        const receiptCount = (transfers || []).filter((t: any) => t.stock_entry_type === 'Material Receipt').length;
        const issueCount = (transfers || []).filter((t: any) => t.stock_entry_type === 'Material Issue').length;
        const transferCount = (transfers || []).filter((t: any) => t.stock_entry_type === 'Material Transfer').length;
        setRecentActivity([
          { type: 'Nhập kho', count: receiptCount },
          { type: 'Xuất kho', count: issueCount },
          { type: 'Điều chuyển', count: transferCount },
        ]);
      } catch {
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const formatQty = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString('vi-VN');

  const statCards = [
    { label: 'Vật tư', value: stats.items > 9999 ? `${(stats.items / 1000).toFixed(1)}K` : stats.items, icon: Package, color: 'bg-blue-50 text-blue-500', path: '/items' },
    { label: 'Kho', value: stats.warehouses, icon: Warehouse, color: 'bg-purple-50 text-purple-500', path: '/warehouses' },
    { label: 'Phiếu gần đây', value: stats.recentTransfers, icon: ArrowLeftRight, color: 'bg-green-50 text-green-500', path: '/transfers' },
    { label: 'Tổng tồn', value: formatQty(stats.totalStock), icon: TrendingUp, color: 'bg-orange-50 text-orange-500', path: '/stock' },
  ];

  const quickActions = [
    { label: 'Điều chuyển kho', desc: 'Chuyển hàng giữa các kho', icon: ArrowUpRight, color: 'bg-blue-50 text-blue-500', path: '/transfers/new' },
    { label: 'Nhập kho', desc: 'Ghi nhận vật tư nhập vào', icon: ArrowDownLeft, color: 'bg-green-50 text-green-500', path: '/transfers/new' },
    { label: 'Tạo vật tư mới', desc: 'Thêm vật tư vào hệ thống', icon: Plus, color: 'bg-purple-50 text-purple-500', path: '/items/new' },
    { label: 'Đối soát kho', desc: 'Kiểm tra tồn thực tế', icon: BarChart3, color: 'bg-orange-50 text-orange-500', path: '/stock-reconciliation/new' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs">
          <p className="font-semibold text-gray-700 mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value.toLocaleString('vi-VN')}</span></p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Xin chào!</h1>
        <p className="text-sm text-gray-500 mt-0.5">Chào mừng đến với Kho Tân Tiến</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up stagger-1">
        {statCards.map((card) => (
          <Link key={card.label} to={card.path} className="card p-4 lg:p-5 text-center card-press">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${card.color}`}>
              <card.icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs lg:text-sm text-gray-400 mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up stagger-2">
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up stagger-2">
        {/* Stock by warehouse */}
        {stockByWarehouse.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Warehouse className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-gray-700">Tồn kho theo kho</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stockByWarehouse} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => formatQty(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="qty" name="Tồn" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stock by item group */}
        {stockByGroup.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-gray-700">Phân bổ tồn kho theo nhóm</h3>
            </div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <RePieChart>
                  <Pie
                    data={stockByGroup}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stockByGroup.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => v.toLocaleString('vi-VN')} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 pr-2">
                {stockByGroup.map((g, i) => (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-gray-600 truncate flex-1" title={g.name}>{g.name}</span>
                    <span className="text-xs font-semibold text-gray-700 flex-shrink-0">{formatQty(g.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up stagger-4">
        {/* Top items by qty */}
        {topItems.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-bold text-gray-700">Top vật tư tồn kho cao nhất</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={topItems} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => formatQty(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="qty" name="SL tồn" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-gray-700">Phiếu nhập xuất gần đây</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={recentActivity} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Số phiếu" radius={[4, 4, 0, 0]}>
                  {recentActivity.map((_, i) => (
                    <Cell key={i} fill={['#3b82f6', '#ef4444', '#f59e0b'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up stagger-4">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Thao tác nhanh</h2>
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
    </div>
  );
}
