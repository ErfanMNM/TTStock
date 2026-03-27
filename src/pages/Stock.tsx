import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Warehouse, Package, Filter, ChevronDown, Search } from 'lucide-react';

export function Stock() {
  const [stock, setStock] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const whs = await erpService.getWarehouses();
        setWarehouses(whs.filter((w: any) => !w.is_group));
      } catch { /* ignore */ }
      await fetchStock();
    };
    init();
  }, []);

  const fetchStock = async (warehouse = '') => {
    setLoading(true);
    try {
      const data = await erpService.getStockBalance(warehouse);
      setStock(data);
    } catch { setStock([]); }
    finally { setLoading(false); }
  };

  const handleWarehouseChange = (val: string) => {
    setSelectedWarehouse(val);
    fetchStock(val);
  };

  const totalQty = stock.reduce((sum, b) => sum + (b.actual_qty || 0), 0);

  const filtered = stock.filter((b) =>
    b.item_code?.toLowerCase().includes(search.toLowerCase()) ||
    b.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.item_group?.toLowerCase().includes(search.toLowerCase()) ||
    b.warehouse?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tồn kho</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">Tổng: {totalQty.toLocaleString()} đơn vị · {filtered.length} dòng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 animate-slide-up stagger-1">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã vật tư, kho..."
            className="input-field !rounded-xl !bg-gray-50 !pl-10"
          />
        </div>
        <div className="relative sm:w-52 flex-shrink-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={selectedWarehouse}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            className="input-field !rounded-xl !bg-gray-50 !pl-10 !pr-10 appearance-none cursor-pointer"
          >
            <option value="">Tất cả kho</option>
            {warehouses.map(w => (
              <option key={w.name} value={w.name}>{w.warehouse_name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {search ? 'Không tìm thấy kết quả phù hợp.' : 'Không có dữ liệu tồn kho.'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-left">Mã vật tư</th>
                    <th className="text-left">Tên vật tư</th>
                    <th className="text-left">Nhóm</th>
                    <th className="text-left">Kho</th>
                    <th className="text-right">Tồn thực tế</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((bin) => (
                    <tr key={bin.name}>
                      <td className="font-medium">{bin.item_code}</td>
                      <td className="text-gray-600 truncate max-w-[200px]">{bin.item_name || '—'}</td>
                      <td>
                        <span className="chip chip-gray !text-xs">{bin.item_group || '—'}</span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Warehouse className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="truncate">{bin.warehouse}</span>
                        </div>
                      </td>
                      <td className="text-right font-semibold text-blue-600">{bin.actual_qty?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
