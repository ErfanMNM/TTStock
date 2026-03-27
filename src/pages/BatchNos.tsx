import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Layers, AlertTriangle, CheckCircle } from 'lucide-react';

export function BatchNos() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/resource/Batch`, {
        params: {
          fields: '["name", "item", "batch_id", "expiry_date", "docstatus", "disabled"]',
          order_by: 'creation desc',
          limit_page_length: 100,
        }
      });
      setBatches(response.data.data || []);
    } catch { setBatches([]); }
    finally { setLoading(false); }
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    const now = new Date();
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (isExpired(expiryDate)) return 'expired';
    if (isExpiringSoon(expiryDate)) return 'warning';
    return 'ok';
  };

  const filtered = batches.filter(e => {
    if (filter === 'active') return !isExpired(e.expiry_date);
    if (filter === 'expired') return isExpired(e.expiry_date);
    return true;
  });

  const statusCounts = {
    all: batches.length,
    active: batches.filter(e => !isExpired(e.expiry_date)).length,
    expired: batches.filter(e => isExpired(e.expiry_date)).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Số lô</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{batches.length} lô hàng</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 animate-slide-up stagger-1">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'active', label: 'Hoạt động' },
          { key: 'expired', label: 'Hết hạn' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`chip whitespace-nowrap transition-all ${filter === tab.key ? 'chip-blue shadow-sm' : 'chip-gray'}`}
          >
            {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Layers className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có số lô nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((batch, i) => {
              const expiryStatus = getExpiryStatus(batch.expiry_date);
              return (
                <div key={batch.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      expiryStatus === 'expired' ? 'bg-red-50' :
                      expiryStatus === 'warning' ? 'bg-yellow-50' : 'bg-indigo-50'
                    }`}>
                      <Layers className={`w-5 h-5 ${
                        expiryStatus === 'expired' ? 'text-red-500' :
                        expiryStatus === 'warning' ? 'text-yellow-500' : 'text-indigo-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{batch.batch_id || batch.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{batch.item}</p>
                      {batch.expiry_date && (
                        <div className="flex items-center space-x-1 mt-1">
                          <span className={`text-xs ${
                            expiryStatus === 'expired' ? 'text-red-600' :
                            expiryStatus === 'warning' ? 'text-yellow-600' : 'text-gray-500'
                          }`}>
                            {expiryStatus === 'expired' && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                            HSD: {batch.expiry_date}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-auto">
                      {expiryStatus === 'expired' ? (
                        <span className="chip chip-red text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          Hết hạn
                        </span>
                      ) : expiryStatus === 'warning' ? (
                        <span className="chip chip-yellow text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          Sắp hết
                        </span>
                      ) : (
                        <span className="chip chip-green text-[10px]">
                          <CheckCircle className="w-3 h-3 mr-0.5" />
                          OK
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
