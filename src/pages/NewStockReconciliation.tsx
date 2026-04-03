import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpService, debugFetchBin } from '../services/api';
import {
  ArrowLeft, Save, Plus, Trash2, ChevronDown, AlertCircle, Search, X,
  Package, ChevronLeft, ChevronRight, Image as ImageIcon, Scale,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

type ReconItem = {
  item_code: string;
  item_name?: string;
  qty?: number;
  valuation_rate?: number;
  current_qty?: number;
  stock_uom?: string;
  image?: string;
};

export function NewStockReconciliation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [stockData, setStockData] = useState<Record<string, number>>({}); // kept for row qty defaults
  const [loadingData, setLoadingData] = useState(true);
  const [searchItem, setSearchItem] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPage, setPickerPage] = useState(0);
  const [pickerSearch, setPickerSearch] = useState('');
  const searchRef = useRef<ReturnType<typeof setTimeout>>();
  const PICKER_SIZE = 20;

  const [formData, setFormData] = useState({
    purpose: 'Stock Reconciliation',
    warehouse: '',
    posting_date: new Date().toISOString().split('T')[0],
    items: [] as ReconItem[],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [whs, itms] = await Promise.all([
          erpService.getWarehouses(),
          erpService.getItems(10000, 0, ''),
        ]);
        setWarehouses(whs.filter((w: any) => !w.is_group));
        setAllItems(itms);
      } catch {
        setError('Không thể tải dữ liệu.');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Fetch stock balance when warehouse changes and update items
  useEffect(() => {
    const fetchStock = async () => {
      if (!formData.warehouse) { setStockData({}); return; }
      try {
        // Debug: raw call
        const raw = await debugFetchBin(formData.warehouse);
        console.log('[DEBUG] Raw Bin API response:', JSON.stringify(raw).substring(0, 500));
        console.log('[DEBUG] response.data:', raw.data);

        const data = await erpService.getStockBalance(formData.warehouse, '');
        console.log('[DEBUG] getStockBalance result:', data.length, 'bins');
        const map: Record<string, number> = {};
        for (const row of data) {
          map[row.item_code] = row.actual_qty || 0;
        }
        setStockData(map);

        setAllItems((prev: any[]) => prev.map((item: any) => ({
          ...item,
          actual_qty: map[item.name] ?? 0,
        })));
      } catch (err: any) {
        console.error('[DEBUG] fetchStock error:', err?.response?.data || err);
        setStockData({});
      }
    };
    fetchStock();
  }, [formData.warehouse]);

  const filteredPickerItems = useMemo(() => {
    let items = allItems;
    if (pickerSearch) {
      const q = pickerSearch.toLowerCase();
      items = items.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.item_name || '').toLowerCase().includes(q) ||
        (i.item_group || '').toLowerCase().includes(q)
      );
    }
    return items;
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
      items: [...prev.items, { item_code: '', qty: 0 }],
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
        stock_uom: item.stock_uom,
        image: item.image,
        qty: stockData[item.name] ?? 0,
        current_qty: stockData[item.name] ?? 0,
      }],
    }));
    setShowPicker(false);
    setSearchItem('');
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent, submitNow: boolean) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.warehouse) {
      setError('Vui lòng chọn kho.');
      setLoading(false);
      return;
    }

    const validItems = formData.items.filter(i => i.item_code && i.qty !== undefined);
    if (validItems.length === 0) {
      setError('Vui lòng thêm ít nhất một vật tư.');
      setLoading(false);
      return;
    }

    try {
      const itemsPayload = validItems.map((item: any) => ({
        item_code: item.item_code,
        qty: item.qty || 0,
        valuation_rate: item.valuation_rate || 0,
      }));
      const payload: any = {
        purpose: formData.purpose,
        posting_date: formData.posting_date,
        items: itemsPayload,
        mode_of_sync: 'Local',
      };

      const result = await erpService.createStockReconciliation(payload);

      if (submitNow) {
        await erpService.submitStockReconciliation(result.name);
      }

      navigate('/stock-reconciliation');
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.message;
      if (typeof msg === 'string') {
        const clean = msg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        setError(clean.substring(0, 200));
      } else {
        setError('Không thể tạo phiếu đối soát.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validCount = formData.items.filter(i => i.item_code).length;

  const getDiff = (item: ReconItem) => {
    const current = item.current_qty ?? 0;
    const actual = item.qty ?? 0;
    return actual - current;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 animate-slide-up">
        <Link to="/stock-reconciliation" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tạo phiếu đối soát</h1>
          <p className="text-xs text-gray-400">{validCount} vật tư đã chọn</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-scale-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-3 animate-slide-up stagger-1">
        {/* Kho + Ngày */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 ml-1">Kho</label>
              <div className="relative">
                <select
                  value={formData.warehouse}
                  onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value, items: [] }))}
                  className="input-field !rounded-xl !bg-gray-50 !pr-10 appearance-none cursor-pointer"
                >
                  <option value="">Chọn kho</option>
                  {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 ml-1">Ngày đối soát</label>
              <input
                type="date"
                value={formData.posting_date}
                onChange={(e) => setFormData(prev => ({ ...prev, posting_date: e.target.value }))}
                className="input-field !rounded-xl !bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Bang vat tu */}
        <div className="card overflow-hidden animate-slide-up stagger-2">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900">Vật tư ({validCount})</p>
            <button
              type="button"
              onClick={() => { setShowPicker(true); setPickerPage(0); setPickerSearch(''); }}
              className="btn-primary !rounded-xl !px-4 !py-2 !text-sm"
              disabled={!formData.warehouse}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm vật tư
            </button>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : !formData.warehouse ? (
            <div className="p-8 text-center">
              <Scale className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">Vui lòng chọn kho trước</p>
            </div>
          ) : formData.items.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
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
                    <th className="text-left">Vật tư</th>
                    <th className="text-right">Tồn HT</th>
                    <th className="text-right">Thực tế</th>
                    <th className="text-right">Chênh</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((row, idx) => {
                    const diff = getDiff(row);
                    return (
                      <tr key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 20}ms` }}>
                        <td>
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {row.image ? (
                              <img src={`https://erp.mte.vn${row.image}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-3.5 h-3.5 text-gray-300" />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <div className="relative">
                              <select
                                value={row.item_code}
                                onChange={(e) => {
                                  const item = allItems.find(i => i.name === e.target.value);
                                  if (item) {
                                    handleItemChange(idx, 'item_code', item.name);
                                    handleItemChange(idx, 'item_name', item.item_name);
                                    handleItemChange(idx, 'stock_uom', item.stock_uom);
                                    handleItemChange(idx, 'image', item.image);
                                    handleItemChange(idx, 'current_qty', stockData[item.name] ?? 0);
                                    handleItemChange(idx, 'qty', stockData[item.name] ?? 0);
                                  } else {
                                    handleItemChange(idx, 'item_code', '');
                                  }
                                }}
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
                        <td className="text-right text-gray-500">
                          {(row.current_qty ?? 0).toLocaleString('vi-VN')}
                        </td>
                        <td className="w-28">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.qty ?? ''}
                            onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                            className="input-field !rounded-lg !text-sm !py-2 !text-right !w-24"
                            disabled={!row.item_code}
                          />
                        </td>
                        <td className={cn(
                          "text-right font-bold w-24",
                          diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400"
                        )}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                <p className="text-xs text-gray-400 mt-1.5">
                  {filteredPickerItems.length} vật tư
                </p>
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
                      const currentQty = item.actual_qty ?? 0;
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
                          <span className={cn("text-xs flex-shrink-0", currentQty !== 0 ? "text-gray-400" : "text-gray-300")}>
                            Tồn: {currentQty.toLocaleString()}
                          </span>
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

        {/* Actions */}
        <div className="flex gap-3 pt-1 animate-slide-up stagger-3">
          <Link to="/stock-reconciliation" className="btn-secondary flex-1 !rounded-xl !py-3">Hủy</Link>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, false)}
            disabled={loading || validCount === 0 || !formData.warehouse}
            className="btn-secondary flex-1 !rounded-xl !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Lưu nháp
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, true)}
            disabled={loading || validCount === 0 || !formData.warehouse}
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
              <>Lưu & Duyệt</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
