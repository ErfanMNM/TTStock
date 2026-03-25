import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Search, Package, Image as ImageIcon } from 'lucide-react';

export function Items() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async (searchTerm = '') => {
    setLoading(true);
    try {
      const data = await erpService.getItems(50, 0, searchTerm);
      setItems(data);
    } catch (err: any) {
      setError('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(search);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        <form onSubmit={handleSearch} className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No items found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.name}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6 flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={`https://erp.mte.vn${item.image}`} alt={item.item_name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">{item.item_name}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {item.stock_uom}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <Package className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {item.name}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>{item.item_group}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
