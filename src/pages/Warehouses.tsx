import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Building2, ChevronRight } from 'lucide-react';

export function Warehouses() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const data = await erpService.getWarehouses();
      setWarehouses(data);
    } catch { setWarehouses([]); }
    finally { setLoading(false); }
  };

  const groups = warehouses.filter(w => w.is_group);
  const nonGroups = warehouses.filter(w => !w.is_group);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Kho hàng</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{nonGroups.length} kho • {groups.length} nhóm kho</p>
      </div>

      {/* List */}
      <div className="animate-slide-up stagger-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có kho hàng nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {warehouses.map((wh, i) => (
              <div key={wh.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    wh.is_group ? 'bg-gray-100' : 'bg-indigo-50'
                  }`}>
                    <Building2 className={`w-5 h-5 ${wh.is_group ? 'text-gray-400' : 'text-indigo-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{wh.warehouse_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{wh.name}</p>
                    <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-1">
                      {wh.company && (
                        <span className="chip chip-gray !text-[10px]">
                          <ChevronRight className="w-3 h-3 mr-0.5" />
                          {wh.company}
                        </span>
                      )}
                      {wh.is_group && (
                        <span className="chip chip-gray !text-[10px]">Nhóm kho</span>
                      )}
                    </div>
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
