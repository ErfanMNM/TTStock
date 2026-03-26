import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/api';
import { ArrowLeft, Save, Package, Search, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComboOption {
  value: string;
  label: string;
}

export function NewItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Options từ API
  const [itemGroupOptions, setItemGroupOptions] = useState<ComboOption[]>([]);
  const [uomOptions, setUomOptions] = useState<ComboOption[]>([]);

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    item_group: '',
    stock_uom: 'Unit',
    unit: 'Unit',
    is_stock_item: 1,
    maintain_stock: 1,
    description: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Gọi song song Item Group và UOM
        const [groupsRes, uomRes] = await Promise.allSettled([
          erpService.getItemGroups(),
          erpService.getUOMs(),
        ]);

        if (groupsRes.status === 'fulfilled' && groupsRes.value) {
          const groups = Array.isArray(groupsRes.value) ? groupsRes.value : [];
          setItemGroupOptions(groups.map((g: any) => ({ value: g.name, label: g.item_group_name || g.name })));
        }

        if (uomRes.status === 'fulfilled' && uomRes.value) {
          const uoms = Array.isArray(uomRes.value) ? uomRes.value : [];
          setUomOptions(uoms.map((u: any) => ({ value: u.name, label: u.name })));
        }
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        item_code: formData.item_code.trim(),
        item_name: formData.item_name.trim(),
        item_group: formData.item_group.trim(),
        stock_uom: formData.stock_uom.trim() || 'Unit',
        unit: formData.unit.trim() || 'Unit',
        is_stock_item: formData.is_stock_item,
        maintain_stock: formData.maintain_stock,
        description: formData.description,
      };

      const result = await erpService.createItem(payload);
      navigate('/items');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg?.exc) {
        const excStr = msg.exc[0] || '';
        if (excStr.includes('Item')) {
          setError('Mã vật tư đã tồn tại trong hệ thống.');
        } else {
          setError('Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin.');
        }
      } else {
        setError(msg || 'Không thể tạo vật tư.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 animate-slide-up">
        <Link to="/items" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tạo vật tư mới</h1>
          <p className="text-xs text-gray-400">Thêm vật tư vào hệ thống</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 animate-slide-up stagger-1">
        {/* Card: Thông tin cơ bản */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Thông tin vật tư</h2>
          </div>

          <div className="space-y-3">
            {/* Mã vật tư */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 ml-1">Mã vật tư <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={formData.item_code}
                onChange={(e) => handleChange('item_code', e.target.value)}
                className="input-field !rounded-xl !bg-gray-50"
                placeholder="VD: VT-001"
              />
            </div>

            {/* Tên vật tư */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 ml-1">Tên vật tư <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={formData.item_name}
                onChange={(e) => handleChange('item_name', e.target.value)}
                className="input-field !rounded-xl !bg-gray-50"
                placeholder="VD: Thép tròn đặc"
              />
            </div>

            {/* Nhóm vật tư — combobox có search */}
            <ComboBox
              label="Nhóm vật tư"
              required
              value={formData.item_group}
              options={itemGroupOptions}
              onChange={(val) => handleChange('item_group', val)}
              placeholder="Chọn hoặc nhập nhóm vật tư..."
              loading={loadingData}
            />

            {/* Đơn vị tính — combobox có search */}
            <ComboBox
              label="Đơn vị tính"
              required
              value={formData.stock_uom}
              options={uomOptions}
              onChange={(val) => {
                handleChange('stock_uom', val);
                handleChange('unit', val);
              }}
              placeholder="Chọn hoặc nhập đơn vị..."
              loading={loadingData}
            />

            {/* Mô tả */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 ml-1">Mô tả</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="input-field !rounded-xl !bg-gray-50 resize-none"
                placeholder="Mô tả chi tiết về vật tư..."
              />
            </div>
          </div>
        </div>

        {/* Card: Tùy chọn */}
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Tùy chọn tồn kho</h2>
          <label className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_stock_item === 1}
              onChange={(e) => handleChange('is_stock_item', e.target.checked ? 1 : 0)}
              className="w-5 h-5 text-blue-600 rounded-lg accent-blue-600"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Là vật tư tồn kho</div>
              <div className="text-xs text-gray-400">Vật tư được theo dõi số lượng trong kho</div>
            </div>
          </label>
          <label className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={formData.maintain_stock === 1}
              onChange={(e) => handleChange('maintain_stock', e.target.checked ? 1 : 0)}
              className="w-5 h-5 text-blue-600 rounded-lg accent-blue-600"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Theo dõi tồn kho</div>
              <div className="text-xs text-gray-400">Tự động cập nhật số lượng khi nhập/xuất</div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-1 animate-slide-up stagger-2">
          <Link to="/items" className="btn-secondary flex-1 !rounded-xl !py-3">Hủy</Link>
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
                Lưu vật tư
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- ComboBox Component ---
interface ComboBoxProps {
  label: string;
  required?: boolean;
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
}

function ComboBox({ label, required, value, options, onChange, placeholder, loading }: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const showDropdown = open && !loading;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input khi mở dropdown
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    setSearch('');
  };

  const handleInputChange = (val: string) => {
    // Nếu không chọn từ dropdown thì cho nhập tay
    onChange(val);
  };

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      <label className="text-xs font-medium text-gray-500 ml-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between input-field !rounded-xl !bg-gray-50 !py-3 cursor-pointer ${open ? '!border-blue-500 !bg-white !shadow-sm !ring-2 !ring-blue-500/20' : ''}`}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {loading ? 'Đang tải...' : (value || placeholder || 'Chọn...')}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-scale-in">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  {search ? 'Không có kết quả phù hợp.' : 'Chưa có dữ liệu — nhập trực tiếp để thêm.'}
                </div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors ${value === opt.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>

            {/* Footer hint */}
            {filtered.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400">Nhấn Enter hoặc chọn để xác nhận. Nhập trực tiếp để thêm mới.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
