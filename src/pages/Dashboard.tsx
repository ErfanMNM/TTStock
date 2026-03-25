import React, { useEffect, useState } from 'react';
import { erpService } from '../services/api';
import { Package, Warehouse, ArrowLeftRight, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState({
    items: 0,
    warehouses: 0,
    recentTransfers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [items, warehouses, transfers] = await Promise.all([
          erpService.getItems(1),
          erpService.getWarehouses(),
          erpService.getStockEntries(5),
        ]);
        setStats({
          items: items.length > 0 ? '100+' : 0, // Just a placeholder, ERPNext doesn't return total count easily without specific query
          warehouses: warehouses.length,
          recentTransfers: transfers.length,
        });
      } catch (err: any) {
        setError('Failed to load dashboard data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md flex items-start">
        <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Items Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.items}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/items" className="font-medium text-blue-700 hover:text-blue-900">
                View all items
              </Link>
            </div>
          </div>
        </div>

        {/* Warehouses Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Warehouse className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Warehouses</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.warehouses}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/stock" className="font-medium text-blue-700 hover:text-blue-900">
                View stock balance
              </Link>
            </div>
          </div>
        </div>

        {/* Transfers Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowLeftRight className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent Transfers</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.recentTransfers}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/transfers" className="font-medium text-blue-700 hover:text-blue-900">
                Manage transfers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link to="/transfers/new" className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                <ArrowLeftRight className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">
                <span className="absolute inset-0" aria-hidden="true" />
                New Transfer
              </h3>
              <p className="mt-2 text-sm text-gray-500">Move stock between warehouses.</p>
            </div>
          </Link>
          
          <Link to="/stock/receive" className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow hover:shadow-md transition-shadow">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                <TrendingUp className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">
                <span className="absolute inset-0" aria-hidden="true" />
                Receive Stock
              </h3>
              <p className="mt-2 text-sm text-gray-500">Record incoming materials.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
