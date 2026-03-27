import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { ListTodo, Calendar, CheckCircle, Clock, Ban } from 'lucide-react';

export function PickList() {
  const [pickLists, setPickLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'draft'>('all');

  useEffect(() => { fetchPickLists(); }, []);

  const fetchPickLists = async () => {
    setLoading(true);
    try {
      const response = await erpService.getStockEntries(50);
      // Pick List is stored as Stock Entry with pick_list_type
      setPickLists(response.filter((e: any) => e.pick_list_type || e.stock_entry_type === 'Pick List'));
    } catch { setPickLists([]); }
    finally { setLoading(false); }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'Pick List': 'Chọn hàng',
      'Material Transfer': 'Điều chuyển',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Pick List': 'chip-blue',
      'Material Transfer': 'chip-blue',
    };
    return colors[type] || 'chip-gray';
  };

  const filtered = pickLists.filter(e => {
    if (filter === 'draft') return e.docstatus === 0;
    if (filter === 'submitted') return e.docstatus === 1;
    return true;
  });

  const statusCounts = {
    all: pickLists.length,
    draft: pickLists.filter(e => e.docstatus === 0).length,
    submitted: pickLists.filter(e => e.docstatus === 1).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Danh sách chọn hàng</h1>
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
              <ListTodo className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có danh sách chọn hàng nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((item, i) => (
              <div key={item.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.docstatus === 1 ? 'bg-blue-50' : item.docstatus === 0 ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <ListTodo className={`w-5 h-5 ${
                      item.docstatus === 1 ? 'text-blue-500' : item.docstatus === 0 ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className={`chip ${getTypeColor(item.pick_list_type || item.stock_entry_type)} text-[10px]`}>
                        {getTypeLabel(item.pick_list_type || item.stock_entry_type)}
                      </span>
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
