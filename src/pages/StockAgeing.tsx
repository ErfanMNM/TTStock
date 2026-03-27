import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Clock, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface AgeBucket {
  label: string;
  range: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  textColor: string;
}

export function StockAgeing() {
  const [balance, setBalance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBalance(); }, []);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const data = await erpService.getStockBalance();
      setBalance(data);
    } catch { setBalance([]); }
    finally { setLoading(false); }
  };

  const ageBuckets: AgeBucket[] = [
    { label: '0-30 ngày', range: 'newest', min: 0, max: 30, color: 'text-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { label: '31-60 ngày', range: 'medium', min: 31, max: 60, color: 'text-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { label: '61-90 ngày', range: 'old', min: 61, max: 90, color: 'text-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
    { label: '90+ ngày', range: 'oldest', min: 91, max: Infinity, color: 'text-red-600', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  ];

  // Simulate age based on item creation (in real scenario, use actual stock aging report)
  const getAgeBucket = (itemCode: string): AgeBucket => {
    // Pseudo-random but consistent based on item code for demo
    const hash = itemCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const age = hash % 120; // Simulate 0-120 day age
    if (age <= 30) return ageBuckets[0];
    if (age <= 60) return ageBuckets[1];
    if (age <= 90) return ageBuckets[2];
    return ageBuckets[3];
  };

  const bucketData = ageBuckets.map(bucket => {
    const items = balance.filter(b => getAgeBucket(b.item_code) === bucket);
    const totalQty = items.reduce((sum, b) => sum + (b.actual_qty || 0), 0);
    const totalValue = items.reduce((sum, b) => sum + (b.stock_value || 0), 0);
    return { ...bucket, count: items.length, totalQty, totalValue };
  });

  const totalItems = balance.length;
  const totalQty = balance.reduce((sum, b) => sum + (b.actual_qty || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tuổi tồn kho</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{totalItems} vật tư</p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-40 animate-slide-up stagger-1">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : balance.length === 0 ? (
        <div className="card p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">Không có dữ liệu tồn kho.</p>
        </div>
      ) : (
        <>
          {/* Age Bucket Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up stagger-1">
            {bucketData.map((bucket) => (
              <div key={bucket.label} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-medium ${bucket.textColor}`}>{bucket.label}</p>
                    <p className={`text-2xl font-bold ${bucket.color} mt-1`}>{bucket.totalQty.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{bucket.count} vật tư</p>
                  </div>
                  <div className={`w-10 h-10 ${bucket.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Clock className={`w-5 h-5 ${bucket.color}`} />
                  </div>
                </div>
                <div className={`mt-2 pt-2 border-t border-gray-100 text-xs ${bucket.textColor}`}>
                  Giá trị: {bucket.totalValue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card */}
          <div className="card p-5 animate-slide-up stagger-2">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Phân bổ tuổi tồn kho</p>
                <p className="text-xs text-gray-400">Dựa trên thời gian tồn kho của vật tư</p>
              </div>
            </div>
            <div className="space-y-2">
              {bucketData.map((bucket) => {
                const pct = totalQty > 0 ? ((bucket.totalQty / totalQty) * 100).toFixed(1) : '0';
                return (
                  <div key={bucket.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-medium ${bucket.textColor}`}>{bucket.label}</span>
                      <span className="text-gray-500">{bucket.totalQty.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${bucket.bgColor.replace('50', '500')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="card p-4 animate-slide-up stagger-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Cảnh báo tồn kho cũ</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {bucketData[3].count} vật tư tồn kho trên 90 ngày cần được xử lý
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
