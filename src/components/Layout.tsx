import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, Warehouse, ArrowLeftRight, Settings, Menu, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { erpService } from '../services/api';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Items', path: '/items', icon: Package },
  { name: 'Stock', path: '/stock', icon: Warehouse },
  { name: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await erpService.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <span className="text-xl font-bold text-blue-600">MTE WMS</span>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700">
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 mr-3">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold text-blue-600">MTE WMS</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
