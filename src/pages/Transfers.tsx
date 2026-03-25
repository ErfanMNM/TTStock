import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { ArrowLeftRight, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Transfers() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await erpService.getStockEntries(50);
      setEntries(data);
    } catch (err) {
      setError('Failed to fetch stock entries');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
        <Link
          to="/transfers/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          New Transfer
        </Link>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading transfers...</div>
        ) : entries.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No transfers found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {entries.map((entry) => (
              <li key={entry.name}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600 truncate">{entry.name}</p>
                        <p className="text-sm text-gray-500">{entry.stock_entry_type}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>{entry.posting_date}</p>
                      </div>
                      <div className="mt-2 flex items-center text-sm">
                        {entry.docstatus === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Submitted
                          </span>
                        ) : entry.docstatus === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
