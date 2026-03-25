import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/api';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NewTransfer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    stock_entry_type: 'Material Transfer',
    from_warehouse: '',
    to_warehouse: '',
    items: [{ item_code: '', qty: 1, s_warehouse: '', t_warehouse: '' }]
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [whs, itms] = await Promise.all([
          erpService.getWarehouses(),
          erpService.getItems(100)
        ]);
        setWarehouses(whs.filter((w: any) => !w.is_group));
        setItems(itms);
      } catch (err) {
        setError('Failed to load required data');
      }
    };
    loadData();
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item_code: '', qty: 1, s_warehouse: formData.from_warehouse, t_warehouse: formData.to_warehouse }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Format data for ERPNext
      const payload = {
        stock_entry_type: formData.stock_entry_type,
        from_warehouse: formData.from_warehouse || undefined,
        to_warehouse: formData.to_warehouse || undefined,
        items: formData.items.map(item => ({
          item_code: item.item_code,
          qty: item.qty,
          s_warehouse: formData.stock_entry_type === 'Material Receipt' ? undefined : (item.s_warehouse || formData.from_warehouse),
          t_warehouse: formData.stock_entry_type === 'Material Issue' ? undefined : (item.t_warehouse || formData.to_warehouse),
        }))
      };

      const result = await erpService.createStockEntry(payload);
      // Automatically submit if created successfully
      await erpService.submitStockEntry(result.name);
      navigate('/transfers');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create stock entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/transfers" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">New Stock Entry</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-6 sm:space-y-5 bg-white p-6 shadow sm:rounded-lg">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">General Details</h3>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
            <label htmlFor="stock_entry_type" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Entry Type
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <select
                id="stock_entry_type"
                className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                value={formData.stock_entry_type}
                onChange={(e) => setFormData({ ...formData, stock_entry_type: e.target.value })}
              >
                <option value="Material Transfer">Material Transfer</option>
                <option value="Material Receipt">Material Receipt</option>
                <option value="Material Issue">Material Issue</option>
              </select>
            </div>
          </div>

          {formData.stock_entry_type !== 'Material Receipt' && (
            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
              <label htmlFor="from_warehouse" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                Default Source Warehouse
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <select
                  id="from_warehouse"
                  className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  value={formData.from_warehouse}
                  onChange={(e) => setFormData({ ...formData, from_warehouse: e.target.value })}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.name} value={w.name}>{w.warehouse_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.stock_entry_type !== 'Material Issue' && (
            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
              <label htmlFor="to_warehouse" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                Default Target Warehouse
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <select
                  id="to_warehouse"
                  className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  value={formData.to_warehouse}
                  onChange={(e) => setFormData({ ...formData, to_warehouse: e.target.value })}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.name} value={w.name}>{w.warehouse_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 space-y-6 sm:space-y-5 bg-white p-6 shadow sm:rounded-lg mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Row
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Qty</th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <select
                        required
                        className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                        value={item.item_code}
                        onChange={(e) => handleItemChange(index, 'item_code', e.target.value)}
                      >
                        <option value="">Select Item</option>
                        {items.map(i => (
                          <option key={i.name} value={i.name}>{i.item_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-900"
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <Link
              to="/transfers"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Submit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
