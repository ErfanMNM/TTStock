import React, { useState, useEffect, useRef, useMemo } from 'react';
import { erpService } from '../services/api';
import { Search, Package, Plus, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Image as ImageIcon, Filter, ChevronDown, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { exportToCsv, printPage } from '../lib/export';

const PAGE_SIZES = [10, 20, 30, 50, 100];

export function Items() {
  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);
  const [hasMore, setHasMore] = useState(false);

  // Column filters
  const [filterGroup, setFilterGroup] = useState('');
  const [filterUom, setFilterUom] = useState('');
  const [colSearch, setColSearch] = useState({ code: '', name: '', group: '', uom: '' });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch all items once for filter options
  const fetchAllItems = async () => {
    try {
      const data = await erpService.getItems(1000, 0, '');
      setAllItems(data);
    } catch { setAllItems([]); }
  };

  const fetchItems = async (searchTerm = '', pageNum = 0, size = pageSize) => {
    setLoading(true);
    try {
      const data = await erpService.getItems(size, pageNum * size, searchTerm);
      setItems(data);
      setHasMore(data.length === size);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchItems('', 0);
    fetchAllItems();
  }, []);

  // Unique filter options
  const groups = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of allItems) {
      if (item.item_group && !seen.has(item.item_group)) {
        seen.add(item.item_group);
        result.push(item.item_group);
      }
    }
    return result.sort();
  }, [allItems]);

  const uoms = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of allItems) {
      if (item.stock_uom && !seen.has(item.stock_uom)) {
        seen.add(item.stock_uom);
        result.push(item.stock_uom);
      }
    }
    return result.sort();
  }, [allItems]);

  // Apply all filters client-side
  const filtered = useMemo(() => {
    let result = allItems;

    // Global search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.item_name || '').toLowerCase().includes(q)
      );
    }

    // Column filters
    if (filterGroup) result = result.filter(i => i.item_group === filterGroup);
    if (filterUom) result = result.filter(i => i.stock_uom === filterUom);

    // Per-column search
    if (colSearch.code) {
      const q = colSearch.code.toLowerCase();
      result = result.filter(i => (i.name || '').toLowerCase().includes(q));
    }
    if (colSearch.name) {
      const q = colSearch.name.toLowerCase();
      result = result.filter(i => (i.item_name || '').toLowerCase().includes(q));
    }
    if (colSearch.group) {
      const q = colSearch.group.toLowerCase();
      result = result.filter(i => (i.item_group || '').toLowerCase().includes(q));
    }
    if (colSearch.uom) {
      const q = colSearch.uom.toLowerCase();
      result = result.filter(i => (i.stock_uom || '').toLowerCase().includes(q));
    }

    return result;
  }, [allItems, search, filterGroup, filterUom, colSearch]);

  // Paginate from filtered results
  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const hasMoreFiltered = filtered.length > page * pageSize + pageSize;

  const handleExportCsv = () => {
    exportToCsv(filtered, [
      { key: 'name', header: 'Mã vật tư' },
      { key: 'item_name', header: 'Tên vật tư' },
      { key: 'item_group', header: 'Nhóm vật tư' },
      { key: 'stock_uom', header: 'Đơn vị tính' },
    ], `danh-sach-vat-tu-${new Date().toISOString().split('T')[0]}`);
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

  const totalPages = hasMoreFiltered ? Math.ceil(filtered.length / pageSize) : page + 1;
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

  const hasActiveFilters = filterGroup || filterUom || colSearch.code || colSearch.name || colSearch.group || colSearch.uom;

  const clearAllFilters = () => {
    setFilterGroup('');
    setFilterUom('');
    setColSearch({ code: '', name: '', group: '', uom: '' });
    setSearch('');
    setSearchInput('');
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Vật tư</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-0.5">
            {filtered.length > 0
              ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)} / ${filtered.length} vật tư`
              : `${filtered.length} vật tư`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
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
          <Link to="/items/new" className="btn-primary !rounded-xl !px-4 !py-2.5 !text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Thêm mới
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col lg:flex-row gap-2 animate-slide-up stagger-1">
        {/* Global search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field !rounded-xl !py-3 !pl-12 !pr-10"
            placeholder="Tìm mã hoặc tên vật tư..."
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Group filter */}
        <div className="relative sm:w-48 flex-shrink-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={filterGroup}
            onChange={(e) => { setFilterGroup(e.target.value); setPage(0); }}
            className="input-field !rounded-xl !bg-gray-50 !pl-10 !pr-10 appearance-none cursor-pointer !text-sm !h-12"
          >
            <option value="">Tất cả nhóm</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* UOM filter */}
        <div className="relative sm:w-36 flex-shrink-0">
          <select
            value={filterUom}
            onChange={(e) => { setFilterUom(e.target.value); setPage(0); }}
            className="input-field !rounded-xl !bg-gray-50 !py-3 !px-3 appearance-none cursor-pointer !text-sm !h-12"
          >
            <option value="">Tất cả ĐVT</option>
            {uoms.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none !mr-1" />
        </div>
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 animate-slide-in">
          <span className="text-xs text-gray-400">Lọc:</span>
          {filterGroup && (
            <button onClick={() => setFilterGroup('')} className="chip chip-blue !text-xs flex items-center gap-1">
              Nhóm: {filterGroup} <X className="w-3 h-3" />
            </button>
          )}
          {filterUom && (
            <button onClick={() => setFilterUom('')} className="chip chip-green !text-xs flex items-center gap-1">
              ĐVT: {filterUom} <X className="w-3 h-3" />
            </button>
          )}
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
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">{search || hasActiveFilters ? 'Không tìm thấy vật tư nào phù hợp.' : 'Chưa có vật tư nào.'}</p>
            {(search || hasActiveFilters) && (
              <button onClick={clearAllFilters} className="btn-primary !rounded-xl !px-5 !py-2.5 !text-sm mt-4 inline-flex">
                Xóa bộ lọc
              </button>
            )}
            {!search && !hasActiveFilters && (
              <Link to="/items/new" className="btn-primary !rounded-xl !px-5 !py-2.5 !text-sm mt-4 inline-flex">
                <Plus className="w-4 h-4 mr-1.5" />
                Thêm vật tư đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-14"></th>
                      <th className="text-left min-w-[140px]">
                        <div className="flex flex-col gap-1">
                          <span>Mã vật tư</span>
                          <div className="relative">
                            <input
                              type="text"
                              value={colSearch.code}
                              onChange={(e) => handleColSearch('code', e.target.value)}
                              placeholder="Lọc..."
                              className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                            />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="text-left min-w-[200px]">
                        <div className="flex flex-col gap-1">
                          <span>Tên vật tư</span>
                          <div className="relative">
                            <input
                              type="text"
                              value={colSearch.name}
                              onChange={(e) => handleColSearch('name', e.target.value)}
                              placeholder="Lọc..."
                              className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                            />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="text-left min-w-[140px]">
                        <div className="flex flex-col gap-1">
                          <span>Nhóm</span>
                          <div className="relative">
                            <input
                              type="text"
                              value={colSearch.group}
                              onChange={(e) => handleColSearch('group', e.target.value)}
                              placeholder="Lọc..."
                              className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                            />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                      <th className="text-center min-w-[80px]">
                        <div className="flex flex-col gap-1 items-center">
                          <span>Đơn vị</span>
                          <div className="relative w-full max-w-[80px]">
                            <input
                              type="text"
                              value={colSearch.uom}
                              onChange={(e) => handleColSearch('uom', e.target.value)}
                              placeholder="..."
                              className="w-full !text-xs !py-1.5 !pl-7 !pr-2 !rounded-lg !bg-gray-50 !border-gray-200 focus:!border-blue-400 focus:!ring-1 focus:!ring-blue-100 placeholder:!text-gray-300"
                            />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((item, i) => (
                      <tr
                        key={item.name}
                        className="group cursor-pointer animate-slide-up"
                        style={{ animationDelay: `${i * 10}ms` }}
                        onClick={() => window.location.href = `/items/${encodeURIComponent(item.name)}`}
                      >
                        <td className="w-14">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.image ? (
                              <img src={`https://erp.mte.vn${item.image}`} alt={item.item_name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                        </td>
                        <td className="font-mono font-semibold text-blue-600">{item.name}</td>
                        <td className="font-medium text-gray-900 max-w-[240px] truncate">{item.item_name}</td>
                        <td>
                          <span className="chip chip-gray !text-xs">{item.item_group || '—'}</span>
                        </td>
                        <td className="text-center">
                          <span className="chip chip-green !text-xs">{item.stock_uom || '—'}</span>
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
                  {PAGE_SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-400">/ trang</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 mr-2">
                  {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)}
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
