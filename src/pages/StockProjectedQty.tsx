import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { TrendingUp, Search, Package } from 'lucide-react';

export function StockProjectedQty() {
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

  const filtered = balance.filter(b =>
    b.item_code?.toLowerCase().includes(search.toLowerCase()) ||
    b.item_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getProjectedStatus = (projected: number, actual: number) => {
    if (projected <= 0) return 'chip-red';
    if (projected < actual) return 'chip-yellow';
    return 'chip-green';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tồn dự kiến</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{filtered.length} vật tư</p>
      </div>

      {/* Search */}
      <div className="animate-slide-up stagger-1">
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

      {/* Table */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-gray-300" />
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
                    <th className="text-right">Tồn thực</th>
                    <th className="text-right">Dự kiến</th>
                    <th className="text-right">Đặt hàng</th>
                    <th className="text-right">Sẵn có</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((bin) => {
                    const ordered = (bin.projected_qty || 0) - (bin.actual_qty || 0) - (bin.reserved_qty || 0);
                    return (
                      <tr key={bin.name}>
                        <td className="font-medium">{bin.item_code}</td>
                        <td className="text-gray-600 truncate max-w-[200px]">{bin.item_name || '—'}</td>
                        <td className="text-right font-semibold text-blue-600">{bin.actual_qty?.toLocaleString()}</td>
                        <td className="text-right text-gray-600">{bin.projected_qty?.toLocaleString()}</td>
                        <td className="text-right text-orange-600">{ordered > 0 ? ordered.toLocaleString() : '—'}</td>
                        <td className="text-right">
                          <span className={`chip ${getProjectedStatus(bin.projected_qty || 0, bin.actual_qty || 0)} !text-xs`}>
                            {bin.projected_qty?.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
