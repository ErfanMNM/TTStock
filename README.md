# TTStock — Quản Lý Kho Tân Tiến

<div align="center">
  <img width="1200" height="475" alt="TTStock Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

Ứng dụng quản lý kho hàng kết nối ERPNext, tối ưu cho thiết bị di động và máy tính.

## Tính năng

- **Quản lý hàng hóa** — Xem, tạo, tìm kiếm vật tư trong kho
- **Phiếu kho** — Tạo và duyệt phiếu nhập / xuất / chuyển kho
- **Sổ kho** — Theo dõi tồn kho theo thời gian thực
- **Yêu cầu vật tư** — Tạo và theo dõi yêu cầu mua hàng
- **Thông tin tài khoản** — Xem profile, vai trò, trạng thái từ ERPNext

## Công nghệ

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 19, React Router v7, Tailwind CSS v4 |
| Build | Vite 6 |
| Backend | ERPNext (erp.mte.vn) |
| Deploy | Cloudflare Workers |

## Run cục bộ

**Yêu cầu:** Node.js

```bash
npm install
npm run dev
```

App sẽ chạy tại `http://localhost:3000`. Dev server proxy `/api/*` sang ERPNext.

## Deploy lên Cloudflare

```bash
npm run deploy
```

Cần thiết lập secret `SESSION_COOKIE` (cookie đăng nhập ERPNext):

```bash
wrangler secret put SESSION_COOKIE
```

## Cấu trúc thư mục

```
src/
├── pages/          # Trang chính (Login, Profile, Items, StockLedger, ...)
├── services/
│   └── api.ts      # ERPNext API service
worker.js           # Cloudflare Worker (API proxy + SPA fallback)
wrangler.toml        # Cloudflare Workers config
```
