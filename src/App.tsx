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
import { ItemDetail } from './pages/ItemDetail';
import { NewItem } from './pages/NewItem';
import { Stock } from './pages/Stock';
import { Transfers } from './pages/Transfers';
import { NewTransfer } from './pages/NewTransfer';
import { MaterialRequests } from './pages/MaterialRequests';
import { BOMs } from './pages/BOMs';
import { DeliveryNotes } from './pages/DeliveryNotes';
import { PurchaseReceipts } from './pages/PurchaseReceipts';
import { PickList } from './pages/PickList';
import { StockReconciliation } from './pages/StockReconciliation';
import { StockAnalytics } from './pages/StockAnalytics';
import { ItemGroups } from './pages/ItemGroups';
import { Brands } from './pages/Brands';
import { Warehouses } from './pages/Warehouses';
import { UOMs } from './pages/UOMs';
import { SerialNos } from './pages/SerialNos';
import { BatchNos } from './pages/BatchNos';
import { StockLedger } from './pages/StockLedger';
import { StockBalanceReport } from './pages/StockBalanceReport';
import { StockProjectedQty } from './pages/StockProjectedQty';
import { StockAgeing } from './pages/StockAgeing';
import { WarehouseWiseStock } from './pages/WarehouseWiseStock';
import { ItemShortageReport } from './pages/ItemShortageReport';
import { StockSettings } from './pages/StockSettings';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';

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
          <Route path="items/new" element={<NewItem />} />
          <Route path="items/:id" element={<ItemDetail />} />
          <Route path="stock" element={<Stock />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="transfers/new" element={<NewTransfer />} />
          <Route path="stock/receive" element={<NewTransfer />} />
          <Route path="material-requests" element={<MaterialRequests />} />
          <Route path="boms" element={<BOMs />} />
          <Route path="delivery-notes" element={<DeliveryNotes />} />
          <Route path="purchase-receipts" element={<PurchaseReceipts />} />
          <Route path="pick-list" element={<PickList />} />
          <Route path="stock-reconciliation" element={<StockReconciliation />} />
          <Route path="stock-analytics" element={<StockAnalytics />} />
          <Route path="item-groups" element={<ItemGroups />} />
          <Route path="brands" element={<Brands />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="uoms" element={<UOMs />} />
          <Route path="serial-nos" element={<SerialNos />} />
          <Route path="batch-nos" element={<BatchNos />} />
          <Route path="stock-ledger" element={<StockLedger />} />
          <Route path="stock-balance-report" element={<StockBalanceReport />} />
          <Route path="stock-projected-qty" element={<StockProjectedQty />} />
          <Route path="stock-ageing" element={<StockAgeing />} />
          <Route path="warehouse-wise-stock" element={<WarehouseWiseStock />} />
          <Route path="item-shortage-report" element={<ItemShortageReport />} />
          <Route path="stock-settings" element={<StockSettings />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
