# Backend - WebsiteServiceEcommerce API

Backend được xây dựng bằng ASP.NET Core Web API với Entity Framework Core và SQL Server.

## Công nghệ sử dụng

- **Framework:** ASP.NET Core 8.0 Web API
- **ORM:** Entity Framework Core 8.0
- **Database:** SQL Server
- **Authentication:** JWT Bearer Token
- **Language:** C# 12

## Cấu trúc thư mục

```
BE/
├── Controllers/        # API Controllers
├── Models/            # Entity models
├── DTOs/              # Data Transfer Objects
├── Data/              # DbContext và database config
├── Services/          # Business logic services
├── Repositories/      # Data access layer
├── Helpers/           # Helper classes (JWT, Password)
├── Migrations/        # EF Core migrations
├── Program.cs         # Application entry point
└── appsettings.json   # Configuration
```

## Cài đặt và chạy

### 1. Yêu cầu hệ thống

- .NET 8.0 SDK
- SQL Server 2019 trở lên (hoặc LocalDB/Express)
- Visual Studio 2022 hoặc VS Code

### 2. Cấu hình database

Mở file `appsettings.json` và cập nhật connection string nếu cần:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=WebsiteServiceEcommerceDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 3. Tạo database

Database hi?n t?i ?? c? schema v? d? li?u m?u trong SQL Server.

N?u c?n t?o l?i b?ng Entity Framework migrations:
Hoặc sử dụng Entity Framework migrations:

```bash
cd BE
dotnet ef database update
```

### 4. Restore packages

```bash
cd BE
dotnet restore
```

### 5. Chạy API

```bash
dotnet run
```

API sẽ chạy tại:
- HTTP: `http://localhost:5194`
- HTTPS: `https://localhost:7295`

Swagger UI: `http://localhost:5194/swagger`

## API Endpoints

### System

- `GET /api/health`
- `GET /api/categories`
- `GET /api/service-packages`
- `GET /api/service-packages/{id}`
- `GET /api/providers/{id}`

### Authentication

#### POST /api/Auth/register
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "123456",
  "phoneNumber": "0912345678",
  "role": "Customer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công.",
  "data": {
    "userId": 1,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "Customer",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "providerId": null
  }
}
```

#### POST /api/Auth/login
Đăng nhập

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

#### POST /api/Auth/logout
Đăng xuất phía client bằng cách xóa JWT token.

#### GET /api/Auth/me
Lấy thông tin người dùng hiện tại từ JWT token.

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công.",
  "data": {
    "userId": 1,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "Customer",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "providerId": null
  }
}
```

## Tài khoản test

Tất cả tài khoản có mật khẩu: `123456`

| Email | Role | Mô tả |
|-------|------|-------|
| admin@websiteservice.vn | Admin | Quản trị hệ thống |
| customer1@example.com | Customer | Khách hàng 1 |
| customer2@example.com | Customer | Khách hàng 2 |
| minhanh@studio.com | Provider | Minh Anh Studio |
| bluepixel@agency.com | Provider | BluePixel Agency |
| thanhvu@dev.com | Provider | Thanh Vũ Dev |

## JWT Token

Token có thời gian sống: **1440 phút (24 giờ)**

Sử dụng token trong request header:
```
Authorization: Bearer {token}
```

## CORS Configuration

API cho phép CORS từ:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`

## Entity Framework Commands

### Tạo migration mới
```bash
dotnet ef migrations add MigrationName
```

### Apply migrations
```bash
dotnet ef database update
```

### Xóa migration cuối
```bash
dotnet ef migrations remove
```

### Tạo SQL script từ migrations
```bash
dotnet ef migrations script
```

## Lưu ý

- Password được hash bằng SHA256 (trong production nên dùng bcrypt hoặc Argon2)
- JWT Secret Key nên được đổi trong production và lưu trong environment variables
- Database connection string nên được bảo mật trong production
- Các API endpoint khác sẽ được thêm vào trong các milestone tiếp theo

## Troubleshooting

### Lỗi kết nối SQL Server

Kiểm tra:
1. SQL Server service đang chạy
2. Connection string đúng
3. SQL Server cho phép TCP/IP connections
4. Firewall không chặn port 1433

### Lỗi migration

```bash
# Xóa database và tạo lại
dotnet ef database drop
dotnet ef database update
```

## Next Steps (Milestone 3)

- Thêm PackageController (GET, POST, PUT, DELETE)
- Thêm OrderController (tạo đơn hàng)
- Thêm UserController (profile management)
- Implement Repository pattern
- Thêm validation middleware

