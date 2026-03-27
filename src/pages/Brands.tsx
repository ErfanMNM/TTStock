import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Tag, CheckCircle } from 'lucide-react';

export function Brands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/resource/Brand`, {
        params: {
          fields: '["name", "brand"]',
          limit_page_length: 100,
        }
      });
      setBrands(response.data.data || []);
    } catch { setBrands([]); }
    finally { setLoading(false); }
  };

  const filtered = brands.filter(e => {
    if (filter === 'active') return true; // All brands from API are active
    return true;
  });

  const statusCounts = {
    all: brands.length,
    active: brands.length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Thương hiệu</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{brands.length} thương hiệu</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 animate-slide-up stagger-1">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'active', label: 'Hoạt động' },
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
              <Tag className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có thương hiệu nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((brand, i) => (
              <div key={brand.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-pink-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{brand.brand}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{brand.name}</p>
                  </div>
                  <div className="flex-shrink-0 ml-auto">
                    <span className="chip chip-green text-[10px]">
                      <CheckCircle className="w-3 h-3 mr-0.5" />
                      Hoạt động
                    </span>
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
