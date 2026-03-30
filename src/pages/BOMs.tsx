import React, { useState, useEffect, useMemo } from 'react';
import { erpService } from '../services/api';
import { FileText, CheckCircle, X, Search } from 'lucide-react';
import { cn } from '../lib/utils';

const PAGE_SIZES = [10, 20, 30, 50, 100];

export function BOMs() {
  const [boms, setBOMs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);
  const [colSearch, setColSearch] = useState({ name: '', item: '' });

  useEffect(() => { fetchBOMs(); }, []);

  const fetchBOMs = async () => {
    setLoading(true);
    try {
      const data = await erpService.getBOMs(1000);
      setBOMs(data);
    } catch { setBOMs([]); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let result = boms;
    if (filter === 'active') result = result.filter(e => e.is_active === 1 || e.docstatus === 1);
    else if (filter === 'inactive') result = result.filter(e => e.is_active === 0 && e.docstatus !== 1);
    if (colSearch.name) {
      const q = colSearch.name.toLowerCase();
      result = result.filter(e => (e.name || '').toLowerCase().includes(q));
    }
    if (colSearch.item) {
      const q = colSearch.item.toLowerCase();
      result = result.filter(e => (e.item_name || e.item || '').toLowerCase().includes(q));
    }
    return result;
  }, [boms, filter, colSearch]);

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
    all: boms.length,
    active: boms.filter(e => e.is_active === 1 || e.docstatus === 1).length,
    inactive: boms.filter(e => e.is_active === 0 && e.docstatus !== 1).length,
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

  const hasFilters = filter !== 'all' || colSearch.name || colSearch.item;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Định mức (BOM)</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">
            {filtered.length > 0 ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)} / ${filtered.length} BOM` : `${filtered.length} BOM`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 animate-slide-up stagger-1">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'active', label: 'Hoạt động' },
          { key: 'inactive', label: 'Không hoạt động' },
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
          <button onClick={() => { setFilter('all'); setColSearch({ name: '', item: '' }); setPage(0); }} className="text-xs text-red-500 hover:text-red-600 font-medium ml-1">
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
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Không tìm thấy BOM nào.</p>
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
                          <span>Mã BOM</span>
                          <div className="relative">
                            <input type="text" value={colSearch.name} onChange={(e) => handleColSearch('name', e.target.value)} placeholder="Lọc..." className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 placeholder:!text-gray-300" />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="text-left min-w-[160px]">
                        <div className="flex flex-col gap-1">
                          <span>Vật tư</span>
                          <div className="relative">
                            <input type="text" value={colSearch.item} onChange={(e) => handleColSearch('item', e.target.value)} placeholder="Lọc..." className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 placeholder:!text-gray-300" />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="text-right">Số lượng</th>
                      <th className="text-left">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((bom, i) => (
                      <tr key={bom.name} className="animate-slide-up" style={{ animationDelay: `${i * 10}ms` }}>
                        <td className="font-mono font-semibold text-blue-600">{bom.name}</td>
                        <td className="font-medium text-gray-900">{bom.item_name || bom.item}</td>
                        <td className="text-right text-gray-700">{bom.quantity} {bom.uom}</td>
                        <td>
                          {bom.is_active ? (
                            <span className={cn("flex items-center gap-1.5", bom.is_default ? "text-green-700" : "")}>
                              <span className="chip chip-green !text-xs"><CheckCircle className="w-3 h-3 mr-0.5" /> Hoạt động</span>
                              {bom.is_default && <span className="chip chip-blue !text-xs">Mặc định</span>}
                            </span>
                          ) : (
                            <span className="chip chip-gray !text-xs"><X className="w-3 h-3 mr-0.5" /> Không</span>
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
