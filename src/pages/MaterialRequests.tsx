import React, { useState, useEffect, useRef, useMemo } from 'react';
import { erpService } from '../services/api';
import { ClipboardList, Calendar, CheckCircle, Clock, Plus, Ban, Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const PAGE_SIZES = [10, 20, 30, 50, 100];

export function MaterialRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted'>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);
  const [colSearch, setColSearch] = useState({ name: '', type: '', date: '' });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await erpService.getMaterialRequests(1000);
      setRequests(data);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'Material Transfer': 'Điều chuyển',
      'Material Receipt': 'Nhập kho',
      'Purchase': 'Mua hàng',
      'Customer Provided': 'Khách cung cấp',
    };
    return labels[type] || type;
  };

  const filtered = useMemo(() => {
    let result = requests;
    if (filter === 'draft') result = result.filter(e => e.docstatus === 0);
    else if (filter === 'submitted') result = result.filter(e => e.docstatus === 1);
    if (colSearch.name) {
      const q = colSearch.name.toLowerCase();
      result = result.filter(e => (e.name || '').toLowerCase().includes(q));
    }
    if (colSearch.type) {
      const q = colSearch.type.toLowerCase();
      result = result.filter(e => getTypeLabel(e.material_request_type).toLowerCase().includes(q));
    }
    if (colSearch.date) {
      const q = colSearch.date.toLowerCase();
      result = result.filter(e => (e.transaction_date || '').includes(q));
    }
    return result;
  }, [requests, filter, colSearch]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const hasMore = filtered.length > page * pageSize + pageSize;

  const handleColSearch = (col: keyof typeof colSearch, value: string) => {
    setColSearch(prev => ({ ...prev, [col]: value }));
    setPage(0);
  };

  const handlePage = (pageNum: number) => {
    setPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const statusCounts = {
    all: requests.length,
    draft: requests.filter(e => e.docstatus === 0).length,
    submitted: requests.filter(e => e.docstatus === 1).length,
  };

  const totalPages = hasMore ? Math.ceil(filtered.length / pageSize) : page + 1;
  const pages: (number | string)[] = [];
  if (totalPages <= 7) { for (let i = 0; i < totalPages; i++) pages.push(i); }
  else {
    pages.push(0);
    if (page > 2) pages.push('...');
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages - 1);
  }

  const hasFilters = filter !== 'all' || colSearch.name || colSearch.type || colSearch.date;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Yêu cầu vật tư</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">
            {filtered.length > 0 ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)} / ${filtered.length} yêu cầu` : `${filtered.length} yêu cầu`}
          </p>
        </div>
        <Link to="/material-requests/new" className="btn-primary !rounded-xl !px-4 !py-2.5 !text-sm w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 mr-1.5" />
          Tạo mới
        </Link>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 animate-slide-up stagger-1">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'submitted', label: 'Đã duyệt' },
          { key: 'draft', label: 'Nháp' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key as typeof filter); setPage(0); }}
            className={cn("chip whitespace-nowrap transition-all", filter === tab.key ? "chip-blue shadow-sm" : "chip-gray")}
          >
            {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts]})
          </button>
        ))}
        {hasFilters && (
          <button onClick={() => { setFilter('all'); setColSearch({ name: '', type: '', date: '' }); setPage(0); }} className="text-xs text-red-500 hover:text-red-600 font-medium ml-1">
            Xóa lọc
          </button>
        )}
      </div>

      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Không tìm thấy yêu cầu nào.</p>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-left min-w-[160px]">
                        <div className="flex flex-col gap-1">
                          <span>Mã yêu cầu</span>
                          <div className="relative">
                            <input type="text" value={colSearch.name} onChange={(e) => handleColSearch('name', e.target.value)} placeholder="Lọc..." className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 placeholder:!text-gray-300" />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="text-left min-w-[140px]">
                        <div className="flex flex-col gap-1">
                          <span>Loại</span>
                          <div className="relative">
                            <input type="text" value={colSearch.type} onChange={(e) => handleColSearch('type', e.target.value)} placeholder="Lọc..." className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 placeholder:!text-gray-300" />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="text-left min-w-[120px]">
                        <div className="flex flex-col gap-1">
                          <span>Ngày</span>
                          <div className="relative">
                            <input type="text" value={colSearch.date} onChange={(e) => handleColSearch('date', e.target.value)} placeholder="..." className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 placeholder:!text-gray-300" />
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="text-left">Tiến độ</th>
                      <th className="text-left">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((req, i) => (
                      <tr key={req.name} className="animate-slide-up" style={{ animationDelay: `${i * 10}ms` }}>
                        <td className="font-mono font-semibold text-blue-600">{req.name}</td>
                        <td><span className="chip chip-blue !text-xs">{getTypeLabel(req.material_request_type)}</span></td>
                        <td className="text-sm text-gray-500">{req.transaction_date}</td>
                        <td>
                          {(req.per_received > 0 || req.per_ordered > 0) ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${req.per_received > 0 ? req.per_received : req.per_ordered}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{req.per_received > 0 ? req.per_received : req.per_ordered}%</span>
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td>
                          {req.docstatus === 1 ? (
                            <span className="chip chip-green !text-xs"><CheckCircle className="w-3 h-3 mr-0.5" /> Đã duyệt</span>
                          ) : req.docstatus === 0 ? (
                            <span className="chip chip-yellow !text-xs"><Clock className="w-3 h-3 mr-0.5" /> Nháp</span>
                          ) : (
                            <span className="chip chip-red !text-xs"><Ban className="w-3 h-3 mr-0.5" /> Đã hủy</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Hiển thị</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="input-field !rounded-lg !py-1.5 !px-2 !text-xs !w-16 !h-8 cursor-pointer">
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs text-gray-400">/ trang</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 mr-2">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)}</span>
                <button onClick={() => handlePage(0)} disabled={page === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><span className="text-xs font-bold">«</span></button>
                <button onClick={() => handlePage(page - 1)} disabled={page === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><span className="text-xs">‹</span></button>
                {pages.map((p, idx) =>
                  p === '...' ? <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span> : (
                    <button key={p} onClick={() => handlePage(p as number)} className={cn("w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors", p === page ? "bg-blue-500 text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50")}>
                      {(p as number) + 1}
                    </button>
                  )
                )}
                <button onClick={() => handlePage(page + 1)} disabled={!hasMore} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><span className="text-xs">›</span></button>
                <button onClick={() => handlePage(totalPages - 1)} disabled={!hasMore} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><span className="text-xs font-bold">»</span></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
