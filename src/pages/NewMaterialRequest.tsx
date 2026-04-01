import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/api';
import {
  ArrowLeft, Save, Plus, Trash2, ChevronDown,
  AlertCircle, Search, X, ExternalLink, Package,
  ChevronLeft, ChevronRight, Image as ImageIcon, Send,
  Calendar, FileText, Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

type MRItem = {
  item_code: string;
  item_name?: string;
  qty: number;
  item_group?: string;
  stock_uom?: string;
  image?: string;
  schedule_date?: string;
  warehouse?: string;
  description?: string;
};

export function NewMaterialRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchItem, setSearchItem] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPage, setPickerPage] = useState(0);
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedItemDetail, setSelectedItemDetail] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout>>();
  const PICKER_SIZE = 20;

  const [formData, setFormData] = useState<{
    material_request_type: string;
    set_from_warehouse: string;
    set_warehouse: string;
    set_warehouse_for: string;
    company: string;
    transaction_date: string;
    schedule_date: string;
    title: string;
    remarks: string;
    items: MRItem[];
  }>({
    material_request_type: 'Purchase',
    set_from_warehouse: '',
    set_warehouse: '',
    set_warehouse_for: '',
    company: '',
    transaction_date: new Date().toISOString().split('T')[0],
    schedule_date: new Date().toISOString().split('T')[0],
    title: '',
    remarks: '',
    items: [{ item_code: '', qty: 1 }],
  });

  const requestTypes = [
    { value: 'Purchase', label: 'Mua hàng' },
    { value: 'Material Transfer', label: 'Điều chuyển' },
    { value: 'Material Issue', label: 'Xuất kho' },
    { value: 'Customer Provided', label: 'Khách cung cấp' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [whs, itms, comp] = await Promise.all([
          erpService.getWarehouses(),
          erpService.getItems(1000, 0, ''),
          erpService.getCompany(),
        ]);
        setWarehouses(whs.filter((w: any) => !w.is_group));
        setAllItems(itms);
        if (comp?.name) setFormData(prev => ({ ...prev, company: comp.name }));
      } catch {
        setError('Không thể tải dữ liệu.');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const filteredPickerItems = useMemo(() => {
    if (!pickerSearch) return allItems;
    const q = pickerSearch.toLowerCase();
    return allItems.filter(i =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.item_name || '').toLowerCase().includes(q) ||
      (i.item_group || '').toLowerCase().includes(q)
    );
  }, [allItems, pickerSearch]);

  const pickerPageItems = filteredPickerItems.slice(pickerPage * PICKER_SIZE, (pickerPage + 1) * PICKER_SIZE);
  const pickerHasMore = filteredPickerItems.length > (pickerPage + 1) * PICKER_SIZE;

  const handleSearchChange = (value: string) => {
    setSearchItem(value);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPickerSearch(value);
      setPickerPage(0);
    }, 300);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_code: '', qty: 1 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemSelect = (item: any) => {
    if (formData.items.some(i => i.item_code === item.name)) {
      setShowPicker(false);
      setSearchItem('');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        item_code: item.name,
        item_name: item.item_name,
        item_group: item.item_group,
        stock_uom: item.stock_uom,
        image: item.image,
        qty: 1,
        schedule_date: new Date().toISOString().split('T')[0],
        warehouse: formData.set_warehouse,
        description: '',
      }],
    }));
    setShowPicker(false);
    setSearchItem('');
  };

  const handleRowItemChange = (index: number, item_code: string) => {
    if (!item_code) {
      handleItemChange(index, 'item_code', '');
      return;
    }
    const itemData = allItems.find(i => i.name === item_code);
    if (itemData) {
      setFormData(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          item_code,
          item_name: itemData.item_name,
          item_group: itemData.item_group,
          stock_uom: itemData.stock_uom,
          image: itemData.image,
          warehouse: prev.set_warehouse || itemData.item_defaults?.[0]?.default_warehouse || '',
        };
        return { ...prev, items: newItems };
      });
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const openItemDetail = async (itemCode: string) => {
    try {
      const detail = await erpService.getItemDetails(itemCode);
      setSelectedItemDetail(detail);
      setShowDetailModal(true);
    } catch {
      setError('Không thể tải chi tiết vật tư.');
    }
  };

  const handleSubmit = async (e: React.FormEvent, submit = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const validItems = formData.items.filter(i => i.item_code && i.qty > 0);
    if (validItems.length === 0) {
      setError('Vui lòng thêm ít nhất một vật tư.');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        material_request_type: formData.material_request_type,
        title: formData.title || `YCVT ${new Date().toISOString().split('T')[0]}`,
        company: formData.company,
        transaction_date: formData.transaction_date,
        set_warehouse: formData.set_warehouse || undefined,
        set_from_warehouse: formData.set_from_warehouse || undefined,
        set_warehouse_for: formData.set_warehouse_for || undefined,
        remarks: formData.remarks || undefined,
        items: validItems.map((item) => ({
          item_code: item.item_code,
          qty: item.qty,
          schedule_date: item.schedule_date || new Date().toISOString().split('T')[0],
          warehouse: item.warehouse || formData.set_warehouse || undefined,
          description: item.description || undefined,
        })),
      };

      const response = await erpService.createMaterialRequest(payload);

      if (submit) {
        // Submit via fetch like other submit actions
        const formData2 = new URLSearchParams({ doctype: 'Material Request', docname: response.name });
        const res = await fetch('/api/method/frappe.client.submit', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData2,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.exception || data.message || 'Lỗi duyệt phiếu');
      }

      setSuccess('Tạo phiếu thành công!');
      setTimeout(() => navigate('/material-requests'), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (typeof msg === 'string') {
        const clean = msg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        setError(clean.substring(0, 200));
      } else {
        setError(err.response?.data?.exception || 'Không thể tạo phiếu yêu cầu vật tư.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validCount = formData.items.filter(i => i.item_code && i.qty > 0).length;
  const isTransfer = formData.material_request_type === 'Material Transfer';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <Link to="/material-requests" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tạo phiếu YCVT</h1>
            <p className="text-xs text-gray-400">{validCount} vật tư đã chọn</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-scale-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 animate-scale-in">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 animate-slide-up stagger-1">
        {/* Loại phiếu */}
        <div className="card p-3">
          <p className="text-xs font-medium text-gray-500 mb-2 ml-1">Loại yêu cầu</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {requestTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, material_request_type: type.value })}
                className={cn(
                  "p-3 rounded-xl text-center transition-all",
                  formData.material_request_type === type.value
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                )}
              >
                <p className={cn("text-xs font-medium", formData.material_request_type === type.value ? "text-blue-700" : "text-gray-500")}>{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Thông tin chung */}
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tiêu đề */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tiêu đề phiếu</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field !rounded-xl !bg-gray-50 !text-sm"
                placeholder="VD: YCVT vật tư tháng 4/2026"
              />
            </div>

            {/* Công ty */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Công ty</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={formData.company}
                  readOnly
                  className="input-field !rounded-xl !bg-gray-100 !text-sm !pl-10 !pr-10"
                />
              </div>
            </div>

            {/* Ngày yêu cầu */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ngày yêu cầu</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  className="input-field !rounded-xl !bg-gray-50 !text-sm !pl-10"
                />
              </div>
            </div>

            {/* Ngày cần hàng */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ngày cần hàng</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={formData.schedule_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, schedule_date: e.target.value }))}
                  className="input-field !rounded-xl !bg-gray-50 !text-sm !pl-10"
                />
              </div>
            </div>

            {/* Kho mặc định */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Kho đích mặc định</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  value={formData.set_warehouse}
                  onChange={(e) => setFormData(prev => ({ ...prev, set_warehouse: e.target.value }))}
                  className="input-field !rounded-xl !bg-gray-50 !pl-10 !pr-10 appearance-none cursor-pointer !text-sm"
                >
                  <option value="">Chọn kho</option>
                  {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Kho nguồn (chỉ cho điều chuyển) */}
        {isTransfer && (
          <div className="card p-4">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Từ kho (kho nguồn điều chuyển)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
              <select
                value={formData.set_from_warehouse}
                onChange={(e) => setFormData(prev => ({ ...prev, set_from_warehouse: e.target.value }))}
                className="input-field !rounded-xl !bg-gray-50 !pl-10 !pr-10 appearance-none cursor-pointer !text-sm"
              >
                <option value="">Chọn kho nguồn</option>
                {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Ghi chú */}
        <div className="card p-4">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ghi chú / Mô tả</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            className="input-field !rounded-xl !bg-gray-50 !text-sm !resize-none"
            rows={2}
            placeholder="VD: Cần gấp cho đơn hàng KH-2026-04..."
          />
        </div>

        {/* Bang vat tu */}
        <div className="card overflow-hidden animate-slide-up stagger-2">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900">Vật tư ({validCount})</p>
            <button
              type="button"
              onClick={() => { setShowPicker(true); setPickerPage(0); }}
              className="btn-primary !rounded-xl !px-4 !py-2 !text-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm vật tư
            </button>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : formData.items.every(i => !i.item_code) ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-3">Chưa có vật tư nào</p>
              <button
                type="button"
                onClick={() => { setShowPicker(true); setPickerPage(0); }}
                className="btn-primary !rounded-xl !px-5 !py-2.5 !text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Thêm vật tư đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12"></th>
                    <th className="text-left min-w-[200px]">Mã / Tên vật tư</th>
                    <th className="text-left hidden lg:table-cell min-w-[120px]">Ngày cần</th>
                    <th className="text-center min-w-[80px]">SL</th>
                    <th className="text-center hidden lg:table-cell min-w-[70px]">ĐVT</th>
                    <th className="text-left hidden lg:table-cell min-w-[130px]">Kho</th>
                    <th className="text-left hidden xl:table-cell min-w-[150px]">Mô tả</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((row, idx) => {
                    const matched = allItems.find(i => i.name === row.item_code);
                    return (
                      <tr key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 20}ms` }}>
                        <td>
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {row.image || matched?.image ? (
                              <img
                                src={`https://erp.mte.vn${row.image || matched?.image}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <div className="relative">
                              <select
                                value={row.item_code}
                                onChange={(e) => handleRowItemChange(idx, e.target.value)}
                                className="w-full !rounded-lg !bg-gray-50 !text-sm !py-2 !pl-3 !pr-8 appearance-none cursor-pointer font-medium"
                              >
                                <option value="">Chọn vật tư</option>
                                {allItems.map(i => (
                                  <option key={i.name} value={i.name}>
                                    {i.item_name || i.name} ({i.name})
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                            {row.item_code && (
                              <span className="text-[10px] text-gray-400 mt-0.5 font-mono">{row.item_code}</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell">
                          <input
                            type="date"
                            value={row.schedule_date || ''}
                            onChange={(e) => handleItemChange(idx, 'schedule_date', e.target.value)}
                            className="input-field !rounded-lg !text-sm !py-2 !px-2 !w-36"
                          />
                        </td>
                        <td className="w-24">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={row.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                            className="input-field !rounded-lg !text-sm !py-2 !text-center !w-20"
                            disabled={!row.item_code}
                          />
                        </td>
                        <td className="hidden lg:table-cell">
                          <span className="chip chip-green !text-xs">{row.stock_uom || matched?.stock_uom || '—'}</span>
                        </td>
                        <td className="hidden lg:table-cell">
                          <div className="relative">
                            <select
                              value={row.warehouse || ''}
                              onChange={(e) => handleItemChange(idx, 'warehouse', e.target.value)}
                              className="!rounded-lg !bg-gray-50 !text-xs !py-1.5 !pl-2 !pr-6 appearance-none cursor-pointer w-full max-w-[130px]"
                            >
                              <option value="">—</option>
                              {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="hidden xl:table-cell">
                          <input
                            type="text"
                            value={row.description || ''}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="input-field !rounded-lg !text-xs !py-1.5 !px-2 !bg-gray-50 !w-full max-w-[150px]"
                            placeholder="Mô tả..."
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {row.item_code && (
                              <button
                                type="button"
                                onClick={() => openItemDetail(row.item_code)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                title="Chi tiết vật tư"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              disabled={formData.items.length === 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {formData.items.some(i => i.item_code) && (
            <div className="p-3 border-t border-gray-50">
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm dòng
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1 animate-slide-up stagger-3">
          <Link to="/material-requests" className="btn-secondary flex-1 !rounded-xl !py-3">Hủy</Link>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, false)}
            disabled={loading || validCount === 0}
            className="btn-secondary flex-1 !rounded-xl !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Lưu nháp
          </button>
          <button
            type="submit"
            disabled={loading || validCount === 0}
            className="btn-primary flex-1 !rounded-xl !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
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

      {/* Item detail modal */}
      {showDetailModal && selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Chi tiết vật tư</h3>
              <div className="flex items-center gap-2">
                <a
                  href={`https://erp.mte.vn/app/item/${selectedItemDetail.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                  title="Mở trên ERPNext"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl">
                <div className="w-16 h-16 bg-white/20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {selectedItemDetail.image ? (
                    <img src={`https://erp.mte.vn${selectedItemDetail.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-white/40" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedItemDetail.item_name}</h4>
                  <p className="text-xs text-blue-200 font-mono mt-0.5">{selectedItemDetail.name}</p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full">
                      {selectedItemDetail.stock_uom || '—'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full">
                      {selectedItemDetail.item_group_name || selectedItemDetail.item_group || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Giá mua cuối', selectedItemDetail.last_purchase_rate ? `${selectedItemDetail.last_purchase_rate.toLocaleString('vi-VN')} VND` : '—'],
                  ['Chi phí chuẩn', selectedItemDetail.std_cost ? `${selectedItemDetail.std_cost.toLocaleString('vi-VN')} VND` : '—'],
                  ['Giá trị / đơn vị', selectedItemDetail.valuation_rate ? `${selectedItemDetail.valuation_rate.toLocaleString('vi-VN')} VND` : '—'],
                  ['Tồn ban đầu', selectedItemDetail.opening_stock ?? '—'],
                  ['Trọng lượng', selectedItemDetail.weight_per_unit ? `${selectedItemDetail.weight_per_unit} ${selectedItemDetail.weight_uom || ''}` : '—'],
                  ['Hạn sử dụng', selectedItemDetail.shelf_life_in_days > 0 ? `${selectedItemDetail.shelf_life_in_days} ngày` : '—'],
                  ['Bảo hành', selectedItemDetail.warranty_period ? `${selectedItemDetail.warranty_period} tháng` : '—'],
                  ['Xuất xứ', selectedItemDetail.origin || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {selectedItemDetail.description && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 mb-1">Mô tả</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedItemDetail.description}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary w-full !rounded-xl !py-2.5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item picker overlay */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPicker(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Chọn vật tư</h3>
              <button onClick={() => setShowPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchItem}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="input-field !rounded-xl !py-2.5 !pl-10 !pr-4"
                  placeholder="Tìm mã, tên hoặc nhóm vật tư..."
                  autoFocus
                />
                {searchItem && (
                  <button
                    onClick={() => { setSearchItem(''); setPickerSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{filteredPickerItems.length} vật tư</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {pickerPageItems.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Không tìm thấy vật tư nào.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {pickerPageItems.map((item) => {
                    const alreadyAdded = formData.items.some(i => i.item_code === item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleItemSelect(item)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                          alreadyAdded
                            ? "opacity-40 cursor-not-allowed bg-gray-50"
                            : "hover:bg-blue-50 active:bg-blue-100"
                        )}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <img src={`https://erp.mte.vn${item.image}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.item_name || item.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.name} · {item.item_group}</p>
                        </div>
                        {alreadyAdded && (
                          <span className="text-xs text-blue-500 font-medium flex-shrink-0">Đã thêm</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {filteredPickerItems.length > PICKER_SIZE && (
              <div className="flex items-center justify-between p-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {pickerPage * PICKER_SIZE + 1}–{Math.min((pickerPage + 1) * PICKER_SIZE, filteredPickerItems.length)} / {filteredPickerItems.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPickerPage(p => Math.max(0, p - 1))}
                    disabled={pickerPage === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg">
                    {pickerPage + 1}
                  </span>
                  <button
                    onClick={() => setPickerPage(p => p + 1)}
                    disabled={!pickerHasMore}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
