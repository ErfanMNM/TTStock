import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { Home, Package, Warehouse, ArrowLeftRight, User, Menu, LogOut, X, Settings, ClipboardList, FileText, Truck, PackageSearch, ListTodo, Scale, BarChart3, Folders, Tag, Ruler, Hash, Layers, BookOpen, Wallet, TrendingUp, Clock, MapPin, AlertTriangle, Settings2, Building2, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { erpService } from '../services/api';
import { WhatsNew } from './WhatsNew';

type NavItem = { name: string; path: string; icon: React.ComponentType<{ className?: string }> };
type NavGroupColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'slate';
type NavGroup = { label: string; icon: React.ComponentType<{ className?: string }>; color: NavGroupColor; items: NavItem[] };

const colorMap: Record<NavGroupColor, Record<'bg' | 'text' | 'bgActive' | 'textActive' | 'border', string>> = {
  blue:    { bg: 'bg-blue-50',       text: 'text-blue-500',    bgActive: 'bg-blue-500',     textActive: 'text-white',      border: 'border-blue-400'    },
  emerald: { bg: 'bg-emerald-50',    text: 'text-emerald-500', bgActive: 'bg-emerald-500',  textActive: 'text-white',      border: 'border-emerald-400' },
  violet:  { bg: 'bg-violet-50',     text: 'text-violet-500',  bgActive: 'bg-violet-500',   textActive: 'text-white',      border: 'border-violet-400'  },
  amber:   { bg: 'bg-amber-50',     text: 'text-amber-500',  bgActive: 'bg-amber-500',   textActive: 'text-white',      border: 'border-amber-400'   },
  slate:   { bg: 'bg-slate-100',     text: 'text-slate-500',   bgActive: 'bg-slate-500',    textActive: 'text-white',      border: 'border-slate-400'    },
};

const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    icon: Home,
    color: 'blue',
    items: [
      { name: 'Tổng quan', path: '/', icon: Home },
      { name: 'Vật tư', path: '/items', icon: Package },
      { name: 'Tồn kho', path: '/stock', icon: Warehouse },
    ],
  },
  {
    label: 'Nghiệp vụ',
    icon: ArrowLeftRight,
    color: 'emerald',
    items: [
      { name: 'Nhập xuất', path: '/transfers', icon: ArrowLeftRight },
      { name: 'Yêu cầu VT', path: '/material-requests', icon: ClipboardList },
      { name: 'Định mức BOM', path: '/boms', icon: FileText },
      { name: 'Giao hàng', path: '/delivery-notes', icon: Truck },
      { name: 'Nhập mua', path: '/purchase-receipts', icon: PackageSearch },
      { name: 'Danh sách chọn', path: '/pick-list', icon: ListTodo },
      { name: 'Đối soát kho', path: '/stock-reconciliation', icon: Scale },
    ],
  },
  {
    label: 'Báo cáo',
    icon: BarChart3,
    color: 'violet',
    items: [
      { name: 'Phân tích kho', path: '/stock-analytics', icon: BarChart3 },
      { name: 'Sổ kho', path: '/stock-ledger', icon: BookOpen },
      { name: 'Báo cáo tồn kho', path: '/stock-balance-report', icon: Wallet },
      { name: 'Tồn dự kiến', path: '/stock-projected-qty', icon: TrendingUp },
      { name: 'Tuổi tồn kho', path: '/stock-ageing', icon: Clock },
      { name: 'Tồn theo kho', path: '/warehouse-wise-stock', icon: MapPin },
      { name: 'Thiếu hàng', path: '/item-shortage-report', icon: AlertTriangle },
    ],
  },
  {
    label: 'Danh mục',
    icon: Folders,
    color: 'amber',
    items: [
      { name: 'Nhóm vật tư', path: '/item-groups', icon: Folders },
      { name: 'Thương hiệu', path: '/brands', icon: Tag },
      { name: 'Kho hàng', path: '/warehouses', icon: Building2 },
      { name: 'Đơn vị tính', path: '/uoms', icon: Ruler },
      { name: 'Số serial', path: '/serial-nos', icon: Hash },
      { name: 'Số lô', path: '/batch-nos', icon: Layers },
    ],
  },
  {
    label: 'Hệ thống',
    icon: Settings2,
    color: 'slate',
    items: [
      { name: 'Cài đặt kho', path: '/stock-settings', icon: Settings2 },
    ],
  },
];

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['Tổng quan']);
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('erp_full_name') || localStorage.getItem('erp_user') || '';

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]);
  };

  const bottomNavItems = navGroups.find(g => g.label === 'Tổng quan')?.items ?? [];

  const handleLogout = async () => {
    setIsSidebarOpen(false);
    await erpService.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex-col no-print",
        "transform transition-all duration-300 ease-out",
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-16 px-5 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-gray-900">TTStock</span>
                <p className="text-[10px] text-gray-400 leading-none">Kho Tân Tiến</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navGroups.map((group) => {
              const isOpen = openGroups.includes(group.label);
              const c = colorMap[group.color];
              return (
                <div key={group.label} className="mb-5">
                  {/* Group header - distinct pill with left accent */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                      isOpen
                        ? `${c.bg} ${c.text} shadow-sm`
                        : "text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <span className={cn("w-1 h-4 rounded-full flex-shrink-0", isOpen ? c.bgActive : "bg-gray-300")} />
                    <group.icon className={cn("w-4 h-4 flex-shrink-0")} />
                    <span className="uppercase tracking-widest">{group.label}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-200", !isOpen && "-rotate-90")} />
                  </button>

                  {/* Group items */}
                  {isOpen && (
                    <div className="mt-1.5 ml-2 space-y-0.5 pl-3 border-l-2 border-gray-100">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.path}
                          end={item.path === '/'}
                          className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                            isActive
                              ? `${c.bgActive} ${c.textActive} shadow-sm`
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          {({ isActive }) => (
                            <>
                              {/* Left dot indicator */}
                              <span className={cn(
                                "absolute -left-[13px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-150",
                                isActive ? `bg-white/80` : "bg-transparent"
                              )} />
                              <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? c.textActive : "text-gray-400 group-hover:text-gray-600")} />
                              <span>{item.name}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-3 border-t border-gray-100 space-y-1">
            <NavLink
              to="/profile"
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <User className="w-5 h-5 mr-3 flex-shrink-0" />
              Tài khoản
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
              Cài đặt
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex-col transform transition-all duration-300 ease-out lg:hidden no-print",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-gray-900">TTStock</span>
                <p className="text-[10px] text-gray-400 leading-none">Kho Tân Tiến</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navGroups.map((group) => {
              const isOpen = openGroups.includes(group.label);
              const c = colorMap[group.color];
              return (
                <div key={group.label} className="mb-5">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                      isOpen
                        ? `${c.bg} ${c.text} shadow-sm`
                        : "text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <span className={cn("w-1 h-4 rounded-full flex-shrink-0", isOpen ? c.bgActive : "bg-gray-300")} />
                    <group.icon className={cn("w-4 h-4 flex-shrink-0")} />
                    <span className="uppercase tracking-widest">{group.label}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-200", !isOpen && "-rotate-90")} />
                  </button>
                  {isOpen && (
                    <div className="mt-1.5 ml-2 space-y-0.5 pl-3 border-l-2 border-gray-100">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.path}
                          end={item.path === '/'}
                          onClick={() => setIsSidebarOpen(false)}
                          className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                            isActive
                              ? `${c.bgActive} ${c.textActive} shadow-sm`
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          {({ isActive }) => (
                            <>
                              <span className={cn(
                                "absolute -left-[13px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-150",
                                isActive ? "bg-white/80" : "bg-transparent"
                              )} />
                              <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? c.textActive : "text-gray-400 group-hover:text-gray-600")} />
                              <span>{item.name}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="p-3 border-t border-gray-100 space-y-1">
            <NavLink to="/profile" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}>
              <User className="w-5 h-5 mr-3 flex-shrink-0" />
              Tài khoản
            </NavLink>
            <NavLink to="/settings" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}>
              <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
              Cài đặt
            </NavLink>
            <button onClick={handleLogout} className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-all duration-200">
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100 sticky top-0 z-30 no-print">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">TTStock</span>
            </div>
          </div>
          <Link to="/profile" className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
            <span className="text-xs font-bold text-blue-600">{userName.charAt(0).toUpperCase()}</span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-24 lg:px-6 lg:py-5 lg:pb-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-print">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-colors duration-200",
                isActive ? "text-blue-600" : "text-gray-400"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-6 h-6" style={{ strokeWidth: isActive ? 2.5 : 2 }} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* What's New notification */}
      <WhatsNew />
    </div>
  );
}
