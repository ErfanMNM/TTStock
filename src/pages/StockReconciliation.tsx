import React, { useState, useEffect, useRef, useMemo } from 'react';
import { erpService } from '../services/api';
import { Search, Scale, Plus, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Printer, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { exportToCsv, printPage } from '../lib/export';

const PAGE_SIZES = [10, 20, 30, 50, 100];

export function StockReconciliation() {
  const navigate = useNavigate();
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);
  const [sortCol, setSortCol] = useState<'date'|'name'|'purpose'>('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const data = await erpService.getStockReconciliations(1000, 0, '');
      setReconciliations(data);
    } catch { setReconciliations([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReconciliations(); }, []);

  const filtered = useMemo(() => {
    if (!search) return reconciliations;
    const q = search.toLowerCase();
    return reconciliations.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.purpose || '').toLowerCase().includes(q)
    );
  }, [reconciliations, search]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal = '', bVal = '';
      if (sortCol === 'name') { aVal = (a.name || '').toLowerCase(); bVal = (b.name || '').toLowerCase(); }
      if (sortCol === 'date') { aVal = (a.posting_date || ''); bVal = (b.posting_date || ''); }
      if (sortCol === 'purpose') { aVal = (a.purpose || '').toLowerCase(); bVal = (b.purpose || '').toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const hasMore = sorted.length > (page + 1) * pageSize;

  const handleSearch = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, 400);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(0);
  };

  const handlePage = (pageNum: number) => {
    setPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(0);
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      'Stock Reconciliation': 'Đối soát',
      'Stock Loss': 'Mất hàng',
      'Stock Reconciliation on Opening': 'Đối soát mở đầu',
    };
    return labels[purpose] || purpose;
  };

  const totalPages = hasMore ? Math.ceil(sorted.length / pageSize) : page + 1;
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 2) pages.push('...');
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages - 1);
  }

  const draftCount = reconciliations.filter(e => e.docstatus === 0).length;
  const submittedCount = reconciliations.filter(e => e.docstatus === 1).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Đối soát tồn kho</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">
            {sorted.length > 0
              ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)} / ${sorted.length} phiếu`
              : `${sorted.length} phiếu`}
            {draftCount > 0 && <span className="ml-1 text-yellow-500">• {draftCount} nháp</span>}
            {submittedCount > 0 && <span className="ml-1 text-green-500">• {submittedCount} đã duyệt</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sorted.length > 0 && (
            <>
              <button onClick={() => exportToCsv(sorted, [
                { key: 'name', header: 'Mã phiếu' },
                { key: 'purpose', header: 'Loại' },
                { key: 'posting_date', header: 'Ngày' },
                { key: 'docstatus', header: 'Trạng thái' },
              ], `doi-soat-ton-kho-${new Date().toISOString().split('T')[0]}`)} className="btn-secondary !rounded-xl !px-3 !py-2 !text-xs flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Xuất CSV
              </button>
              <button onClick={printPage} className="btn-ghost !rounded-xl !px-3 !py-2 !text-xs flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                In
              </button>
            </>
          )}
          <button onClick={() => navigate('/stock-reconciliation/new')} className="btn-primary !rounded-xl !px-4 !py-2.5 !text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Tạo mới
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="animate-slide-up stagger-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field !rounded-xl !py-3 !pl-12 !pr-10"
            placeholder="Tìm mã phiếu, loại..."
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Scale className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">{search ? 'Không tìm thấy phiếu nào phù hợp.' : 'Chưa có phiếu đối soát nào.'}</p>
            {search && (
              <button onClick={clearSearch} className="btn-primary !rounded-xl !px-5 !py-2.5 !text-sm mt-4 inline-flex">
                Xóa tìm kiếm
              </button>
            )}
            {!search && (
              <button onClick={() => navigate('/stock-reconciliation/new')} className="btn-primary !rounded-xl !px-5 !py-2.5 !text-sm mt-4 inline-flex">
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo phiếu đối soát
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-center w-10">STT</th>
                      <th className="text-left min-w-[180px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Mã phiếu</span>
                          <button onClick={() => handleSort('name')} className={cn('p-0.5 rounded hover:bg-gray-100 transition-colors', sortCol === 'name' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')}>
                            {sortCol === 'name' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </th>
                      <th className="text-left min-w-[140px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Loại</span>
                          <button onClick={() => handleSort('purpose')} className={cn('p-0.5 rounded hover:bg-gray-100 transition-colors', sortCol === 'purpose' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')}>
                            {sortCol === 'purpose' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </th>
                      <th className="text-left min-w-[120px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Ngày</span>
                          <button onClick={() => handleSort('date')} className={cn('p-0.5 rounded hover:bg-gray-100 transition-colors', sortCol === 'date' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')}>
                            {sortCol === 'date' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </th>
                      <th className="text-center w-28">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((item, i) => (
                      <tr
                        key={item.name}
                        className="cursor-pointer animate-slide-up hover:bg-blue-50/50"
                        style={{ animationDelay: `${i * 10}ms` }}
                        onClick={() => navigate(`/stock-reconciliation/${encodeURIComponent(item.name)}`)}
                      >
                        <td className="text-center text-gray-400 text-xs">{page * pageSize + i + 1}</td>
                        <td className="font-mono font-semibold text-blue-600">{item.name}</td>
                        <td>
                          <span className="chip chip-blue !text-xs">{getPurposeLabel(item.purpose)}</span>
                        </td>
                        <td className="text-gray-600">{item.posting_date}</td>
                        <td className="text-center">
                          {item.docstatus === 1 ? (
                            <span className="chip chip-green !text-xs">Đã duyệt</span>
                          ) : item.docstatus === 0 ? (
                            <span className="chip chip-yellow !text-xs">Nháp</span>
                          ) : (
                            <span className="chip chip-red !text-xs">Đã hủy</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  className="input-field !rounded-lg !py-1.5 !px-2 !text-xs !w-16 !h-8 cursor-pointer"
                >
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs text-gray-400">/ trang</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 mr-2">
                  {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)}
                </span>
                <button onClick={() => handlePage(0)} disabled={page === 0 || loading} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button onClick={() => handlePage(page - 1)} disabled={page === 0 || loading} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pages.map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePage(p as number)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                        p === page
                          ? "bg-blue-500 text-white shadow-sm"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      {(p as number) + 1}
                    </button>
                  )
                )}

                <button onClick={() => handlePage(page + 1)} disabled={!hasMore || loading} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => handlePage(totalPages - 1)} disabled={!hasMore || loading} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
