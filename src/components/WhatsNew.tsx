import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const APP_VERSION = 'beta-1.0.695.1031';

const CURRENT_VERSION = APP_VERSION;

type Feature = {
  tag?: 'new' | 'improved' | 'fix';
  text: string;
};

const features: Feature[] = [
  { tag: 'new', text: 'Thêm cột Tồn kho và Đơn giá (Basic Rate) vào bảng vật tư khi tạo phiếu nhập xuất' },
  { tag: 'new', text: 'Kho nguồn / kho đích cho từng sản phẩm riêng biệt trong phiếu điều chuyển' },
  { tag: 'new', text: 'Nút info (i) ở cột Tồn — nhấn xem chi tiết Tên kho - SL tồn theo từng kho' },
  { tag: 'new', text: 'Thêm nút Xóa phiếu nháp trên trang chi tiết phiếu' },
  { tag: 'improved', text: 'Tối ưu tải tồn kho — gộp API calls, không còn race condition' },
  { tag: 'improved', text: 'Đổi port dev server sang 3001' },
  { tag: 'fix', text: 'Sửa lỗi cột Tồn kho không hiển thị trên màn hình lớn' },
  { tag: 'fix', text: 'Sửa lỗi font tiếng Việt khi xuất PDF bằng html2canvas' },
  { tag: 'fix', text: 'Sửa lỗi nút "+ Thêm dòng" tạo hàng rỗng' },
];

const tagStyle: Record<NonNullable<Feature['tag']>, string> = {
  new: 'bg-blue-100 text-blue-700',
  improved: 'bg-emerald-100 text-emerald-700',
  fix: 'bg-amber-100 text-amber-700',
};

const tagLabel: Record<NonNullable<Feature['tag']>, string> = {
  new: 'Mới',
  improved: 'Cải thiện',
  fix: 'Sửa lỗi',
};

export function WhatsNew() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('ttstock_whatsnew_version') === CURRENT_VERSION;
  });

  const handleDismiss = () => {
    localStorage.setItem('ttstock_whatsnew_version', CURRENT_VERSION);
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto animate-fade-in" onClick={handleDismiss} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden pointer-events-auto animate-scale-in">
        {/* Header */}
        <div className="relative p-5 pb-4 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Cập nhật tính năng mới</h2>
              <p className="text-blue-200 text-xs">Beta {CURRENT_VERSION}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Features list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              {f.tag && (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5", tagStyle[f.tag])}>
                  {tagLabel[f.tag]}
                </span>
              )}
              <p className="text-sm text-gray-700 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleDismiss}
            className="w-full btn-primary !rounded-xl !py-2.5"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
