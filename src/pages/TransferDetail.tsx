import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { erpService } from '../services/api';
import { ArrowLeft, CheckCircle, Clock, Ban, Package, Warehouse, Calendar, FileText, MapPin, Printer, Loader2, User } from 'lucide-react';

export function TransferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('CÔNG TY');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creator, setCreator] = useState<any>(null);
  const [approver, setApprover] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [detailData, itemsData, companyData] = await Promise.all([
          erpService.getStockEntryDetails(id),
          erpService.getStockEntryItems(id),
          erpService.getCompany(),
        ]);
        setEntry(detailData);
        setItems(itemsData);

        // Fetch creator & approver
        const [creatorData, approverData] = await Promise.all([
          detailData?.owner ? erpService.getUserByName(detailData.owner) : null,
          detailData?.modified_by && detailData.modified_by !== detailData?.owner
            ? erpService.getUserByName(detailData.modified_by)
            : null,
        ]);
        setCreator(creatorData);
        setApprover(approverData);
        if (companyData?.company_name) {
          setCompanyName(String(companyData.company_name).toUpperCase());
        }
      } catch (err) {
        console.error('Lỗi tải chi tiết phiếu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'Material Transfer': 'Điều chuyển',
      'Material Receipt': 'Nhập kho',
      'Material Issue': 'Xuất kho',
    };
    return labels[type] || type;
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '—';
    return num.toLocaleString('vi-VN');
  };

  const totalQty = items.reduce((sum: number, item: any) => sum + (item.qty || 0), 0);
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

  const handleSubmit = async () => {
    if (!entry?.name || submitting) return;
    if (!confirm(`Duyệt phiếu "${entry.name}"?\nSau khi duyệt sẽ không thể chỉnh sửa.`)) return;
    setSubmitting(true);
    try {
      await erpService.submitStockEntry(entry.name);
      // Reload lại dữ liệu
      const detailData = await erpService.getStockEntryDetails(entry.name);
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
        <button onClick={() => navigate('/transfers')} className="btn-primary !rounded-xl mt-4">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">

      {/* ── Toolbar (ẩn khi in) ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/transfers')} className="btn-ghost !rounded-xl !p-2">
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
          <p className="text-xs text-gray-400 mt-0.5">{getTypeLabel(entry.stock_entry_type)}</p>
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

      {/* ── Web View (ẩn khi in) ── */}
      <div className="web-view space-y-4">
        {/* ── Thông tin ── */}
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Loại phiếu</p>
              <p className="text-sm font-semibold text-gray-900">{getTypeLabel(entry.stock_entry_type)}</p>
            </div>
          </div>
          {entry.from_warehouse && (
            <div className="card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Warehouse className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Từ kho</p>
                <p className="text-sm font-semibold text-gray-900">{entry.from_warehouse}</p>
              </div>
            </div>
          )}
          {entry.to_warehouse && (
            <div className="card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Đến kho</p>
                <p className="text-sm font-semibold text-gray-900">{entry.to_warehouse}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Người tạo / duyệt ── */}
        {(creator || approver) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {creator && (
              <div className="card p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Người tạo</p>
                  <p className="text-sm font-semibold text-gray-900">{creator.full_name || creator.name}</p>
                  {creator.email && <p className="text-xs text-gray-400">{creator.email}</p>}
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
                  {approver.email && <p className="text-xs text-gray-400">{approver.email}</p>}
                </div>
              </div>
            )}
          </div>
        )}

      {/* ── Bảng vật tư ── */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            Chi tiết vật tư ({items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-center w-10">STT</th>
                <th className="text-left">Mã vật tư</th>
                <th className="text-left">Tên vật tư</th>
                <th className="text-center">Đơn vị</th>
                <th className="text-right">Số lượng</th>
                <th className="text-right">Đơn giá</th>
                <th className="text-right pr-4">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 10}ms` }}>
                  <td className="text-center text-gray-400 text-xs">{idx + 1}</td>
                  <td className="font-mono font-semibold text-blue-600">{item.item_code}</td>
                  <td className="font-medium text-gray-900">{item.item_name || item.item_code}</td>
                  <td className="text-center"><span className="chip chip-green !text-xs !px-2.5">{item.uom || '—'}</span></td>
                  <td className="text-right font-semibold text-gray-900">{formatNumber(item.qty)}</td>
                  <td className="text-right text-gray-500">{formatNumber(item.basic_rate)}</td>
                  <td className="text-right font-semibold text-gray-900">{formatNumber(item.amount)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8 text-sm">Không có dữ liệu vật tư.</td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="!bg-blue-50 font-semibold">
                  <td colSpan={4} className="text-right">Tổng cộng</td>
                  <td className="text-right font-bold text-blue-700">{formatNumber(totalQty)}</td>
                  <td></td>
                  <td className="text-right font-bold text-blue-700 pr-4">{formatNumber(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Ghi chú ── */}
      {entry.remarks && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Ghi chú</h3>
          <p className="text-sm text-gray-500 whitespace-pre-wrap">{entry.remarks}</p>
        </div>
      )}

      </div>
      {/* ── Print Layout ── */}
      <div className="print-view ph-wrap">

        {/* Header */}
        <div className="ph-doc-header">
          <div className="ph-company">{companyName}</div>
          <div className="ph-title">{getTypeLabel(entry.stock_entry_type).toUpperCase()}</div>
        </div>

        {/* Info */}
        <div className="ph-info-box">
          <div className="ph-row"><span className="ph-label">Số phiếu:</span><span className="ph-val ph-bold">{entry.name}</span></div>
          <div className="ph-row"><span className="ph-label">Ngày:</span><span className="ph-val">{entry.posting_date}</span></div>
          <div className="ph-row"><span className="ph-label">Loại:</span><span className="ph-val">{getTypeLabel(entry.stock_entry_type)}</span></div>
          <div className="ph-row"><span className="ph-label">Trạng thái:</span><span className="ph-val">{entry.docstatus === 1 ? 'Đã duyệt' : entry.docstatus === 0 ? 'Nháp' : 'Đã hủy'}</span></div>
          {entry.from_warehouse && <div className="ph-row"><span className="ph-label">Từ kho:</span><span className="ph-val">{entry.from_warehouse}</span></div>}
          {entry.to_warehouse && <div className="ph-row"><span className="ph-label">Đến kho:</span><span className="ph-val">{entry.to_warehouse}</span></div>}
        </div>

        {/* Table */}
        <table className="ph-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã vật tư</th>
              <th>Tên vật tư</th>
              <th className="text-center">ĐVT</th>
              <th className="text-right">SL</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td className="font-mono">{item.item_code}</td>
                <td>{item.item_name || item.item_code}</td>
                <td className="text-center">{item.uom || '—'}</td>
                <td className="text-right">{formatNumber(item.qty)}</td>
                <td className="text-right">{formatNumber(item.basic_rate)}</td>
                <td className="text-right ph-bold">{formatNumber(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="ph-total-row">
                <td colSpan={4} className="text-right ph-bold">TỔNG CỘNG</td>
                <td className="text-right ph-bold">{formatNumber(totalQty)}</td>
                <td></td>
                <td className="text-right ph-bold">{formatNumber(totalAmount)}</td>
              </tr>
            </tfoot>
          )}
        </table>

        {totalAmount > 0 && (
          <div className="ph-amount-text"><em>({numberToVietnamese(totalAmount)} đồng)</em></div>
        )}

        {entry.remarks && (
          <div className="ph-remarks-box"><strong>Ghi chú: </strong>{entry.remarks}</div>
        )}

        {/* Signatures */}
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

function numberToVietnamese(n: number): string {
  if (n === 0) return 'Không';
  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const readThree = (num: number): string => {
    if (num === 0) return '';
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    const ten = Math.floor(rest / 10);
    const unit = rest % 10;
    let result = '';
    if (hundred > 0) result += digits[hundred] + ' trăm ';
    if (rest > 0) {
      if (ten === 0 && hundred > 0) result += 'lẻ ';
      else if (ten === 1) result += 'mười ';
      else if (ten > 1) result += digits[ten] + ' mươi ';
      if (ten !== 1 && unit > 0) {
        result += ten === 0 ? digits[unit] : (unit === 1 ? 'mốt' : digits[unit]);
      }
    }
    return result.trim();
  };
  const str = Math.floor(n).toString();
  const parts: string[] = [];
  for (let i = str.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3);
    const chunk = parseInt(str.slice(start, i), 10);
    const unitIdx = Math.floor((str.length - i) / 3);
    if (chunk > 0) parts.unshift(readThree(chunk) + ' ' + units[unitIdx]);
  }
  return parts.join(' ').trim();
}


