import React, { useState, useEffect } from 'react';
import { User, Server } from 'lucide-react';

export function Settings() {
  const [user, setUser] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    setUser(localStorage.getItem('erp_user') || '');
    setFullName(localStorage.getItem('erp_full_name') || '');
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-500" />
            ERPNext Connection
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Connected to <strong>https://erp.mte.vn</strong></p>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              Account Information
            </h3>
            <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Username / Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{fullName}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
