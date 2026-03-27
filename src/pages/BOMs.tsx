import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { FileText, CheckCircle, Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BOMs() {
  const [boms, setBOMs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => { fetchBOMs(); }, []);

  const fetchBOMs = async () => {
    setLoading(true);
    try {
      const data = await erpService.getBOMs(50);
      setBOMs(data);
    } catch { setBOMs([]); }
    finally { setLoading(false); }
  };

  const filtered = boms.filter(e => {
    if (filter === 'active') return e.is_active === 1 || e.docstatus === 1;
    if (filter === 'inactive') return e.is_active === 0 && e.docstatus !== 1;
    return true;
  });

  const statusCounts = {
    all: boms.length,
    active: boms.filter(e => e.is_active === 1 || e.docstatus === 1).length,
    inactive: boms.filter(e => e.is_active === 0 && e.docstatus !== 1).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Định mức (BOM)</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{statusCounts.active} đang hoạt động</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 animate-slide-up stagger-1">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'active', label: 'Hoạt động' },
          { key: 'inactive', label: 'Không hoạt động' },
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
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có định mức nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((bom, i) => (
              <div key={bom.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    bom.is_active ? 'bg-green-50' : 'bg-gray-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${bom.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{bom.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{bom.item_name || bom.item}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="chip chip-gray text-[10px]">
                        SL: {bom.quantity} {bom.uom}
                      </span>
                      {bom.is_default ? (
                        <span className="chip chip-blue text-[10px]">Mặc định</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-auto">
                    {bom.is_active ? (
                      <span className="chip chip-green text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5" /> Hoạt động</span>
                    ) : (
                      <span className="chip chip-gray text-[10px]"><X className="w-3 h-3 mr-0.5" /> Không</span>
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
