import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { erpService } from '../services/api';
import {
  ArrowLeft, Package, Warehouse, Hash, Grid3X3, Ruler, FileText,
  ArrowDownLeft, ArrowUpRight, Tag, Building, Calendar, User,
  Scale, Shield, Truck, CheckCircle, Clock, BarChart3, ExternalLink
} from 'lucide-react';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [stockBalance, setStockBalance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      } catch (err) {
        setError('Không thể tải thông tin vật tư.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const totalStock = stockBalance.reduce((sum, b) => sum + (b.actual_qty || 0), 0);

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
          <p className="text-sm text-red-500">{error || 'Không tìm thấy vật tư.'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (d: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return d; }
  };

  const badge = (val: boolean | number, activeLabel: string, inactiveLabel: string) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
    }`}>
      {val ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
      {val ? activeLabel : inactiveLabel}
    </span>
  );

  const totalValue = totalStock * (item.valuation_rate || 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 animate-slide-up">
        <Link to="/items" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Chi tiết vật tư</h1>
          <p className="text-xs text-gray-400">{item.name}</p>
        </div>
      </div>

      {/* Ảnh + Tên chính */}
      <div className="card overflow-hidden animate-slide-up stagger-1">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8 lg:py-10 flex flex-col lg:flex-row lg:items-center lg:space-x-6">
          <div className="w-24 h-24 lg:w-28 lg:h-28 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm mb-4 lg:mb-0 overflow-hidden mx-auto lg:mx-0">
            {item.image ? (
              <img src={`https://erp.mte.vn${item.image}`} alt={item.item_name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-12 h-12 lg:w-14 lg:h-14 text-white/60" />
            )}
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">{item.item_name}</h2>
            <p className="text-sm text-blue-100 mt-1">{item.name}</p>
            <div className="flex items-center justify-center lg:justify-start space-x-2 mt-3">
              {badge(item.is_stock_item === 1 || item.is_stock_item === true, 'Tồn kho', 'Không tồn kho')}
              {badge(item.disabled !== 1 && item.disabled !== true, 'Đang hoạt động', 'Đã vô hiệu')}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up stagger-2">
        <Link to="/stock/receive" className="card p-4 flex flex-col items-center space-y-2 card-press">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-xs font-medium text-gray-700">Nhập kho</div>
        </Link>
        <Link to="/transfers/new" className="card p-4 flex flex-col items-center space-y-2 card-press">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-xs font-medium text-gray-700">Xuất kho</div>
        </Link>
      </div>

      {/* Mô tả - full width */}
      {item.description && (
        <div className="card p-4 animate-slide-up stagger-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-gray-400" />
            Mô tả
          </h3>
          <div
            className="prose prose-sm max-w-none text-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        </div>
      )}

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
            {item.brand && <InfoRow icon={Tag} label="Thương hiệu" value={item.brand} />}
            {item.manufacturer && <InfoRow icon={Building} label="Nhà sản xuất" value={item.manufacturer} />}
          </div>
        </div>

        {/* Tồn kho */}
        <div className="card p-4 animate-slide-up stagger-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Warehouse className="w-4 h-4 mr-2 text-gray-400" />
            Thông tin tồn kho
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Scale} label="Tổng tồn kho" value={totalStock.toLocaleString()} valueColor="text-blue-600 font-bold" />
            {item.is_stock_item !== undefined && (
              <InfoRow icon={Scale} label="Là vật tư tồn kho" value={item.is_stock_item ? 'Có' : 'Không'} />
            )}
            {item.maintain_stock !== undefined && (
              <InfoRow icon={Scale} label="Theo dõi tồn kho" value={item.maintain_stock ? 'Có' : 'Không'} />
            )}
            {item.valuation_rate > 0 && <InfoRow icon={Scale} label="Giá trị tồn kho" value={item.valuation_rate.toLocaleString('vi-VN')} />}
            {item.opening_stock !== undefined && <InfoRow icon={Scale} label="Tồn kho ban đầu" value={item.opening_stock} />}
            {item.last_purchase_rate > 0 && <InfoRow icon={Scale} label="Giá mua cuối" value={item.last_purchase_rate.toLocaleString('vi-VN')} />}
            {item.std_cost > 0 && <InfoRow icon={Scale} label="Chi phí chuẩn" value={item.std_cost.toLocaleString('vi-VN')} />}
          </div>
        </div>

        {/* Mua / Bán */}
        <div className="card p-4 animate-slide-up stagger-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Truck className="w-4 h-4 mr-2 text-gray-400" />
            Mua / Bán
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Truck} label="Cho phép mua" value={item.is_purchase_item ? 'Có' : 'Không'} />
            <InfoRow icon={Truck} label="Cho phép bán" value={item.is_sales_item ? 'Có' : 'Không'} />
            <InfoRow icon={Truck} label="Yêu cầu kiểm tra trước mua" value={item.inspection_required_before_purchase ? 'Có' : 'Không'} />
            <InfoRow icon={Truck} label="Yêu cầu kiểm tra trước giao" value={item.inspection_required_before_delivery ? 'Có' : 'Không'} />
            <InfoRow icon={Shield} label="Tài sản cố định" value={item.is_fixed_asset ? 'Có' : 'Không'} />
          </div>
        </div>

        {/* Khác */}
        <div className="card p-4 animate-slide-up stagger-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-gray-400" />
            Khác
          </h3>
          <div className="space-y-3">
            {item.weight_per_unit && <InfoRow icon={Scale} label="Trọng lượng / đơn vị" value={`${item.weight_per_unit} ${item.weight_uom || ''}`} />}
            {item.shelf_life_in_days > 0 && <InfoRow icon={Calendar} label="Hạn sử dụng (ngày)" value={item.shelf_life_in_days} />}
            {item.warranty_period && <InfoRow icon={Shield} label="Bảo hành" value={`${item.warranty_period} tháng`} />}
            {item.gst_hsn_code && <InfoRow icon={Hash} label="HSN Code" value={item.gst_hsn_code} />}
            {item.customs_tariff_number && <InfoRow icon={Hash} label="Mã HS / Tariff" value={item.customs_tariff_number} />}
            {item.origin && <InfoRow icon={Building} label="Xuất xứ" value={item.origin} />}
          </div>
        </div>

        {/* Thông tin hệ thống */}
        <div className="card p-4 animate-slide-up stagger-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            Thông tin hệ thống
          </h3>
          <div className="space-y-3">
            <InfoRow icon={User} label="Người tạo" value={item.owner || '-'} />
            <InfoRow icon={User} label="Người sửa cuối" value={item.modified_by || '-'} />
            <InfoRow icon={Calendar} label="Ngày tạo" value={formatDate(item.creation)} />
            <InfoRow icon={Calendar} label="Ngày sửa cuối" value={formatDate(item.modified)} />
            <div className="flex items-center space-x-3 pt-1">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Xem trên ERPNext</p>
                <a
                  href={`https://erp.mte.vn/app/item/${item.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Mở {item.name} →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tồn kho theo kho - full width */}
      {stockBalance.length > 0 && (
        <div className="card p-4 animate-slide-up stagger-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Warehouse className="w-4 h-4 mr-2 text-gray-400" />
            Tồn kho theo kho
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stockBalance.map((bin) => (
              <div key={bin.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Warehouse className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{bin.warehouse}</p>
                    {bin.item_code && <p className="text-[10px] text-gray-400">{bin.item_code}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{bin.actual_qty?.toLocaleString()}</p>
                  {bin.reserved_qty > 0 && (
                    <p className="text-[10px] text-orange-500">Đặt: {bin.reserved_qty}</p>
                  )}
                  {item.valuation_rate > 0 && (
                    <p className="text-[10px] text-gray-400">{(bin.actual_qty * item.valuation_rate).toLocaleString('vi-VN')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueColor = 'text-gray-900', multiline = false }: {
  icon: any; label: string; value: string | number; valueColor?: string; multiline?: boolean;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium ${valueColor} ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>{value || '-'}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'blue' | 'green' | 'purple' | 'gray' | 'orange' }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}
