import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { erpService } from '../services/api';
import {
  ArrowLeft, Save, Plus, Trash2, ChevronDown, ArrowDownLeft, ArrowUpRight,
  ArrowLeftRight, AlertCircle, Search, X, ExternalLink, Package,
  ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const entryTypes = [
  { value: 'Material Transfer', label: 'Điều chuyển', icon: ArrowLeftRight },
  { value: 'Material Receipt', label: 'Nhập kho', icon: ArrowDownLeft },
  { value: 'Material Issue', label: 'Xuất kho', icon: ArrowUpRight },
];

type TransferItem = {
  item_code: string;
  item_name?: string;
  qty: number;
  item_group?: string;
  stock_uom?: string;
  image?: string;
  basic_rate?: number;
};

export function NewTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
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
    stock_entry_type: string;
    from_warehouse: string;
    to_warehouse: string;
    allow_zero_valuation: boolean;
    items: TransferItem[];
  }>({
    stock_entry_type: 'Material Transfer',
    from_warehouse: '',
    to_warehouse: '',
    allow_zero_valuation: true,
    items: [{ item_code: '', qty: 1 }],
  });

  const [stockBalances, setStockBalances] = useState<Record<string, number>>({});
  const [itemRates, setItemRates] = useState<Record<string, number>>({});

  const fetchItems = async (size = 1000) => {
    try {
      return await erpService.getItems(size, 0, '');
    } catch { return []; }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [whs, itms, bins] = await Promise.all([
          erpService.getWarehouses(),
          fetchItems(),
          erpService.getStockBalance(),
        ]);
        setWarehouses(whs.filter((w: any) => !w.is_group));
        setAllItems(itms);

        // Aggregate actual_qty across all warehouses per item
        const map: Record<string, number> = {};
        for (const bin of bins) {
          if (bin.item_code) {
            map[bin.item_code] = (map[bin.item_code] || 0) + (bin.actual_qty || 0);
          }
        }
        setStockBalances(map);

        // Also pre-load valuation rates from bins
        const ratesMap: Record<string, number> = {};
        for (const bin of bins) {
          if (bin.item_code && !ratesMap[bin.item_code] && bin.valuation_rate) {
            ratesMap[bin.item_code] = bin.valuation_rate;
          }
        }
        setItemRates(ratesMap);

        // Auto-add item from URL param
        const prefilledCode = searchParams.get('item_code');
        if (prefilledCode) {
          setFormData(prev => ({
            ...prev,
            items: [{ item_code: prefilledCode, qty: 1, basic_rate: ratesMap[prefilledCode] }],
          }));
        }
      } catch { setError('Không thể tải dữ liệu.'); }
      finally { setLoadingData(false); }
    };
    loadData();
  }, []);


  // Search-filtered items for picker
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

  const handleItemSelect = async (item: any) => {
    // Check if already added
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
      }],
    }));
    setShowPicker(false);
    setSearchItem('');
  };

  const handleRowItemChange = async (index: number, item_code: string) => {
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
          basic_rate: itemRates[item_code] ?? prev.items[index].basic_rate,
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    const validItems = formData.items.filter(i => i.item_code && i.qty > 0);
    if (validItems.length === 0) {
      setError('Vui lòng thêm ít nhất một vật tư.');
      setLoading(false);
      return;
    }

    try {
      const isReceipt = formData.stock_entry_type === 'Material Receipt';
      const isIssue = formData.stock_entry_type === 'Material Issue';

      const payload: any = {
        stock_entry_type: formData.stock_entry_type,
        from_warehouse: isReceipt ? undefined : (formData.from_warehouse || undefined),
        to_warehouse: isIssue ? undefined : (formData.to_warehouse || undefined),
        allow_zero_valuation_rate: formData.allow_zero_valuation ? 1 : 0,
        items: validItems.map((item) => ({
          item_code: item.item_code,
          qty: item.qty,
          basic_rate: item.basic_rate || itemRates[item.item_code] || 0,
          s_warehouse: isReceipt ? undefined : (formData.from_warehouse || undefined),
          t_warehouse: isIssue ? undefined : (formData.to_warehouse || undefined),
          allow_zero_valuation_rate: formData.allow_zero_valuation ? 1 : 0,
        })),
      };

      const result = await erpService.createStockEntry(payload);
      navigate(`/transfers/${encodeURIComponent(result.name)}`);
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.message;
      if (typeof msg === 'string') {
        if (msg.includes('Valuation Rate')) {
          setError('Giá trị tồn kho chưa được thiết lập. Vui lòng bật "Cho phép giá 0" hoặc thiết lập đơn giá.');
        } else if (msg.includes('Missing')) {
          setError('Thông tin còn thiếu. Vui lòng kiểm tra lại kho và vật tư.');
        } else {
          const clean = msg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          setError(clean.substring(0, 200));
        }
      } else {
        setError(data?.message?.exc?.[0] || 'Không thể tạo phiếu nhập xuất.');
      }
      setLoading(false);
    }
  };

  const isReceipt = formData.stock_entry_type === 'Material Receipt';
  const isIssue = formData.stock_entry_type === 'Material Issue';
  const validCount = formData.items.filter(i => i.item_code && i.qty > 0).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 animate-slide-up">
        <Link to="/transfers" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tạo phiếu nhập xuất</h1>
          <p className="text-xs text-gray-400">{validCount} vật tư đã chọn</p>
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
                className={cn(
                  "p-3 rounded-xl text-center transition-all",
                  formData.stock_entry_type === type.value
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                )}
              >
                <type.icon className={cn("w-5 h-5 mx-auto mb-1", formData.stock_entry_type === type.value ? "text-blue-500" : "text-gray-400")} />
                <p className={cn("text-xs font-medium", formData.stock_entry_type === type.value ? "text-blue-700" : "text-gray-500")}>{type.label}</p>
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

        {/* Bang vat tu */}
        <div className="card overflow-hidden animate-slide-up stagger-2">
          {/* Header + actions */}
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
                    <th className="text-left">Mã / Tên vật tư</th>
                    <th className="text-left hidden lg:table-cell">Nhóm</th>
                    <th className="text-center">SL</th>
                    <th className="text-center hidden lg:table-cell">ĐVT</th>
                    <th className="text-center" title={isReceipt ? 'Tồn kho tại kho đích' : 'Tồn kho tại kho nguồn'}>
                      <span className="hidden lg:inline">Tồn</span>
                      <span className="lg:hidden">Tồn kho</span>
                    </th>
                    <th className="text-center hidden lg:table-cell">Đơn giá</th>
                    <th className="w-24"></th>
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
                          <span className="chip chip-gray !text-xs">{row.item_group || matched?.item_group || '—'}</span>
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
                        <td className="text-center">
                          <span
                            className={cn(
                              "font-semibold text-xs",
                              (stockBalances[row.item_code] ?? 0) > 0 ? "text-green-600" : "text-gray-400"
                            )}
                            title={row.item_code ? `Tồn kho ${row.item_code}` : undefined}
                          >
                            {row.item_code ? (stockBalances[row.item_code] ?? 0).toLocaleString('vi-VN') : '—'}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell w-32">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={row.basic_rate ?? itemRates[row.item_code] ?? ''}
                            onChange={(e) => handleItemChange(idx, 'basic_rate', parseFloat(e.target.value) || 0)}
                            className="input-field !rounded-lg !text-xs !py-1.5 !text-right !w-28"
                            placeholder="0"
                            disabled={!row.item_code}
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

          {/* Add row button */}
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
              {/* Picker header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Chọn vật tư</h3>
                <button onClick={() => setShowPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Search */}
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

              {/* Items list */}
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
                          <span className={cn(
                              "text-xs font-semibold flex-shrink-0",
                              (stockBalances[item.name] ?? 0) > 0 ? "text-green-600" : "text-gray-400"
                            )}>
                            {(stockBalances[item.name] ?? 0).toLocaleString('vi-VN')}
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

              {/* Picker pagination */}
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

        {/* Detail modal */}
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

        {/* Tùy chọn */}
        {isReceipt && (
          <div className="card p-4">
            <label className="flex items-start justify-between cursor-pointer">
              <div className="pr-4">
                <div className="text-sm font-medium text-gray-900">Cho phép giá trị 0</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Bỏ qua yêu cầu giá nhập kho. Phù hợp khi vật tư chưa có đơn giá.
                </div>
              </div>
              <label className="ios-switch mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.allow_zero_valuation}
                  onChange={(e) => setFormData({ ...formData, allow_zero_valuation: e.target.checked })}
                />
                <span className="ios-switch-slider" />
              </label>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-1 animate-slide-up stagger-3">
          <Link to="/transfers" className="btn-secondary flex-1 !rounded-xl !py-3">Hủy</Link>
          <button
            type="submit"
            onClick={handleSubmit}
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
                Lưu & chuyển
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
