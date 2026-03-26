import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { Home, Package, Warehouse, ArrowLeftRight, User, Menu, LogOut, X, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { erpService } from '../services/api';

const navItems = [
  { name: 'Tổng quan', path: '/', icon: Home },
  { name: 'Vật tư', path: '/items', icon: Package },
  { name: 'Tồn kho', path: '/stock', icon: Warehouse },
  { name: 'Nhập xuất', path: '/transfers', icon: ArrowLeftRight },
];

const bottomNavItems = [
  { name: 'Tổng quan', path: '/', icon: Home },
  { name: 'Vật tư', path: '/items', icon: Package },
  { name: 'Tồn kho', path: '/stock', icon: Warehouse },
  { name: 'Nhập xuất', path: '/transfers', icon: ArrowLeftRight },
];

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const userName = localStorage.getItem('erp_full_name') || localStorage.getItem('erp_user') || '';

  const handleLogout = async () => {
    setIsSidebarOpen(false);
    await erpService.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex-col",
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
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
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
              <Bell className="w-5 h-5 mr-3 flex-shrink-0" />
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex-col transform transition-all duration-300 ease-out lg:hidden",
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
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
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
              <Bell className="w-5 h-5 mr-3 flex-shrink-0" />
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
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100 sticky top-0 z-30">
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
    </div>
  );
}
