import React from 'react';
import { Settings2, Warehouse, DollarSign, FileText, CheckCircle, X } from 'lucide-react';

interface SettingCard {
  title: string;
  description: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  enabled?: boolean;
}

export function StockSettings() {
  const settingCards: SettingCard[] = [
    {
      title: 'Kho mặc định',
      description: 'Kho được sử dụng khi không chỉ định kho cụ thể',
      value: 'Kho Tổng - Công ty MTE',
      icon: Warehouse,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Phương pháp định giá',
      description: 'Phương pháp tính giá trị tồn kho',
      value: 'FIFO',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Tự động tạo sổ kho',
      description: 'Tự động ghi nhận mọi biến động kho',
      value: 'Bật',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      enabled: true,
    },
    {
      title: 'Tự động duyệt phiếu kho',
      description: 'Tự động submit Stock Entry sau khi tạo',
      value: 'Bật',
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      enabled: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Cài đặt kho</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">Quản lý cấu hình kho hàng</p>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up stagger-1">
        {settingCards.map((card) => (
          <div key={card.title} className="card p-4">
            <div className="flex items-start space-x-3 mb-4">
              <div className={`w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.description}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{card.value}</span>
                {card.enabled !== undefined && (
                  card.enabled ? (
                    <span className="chip chip-green !text-[10px]">
                      <CheckCircle className="w-3 h-3 mr-0.5" />
                      Đang bật
                    </span>
                  ) : (
                    <span className="chip chip-gray !text-[10px]">
                      <X className="w-3 h-3 mr-0.5" />
                      Đang tắt
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="card p-5 animate-slide-up stagger-2">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Settings2 className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Lưu ý</p>
            <p className="text-xs text-gray-400">Các cài đặt này áp dụng cho toàn bộ hệ thống</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Phương pháp định giá</span>
            <span className="text-xs font-medium text-gray-900">FIFO (Nhập trước - Xuất trước)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Đơn vị tiền tệ</span>
            <span className="text-xs font-medium text-gray-900">VND (Vietnamese Dong)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Cho phép định giá = 0</span>
            <span className="text-xs font-medium text-green-600">Có</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Kiểm soát tồn kho âm</span>
            <span className="text-xs font-medium text-red-600">Không cho phép</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center animate-slide-up">
        <p className="text-xs text-gray-300">Kho Tân Tiến • TTStock v1.0</p>
      </div>
    </div>
  );
}
