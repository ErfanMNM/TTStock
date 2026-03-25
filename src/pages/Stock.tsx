import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Warehouse, Package, Filter } from 'lucide-react';

export function Stock() {
  const [stock, setStock] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const whs = await erpService.getWarehouses();
        setWarehouses(whs.filter((w: any) => !w.is_group));
        await fetchStock();
      } catch (err) {
        setError('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchStock = async (warehouse = '') => {
    setLoading(true);
    try {
      const data = await erpService.getStockBalance(warehouse);
      setStock(data);
    } catch (err) {
      setError('Failed to fetch stock balance');
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedWarehouse(val);
    fetchStock(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Stock Balance</h1>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedWarehouse}
            onChange={handleWarehouseChange}
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.name} value={w.name}>{w.warehouse_name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading stock...</div>
        ) : stock.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No stock found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Qty
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stock.map((bin) => (
                  <tr key={bin.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{bin.item_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Warehouse className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-500">{bin.warehouse}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {bin.actual_qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {bin.reserved_qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
