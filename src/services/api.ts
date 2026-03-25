import axios from 'axios';

const BASE_URL = 'https://erp.mte.vn';

export const api = axios.create({
  baseURL: BASE_URL,
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
      console.error('Logout failed', e);
    }
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_full_name');
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
    const response = await api.get(`/api/resource/Item/${encodeURIComponent(itemName)}`);
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
        fields: '["name", "item_code", "warehouse", "actual_qty", "reserved_qty", "projected_qty"]',
        filters: JSON.stringify(filters),
        limit_page_length: 100,
      }
    });
    return response.data.data;
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
