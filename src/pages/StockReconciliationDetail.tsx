import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { erpService } from '../services/api';
import { ArrowLeft, CheckCircle, Clock, Ban, Scale, Calendar, Printer, Loader2, User, Package, Search, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';

export function StockReconciliationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('CÔNG TY');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creator, setCreator] = useState<any>(null);
  const [approver, setApprover] = useState<any>(null);

  // Table features
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortCol, setSortCol] = useState<'code'|'name'|'current'|'actual'|'diff'>('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(0);
  };

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      (i.item_code || '').toLowerCase().includes(q) ||
      (i.item_name || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal = 0, bVal = 0;
      if (sortCol === 'code') {
        aVal = (a.item_code || '').toLowerCase().charCodeAt(0);
        bVal = (b.item_code || '').toLowerCase().charCodeAt(0);
      }
      if (sortCol === 'name') {
        aVal = (a.item_name || '').toLowerCase().charCodeAt(0);
        bVal = (b.item_name || '').toLowerCase().charCodeAt(0);
      }
      if (sortCol === 'current') { aVal = a.current_qty || 0; bVal = b.current_qty || 0; }
      if (sortCol === 'actual') { aVal = a.qty || 0; bVal = b.qty || 0; }
      if (sortCol === 'diff') { aVal = (a.qty || 0) - (a.current_qty || 0); bVal = (b.qty || 0) - (b.current_qty || 0); }
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

  const totalDiff = useMemo(() => {
    return sorted.reduce((sum, i) => sum + ((i.qty || 0) - (i.current_qty || 0)), 0);
  }, [sorted]);

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

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [detailData, itemsData, companyData] = await Promise.all([
          erpService.getStockReconciliationDetails(id),
          erpService.getStockReconciliationItems(id),
          erpService.getCompany(),
        ]);
        setEntry(detailData);
        setItems(itemsData);
        if (companyData?.company_name) {
          setCompanyName(String(companyData.company_name).toUpperCase());
        }

        const [creatorData, approverData] = await Promise.all([
          detailData?.owner ? erpService.getUserByName(detailData.owner) : null,
          detailData?.modified_by && detailData.modified_by !== detailData?.owner
            ? erpService.getUserByName(detailData.modified_by)
            : null,
        ]);
        setCreator(creatorData);
        setApprover(approverData);
      } catch (err) {
        console.error('Lỗi tải chi tiết:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      'Stock Reconciliation': 'Đối soát',
      'Stock Loss': 'Mất hàng',
      'Stock Reconciliation on Opening': 'Đối soát mở đầu',
    };
    return labels[purpose] || purpose;
  };

  const handleSubmit = async () => {
    if (!entry?.name || submitting) return;
    if (!confirm(`Duyệt phiếu "${entry.name}"?\nSau khi duyệt sẽ không thể chỉnh sửa.`)) return;
    setSubmitting(true);
    try {
      await erpService.submitStockReconciliation(entry.name);
      const detailData = await erpService.getStockReconciliationDetails(entry.name);
      setEntry(detailData);
    } catch (err: any) {
      alert(`Lỗi duyệt phiếu: ${err?.response?.data?.message || err?.message || 'Không rõ lỗi'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500">Không tìm thấy phiếu này.</p>
        <button onClick={() => navigate('/stock-reconciliation')} className="btn-primary !rounded-xl mt-4">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/stock-reconciliation')} className="btn-ghost !rounded-xl !p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{entry.name}</h1>
            {entry.docstatus === 1 ? (
              <span className="chip chip-green"><CheckCircle className="w-3.5 h-3.5 mr-0.5" /> Đã duyệt</span>
            ) : entry.docstatus === 0 ? (
              <span className="chip chip-yellow"><Clock className="w-3.5 h-3.5 mr-0.5" /> Nháp</span>
            ) : (
              <span className="chip chip-red"><Ban className="w-3.5 h-3.5 mr-0.5" /> Đã hủy</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{getPurposeLabel(entry.purpose)}</p>
        </div>
        <div className="flex items-center gap-2">
          {entry.docstatus === 0 && (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary !rounded-xl !px-3 !py-2 !text-xs flex items-center gap-1.5">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              {submitting ? 'Đang duyệt...' : 'Duyệt phiếu'}
            </button>
          )}
          <button onClick={() => window.print()} className="btn-secondary !rounded-xl !px-3 !py-2 !text-xs flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" />
            In phiếu
          </button>
        </div>
      </div>

      {/* ── Web View ── */}
      <div className="space-y-4">
        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Ngày</p>
              <p className="text-sm font-semibold text-gray-900">{entry.posting_date}</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Scale className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Loại</p>
              <p className="text-sm font-semibold text-gray-900">{getPurposeLabel(entry.purpose)}</p>
            </div>
          </div>
          {creator && (
            <div className="card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Người tạo</p>
                <p className="text-sm font-semibold text-gray-900">{creator.full_name || creator.name}</p>
              </div>
            </div>
          )}
          {approver && (
            <div className="card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Người duyệt</p>
                <p className="text-sm font-semibold text-gray-900">{approver.full_name || approver.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Items table */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              Chi tiết vật tư ({sorted.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="input-field !rounded-lg !py-2 !pl-9 !pr-8 !text-xs !w-52"
                placeholder="Tìm mã, tên..."
              />
              {searchInput && (
                <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300">
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-center w-10">STT</th>
                  <th className="text-left min-w-[160px]">
                    <div className="flex items-center gap-1">
                      <span>Mã vật tư</span>
                      <button onClick={() => handleSort('code')} className={cn('p-0.5 rounded hover:bg-gray-100', sortCol === 'code' ? 'text-blue-500' : 'text-gray-400')}>
                        {sortCol === 'code' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </th>
                  <th className="text-left min-w-[200px]">
                    <div className="flex items-center gap-1">
                      <span>Tên vật tư</span>
                      <button onClick={() => handleSort('name')} className={cn('p-0.5 rounded hover:bg-gray-100', sortCol === 'name' ? 'text-blue-500' : 'text-gray-400')}>
                        {sortCol === 'name' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </th>
                  <th className="text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>Tồn HT</span>
                      <button onClick={() => handleSort('current')} className={cn('p-0.5 rounded hover:bg-gray-100', sortCol === 'current' ? 'text-blue-500' : 'text-gray-400')}>
                        {sortCol === 'current' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </th>
                  <th className="text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>Thực tế</span>
                      <button onClick={() => handleSort('actual')} className={cn('p-0.5 rounded hover:bg-gray-100', sortCol === 'actual' ? 'text-blue-500' : 'text-gray-400')}>
                        {sortCol === 'actual' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </th>
                  <th className="text-right min-w-[100px] pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <span>Chênh</span>
                      <button onClick={() => handleSort('diff')} className={cn('p-0.5 rounded hover:bg-gray-100', sortCol === 'diff' ? 'text-blue-500' : 'text-gray-400')}>
                        {sortCol === 'diff' && sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any, idx: number) => {
                  const current = item.qty || 0;
                  const systemQty = item.current_qty || 0;
                  const diff = current - systemQty;
                  return (
                    <tr key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 10}ms` }}>
                      <td className="text-center text-gray-400 text-xs">{page * pageSize + idx + 1}</td>
                      <td className="font-mono font-semibold text-blue-600">{item.item_code}</td>
                      <td className="font-medium text-gray-900">{item.item_name || item.item_code}</td>
                      <td className="text-right text-gray-500">{systemQty.toLocaleString('vi-VN')}</td>
                      <td className="text-right font-semibold text-gray-900">{current.toLocaleString('vi-VN')}</td>
                      <td className={`text-right font-bold pr-4 ${
                        diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-8 text-sm">{search ? 'Không tìm thấy vật tư nào.' : 'Không có dữ liệu vật tư.'}</td>
                  </tr>
                )}
              </tbody>
              {sorted.length > 0 && (
                <tfoot>
                  <tr className="!bg-blue-50 font-semibold">
                    <td colSpan={3} className="text-right">Tổng cộng</td>
                    <td className="text-right font-bold text-blue-700">{sorted.reduce((s, i) => s + (i.current_qty || 0), 0).toLocaleString('vi-VN')}</td>
                    <td className="text-right font-bold text-blue-700">{sorted.reduce((s, i) => s + (i.qty || 0), 0).toLocaleString('vi-VN')}</td>
                    <td className={`text-right font-bold text-blue-700 pr-4 ${
                      totalDiff > 0 ? 'text-green-700' : totalDiff < 0 ? 'text-red-700' : ''
                    }`}>
                      {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {sorted.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 px-4 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  className="input-field !rounded-lg !py-1.5 !px-2 !text-xs !w-16 !h-8 cursor-pointer"
                >
                  {[10, 20, 30, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs text-gray-400">/ trang</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 mr-2">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)}</span>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {pages.map((p, idx) =>
                  p === '...' ? <span key={`e-${idx}`} className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs">…</span> : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={cn("w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                        p === page ? "bg-blue-500 text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      {(p as number) + 1}
                    </button>
                  )
                )}
                <button onClick={() => setPage(p => p + 1)} disabled={!hasMore} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Remarks */}
        {entry.remarks && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Ghi chú</h3>
            <p className="text-sm text-gray-500 whitespace-pre-wrap">{entry.remarks}</p>
          </div>
        )}
      </div>

      {/* ── Print Layout ── */}
      <div className="print-view ph-wrap">
        <div className="ph-doc-header">
          <div className="ph-company">{companyName}</div>
          <div className="ph-title">PHIẾU ĐỐI SOÁT TỒN KHO</div>
        </div>

        <div className="ph-info-box">
          <div className="ph-row"><span className="ph-label">Số phiếu:</span><span className="ph-val ph-bold">{entry.name}</span></div>
          <div className="ph-row"><span className="ph-label">Ngày:</span><span className="ph-val">{entry.posting_date}</span></div>
          <div className="ph-row"><span className="ph-label">Loại:</span><span className="ph-val">{getPurposeLabel(entry.purpose)}</span></div>
          <div className="ph-row"><span className="ph-label">Trạng thái:</span><span className="ph-val">{entry.docstatus === 1 ? 'Đã duyệt' : entry.docstatus === 0 ? 'Nháp' : 'Đã hủy'}</span></div>
        </div>

        <table className="ph-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã vật tư</th>
              <th>Tên vật tư</th>
              <th className="text-right">Tồn HT</th>
              <th className="text-right">Thực tế</th>
              <th className="text-right">Chênh</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => {
              const diff = (item.qty || 0) - (item.current_qty || 0);
              return (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="font-mono">{item.item_code}</td>
                  <td>{item.item_name || item.item_code}</td>
                  <td className="text-right">{(item.current_qty || 0).toLocaleString('vi-VN')}</td>
                  <td className="text-right">{(item.qty || 0).toLocaleString('vi-VN')}</td>
                  <td className="text-right ph-bold">{diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {entry.remarks && (
          <div className="ph-remarks-box"><strong>Ghi chú: </strong>{entry.remarks}</div>
        )}

        <div className="ph-sig-row">
          <div className="ph-sig-cell">
            <div className="ph-sig-title">Người lập phiếu</div>
            <div className="ph-sig-line"></div>
          </div>
          <div className="ph-sig-cell">
            <div className="ph-sig-title">Thủ kho</div>
            <div className="ph-sig-line"></div>
          </div>
        </div>

        <div className="ph-doc-footer">
          <span>{entry.name}</span>
          <span>{entry.creation}</span>
        </div>
      </div>

    </div>
  );
}
