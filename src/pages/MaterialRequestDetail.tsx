import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { erpService } from '../services/api';
import { ArrowLeft, CheckCircle, Clock, Ban, Package, Warehouse, Calendar, FileText, MapPin, Printer, Loader2, ExternalLink, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';

export function MaterialRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('CÔNG TY');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [detailData, companyData] = await Promise.all([
          erpService.getMaterialRequestDetails(id),
          erpService.getCompany(),
        ]);
        setEntry(detailData);
        // items is nested in the response
        setItems(detailData?.items || []);
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
      'Purchase': 'Mua hàng',
      'Material Transfer': 'Điều chuyển',
      'Material Issue': 'Xuất kho',
      'Customer Provided': 'Khách cung cấp',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'Draft': 'Nháp',
      'Submitted': 'Đã duyệt',
      'Cancelled': 'Đã hủy',
      'Pending': 'Chờ duyệt',
      'Partial Ordered': 'Đặt một phần',
      'Ordered': 'Đã đặt',
      'Partial Received': 'Nhận một phần',
      'Received': 'Đã nhận',
    };
    return labels[status] || status;
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '—';
    return num.toLocaleString('vi-VN');
  };

  const totalQty = items.reduce((sum: number, item: any) => sum + (item.qty || 0), 0);

  const handleSubmit = async () => {
    if (!entry?.name || submitting) return;
    if (!confirm(`Duyệt phiếu "${entry.name}"?\nSau khi duyệt sẽ không thể chỉnh sửa.`)) return;
    setSubmitting(true);
    try {
      const formData2 = new URLSearchParams({ doctype: 'Material Request', docname: entry.name });
      const res = await fetch('/api/method/frappe.client.submit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData2,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.exception || data.message || 'Lỗi duyệt phiếu');
      // Reload
      const detailData = await erpService.getMaterialRequestDetails(entry.name);
      setEntry(detailData);
      setItems(detailData?.items || []);
    } catch (err: any) {
      alert(`Lỗi duyệt phiếu: ${err?.message || 'Không rõ lỗi'}`);
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
        <button onClick={() => navigate('/material-requests')} className="btn-primary !rounded-xl mt-4">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/material-requests')} className="btn-ghost !rounded-xl !p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{entry.name}</h1>
              {entry.docstatus === 1 ? (
                <span className="chip chip-green"><CheckCircle className="w-3.5 h-3.5 mr-0.5" /> Đã duyệt</span>
              ) : entry.docstatus === 0 ? (
                <span className="chip chip-yellow"><Clock className="w-3.5 h-3.5 mr-0.5" /> Nháp</span>
              ) : (
                <span className="chip chip-red"><Ban className="w-3.5 h-3.5 mr-0.5" /> Đã hủy</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{getTypeLabel(entry.material_request_type)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://erp.mte.vn/app/material-request/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !rounded-xl !px-3 !py-2 !text-xs flex items-center gap-1.5"
            title="Mở trên ERPNext"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            ERPNext
          </a>
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
      <div className="web-view">
        {/* ── Thông tin ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Ngày yêu cầu</p>
              <p className="text-sm font-semibold text-gray-900">{entry.transaction_date || '—'}</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Loại yêu cầu</p>
              <p className="text-sm font-semibold text-gray-900">{getTypeLabel(entry.material_request_type)}</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Kho đích</p>
              <p className="text-sm font-semibold text-gray-900">{entry.set_warehouse || '—'}</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Trạng thái</p>
              <p className="text-sm font-semibold text-gray-900">{getStatusLabel(entry.status)}</p>
            </div>
          </div>
        </div>

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
                  <th className="text-center">Ngày cần</th>
                  <th className="text-center">Đơn vị</th>
                  <th className="text-right">SL yêu cầu</th>
                  <th className="text-right">SL đã đặt</th>
                  <th className="text-right">SL đã nhận</th>
                  <th className="text-right">% Đã nhận</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => {
                  const perReceived = item.qty > 0 ? Math.round((item.received_qty || 0) / item.qty * 100) : 0;
                  return (
                    <tr key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 10}ms` }}>
                      <td className="text-center text-gray-400 text-xs">{idx + 1}</td>
                      <td className="font-mono font-semibold text-blue-600">{item.item_code}</td>
                      <td className="font-medium text-gray-900">{item.item_name || item.item_code}</td>
                      <td className="text-center text-gray-500 text-xs">{item.schedule_date || '—'}</td>
                      <td className="text-center"><span className="chip chip-green !text-xs">{item.uom || '—'}</span></td>
                      <td className="text-right font-semibold text-gray-900">{formatNumber(item.qty)}</td>
                      <td className="text-right text-gray-500">{formatNumber(item.ordered_qty)}</td>
                      <td className="text-right text-gray-500">{formatNumber(item.received_qty)}</td>
                      <td className="text-right">
                        {perReceived > 0 ? (
                          <span className={cn("font-semibold text-xs", perReceived >= 100 ? "text-green-600" : perReceived > 0 ? "text-amber-600" : "text-gray-400")}>
                            {perReceived}%
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-400 py-8 text-sm">Không có dữ liệu vật tư.</td>
                  </tr>
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="!bg-blue-50 font-semibold">
                    <td colSpan={5} className="text-right">Tổng cộng</td>
                    <td className="text-right font-bold text-blue-700">{formatNumber(totalQty)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
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

        {/* ── Timeline / Log ── */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin bổ sung</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-gray-400">Người tạo:</span> <span className="font-medium text-gray-700">{entry.owner || '—'}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-gray-400">Ngày tạo:</span> <span className="font-medium text-gray-700">{entry.creation ? new Date(entry.creation).toLocaleString('vi-VN') : '—'}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-gray-400">Sửa lần cuối:</span> <span className="font-medium text-gray-700">{entry.modified ? new Date(entry.modified).toLocaleString('vi-VN') : '—'}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-gray-400">Người sửa:</span> <span className="font-medium text-gray-700">{entry.modified_by || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Print Layout ── */}
      <div className="print-view ph-wrap">
        <div className="ph-doc-header">
          <div className="ph-company">{companyName}</div>
          <div className="ph-title">PHIẾU YÊU CẦU VẬT TƯ</div>
        </div>

        <div className="ph-info-box">
          <div className="ph-row"><span className="ph-label">Số phiếu:</span><span className="ph-val ph-bold">{entry.name}</span></div>
          <div className="ph-row"><span className="ph-label">Ngày yêu cầu:</span><span className="ph-val">{entry.transaction_date}</span></div>
          <div className="ph-row"><span className="ph-label">Loại yêu cầu:</span><span className="ph-val">{getTypeLabel(entry.material_request_type)}</span></div>
          <div className="ph-row"><span className="ph-label">Kho đích:</span><span className="ph-val">{entry.set_warehouse || '—'}</span></div>
          <div className="ph-row"><span className="ph-label">Trạng thái:</span><span className="ph-val">{entry.docstatus === 1 ? 'Đã duyệt' : entry.docstatus === 0 ? 'Nháp' : 'Đã hủy'}</span></div>
          <div className="ph-row"><span className="ph-label">Trạng thái xử lý:</span><span className="ph-val">{getStatusLabel(entry.status)}</span></div>
        </div>

        <table className="ph-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã vật tư</th>
              <th>Tên vật tư</th>
              <th className="text-center">Ngày cần</th>
              <th className="text-center">ĐVT</th>
              <th className="text-right">SL yêu cầu</th>
              <th className="text-right">SL đã đặt</th>
              <th className="text-right">SL đã nhận</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td className="font-mono">{item.item_code}</td>
                <td>{item.item_name || item.item_code}</td>
                <td className="text-center">{item.schedule_date || '—'}</td>
                <td className="text-center">{item.uom || '—'}</td>
                <td className="text-right">{formatNumber(item.qty)}</td>
                <td className="text-right">{formatNumber(item.ordered_qty)}</td>
                <td className="text-right">{formatNumber(item.received_qty)}</td>
              </tr>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="ph-total-row">
                <td colSpan={5} className="text-right ph-bold">TỔNG CỘNG</td>
                <td className="text-right ph-bold">{formatNumber(totalQty)}</td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          )}
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
          <div className="ph-sig-cell">
            <div className="ph-sig-title">Kế toán trưởng</div>
            <div className="ph-sig-line"></div>
          </div>
          <div className="ph-sig-cell">
            <div className="ph-sig-title">Giám đốc</div>
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
