import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/api';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const entryTypes = [
  { value: 'Material Transfer', label: 'Điều chuyển', icon: ArrowLeftRight },
  { value: 'Material Receipt', label: 'Nhập kho', icon: ArrowDownLeft },
  { value: 'Material Issue', label: 'Xuất kho', icon: ArrowUpRight },
];

export function NewTransfer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    stock_entry_type: 'Material Transfer',
    from_warehouse: '',
    to_warehouse: '',
    allow_zero_valuation: true,
    items: [{ item_code: '', qty: 1 }],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [whs, itms] = await Promise.all([erpService.getWarehouses(), erpService.getItems(100)]);
        setWarehouses(whs.filter((w: any) => !w.is_group));
        setItems(itms);
      } catch { setError('Không thể tải dữ liệu.'); }
      finally { setLoadingData(false); }
    };
    loadData();
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item_code: '', qty: 1 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isReceipt = formData.stock_entry_type === 'Material Receipt';
      const isIssue = formData.stock_entry_type === 'Material Issue';

      const payload: any = {
        stock_entry_type: formData.stock_entry_type,
        from_warehouse: isReceipt ? undefined : (formData.from_warehouse || undefined),
        to_warehouse: isIssue ? undefined : (formData.to_warehouse || undefined),
        // Quan trọng: cho phép giá 0 ở cả document level
        allow_zero_valuation_rate: formData.allow_zero_valuation ? 1 : 0,
        items: formData.items.map((item) => ({
          item_code: item.item_code,
          qty: item.qty,
          s_warehouse: isReceipt ? undefined : (formData.from_warehouse || undefined),
          t_warehouse: isIssue ? undefined : (formData.to_warehouse || undefined),
          // Quan trọng: cho phép giá 0 ở mỗi dòng vật tư
          allow_zero_valuation_rate: formData.allow_zero_valuation ? 1 : 0,
        })),
      };

      const result = await erpService.createStockEntry(payload);

      // Tự động duyệt
      await erpService.submitStockEntry(result.name);
      navigate('/transfers');
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.message;
      if (typeof msg === 'string') {
        if (msg.includes('Valuation Rate')) {
          setError('Giá trị tồn kho chưa được thiết lập. Vui lòng bật "Cho phép giá 0" hoặc thiết lập đơn giá trong mục vật tư.');
        } else if (msg.includes('Missing')) {
          setError('Thông tin còn thiếu. Vui lòng kiểm tra lại kho và vật tư.');
        } else {
          const clean = msg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          setError(clean.substring(0, 200));
        }
      } else {
        setError(data?.message?.exc?.[0] || 'Không thể tạo phiếu nhập xuất.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isReceipt = formData.stock_entry_type === 'Material Receipt';
  const isIssue = formData.stock_entry_type === 'Material Issue';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 animate-slide-up">
        <Link to="/transfers" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tạo phiếu nhập xuất</h1>
          <p className="text-xs text-gray-400">Tạo và duyệt phiếu mới</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-scale-in">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 animate-slide-up stagger-1">
        {/* Loại phiếu */}
        <div className="card p-3">
          <p className="text-xs font-medium text-gray-500 mb-2 ml-1">Loại phiếu</p>
          <div className="grid grid-cols-3 gap-2">
            {entryTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, stock_entry_type: type.value })}
                className={`p-3 rounded-xl text-center transition-all ${formData.stock_entry_type === type.value ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
              >
                <type.icon className={`w-5 h-5 mx-auto mb-1 ${formData.stock_entry_type === type.value ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className={`text-xs font-medium ${formData.stock_entry_type === type.value ? 'text-blue-700' : 'text-gray-500'}`}>{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Kho */}
        {!isReceipt && (
          <div className="card p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 ml-1">Kho nguồn</label>
              <div className="relative">
                <select
                  value={formData.from_warehouse}
                  onChange={(e) => setFormData({ ...formData, from_warehouse: e.target.value })}
                  className="input-field !rounded-xl !bg-gray-50 !pr-10 appearance-none cursor-pointer"
                >
                  <option value="">Chọn kho nguồn</option>
                  {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {!isIssue && (
          <div className="card p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 ml-1">Kho đích</label>
              <div className="relative">
                <select
                  value={formData.to_warehouse}
                  onChange={(e) => setFormData({ ...formData, to_warehouse: e.target.value })}
                  className="input-field !rounded-xl !bg-gray-50 !pr-10 appearance-none cursor-pointer"
                >
                  <option value="">Chọn kho đích</option>
                  {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Vật tư */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Vật tư ({formData.items.length})</p>
            <button type="button" onClick={handleAddItem} className="btn-ghost !text-xs !px-3 !py-1.5 !rounded-lg">
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm dòng
            </button>
          </div>

          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-3 space-y-2 animate-scale-in">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-gray-400 ml-1">Vật tư</label>
                  <div className="relative">
                    <select
                      required
                      value={item.item_code}
                      onChange={(e) => handleItemChange(index, 'item_code', e.target.value)}
                      className="input-field !rounded-lg !bg-white !text-sm !pr-8 appearance-none cursor-pointer"
                    >
                      <option value="">Chọn vật tư</option>
                      {items.map(i => <option key={i.name} value={i.name}>{i.item_name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-medium text-gray-400 ml-1">Số lượng</label>
                    <input
                      type="number" min="0.01" step="0.01" required
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                      className="input-field !rounded-lg !bg-white !text-sm !py-2.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={formData.items.length === 1}
                    className="mt-5 w-9 h-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tùy chọn */}
        {isReceipt && (
          <div className="card p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_zero_valuation}
                onChange={(e) => setFormData({ ...formData, allow_zero_valuation: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded-lg accent-blue-600 mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Cho phép giá trị 0</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Bỏ qua yêu cầu giá nhập kho. Phù hợp khi vật tư chưa có đơn giá.
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-1 animate-slide-up stagger-2">
          <Link to="/transfers" className="btn-secondary flex-1 !rounded-xl !py-3">Hủy</Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1 !rounded-xl !py-3">
            {loading ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang lưu...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Lưu & Duyệt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
