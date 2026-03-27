import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { MapPin, Package, TrendingUp, Warehouse } from 'lucide-react';

interface WarehouseSummary {
  warehouse: string;
  warehouse_name: string;
  total_qty: number;
  total_value: number;
  item_count: number;
}

export function WarehouseWiseStock() {
  const [balance, setBalance] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const data = await erpService.getStockBalance();
      setBalance(data);
    } catch { setBalance([]); }
    finally { setLoading(false); }
  };

  const warehouseSummaries: WarehouseSummary[] = warehouses.map(wh => {
    const whBalance = balance.filter(b => b.warehouse === wh.name);
    return {
      warehouse: wh.name,
      warehouse_name: wh.warehouse_name,
      total_qty: whBalance.reduce((sum, b) => sum + (b.actual_qty || 0), 0),
      total_value: whBalance.reduce((sum, b) => sum + (b.stock_value || 0), 0),
      item_count: new Set(whBalance.map(b => b.item_code)).size,
    };
  }).sort((a, b) => b.total_qty - a.total_qty);

  const grandTotalQty = warehouseSummaries.reduce((sum, w) => sum + w.total_qty, 0);
  const grandTotalValue = warehouseSummaries.reduce((sum, w) => sum + w.total_value, 0);

  const getTopWarehouse = () => {
    if (warehouseSummaries.length === 0) return null;
    return warehouseSummaries.reduce((max, w) => w.total_qty > max.total_qty ? w : max, warehouseSummaries[0]);
  };

  const topWarehouse = getTopWarehouse();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tồn kho theo kho</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{warehouses.length} kho</p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-40 animate-slide-up stagger-1">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : warehouseSummaries.length === 0 ? (
        <div className="card p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">Không có dữ liệu.</p>
        </div>
      ) : (
        <>
          {/* Top warehouse highlight */}
          {topWarehouse && topWarehouse.total_qty > 0 && (
            <div className="card p-5 bg-gradient-to-r from-blue-50 to-indigo-50 animate-slide-up stagger-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-500 font-medium">Kho nhiều hàng nhất</p>
                  <p className="text-lg font-bold text-gray-900">{topWarehouse.warehouse_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{topWarehouse.total_qty.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{topWarehouse.item_count} vật tư</p>
                </div>
              </div>
            </div>
          )}

          {/* Warehouse Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-slide-up stagger-2">
            {warehouseSummaries.map((wh, i) => (
              <div key={wh.warehouse} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    wh.total_qty > 0 ? 'bg-indigo-50' : 'bg-gray-100'
                  }`}>
                    <Warehouse className={`w-5 h-5 ${wh.total_qty > 0 ? 'text-indigo-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{wh.warehouse_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{wh.warehouse}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{wh.total_qty.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">tồn kho</p>
                      </div>
                      <div className="h-8 w-px bg-gray-200" />
                      <div>
                        <p className="text-lg font-bold text-green-600">{wh.item_count}</p>
                        <p className="text-[10px] text-gray-400">vật tư</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-3">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-400">Tổng tồn</p>
              <p className="text-2xl font-bold text-blue-600">{grandTotalQty.toLocaleString()}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-400">Giá trị tổng</p>
              <p className="text-2xl font-bold text-green-600">{grandTotalValue.toLocaleString()}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
