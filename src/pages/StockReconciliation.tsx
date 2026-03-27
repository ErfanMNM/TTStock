import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Scale, Calendar, CheckCircle, Clock, Ban } from 'lucide-react';
import { api } from '../services/api';

export function StockReconciliation() {
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'draft'>('all');

  useEffect(() => { fetchReconciliations(); }, []);

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/resource/Stock Reconciliation`, {
        params: {
          fields: '["name", "purpose", "posting_date", "docstatus", "amended_from"]',
          order_by: 'creation desc',
          limit_page_length: 50,
        }
      });
      setReconciliations(response.data.data || []);
    } catch { setReconciliations([]); }
    finally { setLoading(false); }
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      'Stock Reconciliation': 'Đối soát',
      'Stock Loss': 'Mất hàng',
      'Stock Reconciliation on Opening': 'Đối soát mở đầu',
    };
    return labels[purpose] || purpose;
  };

  const filtered = reconciliations.filter(e => {
    if (filter === 'draft') return e.docstatus === 0;
    if (filter === 'submitted') return e.docstatus === 1;
    return true;
  });

  const statusCounts = {
    all: reconciliations.length,
    draft: reconciliations.filter(e => e.docstatus === 0).length,
    submitted: reconciliations.filter(e => e.docstatus === 1).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Đối soát tồn kho</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{statusCounts.submitted} đã duyệt • {statusCounts.draft} nháp</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 animate-slide-up stagger-1">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'submitted', label: 'Đã duyệt' },
          { key: 'draft', label: 'Nháp' },
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
              <Scale className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có phiếu đối soát nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((item, i) => (
              <div key={item.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.docstatus === 1 ? 'bg-purple-50' : item.docstatus === 0 ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <Scale className={`w-5 h-5 ${
                      item.docstatus === 1 ? 'text-purple-500' : item.docstatus === 0 ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="chip chip-blue text-[10px]">{getPurposeLabel(item.purpose)}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {item.posting_date}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-auto">
                    {item.docstatus === 1 ? (
                      <span className="chip chip-green text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5" /> Đã duyệt</span>
                    ) : item.docstatus === 0 ? (
                      <span className="chip chip-yellow text-[10px]"><Clock className="w-3 h-3 mr-0.5" /> Nháp</span>
                    ) : (
                      <span className="chip chip-red text-[10px]"><Ban className="w-3 h-3 mr-0.5" /> Đã hủy</span>
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
