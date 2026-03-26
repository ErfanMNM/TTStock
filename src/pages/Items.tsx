import React, { useState, useEffect, useRef } from 'react';
import { erpService } from '../services/api';
import { Search, Package, Image as ImageIcon, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Items() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async (searchTerm = '') => {
    setLoading(true);
    try {
      const data = await erpService.getItems(50, 0, searchTerm);
      setItems(data);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      fetchItems(value);
    }, 400);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    fetchItems();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Vật tư</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{items.length} vật tư</p>
        </div>
        <Link to="/items/new" className="btn-primary !rounded-xl !px-4 !py-2.5 !text-sm w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm mới
        </Link>
      </div>

      {/* Search Bar */}
      <div className="animate-slide-up stagger-1">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field !rounded-2xl !py-3.5 !pl-12 !pr-10"
            placeholder="Tìm kiếm vật tư..."
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">{search ? 'Không tìm thấy vật tư nào.' : 'Chưa có vật tư nào.'}</p>
            {!search && (
              <Link to="/items/new" className="btn-primary !rounded-xl !px-5 !py-2.5 !text-sm mt-4 inline-flex">
                <Plus className="w-4 h-4 mr-1.5" />
                Thêm vật tư đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((item, i) => (
              <Link
                key={item.name}
                to={`/items/${encodeURIComponent(item.name)}`}
                className="card p-3 flex items-center space-x-3 card-press animate-slide-up block"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={`https://erp.mte.vn${item.image}`} alt={item.item_name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.item_name}</p>
                    <span className="chip chip-green text-[10px] flex-shrink-0">{item.stock_uom}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{item.name} • {item.item_group}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
