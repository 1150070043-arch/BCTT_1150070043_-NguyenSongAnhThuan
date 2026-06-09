# WebsiteServiceEcommerce

Hệ thống thương mại điện tử cung cấp dịch vụ thiết kế website.

## Milestone đã hoàn thành

### ✅ Milestone 1: Landing Page ReactJS + Vite

Frontend landing page với giao diện hiện đại, animation mượt mà.

### ✅ Milestone 2: Backend API & Database cơ bản

Backend ASP.NET Core Web API với Entity Framework Core, SQL Server và JWT Authentication.

### ✅ Milestone 3: Database SQL Server cơ bản

Database script có đủ bảng chính, category, payment, message, notification và dữ liệu mẫu.

### ✅ Milestone 4: Authentication & Role cơ bản

Backend có register/login/logout/me, frontend có login/register/forgot password và dashboard theo role.

### ✅ Milestone 5-9: Discovery, Order, Provider, Admin, Interaction cơ bản

Đã có danh sách/chi tiết gói, tạo đơn, checkout giả lập, provider quản lý gói/đơn/bàn giao, admin duyệt user/provider/package/order/report, chat/review/notification.

## Cấu trúc dự án

```txt
WebsiteServiceEcommerce/
│
├── BE/
│   ├── WebsiteServiceEcommerce.API/
│   │   ├── Controllers/          # AuthController
│   │   ├── Models/               # User, Provider, Package, Order, Review, ProjectDelivery
│   │   ├── DTOs/                 # RegisterDto, LoginDto, AuthResponseDto, ApiResponse
│   │   ├── Data/                 # ApplicationDbContext
│   │   ├── Services/             # (Sẽ thêm trong milestone tiếp theo)
│   │   ├── Repositories/         # (Sẽ thêm trong milestone tiếp theo)
│   │   ├── Migrations/           # EF Core migrations
│   │   ├── Helpers/              # JwtHelper, PasswordHelper
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   └── README_BE.md
│
├── FE/
│   ├── website-service-ecommerce/
│   │   ├── src/
│   │   │   ├── api/              # API client
│   │   │   ├── components/       # Header, Footer, Cards
│   │   │   ├── pages/            # LandingPage
│   │   │   ├── styles/           # CSS với animations
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   │
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── README_FE.md
│
├── Database/
?   ??? database-note.md      # T?i li?u database
│
└── README.md
```

## Chạy dự án

### 1. Tạo database

```bash
# Database hi?n t?i ?? c? schema v? d? li?u m?u trong SQL Server.
# N?u c?n t?o l?i b?ng Entity Framework:
```


```bash
cd BE
dotnet ef database update
```

### 2. Chạy backend

```bash
cd BE
dotnet restore
dotnet run
```

API chạy tại: `http://localhost:5194`

Swagger UI: `http://localhost:5194/swagger`

### 3. Chạy frontend

```bash
cd FE
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

## Tài khoản test

Tất cả có mật khẩu: `123456`

| Email | Role | Mô tả |
|-------|------|-------|
| admin@websiteservice.vn | Admin | Quản trị hệ thống |
| customer1@example.com | Customer | Khách hàng 1 |
| customer2@example.com | Customer | Khách hàng 2 |
| customer3@example.com | Customer | Khách hàng 3 |
| minhanh@studio.com | Provider | Minh Anh Studio |
| bluepixel@agency.com | Provider | BluePixel Agency |
| thanhvu@dev.com | Provider | Thanh Vũ Dev |

## API Endpoints (Milestone 2)

- `GET /api/health` - Kiểm tra API và database
- `GET /api/categories` - Danh mục dịch vụ
- `GET /api/service-packages` - Danh sách gói dịch vụ
- `GET /api/service-packages/{id}` - Chi tiết gói dịch vụ
- `GET /api/providers/{id}` - Chi tiết provider
- `POST /api/Auth/register` - Đăng ký tài khoản
- `POST /api/Auth/login` - Đăng nhập
- `POST /api/Auth/logout` - Đăng xuất
- `GET /api/Auth/me` - Thông tin người dùng hiện tại
- `POST /api/orders` - Customer tạo đơn hàng
- `GET /api/orders/my-orders` - Đơn hàng của customer
- `GET /api/orders/{id}` - Chi tiết đơn hàng
- `PUT /api/orders/{id}/cancel` - Hủy đơn
- `PUT /api/orders/{id}/request-revision` - Yêu cầu chỉnh sửa
- `PUT /api/orders/{id}/complete` - Nghiệm thu đơn
- `GET /api/provider/packages` - Provider xem gói
- `POST /api/provider/packages` - Provider tạo gói
- `GET /api/provider/orders` - Provider xem đơn
- `PUT /api/provider/orders/{id}/status` - Provider cập nhật trạng thái
- `POST /api/project-deliveries` - Provider nộp bàn giao
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Admin quản lý user
- `GET /api/admin/providers/pending` - Provider chờ duyệt
- `GET /api/admin/packages/pending` - Gói chờ duyệt
- `GET /api/admin/orders` - Danh sách đơn admin
- `GET /api/admin/reports` - Báo cáo
- `GET /api/messages/order/{orderId}` và `POST /api/messages` - Chat trong đơn
- `POST /api/reviews` và `GET /api/reviews/provider/{providerId}` - Đánh giá
- `GET /api/notifications` và `PUT /api/notifications/{id}/read` - Thông báo

## Công nghệ sử dụng

**Frontend:**
- ReactJS 18
- Vite
- CSS thuần (animations & transitions)
- Axios
- Lucide Icons

**Backend:**
- ASP.NET Core 8.0 Web API
- Entity Framework Core 8.0
- SQL Server
- JWT Authentication

## Milestone tiếp theo

### Milestone tiếp theo: Polish UI/UX và hardening

- Route guard theo role chặt hơn
- Toast/confirm modal/skeleton đầy đủ hơn
- Test API với database thật
- Tách service/repository nếu cần mở rộng production

## Ghi chú

- Milestone 1: Landing page hoàn chỉnh với animation, responsive
- Milestone 2: Backend API cơ bản với Authentication, Database setup, 6 models chính
- Frontend và Backend đã được tách biệt rõ ràng
- CORS đã được cấu hình cho phép frontend gọi API
- Database có dữ liệu mẫu sẵn để test


