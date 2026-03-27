import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Ruler } from 'lucide-react';

export function UOMs() {
  const [uoms, setUOMs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUOMs(); }, []);

  const fetchUOMs = async () => {
    setLoading(true);
    try {
      const data = await erpService.getUOMs();
      setUOMs(data);
    } catch { setUOMs([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Đơn vị tính</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{uoms.length} đơn vị tính</p>
      </div>

      {/* List */}
      <div className="animate-slide-up stagger-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : uoms.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Ruler className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có đơn vị tính nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {uoms.map((uom, i) => (
              <div key={uom.name} className="card p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Ruler className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{uom.uom_name || uom.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{uom.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
