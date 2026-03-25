/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Items } from './pages/Items';
import { Stock } from './pages/Stock';
import { Transfers } from './pages/Transfers';
import { NewTransfer } from './pages/NewTransfer';
import { Settings } from './pages/Settings';

// Simple auth check
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('erp_user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="items" element={<Items />} />
          <Route path="stock" element={<Stock />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="transfers/new" element={<NewTransfer />} />
          <Route path="stock/receive" element={<NewTransfer />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
