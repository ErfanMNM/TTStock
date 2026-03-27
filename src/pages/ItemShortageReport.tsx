import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { AlertTriangle, Package, Search, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ItemShortageReport() {
  const [balance, setBalance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchBalance(); }, []);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const data = await erpService.getStockBalance();
      setBalance(data);
    } catch { setBalance([]); }
    finally { setLoading(false); }
  };

  const shortageItems = balance.filter(b =>
    (b.projected_qty || 0) <= 0 || (b.actual_qty || 0) <= 0
  );

  const filtered = shortageItems.filter(b =>
    b.item_code?.toLowerCase().includes(search.toLowerCase()) ||
    b.item_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalShortage = shortageItems.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Báo cáo thiếu hàng</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{totalShortage} vật tư cần đặt hàng</p>
      </div>

      {/* Alert Banner */}
      {totalShortage > 0 && (
        <div className="card p-4 bg-red-50 border-red-100 animate-slide-up stagger-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Cảnh báo thiếu hàng</p>
              <p className="text-xs text-red-500 mt-0.5">
                {totalShortage} vật tư có tồn kho bằng 0 hoặc âm. Cần tạo yêu cầu mua hàng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="animate-slide-up stagger-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !rounded-2xl !py-3.5 !pl-12"
            placeholder="Tìm mã vật tư..."
          />
        </div>
      </div>

      {/* List */}
      <div className="animate-slide-up stagger-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">Không có vật tư thiếu hàng.</p>
            <p className="text-xs text-gray-400 mt-1">Tất cả vật tư đều có tồn kho dương.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((item, i) => (
              <Link
                key={item.name}
                to={`/items/${encodeURIComponent(item.item_code)}`}
                className="card p-4 animate-slide-up card-press block"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    (item.actual_qty || 0) <= 0 ? 'bg-red-50' : 'bg-yellow-50'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      (item.actual_qty || 0) <= 0 ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.item_name || item.item_code}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.item_code}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`text-lg font-bold ${
                        (item.actual_qty || 0) <= 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {item.actual_qty?.toLocaleString() || 0}
                      </span>
                      <span className="text-xs text-gray-400">tồn</span>
                    </div>
                    {(item.projected_qty || 0) <= 0 && (
                      <span className="chip chip-red !text-[10px] mt-1">
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                        Cần đặt hàng
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
