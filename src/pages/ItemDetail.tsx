import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { erpService } from '../services/api';
import {
  ArrowLeft, Package, Warehouse, Hash, Grid3X3, Ruler, FileText,
  ArrowDownLeft, ArrowUpRight, Tag, Building, Calendar, User,
  Scale, Shield, Truck, CheckCircle, Clock, BarChart3, ExternalLink,
  ChevronDown, ClipboardList, MoreHorizontal, TrendingUp, AlertTriangle,
  DollarSign, Box, Layers, GripVertical
} from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'overview' | 'inventory' | 'trade' | 'system';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [stockBalance, setStockBalance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true, stock: true, other: false, system: false,
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [itemData, stock] = await Promise.all([
          erpService.getItemDetails(decodeURIComponent(id)),
          erpService.getStockBalance(undefined, decodeURIComponent(id)),
        ]);
        setItem(itemData);
        setStockBalance(stock || []);
      } catch {
        setError('Không thể tải thông tin vật tư.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return d; }
  };

  const formatNumber = (n: number | undefined, decimals = 0) => {
    if (n === undefined || n === null) return '—';
    return n.toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const totalStock = stockBalance.reduce((sum, b) => sum + (b.actual_qty || 0), 0);
  const totalValue = stockBalance.reduce((sum, b) => sum + (b.stock_value || 0), 0);
  const reservedStock = stockBalance.reduce((sum, b) => sum + (b.reserved_qty || 0), 0);
  const maxQty = Math.max(...stockBalance.map(b => b.actual_qty || 0), 1) || 1;

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { key: 'inventory', label: 'Tồn kho', icon: Warehouse },
    { key: 'trade', label: 'Mua / Bán', icon: Truck },
    { key: 'system', label: 'Hệ thống', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-[3px] border-blue-100 rounded-full animate-spin" />
            <div className="absolute inset-0 border-[3px] border-transparent border-t-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-sm text-gray-400 font-medium">Đang tải thông tin vật tư...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Link to="/items" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Chi tiết vật tư</h1>
        </div>
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm text-red-500">{error || 'Không tìm thấy vật tư.'}</p>
        </div>
      </div>
    );
  }

  const isStock = item.is_stock_item === 1 || item.is_stock_item === true;
  const isActive = item.disabled !== 1 && item.disabled !== true;

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-center space-x-3 animate-slide-up">
        <Link to="/items" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 truncate">{item.item_name || item.name}</h1>
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md flex-shrink-0">{item.name}</span>
          </div>
        </div>
        <a
          href={`https://erp.mte.vn/app/item/${item.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 bg-white shadow-sm px-3 py-2 rounded-xl hover:shadow transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          ERPNext
        </a>
      </div>

      {/* Hero Card */}
      <div className="animate-slide-up stagger-1">
        <div className="card overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left: Image + Identity */}
            <div className="flex items-center gap-4 p-5 lg:p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 min-w-0 lg:w-72 xl:w-80 flex-shrink-0">
              {/* Image */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden bg-white/15 backdrop-blur-sm shadow-2xl ring-2 ring-white/20">
                  {item.image ? (
                    <img src={`https://erp.mte.vn${item.image}`} alt={item.item_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 lg:w-12 lg:h-12 text-white/40" />
                    </div>
                  )}
                </div>
                {/* Status dot */}
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-blue-600",
                  isActive ? "bg-emerald-400" : "bg-gray-400"
                )} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base lg:text-lg font-bold text-white leading-tight">{item.item_name || item.name}</h2>
                <p className="text-xs text-blue-200 mt-1 font-mono">{item.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    isStock ? "bg-white/20 text-white" : "bg-amber-500/30 text-amber-200"
                  )}>
                    <Box className="w-2.5 h-2.5" />
                    {isStock ? 'Vật tư tồn kho' : 'Không tồn kho'}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    isActive ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-400" : "bg-red-400")} />
                    {isActive ? 'Đang hoạt động' : 'Đã vô hiệu'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Key Stats */}
            <div className="flex-1 p-5 lg:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/60">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layers className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Tổng tồn</p>
                    <p className="text-lg font-bold text-blue-700 leading-none mt-0.5">{formatNumber(totalStock)}</p>
                    <p className="text-[10px] text-blue-300 mt-0.5">{item.stock_uom || 'đơn vị'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Giá trị</p>
                    <p className="text-lg font-bold text-emerald-700 leading-none mt-0.5">{formatNumber(totalValue)}</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">VND</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/60">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Grid3X3 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wide">Nhóm</p>
                    <p className="text-sm font-bold text-purple-700 leading-tight mt-0.5 truncate max-w-[120px]">{item.item_group_name || item.item_group || '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-50/60">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tag className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wide">Thương hiệu</p>
                    <p className="text-sm font-bold text-orange-700 leading-tight mt-0.5 truncate max-w-[120px]">{item.brand || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-slide-up stagger-2">
        <Link to={`/stock/receive?item_code=${encodeURIComponent(item.name)}`} className="card p-3 flex items-center gap-3 card-press group">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Nhập kho</p>
            <p className="text-[10px] text-gray-400">Ghi nhận nhập</p>
          </div>
        </Link>
        <Link to={`/transfers/new?item_code=${encodeURIComponent(item.name)}`} className="card p-3 flex items-center gap-3 card-press group">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <ArrowUpRight className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Xuất kho</p>
            <p className="text-[10px] text-gray-400">Điều chuyển / xuất</p>
          </div>
        </Link>
      </div>

      {/* Info sections - responsive 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tổng quan */}
        <div className="card p-4 animate-slide-up stagger-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-gray-400" />
            Tổng quan
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Tổng tồn kho" value={totalStock.toLocaleString()} color="blue" />
            <StatCard label="Đơn vị tính" value={item.stock_uom || 'Unit'} color="gray" />
            {item.valuation_rate > 0 && (
              <StatCard label="Giá trị / đơn vị" value={item.valuation_rate.toLocaleString('vi-VN')} color="green" />
            )}
            {totalValue > 0 && (
              <StatCard label="Tổng giá trị" value={totalValue.toLocaleString('vi-VN')} color="green" />
            )}
            {item.brand && <StatCard label="Thương hiệu" value={item.brand} color="purple" />}
            {item.manufacturer && <StatCard label="Nhà sản xuất" value={item.manufacturer} color="gray" />}
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div className="card p-4 animate-slide-up stagger-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Package className="w-4 h-4 mr-2 text-gray-400" />
            Thông tin cơ bản
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Hash} label="Mã vật tư" value={item.name} />
            <InfoRow icon={Tag} label="Tên vật tư" value={item.item_name} />
            <InfoRow icon={Grid3X3} label="Nhóm vật tư" value={item.item_group_name || item.item_group} />
            <InfoRow icon={Ruler} label="Đơn vị tính" value={item.stock_uom || 'Unit'} />
            {item.description && <InfoRow icon={FileText} label="Mô tả" value={item.description} multiline />}
            {item.brand && <InfoRow icon={Tag} label="Thương hiệu" value={item.brand} />}
            {item.manufacturer && <InfoRow icon={Building} label="Nhà sản xuất" value={item.manufacturer} />}
          </div>
        </div>

      {/* Tab Content */}
      <div className="animate-slide-up stagger-3">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Inventory by Warehouse */}
            {stockBalance.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-gray-400" />
                  Tồn kho theo kho
                </h3>
                <div className="space-y-3">
                  {stockBalance.map((bin) => (
                    <div key={bin.name} className="flex items-center gap-4 p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Warehouse className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-semibold text-gray-800 truncate">{bin.warehouse}</p>
                          <div className="flex items-center gap-3 text-right flex-shrink-0 ml-2">
                            <span className="text-sm font-bold text-gray-900">{formatNumber(bin.actual_qty)}</span>
                            {bin.reserved_qty > 0 && (
                              <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md font-medium">
                                Đặt: {formatNumber(bin.reserved_qty)}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                            style={{ width: `${Math.max((bin.actual_qty || 0) / maxQty * 100, bin.actual_qty > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{bin.projected_qty > bin.actual_qty ? `Dự kiến: ${formatNumber(bin.projected_qty)}` : bin.stock_value > 0 ? `Giá trị: ${formatNumber(bin.stock_value)} VND` : item.stock_uom || 'đơn vị'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Info Sections */}
            <div className="card overflow-hidden">
              <CollapsibleSection
                title="Thông tin cơ bản"
                icon={Package}
                open={openSections.basic}
                onToggle={() => toggleSection('basic')}
              >
                <div className="divide-y divide-gray-50">
                  <InfoRow label="Mã vật tư" value={item.name} mono />
                  <InfoRow label="Tên vật tư" value={item.item_name} />
                  <InfoRow label="Nhóm vật tư" value={item.item_group_name || item.item_group} />
                  <InfoRow label="Đơn vị tính" value={item.stock_uom || 'Unit'} />
                  <InfoRow label="Mô tả" value={item.description} multiline />
                  <InfoRow label="Thương hiệu" value={item.brand} />
                  <InfoRow label="Nhà sản xuất" value={item.manufacturer} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Thông tin tồn kho"
                icon={Scale}
                open={openSections.stock}
                onToggle={() => toggleSection('stock')}
              >
                <div className="divide-y divide-gray-50">
                  <InfoRow label="Tổng tồn kho" value={formatNumber(totalStock)} highlight />
                  <InfoRow label="Đơn vị" value={item.stock_uom || 'Unit'} />
                  {item.valuation_rate > 0 && <InfoRow label="Giá trị / đơn vị" value={`${formatNumber(item.valuation_rate)} VND`} />}
                  {item.opening_stock !== undefined && <InfoRow label="Tồn kho ban đầu" value={formatNumber(item.opening_stock)} />}
                  {item.last_purchase_rate > 0 && <InfoRow label="Giá mua cuối" value={`${formatNumber(item.last_purchase_rate)} VND`} />}
                  {item.std_cost > 0 && <InfoRow label="Chi phí chuẩn" value={`${formatNumber(item.std_cost)} VND`} />}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Khác"
                icon={MoreHorizontal}
                open={openSections.other}
                onToggle={() => toggleSection('other')}
              >
                <div className="divide-y divide-gray-50">
                  {item.weight_per_unit && <InfoRow label="Trọng lượng" value={`${item.weight_per_unit} ${item.weight_uom || ''}`} />}
                  {item.shelf_life_in_days > 0 && <InfoRow label="Hạn sử dụng" value={`${item.shelf_life_in_days} ngày`} />}
                  {item.warranty_period && <InfoRow label="Bảo hành" value={`${item.warranty_period} tháng`} />}
                  {item.gst_hsn_code && <InfoRow label="HSN Code" value={item.gst_hsn_code} mono />}
                  {item.customs_tariff_number && <InfoRow label="Mã HS" value={item.customs_tariff_number} mono />}
                  {item.origin && <InfoRow label="Xuất xứ" value={item.origin} />}
                  {item.is_fixed_asset && <InfoRow label="Tài sản cố định" value="Có" />}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Hệ thống"
                icon={User}
                open={openSections.system}
                onToggle={() => toggleSection('system')}
              >
                <div className="divide-y divide-gray-50">
                  <InfoRow label="Người tạo" value={item.owner || '—'} />
                  <InfoRow label="Ngày tạo" value={formatDate(item.creation)} />
                  <InfoRow label="Người sửa cuối" value={item.modified_by || '—'} />
                  <InfoRow label="Sửa cuối" value={formatDate(item.modified)} />
                  <div className="px-4 py-3">
                    <a
                      href={`https://erp.mte.vn/app/item/${item.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Mở trên ERPNext
                    </a>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Layers className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-400">Tồn thực tế</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalStock)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.stock_uom || 'đơn vị'}</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Scale className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-xs text-gray-400">Đã đặt trước</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(reservedStock)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.stock_uom || 'đơn vị'}</p>
              </div>
              <div className="card p-4 col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs text-gray-400">Tồn dự kiến</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatNumber(stockBalance.reduce((s, b) => s + (b.projected_qty || 0), 0))}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.stock_uom || 'đơn vị'}</p>
              </div>
            </div>

            {/* Warehouse table */}
            {stockBalance.length > 0 ? (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-left">Kho</th>
                        <th className="text-right">Tồn thực tế</th>
                        <th className="text-right">Đặt trước</th>
                        <th className="text-right">Dự kiến</th>
                        <th className="text-right">Giá trị</th>
                        <th className="text-left w-24">Mức tồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockBalance.map(bin => (
                        <tr key={bin.name}>
                          <td className="font-medium text-gray-900">{bin.warehouse}</td>
                          <td className="text-right font-bold text-gray-900">{formatNumber(bin.actual_qty)}</td>
                          <td className="text-right text-orange-600">{bin.reserved_qty > 0 ? formatNumber(bin.reserved_qty) : '—'}</td>
                          <td className="text-right text-emerald-600">{formatNumber(bin.projected_qty)}</td>
                          <td className="text-right text-gray-500">{bin.stock_value > 0 ? `${formatNumber(bin.stock_value)}` : '—'}</td>
                          <td>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                                style={{ width: `${Math.max((bin.actual_qty || 0) / maxQty * 100, bin.actual_qty > 0 ? 5 : 0)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Warehouse className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">Không có dữ liệu tồn kho</p>
              </div>
            )}
          </div>
        )}

        {/* Trade Tab */}
        {activeTab === 'trade' && (
          <div className="card p-5 space-y-1">
            <TradeRow label="Cho phép mua" value={item.is_purchase_item} />
            <TradeRow label="Cho phép bán" value={item.is_sales_item} />
            <TradeRow label="Kiểm tra trước mua" value={item.inspection_required_before_purchase} />
            <TradeRow label="Kiểm tra trước giao" value={item.inspection_required_before_delivery} />
            <TradeRow label="Yêu cầu đặt trước" value={item.allow_preorders_artifacts} />
            <TradeRow label="Tài sản cố định" value={item.is_fixed_asset} />
            <TradeRow label="Hàng phục vụ dự án" value={item.is_sub_contracted_item} />
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-50">
              <InfoRow label="Người tạo" value={item.owner || '—'} />
              <InfoRow label="Ngày tạo" value={formatDate(item.creation)} />
              <InfoRow label="Người sửa cuối" value={item.modified_by || '—'} />
              <InfoRow label="Sửa cuối" value={formatDate(item.modified)} />
              <div className="px-4 py-3">
                <a
                  href={`https://erp.mte.vn/app/item/${item.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mở trên ERPNext
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title, icon: Icon, open, onToggle, children
}: {
  title: string; icon: any; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-300 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value, mono = false, multiline = false, highlight = false }: {
  label: string; value: string | number | undefined; mono?: boolean; multiline?: boolean; highlight?: boolean;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start px-4 py-2.5 gap-4">
      <span className="text-xs text-gray-400 w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className={cn(
        "text-sm text-gray-800 flex-1",
        mono && "font-mono text-xs",
        highlight && "font-bold text-blue-600",
        multiline ? "whitespace-pre-wrap" : "truncate"
      )}>{value}</span>
    </div>
  );
}

function TradeRow({ label, value }: { label: string; value: boolean | number | undefined }) {
  const isYes = !!value;
  return (
    <div className="flex items-center justify-between py-2.5 hover:bg-gray-50/50 rounded-lg px-4">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
        isYes ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
      )}>
        {isYes ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {isYes ? 'Có' : 'Không'}
      </span>
    </div>
  );
}
