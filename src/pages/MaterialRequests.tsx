import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { ClipboardList, Calendar, CheckCircle, Clock, Plus, Ban, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MaterialRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted'>('all');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await erpService.getMaterialRequests(50);
      setRequests(data);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'Material Transfer': 'Điều chuyển',
      'Material Receipt': 'Nhập kho',
      'Purchase': 'Mua hàng',
      'Customer Provided': 'Khách cung cấp',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string, docstatus: number) => {
    if (docstatus === 2) return 'chip-red';
    if (docstatus === 1) return 'chip-green';
    if (status === 'Partly Ordered' || status === 'Partly Received') return 'chip-yellow';
    if (status === 'Pending') return 'chip-gray';
    return 'chip-yellow';
  };

  const filtered = requests.filter(e => {
    if (filter === 'draft') return e.docstatus === 0;
    if (filter === 'submitted') return e.docstatus === 1;
    return true;
  });

  const statusCounts = {
    all: requests.length,
    draft: requests.filter(e => e.docstatus === 0).length,
    submitted: requests.filter(e => e.docstatus === 1).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Yêu cầu vật tư</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{statusCounts.submitted} đã duyệt • {statusCounts.draft} nháp</p>
        </div>
        <Link to="/material-requests/new" className="btn-primary !rounded-xl !px-4 !py-2.5 !text-sm w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 mr-1.5" />
          Tạo mới
        </Link>
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
              <ClipboardList className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có yêu cầu vật tư nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((req, i) => (
              <div key={req.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    req.docstatus === 1 ? 'bg-green-50' : req.docstatus === 0 ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <ClipboardList className={`w-5 h-5 ${
                      req.docstatus === 1 ? 'text-green-500' : req.docstatus === 0 ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{req.name}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="chip chip-blue text-[10px]">{getTypeLabel(req.material_request_type)}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {req.transaction_date}
                    </div>
                    {(req.per_received > 0 || req.per_ordered > 0) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {req.per_received > 0 ? `Đã nhận ${req.per_received}%` : `Đã đặt ${req.per_ordered}%`}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-auto">
                    {req.docstatus === 1 ? (
                      <span className="chip chip-green text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5" /> Đã duyệt</span>
                    ) : req.docstatus === 0 ? (
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
