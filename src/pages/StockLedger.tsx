import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BookOpen, Package, Search, ArrowDown, ArrowUp, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Download, Printer, Warehouse } from 'lucide-react';
import { cn } from '../lib/utils';
import { exportToCsv, printPage } from '../lib/export';

const PAGE_SIZES = [10, 20, 30, 50, 100];

export function StockLedger() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);
  const [hasMore, setHasMore] = useState(false);

  const [colSearch, setColSearch] = useState({ itemCode: '', warehouse: '', voucher: '' });
  const [sortCol, setSortCol] = useState<''|'date'|'itemCode'|'warehouse'|'incoming'|'outgoing'|'balance'>('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { fetchLedger(); }, []);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Stock Ledger Entry',
          fields: ['name', 'posting_date', 'posting_time', 'item_code', 'warehouse', 'incoming_rate', 'outgoing_rate', 'qty_after_transaction', 'incoming_qty', 'outgoing_qty', 'voucher_type', 'voucher_no'],
          order_by: 'posting_date desc, posting_time desc',
          limit: 10000,
        })
      });
      const data = await response.json();
      if (data.exception) throw new Error(data.exception);
      setLedger(data.message || []);
    } catch (e: any) {
      console.error('Lỗi fetch ledger:', e);
      setLedger([]);
    }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let result = ledger;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        (e.item_code || '').toLowerCase().includes(q) ||
        (e.warehouse || '').toLowerCase().includes(q) ||
        (e.voucher_no || '').toLowerCase().includes(q)
      );
    }

    if (colSearch.itemCode) {
      const q = colSearch.itemCode.toLowerCase();
      result = result.filter(e => (e.item_code || '').toLowerCase().includes(q));
    }
    if (colSearch.warehouse) {
      const q = colSearch.warehouse.toLowerCase();
      result = result.filter(e => (e.warehouse || '').toLowerCase().includes(q));
    }
    if (colSearch.voucher) {
      const q = colSearch.voucher.toLowerCase();
      result = result.filter(e => (e.voucher_no || '').toLowerCase().includes(q));
    }

    return result;
  }, [ledger, search, colSearch]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal: string|number = '', bVal: string|number = '';
      if (sortCol === 'date') { aVal = `${a.posting_date || ''} ${a.posting_time || ''}`; bVal = `${b.posting_date || ''} ${b.posting_time || ''}`; }
      if (sortCol === 'itemCode') { aVal = (a.item_code || '').toLowerCase(); bVal = (b.item_code || '').toLowerCase(); }
      if (sortCol === 'warehouse') { aVal = (a.warehouse || '').toLowerCase(); bVal = (b.warehouse || '').toLowerCase(); }
      if (sortCol === 'incoming') { aVal = Number(a.incoming_qty) || 0; bVal = Number(b.incoming_qty) || 0; }
      if (sortCol === 'outgoing') { aVal = Number(a.outgoing_qty) || 0; bVal = Number(b.outgoing_qty) || 0; }
      if (sortCol === 'balance') { aVal = Number(a.qty_after_transaction) || 0; bVal = Number(b.qty_after_transaction) || 0; }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const hasMoreFiltered = sorted.length > (page + 1) * pageSize;

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

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const handleColSearch = (col: keyof typeof colSearch, value: string) => {
    setColSearch(prev => ({ ...prev, [col]: value }));
    setPage(0);
  };

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(0);
  };

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
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

  const hasActiveFilters = colSearch.itemCode || colSearch.warehouse || colSearch.voucher;

  const clearAllFilters = () => {
    setColSearch({ itemCode: '', warehouse: '', voucher: '' });
    setSearch('');
    setSearchInput('');
    setSortCol('');
    setSortDir('desc');
    setPage(0);
  };

  const SortBtn = ({ col }: { col: typeof sortCol }) => (
    <button
      onClick={() => handleSort(col)}
      className={cn('p-0.5 rounded hover:bg-gray-100 transition-colors', sortCol === col ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')}
      title="Sắp xếp"
    >
      {sortCol === col && sortDir === 'desc' ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Sổ kho</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">
            {sorted.length > 0
              ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)} / ${sorted.length} dòng giao dịch`
              : `${sorted.length} dòng giao dịch`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sorted.length > 0 && (
            <>
              <button onClick={() => exportToCsv(sorted, [
                { key: 'posting_date', header: 'Ngày' },
                { key: 'posting_time', header: 'Giờ' },
                { key: 'item_code', header: 'Mã vật tư' },
                { key: 'warehouse', header: 'Kho' },
                { key: 'incoming_qty', header: 'Nhập' },
                { key: 'outgoing_qty', header: 'Xuất' },
                { key: 'qty_after_transaction', header: 'Tồn' },
                { key: 'voucher_type', header: 'Loại chứng từ' },
                { key: 'voucher_no', header: 'Số chứng từ' },
              ], `so-kho-${new Date().toISOString().split('T')[0]}`)} className="btn-secondary !rounded-xl !px-3 !py-2 !text-xs flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Xuất CSV
              </button>
              <button onClick={printPage} className="btn-ghost !rounded-xl !px-3 !py-2 !text-xs flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                In
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-2 animate-slide-up stagger-1">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field !rounded-xl !py-3 !pl-12 !pr-10"
            placeholder="Tìm mã vật tư, kho, số chứng từ..."
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 animate-slide-in">
          <span className="text-xs text-gray-400">Lọc:</span>
          {colSearch.itemCode && (
            <button onClick={() => handleColSearch('itemCode', '')} className="chip chip-purple !text-xs flex items-center gap-1">
              Mã VT: {colSearch.itemCode} <X className="w-3 h-3" />
            </button>
          )}
          {colSearch.warehouse && (
            <button onClick={() => handleColSearch('warehouse', '')} className="chip chip-purple !text-xs flex items-center gap-1">
              Kho: {colSearch.warehouse} <X className="w-3 h-3" />
            </button>
          )}
          {colSearch.voucher && (
            <button onClick={() => handleColSearch('voucher', '')} className="chip chip-purple !text-xs flex items-center gap-1">
              Chứng từ: {colSearch.voucher} <X className="w-3 h-3" />
            </button>
          )}
          <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-600 font-medium ml-1">
            Xóa tất cả
          </button>
        </div>
      )}

      {/* Table */}
      <div className="animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">{search || hasActiveFilters ? 'Không tìm thấy kết quả phù hợp.' : 'Không có dữ liệu sổ kho.'}</p>
            {(search || hasActiveFilters) && (
              <button onClick={clearAllFilters} className="btn-primary !rounded-xl !px-5 !py-2.5 !text-sm mt-4 inline-flex">
                Xóa bộ lọc
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
                      <th className="text-left min-w-[90px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Ngày</span>
                          <SortBtn col="date" />
                        </div>
                      </th>
                      <th className="text-left min-w-[120px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Mã VT</span>
                          <SortBtn col="itemCode" />
                        </div>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={colSearch.itemCode}
                            onChange={(e) => handleColSearch('itemCode', e.target.value)}
                            placeholder="Lọc..."
                            className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                          />
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left min-w-[130px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Kho</span>
                          <SortBtn col="warehouse" />
                        </div>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={colSearch.warehouse}
                            onChange={(e) => handleColSearch('warehouse', e.target.value)}
                            placeholder="Lọc..."
                            className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                          />
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left min-w-[130px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Chứng từ</span>
                          <SortBtn col="voucher" />
                        </div>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={colSearch.voucher}
                            onChange={(e) => handleColSearch('voucher', e.target.value)}
                            placeholder="Lọc..."
                            className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                          />
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-right min-w-[80px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>Nhập</span>
                          <SortBtn col="incoming" />
                        </div>
                      </th>
                      <th className="text-right min-w-[80px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>Xuất</span>
                          <SortBtn col="outgoing" />
                        </div>
                      </th>
                      <th className="text-right min-w-[90px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>Tồn</span>
                          <SortBtn col="balance" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((entry, idx) => (
                      <tr key={entry.name} className="animate-slide-up" style={{ animationDelay: `${idx * 10}ms` }}>
                        <td className="text-gray-500 text-xs whitespace-nowrap">
                          {entry.posting_date}
                          <span className="text-gray-300 ml-1">{entry.posting_time?.substring(0, 5)}</span>
                        </td>
                        <td className="font-medium text-blue-600 whitespace-nowrap">{entry.item_code || '—'}</td>
                        <td className="text-gray-400 italic text-xs">—</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate text-sm">{entry.warehouse || '—'}</span>
                          </div>
                        </td>
                        <td className="text-gray-500 text-xs truncate max-w-[130px]">{entry.voucher_no || '—'}</td>
                        <td className="text-right">
                          {entry.incoming_qty > 0 ? (
                            <span className="text-green-600 font-medium flex items-center justify-end gap-0.5">
                              <ArrowDown className="w-3 h-3" />
                              {entry.incoming_qty.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="text-right">
                          {entry.outgoing_qty > 0 ? (
                            <span className="text-red-600 font-medium flex items-center justify-end gap-0.5">
                              <ArrowUp className="w-3 h-3" />
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

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
                <button
                  onClick={() => handlePage(0)}
                  disabled={page === 0 || loading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page === 0 || loading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
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
                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={!hasMoreFiltered || loading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePage(totalPages - 1)}
                  disabled={!hasMoreFiltered || loading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
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
