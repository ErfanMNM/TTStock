import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Warehouse, Package, Filter, ChevronDown } from 'lucide-react';

export function Stock() {
  const [stock, setStock] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tồn kho</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">Tổng: {totalQty.toLocaleString()} đơn vị</p>
      </div>

      {/* Warehouse Filter */}
      <div className="card p-3 animate-slide-up stagger-1">
        <div className="relative">
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

      {/* Content */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : stock.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Không có dữ liệu tồn kho.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {stock.map((bin, i) => (
              <div key={bin.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{bin.item_code}</p>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-blue-600">{bin.actual_qty}</p>
                        <p className="text-[10px] text-gray-400">tồn thực tế</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-3.5 h-3.5 bg-gray-100 rounded flex items-center justify-center">
                        <Warehouse className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-400 truncate">{bin.warehouse}</p>
                    </div>
                    {bin.reserved_qty > 0 && (
                      <p className="text-xs text-orange-500 mt-1">Đã đặt: {bin.reserved_qty}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
