import axios from 'axios';

export const api = axios.create({
  baseURL: '', // Proxy via Vite dev server (see vite.config.ts)
  withCredentials: true, // Required to send and receive session cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// DEBUG: raw fetch for troubleshooting
export async function debugFetchBin(warehouse: string) {
  const response = await api.get('/api/resource/Bin', {
    params: {
      fields: JSON.stringify(["name", "item_code", "warehouse", "actual_qty"]),
      filters: JSON.stringify([["Bin", "warehouse", "=", warehouse]]),
      limit_page_length: 5,
    }
  });
  return response.data;
}

export const erpService = {
  // Authentication
  login: async (usr: string, pwd: string) => {
    const response = await api.post('/api/method/login', { usr, pwd });
    if (response.data.message === 'Logged In') {
      // Use email as identifier — ERPNext User doctype uses email as name
      localStorage.setItem('erp_user', usr);
      localStorage.setItem('erp_full_name', response.data.full_name || usr);
      // If login is via email (not username), store it separately for getUserInfo
      if (usr.includes('@')) {
        localStorage.setItem('erp_user_email', usr);
      }
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/api/method/logout');
    } catch (e) {
      console.error('Đăng xuất thất bại', e);
    }
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_full_name');
    localStorage.removeItem('erp_user_info');
  },

  // User Profile — uses detail endpoint to get child tables like roles
  getUserInfo: async () => {
    const usr = localStorage.getItem('erp_user') || '';
    const response = await api.get(`/api/resource/User/${encodeURIComponent(usr)}`, {
      params: {
        fields: JSON.stringify(["name", "full_name", "user_type", "enabled", "creation", "last_login", "email", "roles"]),
      }
    });
    const userData = response.data.data;
    if (userData) {
      localStorage.setItem('erp_user_info', JSON.stringify(userData));
    }
    return userData;
  },

  getUserByName: async (username: string) => {
    const response = await api.get(`/api/resource/User/${encodeURIComponent(username)}`, {
      params: {
        fields: JSON.stringify(["name", "full_name", "email"]),
      }
    });
    return response.data.data;
  },

  // Items
  getItems: async (limit = 20, start = 0, search = '') => {
    const filters = search ? `[["Item", "item_name", "like", "%${search}%"]]` : '[]';
    const response = await api.get(`/api/resource/Item`, {
      params: {
        fields: '["name", "item_name", "item_group", "image", "stock_uom", "description"]',
        limit_page_length: limit,
        limit_start: start,
        filters,
      }
    });
    return response.data.data;
  },

  getItemsWithStock: async (warehouse?: string) => {
    const [itemsRes, stockRes] = await Promise.all([
      api.get('/api/resource/Item', {
        params: { fields: '["name", "item_name", "item_group", "image", "stock_uom"]', limit_page_length: 10000 }
      }),
      warehouse ? api.get('/api/resource/Bin', {
        params: {
          fields: '["item_code", "actual_qty"]',
          filters: JSON.stringify([["Bin", "warehouse", "=", warehouse]]),
          limit_page_length: 10000,
        }
      }).then(r => r.data.data || []) : Promise.resolve([]),
    ]);

    const items = itemsRes.data.data || [];
    const stockMap: Record<string, number> = {};
    for (const row of stockRes as any[]) {
      stockMap[row.item_code] = row.actual_qty || 0;
    }

    return items.map((item: any) => ({
      ...item,
      actual_qty: stockMap[item.name] ?? 0,
    }));
  },

  getItemDetails: async (itemName: string) => {
    const response = await api.get(`/api/resource/Item/${encodeURIComponent(itemName)}`, {
      params: {
        fields: JSON.stringify([
          "name", "item_name", "item_code", "item_group", "item_group_name",
          "stock_uom", "unit", "description", "image",
          "is_stock_item", "maintain_stock", "disabled",
          "brand", "manufacturer", "item_defaults",
          "opening_stock", "valuation_rate", "standard_rate",
          "last_purchase_rate", "std_cost",
          "weight_per_unit", "weight_uom",
          "shelf_life_in_days", "end_of_life",
          "warranty_period", "origin",
          "gst_hsn_code", "icd_code",
          "is_fixed_asset", "is_purchase_item", "is_sales_item",
          "is_sub_contracted_item", "inspection_required_before_delivery",
          "inspection_required_before_purchase",
          "allow_preorders_artifacts", "enable_deferred_expense",
          "enable_deferred_revenue", "customs_tariff_number",
          "section", "chapter",
          "creation", "modified", "owner", "modified_by",
        ]),
      }
    });
    return response.data.data;
  },

  // Item Groups
  getItemGroups: async () => {
    try {
      const response = await api.get(`/api/resource/Item Group`, {
        params: {
          fields: '["name", "item_group_name", "parent_item_group"]',
          limit_page_length: 100,
        }
      });
      return response.data.data || [];
    } catch (err) {
      console.error('Lỗi getItemGroups:', err);
      return [];
    }
  },

  // Units of Measure
  getUOMs: async () => {
    try {
      // Thử UOM trước (ERPNext v14+)
      let response = await api.get(`/api/resource/UOM`, {
        params: {
          fields: '["name", "uom_name"]',
          limit_page_length: 100,
        }
      });
      if (!response.data.data || response.data.data.length === 0) {
        // Thử gọi method thay thế
        response = await api.get('/api/method/frappe.client.get_list', {
          params: {
            doctype: 'UOM',
            fields: '["name"]',
            limit: 100,
          }
        });
        return response.data.message?.map((u: any) => ({ name: u.name })) || [];
      }
      return response.data.data || [];
    } catch (err) {
      console.error('Lỗi getUOMs:', err);
      // Fallback: trả danh sách UOM phổ biến
      return [
        { name: 'Unit' },
        { name: 'Nos' },
        { name: 'Kg' },
        { name: 'g' },
        { name: 'L' },
        { name: 'ml' },
        { name: 'm' },
        { name: 'cm' },
        { name: 'mm' },
        { name: 'pcs' },
        { name: 'box' },
        { name: 'roll' },
        { name: 'pair' },
        { name: 'set' },
        { name: 'kg' },
      ];
    }
  },

  // Create Item
  createItem: async (data: any) => {
    const response = await api.post('/api/resource/Item', data);
    return response.data.data;
  },

  // Warehouses
  getWarehouses: async () => {
    try {
      const response = await api.get(`/api/resource/Warehouse`, {
        params: {
          fields: '["name", "warehouse_name", "is_group"]',
          limit_page_length: 100,
        }
      });
      return response.data.data || [];
    } catch (err: any) {
      console.error('Lỗi getWarehouses:', err);
      // Nếu lỗi 500 từ server, thử gọi method thay thế
      if (err.response?.status === 500) {
        try {
          const res = await api.get('/api/method/frappe.client.get_list', {
            params: {
              doctype: 'Warehouse',
              filters: JSON.stringify([]),
              fields: JSON.stringify(['name', 'warehouse_name', 'is_group']),
              limit: 100,
            }
          });
          return res.data.message || [];
        } catch {
          return [];
        }
      }
      return [];
    }
  },

  // Stock Balance
  getStockBalance: async (warehouse?: string, itemCode?: string) => {
    const filters: any[] = [];
    if (warehouse) filters.push(["Bin", "warehouse", "=", warehouse]);
    if (itemCode) filters.push(["Bin", "item_code", "=", itemCode]);

    const response = await api.get(`/api/resource/Bin`, {
      params: {
        fields: '["name", "item_code", "warehouse", "actual_qty", "reserved_qty", "projected_qty", "stock_value", "stock_uom"]',
        filters: JSON.stringify(filters),
        limit_page_length: 10000,
      }
    });
    const bins = response.data.data || [];

    // Enrich with item_name and item_group
    const uniqueCodes = [...new Set(bins.map((b: any) => b.item_code).filter(Boolean))];
    if (uniqueCodes.length === 0) return bins;

    // Fetch item details for unique codes
    const itemRes = await api.get(`/api/resource/Item`, {
      params: {
        fields: '["name", "item_name", "item_group"]',
        filters: JSON.stringify([['Item', 'name', 'in', uniqueCodes]]),
        limit_page_length: 10000,
      }
    });

    const itemMap: Record<string, any> = {};
    for (const item of itemRes.data.data || []) {
      itemMap[item.name] = item;
    }

    return bins.map((bin: any) => ({
      ...bin,
      item_name: itemMap[bin.item_code]?.item_name || null,
      item_group: itemMap[bin.item_code]?.item_group || null,
    }));
  },

  // Stock Entries (Receipts, Issues, Transfers)
  getStockEntries: async (limit = 20) => {
    const response = await api.get(`/api/resource/Stock Entry`, {
      params: {
        fields: '["name", "stock_entry_type", "posting_date", "posting_time", "docstatus"]',
        order_by: 'creation desc',
        limit_page_length: limit,
      }
    });
    return response.data.data;
  },

  // Create Stock Entry
  createStockEntry: async (data: any) => {
    const response = await api.post(`/api/resource/Stock Entry`, data);
    return response.data.data;
  },

  // Get Company Info
  getCompany: async () => {
    const response = await api.get('/api/resource/Company', {
      params: {
        fields: '["name", "company_name"]',
        limit_page_length: 1,
      }
    });
    return response.data.data?.[0];
  },

  // Get Stock Entry Details
  getStockEntryDetails: async (name: string) => {
    const response = await api.get(`/api/resource/Stock Entry/${encodeURIComponent(name)}`, {
      params: {
        fields: JSON.stringify([
          "name", "stock_entry_type", "posting_date", "posting_time",
          "docstatus", "purpose", "company", "from_warehouse", "to_warehouse",
          "add_multiple_items", "inspection_required", "receive_items",
          "remarks", "per_refunded", "total_amount", "basic_rate",
          "creation", "modified", "owner", "modified_by",
        ]),
      }
    });
    return response.data.data;
  },

  // Get Stock Entry Items
  getStockEntryItems: async (name: string) => {
    const response = await api.get(`/api/resource/Stock Entry/${encodeURIComponent(name)}`, {
      params: {
        fields: '["items"]',
      }
    });
    return response.data.data?.items || [];
  },


  // Stock Ledger (Transaction History)
  getStockLedger: async (itemCode?: string, fromDate?: string, toDate?: string) => {
    const filters: any[] = [];
    if (itemCode) filters.push(["Stock Ledger Entry", "item_code", "=", itemCode]);
    if (fromDate) filters.push(["Stock Ledger Entry", "posting_date", ">=", fromDate]);
    if (toDate) filters.push(["Stock Ledger Entry", "posting_date", "<=", toDate]);

    const response = await api.get('/api/resource/Stock Ledger Entry', {
      params: {
        fields: JSON.stringify([
          "name", "posting_date", "posting_time",
          "voucher_type", "voucher_no", "incoming_rate", "outgoing_rate",
          "qty_after_transaction", "stock_value", "stock_value_difference",
          "warehouse", "company", "item_code",
          "valuation_rate", "actual_qty", "basic_rate", "basic_amount",
          "creation",
        ]),
        filters: JSON.stringify(filters),
        order_by: "posting_date desc, posting_time desc",
        limit_page_length: 200,
      }
    });
    return response.data.data || [];
  },

  // Stock Reconciliation
  getStockReconciliations: async (limit = 50, page = 0, search = '') => {
    const params: any = {
      fields: JSON.stringify(['name', 'purpose', 'posting_date', 'docstatus', 'amended_from', 'creation', 'owner', 'modified_by']),
      order_by: 'creation desc',
      limit_page_length: limit,
      limit_start: page * limit,
    };
    if (search) {
      params.filters = JSON.stringify([['Stock Reconciliation', 'name', 'like', `%${search}%`]]);
    }
    const response = await api.get('/api/resource/Stock Reconciliation', { params });
    return response.data.data || [];
  },

  getStockReconciliationCount: async (search = '') => {
    const params: any = {
      fields: '["name"]',
      limit_page_length: 0,
    };
    if (search) {
      params.filters = JSON.stringify([['Stock Reconciliation', 'name', 'like', `%${search}%`]]);
    }
    const response = await api.get('/api/resource/Stock Reconciliation', { params });
    return response.data.data?.length || 0;
  },

  getStockReconciliationDetails: async (name: string) => {
    const response = await api.get(`/api/resource/Stock Reconciliation/${encodeURIComponent(name)}`, {
      params: {
        fields: JSON.stringify([
          'name', 'purpose', 'posting_date', 'docstatus', 'remarks',
          'company', 'creation', 'owner', 'modified_by',
        ]),
      }
    });
    return response.data.data;
  },

  createStockReconciliation: async (data: any) => {
    const response = await api.post('/api/resource/Stock Reconciliation', {
      data,
    });
    return response.data.data;
  },

  getStockReconciliationItems: async (name: string) => {
    const response = await api.get(`/api/resource/Stock Reconciliation/${encodeURIComponent(name)}`, {
      params: {
        fields: '["items"]',
      }
    });
    return response.data.data?.items || [];
  },

  submitStockReconciliation: async (name: string) => {
    const response = await api.post('/api/method/frappe.client.submit', new URLSearchParams({
      doctype: 'Stock Reconciliation',
      name,
    }));
    return response.data.data;
  },

  // Ping to check connection
  ping: async () => {
    const response = await api.get('/api/method/ping');
    return response.data;
  },

  // Material Request
  getMaterialRequests: async (limit = 20) => {
    const response = await api.get(`/api/resource/Material Request`, {
      params: {
        fields: '["name", "material_request_type", "transaction_date", "status", "docstatus", "per_received", "per_ordered"]',
        order_by: 'creation desc',
        limit_page_length: limit,
      }
    });
    return response.data.data;
  },

  getMaterialRequestDetails: async (name: string) => {
    const response = await api.get(`/api/resource/Material Request/${encodeURIComponent(name)}`);
    return response.data.data;
  },

  createMaterialRequest: async (data: any) => {
    const response = await api.post('/api/resource/Material Request', data);
    return response.data.data;
  },

  // BOM (Bill of Materials)
  getBOMs: async (limit = 20) => {
    const response = await api.get(`/api/resource/BOM`, {
      params: {
        fields: '["name", "item", "item_name", "quantity", "uom", "docstatus", "is_active", "is_default"]',
        order_by: 'creation desc',
        limit_page_length: limit,
      }
    });
    return response.data.data;
  },

  getBOMDetails: async (name: string) => {
    const response = await api.get(`/api/resource/BOM/${encodeURIComponent(name)}`);
    return response.data.data;
  },

  // Delivery Note
  getDeliveryNotes: async (limit = 20) => {
    const response = await api.get(`/api/resource/Delivery Note`, {
      params: {
        fields: '["name", "customer", "posting_date", "status", "docstatus", "per_delivered", "grand_total"]',
        order_by: 'creation desc',
        limit_page_length: limit,
      }
    });
    return response.data.data;
  },

  getDeliveryNoteDetails: async (name: string) => {
    const response = await api.get(`/api/resource/Delivery Note/${encodeURIComponent(name)}`);
    return response.data.data;
  },

  createDeliveryNote: async (data: any) => {
    const response = await api.post('/api/resource/Delivery Note', data);
    return response.data.data;
  },

  // Stock Entry actions
  submitStockEntry: async (name: string) => {
    // Dùng fetch thuần để kiểm soát hoàn toàn request (form-encoded như ERPNext yêu cầu)
    const formData = new URLSearchParams({ doctype: 'Stock Entry', docname: name });
    const response = await fetch('/api/method/frappe.client.submit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.exception || data.message || 'Lỗi duyệt phiếu');
    return data;
  },
};
