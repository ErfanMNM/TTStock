import axios from 'axios';

export const api = axios.create({
  baseURL: '', // Proxy via Vite dev server (see vite.config.ts)
  withCredentials: true, // Required to send and receive session cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const erpService = {
  // Authentication
  login: async (usr: string, pwd: string) => {
    const response = await api.post('/api/method/login', { usr, pwd });
    if (response.data.message === 'Logged In') {
      localStorage.setItem('erp_user', usr);
      localStorage.setItem('erp_full_name', response.data.full_name || usr);
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

  // User Profile
  getUserInfo: async () => {
    const usr = localStorage.getItem('erp_user') || '';
    const response = await api.get('/api/resource/User', {
      params: {
        filters: `[["User", "email", "=", "${usr}"]]`,
        fields: '["name", "full_name", "user_type", "enabled", "creation", "last_login", "email"]',
        limit_page_length: 1,
      }
    });
    const userData = response.data.data?.[0];
    if (userData) {
      localStorage.setItem('erp_user_info', JSON.stringify(userData));
    }
    return userData;
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
    const response = await api.get(`/api/resource/Warehouse`, {
      params: {
        fields: '["name", "warehouse_name", "company", "is_group"]',
        limit_page_length: 100,
      }
    });
    return response.data.data;
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
        limit_page_length: 100,
      }
    });
    const bins = response.data.data;

    // Gộp thêm item_name, item_group từ Item doctype
    const uniqueCodes = [...new Set(bins.map((b: any) => b.item_code))];
    if (uniqueCodes.length > 0) {
      const itemFilters = uniqueCodes.map((code: string) => ["Item", "name", "=", code]);
      const itemRes = await api.get(`/api/resource/Item`, {
        params: {
          fields: '["name", "item_name", "item_group"]',
          filters: JSON.stringify(itemFilters),
          limit_page_length: 100,
        }
      });
      const itemMap: Record<string, any> = {};
      for (const item of itemRes.data.data) {
        itemMap[item.name] = item;
      }
      return bins.map((bin: any) => ({
        ...bin,
        item_name: itemMap[bin.item_code]?.item_name || null,
        item_group: itemMap[bin.item_code]?.item_group || null,
      }));
    }
    return bins;
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

  // Submit Stock Entry
  submitStockEntry: async (name: string) => {
    const response = await api.put(`/api/resource/Stock Entry/${encodeURIComponent(name)}`, {
      docstatus: 1
    });
    return response.data.data;
  },

  // Ping to check connection
  ping: async () => {
    const response = await api.get('/api/method/ping');
    return response.data;
  }
};
