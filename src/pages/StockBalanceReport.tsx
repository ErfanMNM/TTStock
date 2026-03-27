import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Wallet, Search, Filter, Package } from 'lucide-react';

export function StockBalanceReport() {
  const [balance, setBalance] = useState<any[]>([]);
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
      await fetchBalance();
    };
    init();
  }, []);

  const fetchBalance = async (warehouse = '') => {
    setLoading(true);
    try {
      const data = await erpService.getStockBalance(warehouse);
      setBalance(data);
    } catch { setBalance([]); }
    finally { setLoading(false); }
  };

  const handleWarehouseChange = (val: string) => {
    setSelectedWarehouse(val);
    fetchBalance(val);
  };

  const filtered = balance.filter(b =>
    b.item_code?.toLowerCase().includes(search.toLowerCase()) ||
    b.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.item_group?.toLowerCase().includes(search.toLowerCase()) ||
    b.warehouse?.toLowerCase().includes(search.toLowerCase())
  );

  const totalActual = filtered.reduce((sum, b) => sum + (b.actual_qty || 0), 0);
  const totalProjected = filtered.reduce((sum, b) => sum + (b.projected_qty || 0), 0);
  const totalValue = filtered.reduce((sum, b) => sum + (b.stock_value || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Báo cáo tồn kho</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{filtered.length} dòng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 animate-slide-up stagger-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !rounded-xl !bg-gray-50 !pl-10"
            placeholder="Tìm mã vật tư, kho..."
          />
        </div>
        <div className="relative sm:w-52 flex-shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-2">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-400">Tồn thực</p>
          <p className="text-lg font-bold text-blue-600">{totalActual.toLocaleString()}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-400">Dự kiến</p>
          <p className="text-lg font-bold text-green-600">{totalProjected.toLocaleString()}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-400">Giá trị</p>
          <p className="text-lg font-bold text-purple-600">{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="animate-slide-up stagger-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Không có dữ liệu.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-left">Mã VT</th>
                    <th className="text-left">Tên VT</th>
                    <th className="text-left">Kho</th>
                    <th className="text-right">Tồn thực</th>
                    <th className="text-right">Dự kiến</th>
                    <th className="text-right">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((bin) => (
                    <tr key={bin.name}>
                      <td className="font-medium">{bin.item_code}</td>
                      <td className="text-gray-600 truncate max-w-[180px]">{bin.item_name || '—'}</td>
                      <td>
                        <span className="chip chip-gray !text-xs">{bin.warehouse}</span>
                      </td>
                      <td className="text-right font-semibold text-blue-600">{bin.actual_qty?.toLocaleString()}</td>
                      <td className="text-right text-gray-600">{bin.projected_qty?.toLocaleString()}</td>
                      <td className="text-right font-semibold text-green-600">{bin.stock_value?.toLocaleString()}</td>
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
