import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookOpen, Package, Search, ArrowDown, ArrowUp, Minus } from 'lucide-react';

export function StockLedger() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLedger(); }, []);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/resource/Stock Ledger Entry`, {
        params: {
          fields: '["name", "posting_date", "posting_time", "item_code", "item_name", "warehouse", "incoming_rate", "outgoing_rate", "qty_after_transaction", "incoming_qty", "outgoing_qty", "voucher_type", "voucher_no"]',
          order_by: 'posting_date desc, posting_time desc',
          limit_page_length: 100,
        }
      });
      setLedger(response.data.data || []);
    } catch { setLedger([]); }
    finally { setLoading(false); }
  };

  const filtered = ledger.filter(e =>
    e.item_code?.toLowerCase().includes(search.toLowerCase()) ||
    e.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.warehouse?.toLowerCase().includes(search.toLowerCase()) ||
    e.voucher_no?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Sổ kho</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{filtered.length} dòng giao dịch</p>
      </div>

      {/* Search */}
      <div className="animate-slide-up stagger-1">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !rounded-2xl !py-3.5 !pl-12"
            placeholder="Tìm mã vật tư, kho, số chứng từ..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Không có dữ liệu sổ kho.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-left">Ngày</th>
                    <th className="text-left">Mã VT</th>
                    <th className="text-left">Tên VT</th>
                    <th className="text-left">Kho</th>
                    <th className="text-right">Nhập</th>
                    <th className="text-right">Xuất</th>
                    <th className="text-right">Tồn</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.name}>
                      <td className="text-gray-500">{entry.posting_date}</td>
                      <td className="font-medium">{entry.item_code}</td>
                      <td className="text-gray-600 truncate max-w-[180px]">{entry.item_name || '—'}</td>
                      <td>
                        <span className="text-xs text-gray-600 truncate block max-w-[140px]">{entry.warehouse || '—'}</span>
                      </td>
                      <td className="text-right">
                        {entry.incoming_qty > 0 ? (
                          <span className="text-green-600 font-medium flex items-center justify-end">
                            <ArrowDown className="w-3 h-3 mr-0.5" />
                            {entry.incoming_qty.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        {entry.outgoing_qty > 0 ? (
                          <span className="text-red-600 font-medium flex items-center justify-end">
                            <ArrowUp className="w-3 h-3 mr-0.5" />
                            {entry.outgoing_qty.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="text-right font-semibold text-blue-600">
                        {entry.qty_after_transaction?.toLocaleString() ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
