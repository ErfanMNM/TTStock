import React, { useState, useEffect, useRef, useMemo } from 'react';
import { erpService } from '../services/api';
import { Search, Package, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Download, X, Warehouse, Printer, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { exportToCsv, printPage } from '../lib/export';

const PAGE_SIZES = [10, 20, 30, 50, 100];

export function Stock() {
  const [stock, setStock] = useState<any[]>([]);
  const [allStock, setAllStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);

  // Column filters
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [colSearch, setColSearch] = useState({ code: '', name: '', group: '', warehouse: '' });

  // Column sort
  const [sortCol, setSortCol] = useState<''|'code'|'name'|'group'|'warehouse'>('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchStock = async () => {
    setLoading(true);
    try {
      const data = await erpService.getStockBalance('', '');
      setStock(data);
      setAllStock(data);
    } catch { setStock([]); setAllStock([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStock(); }, []);

  // Unique warehouse options
  const warehouses = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const bin of allStock) {
      if (bin.warehouse && !seen.has(bin.warehouse)) {
        seen.add(bin.warehouse);
        result.push(bin.warehouse);
      }
    }
    return result.sort();
  }, [allStock]);

  // Apply all filters client-side
  const filtered = useMemo(() => {
    let result = allStock;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        (b.item_code || '').toLowerCase().includes(q) ||
        (b.item_name || '').toLowerCase().includes(q) ||
        (b.warehouse || '').toLowerCase().includes(q)
      );
    }

    if (filterWarehouse) result = result.filter(b => b.warehouse === filterWarehouse);

    if (colSearch.code) {
      const q = colSearch.code.toLowerCase();
      result = result.filter(b => (b.item_code || '').toLowerCase().includes(q));
    }
    if (colSearch.name) {
      const q = colSearch.name.toLowerCase();
      result = result.filter(b => (b.item_name || '').toLowerCase().includes(q));
    }
    if (colSearch.group) {
      const q = colSearch.group.toLowerCase();
      result = result.filter(b => (b.item_group || '').toLowerCase().includes(q));
    }
    if (colSearch.warehouse) {
      const q = colSearch.warehouse.toLowerCase();
      result = result.filter(b => (b.warehouse || '').toLowerCase().includes(q));
    }

    return result;
  }, [allStock, search, filterWarehouse, colSearch]);

  // Apply sort
  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal = '', bVal = '';
      if (sortCol === 'code') { aVal = (a.item_code || '').toLowerCase(); bVal = (b.item_code || '').toLowerCase(); }
      if (sortCol === 'name') { aVal = (a.item_name || '').toLowerCase(); bVal = (b.item_name || '').toLowerCase(); }
      if (sortCol === 'group') { aVal = (a.item_group || '').toLowerCase(); bVal = (b.item_group || '').toLowerCase(); }
      if (sortCol === 'warehouse') { aVal = (a.warehouse || '').toLowerCase(); bVal = (b.warehouse || '').toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  // Paginate
  const paginated = useMemo(() => {
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const hasMoreFiltered = sorted.length > (page + 1) * pageSize;

  const handleExportCsv = () => {
    exportToCsv(filtered, [
      { key: 'item_code', header: 'Mã vật tư' },
      { key: 'item_name', header: 'Tên vật tư' },
      { key: 'item_group', header: 'Nhóm' },
      { key: 'warehouse', header: 'Kho' },
      { key: 'actual_qty', header: 'Tồn thực tế' },
    ], `ton-kho-${new Date().toISOString().split('T')[0]}`);
  };

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

  const hasActiveFilters = filterWarehouse || colSearch.code || colSearch.name || colSearch.group || colSearch.warehouse;

  const clearAllFilters = () => {
    setFilterWarehouse('');
    setColSearch({ code: '', name: '', group: '', warehouse: '' });
    setSearch('');
    setSearchInput('');
    setSortCol('');
    setSortDir('asc');
    setPage(0);
  };

  const totalQty = sorted.reduce((sum, b) => sum + (b.actual_qty || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tồn kho</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">
            Tổng: {totalQty.toLocaleString()} đơn vị · {sorted.length} dòng
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sorted.length > 0 && (
            <>
              <button onClick={handleExportCsv} className="btn-secondary !rounded-xl !px-3 !py-2 !text-xs flex items-center gap-1.5">
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

      {/* Top Filters */}
      <div className="flex flex-col lg:flex-row gap-2 animate-slide-up stagger-1">
        {/* Global search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field !rounded-xl !py-3 !pl-12 !pr-10"
            placeholder="Tìm mã vật tư, tên, kho..."
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Warehouse filter */}
        <div className="relative sm:w-48 flex-shrink-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={filterWarehouse}
            onChange={(e) => { setFilterWarehouse(e.target.value); setPage(0); }}
            className="input-field !rounded-xl !bg-gray-50 !pl-10 !pr-10 appearance-none cursor-pointer !text-sm !h-12"
          >
            <option value="">Tất cả kho</option>
            {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 animate-slide-in">
          <span className="text-xs text-gray-400">Lọc:</span>
          {colSearch.code && (
            <button onClick={() => handleColSearch('code', '')} className="chip chip-purple !text-xs flex items-center gap-1">
              Mã: {colSearch.code} <X className="w-3 h-3" />
            </button>
          )}
          {colSearch.name && (
            <button onClick={() => handleColSearch('name', '')} className="chip chip-purple !text-xs flex items-center gap-1">
              Tên: {colSearch.name} <X className="w-3 h-3" />
            </button>
          )}
          {colSearch.group && (
            <button onClick={() => handleColSearch('group', '')} className="chip chip-purple !text-xs flex items-center gap-1">
              Nhóm: {colSearch.group} <X className="w-3 h-3" />
            </button>
          )}
          {colSearch.warehouse && (
            <button onClick={() => handleColSearch('warehouse', '')} className="chip chip-purple !text-xs flex items-center gap-1">
              Kho: {colSearch.warehouse} <X className="w-3 h-3" />
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
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">{search || hasActiveFilters ? 'Không tìm thấy kết quả phù hợp.' : 'Không có dữ liệu tồn kho.'}</p>
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
                      <th className="text-center w-10">STT</th>
                      <th className="text-left min-w-[140px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Mã vật tư</span>
                          <button onClick={() => handleSort('code')} className={cn('p-0.5 rounded hover:bg-gray-100 transition-colors', sortCol === 'code' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')} title="Sắp xếp A-Z">
                            {sortCol === 'code' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={colSearch.code}
                            onChange={(e) => handleColSearch('code', e.target.value)}
                            placeholder="Lọc..."
                            className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                          />
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left min-w-[200px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Tên vật tư</span>
                          <button onClick={() => handleSort('name')} className={cn('p-0.5 rounded hover:bg-gray-100 transition-colors', sortCol === 'name' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')} title="Sắp xếp A-Z">
                            {sortCol === 'name' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={colSearch.name}
                            onChange={(e) => handleColSearch('name', e.target.value)}
                            placeholder="Lọc..."
                            className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                          />
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left min-w-[140px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Nhóm</span>
                          <button onClick={() => handleSort('group')} className={cn('p-0.5 rounded hover:bg-gray-100 transition-colors', sortCol === 'group' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')} title="Sắp xếp A-Z">
                            {sortCol === 'group' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={colSearch.group}
                            onChange={(e) => handleColSearch('group', e.target.value)}
                            placeholder="Lọc..."
                            className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                          />
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left min-w-[140px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>Kho</span>
                          <button onClick={() => handleSort('warehouse')} className={cn('p-0.5 rounded hover:bg-gray-100 transition-colors', sortCol === 'warehouse' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')} title="Sắp xếp A-Z">
                            {sortCol === 'warehouse' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                          </button>
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
                      <th className="text-right min-w-[100px]">
                        <div className="flex flex-col gap-1 items-end">
                          <span>Tồn thực tế</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((bin, idx) => (
                      <tr key={bin.name} className="animate-slide-up" style={{ animationDelay: `${idx * 10}ms` }}>
                        <td className="text-center text-gray-400 text-xs">
                          {page * pageSize + idx + 1}
                        </td>
                        <td className="font-medium text-blue-600">{bin.item_code || '—'}</td>
                        <td className="text-gray-700">{bin.item_name || '—'}</td>
                        <td>
                          <span className="chip chip-gray !text-xs">{bin.item_group || '—'}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{bin.warehouse || '—'}</span>
                          </div>
                        </td>
                        <td className="text-right font-semibold text-blue-600">
                          {bin.actual_qty?.toLocaleString() || 0}
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