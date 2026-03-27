import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Hash, Package, Warehouse, CheckCircle, Ban } from 'lucide-react';

export function SerialNos() {
  const [serialNos, setSerialNos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('all');

  useEffect(() => { fetchSerialNos(); }, []);

  const fetchSerialNos = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/resource/Serial No`, {
        params: {
          fields: '["name", "item_code", "status", "warehouse", "purchase_document_no"]',
          order_by: 'creation desc',
          limit_page_length: 100,
        }
      });
      setSerialNos(response.data.data || []);
    } catch { setSerialNos([]); }
    finally { setLoading(false); }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'Active': 'Hoạt động',
      'Sold': 'Bán',
      'Cancelled': 'Hủy',
      'Inactive': 'Không hoạt động',
    };
    return labels[status] || status;
  };

  const getStatusChip = (status: string) => {
    if (status === 'Active') return 'chip-green';
    if (status === 'Sold') return 'chip-red';
    if (status === 'Cancelled') return 'chip-gray';
    return 'chip-yellow';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Active') return CheckCircle;
    if (status === 'Sold') return Ban;
    return Ban;
  };

  const filtered = serialNos.filter(e => {
    if (filter === 'active') return e.status === 'Active';
    if (filter === 'sold') return e.status === 'Sold';
    return true;
  });

  const statusCounts = {
    all: serialNos.length,
    active: serialNos.filter(e => e.status === 'Active').length,
    sold: serialNos.filter(e => e.status === 'Sold').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Số serial</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{serialNos.length} serial</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 animate-slide-up stagger-1">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'active', label: 'Hoạt động' },
          { key: 'sold', label: 'Bán' },
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
              <Hash className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có số serial nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((sn, i) => {
              const StatusIcon = getStatusIcon(sn.status);
              return (
                <div key={sn.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      sn.status === 'Active' ? 'bg-green-50' : sn.status === 'Sold' ? 'bg-red-50' : 'bg-gray-100'
                    }`}>
                      <Hash className={`w-5 h-5 ${
                        sn.status === 'Active' ? 'text-green-500' : sn.status === 'Sold' ? 'text-red-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 break-all">{sn.name}</p>
                      {sn.item_code && (
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">{sn.item_code}</span>
                        </div>
                      )}
                      {sn.warehouse && (
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <Warehouse className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">{sn.warehouse}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-auto">
                      <span className={`chip ${getStatusChip(sn.status)} text-[10px]`}>
                        <StatusIcon className="w-3 h-3 mr-0.5" />
                        {getStatusLabel(sn.status)}
                      </span>
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
