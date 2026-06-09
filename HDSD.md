# Hướng Dẫn Sử Dụng Hệ Thống

## 1. Giới Thiệu

Hệ thống quản lý bán đá Ngọc Anh Phú Thịnh 9 gồm 2 phần:

- `BE`: Backend ASP.NET Core Web API, dùng SQL Server, JWT và VNPay.
- `FE`: Frontend ReactJS chạy bằng Vite.

Các vai trò chính:

- `Customer`: xem sản phẩm, đặt hàng, thanh toán, theo dõi đơn, hủy/hoàn tất đơn, đánh giá.
- `Provider`: quản lý sản phẩm/kho vận, xử lý đơn, cập nhật giao hàng.
- `Admin`: quản lý người dùng, nhà cung cấp, sản phẩm, đơn hàng, báo cáo, audit log.

## 2. Yêu Cầu Môi Trường

- .NET SDK 8.0 trở lên.
- Node.js 18 trở lên.
- SQL Server hoặc SQL Server Express.
- Trình duyệt hiện đại như Chrome, Edge hoặc Firefox.

## 3. Cấu Hình Backend

Mở file:

```txt
BE/appsettings.json
BE/appsettings.Development.json
```

Kiểm tra connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=NgocAnhPhuThinhIceDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Nếu dùng server SQL khác, thay `Server=.\\SQLEXPRESS` bằng server đang dùng.

## 4. Cấu Hình VNPay

Trong `BE/appsettings.Development.json`, cập nhật các giá trị VNPay:

```json
{
  "VNPAY": {
    "TmnCode": "COPY_TMN_CODE_HERE",
    "HashSecret": "COPY_HASH_SECRET_HERE",
    "BaseUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "CallbackUrl": "http://localhost:5194/api/vnpay/callback",
    "IpnUrl": "http://localhost:5194/api/vnpay/ipn",
    "FrontendReturnUrl": "http://localhost:5173/#/orders",
    "Version": "2.1.0",
    "OrderType": "other"
  }
}
```

Ghi chú:

- `TmnCode` và `HashSecret` lấy từ tài khoản merchant VNPay sandbox.
- `CallbackUrl` phải trỏ về backend đang chạy.
- Với môi trường local, VNPay không gọi được IPN nếu máy không public ra internet. Có thể dùng callback redirect để test kết quả thanh toán.

## 5. Chạy Backend

Mở terminal tại thư mục dự án:

```bash
cd BE
dotnet restore
dotnet run --launch-profile http
```

Backend mặc định chạy tại:

```txt
http://localhost:5194
```

Kiểm tra API:

```txt
http://localhost:5194/api/health
http://localhost:5194/swagger
```

## 6. Chạy Frontend

Mở terminal khác:

```bash
cd FE
npm install
npm run dev
```

Frontend mặc định chạy tại:

```txt
http://localhost:5173
```

Do hệ thống dùng `HashRouter`, các đường dẫn sẽ có dạng:

```txt
http://localhost:5173/#/products
http://localhost:5173/#/orders/my
http://localhost:5173/#/admin/orders
```

## 7. Tài Khoản Kiểm Thử

Nếu database có dữ liệu mẫu, có thể dùng các tài khoản sau. Mật khẩu thường dùng trong dữ liệu mẫu là `123456`.

| Email | Vai trò | Ghi chú |
| --- | --- | --- |
| `admin@websiteservice.vn` | Admin | Quản trị hệ thống |
| `customer1@example.com` | Customer | Khách hàng |
| `customer2@example.com` | Customer | Khách hàng |
| `minhanh@studio.com` | Provider | Kho vận/nhà cung cấp |
| `bluepixel@agency.com` | Provider | Kho vận/nhà cung cấp |
| `thanhvu@dev.com` | Provider | Kho vận/nhà cung cấp |

Nếu tài khoản mẫu không tồn tại, đăng ký tài khoản Customer tại:

```txt
http://localhost:5173/#/register
```

Tài khoản Admin/Provider được tạo từ màn hình Admin hoặc thêm trực tiếp trong database.

## 8. Luồng Sử Dụng Cho Khách Hàng

1. Vào trang chủ hoặc danh sách sản phẩm:

```txt
http://localhost:5173/#/
http://localhost:5173/#/products
```

2. Chọn sản phẩm, xem chi tiết.
3. Bấm đặt sản phẩm.
4. Nhập thông tin giao hàng.
5. Chọn phương thức thanh toán:

- COD.
- Chuyển khoản.
- VNPay.
- Ví/thẻ mô phỏng.

6. Xác nhận đơn hàng.
7. Theo dõi đơn tại:

```txt
http://localhost:5173/#/orders/my
```

8. Xem chi tiết đơn, hủy đơn nếu còn ở trạng thái cho phép, hoặc hoàn tất khi đã giao.

## 9. Luồng Thanh Toán

### COD

- Đơn được tạo với trạng thái thanh toán `Pending`.
- Khi giao thành công và thu tiền, Admin/Provider có thể xác nhận đã thu COD.

### Chuyển Khoản

- Đơn được tạo với trạng thái thanh toán `AwaitingTransfer`.
- Admin đối soát và xác nhận thanh toán.

### VNPay

- Đơn được tạo trước với phương thức `VNPAY`.
- Backend tạo URL thanh toán VNPay.
- Người dùng được chuyển sang cổng VNPay.
- Sau khi thanh toán, VNPay redirect về:

```txt
http://localhost:5194/api/vnpay/callback
```

- Backend cập nhật `PaymentStatus` thành `Paid` nếu giao dịch hợp lệ.
- Người dùng được chuyển về trang chi tiết đơn hàng.

Quy tắc nghiệp vụ hiện tại:

- Đơn đã thanh toán không được tạo link VNPay mới.
- Đơn đã hủy hoặc hoàn tất không được tạo thanh toán mới.
- Đơn đang có giao dịch VNPay chờ xử lý không được tạo thêm giao dịch khác.
- Nếu cùng một draft checkout bị gửi lại, backend trả về đơn cũ thay vì tạo đơn trùng.

## 10. Luồng Cho Admin

Truy cập:

```txt
http://localhost:5173/#/admin
```

Các màn hình chính:

- Dashboard tổng quan.
- Quản lý người dùng.
- Quản lý nhà cung cấp/kho vận.
- Duyệt và quản lý sản phẩm.
- Quản lý đơn hàng.
- Báo cáo doanh thu, COD, chuyển khoản, hủy đơn.
- Audit log thao tác quản trị.

Trang đơn hàng Admin:

```txt
http://localhost:5173/#/admin/orders
```

Admin có thể cập nhật trạng thái đơn theo workflow:

```txt
Pending -> Confirmed -> Preparing -> Shipping -> Delivered -> Completed
```

Một số nhánh đặc biệt:

- Có thể hủy đơn ở trạng thái phù hợp.
- Có thể đánh dấu giao thất bại.
- Không cho sửa tiếp khi đơn đã `Completed` hoặc `Cancelled`, trừ việc giữ nguyên trạng thái.

## 11. Luồng Cho Provider

Truy cập:

```txt
http://localhost:5173/#/provider
```

Provider có thể:

- Xem dashboard kho vận.
- Tạo và quản lý sản phẩm.
- Theo dõi đơn được giao cho provider.
- Cập nhật trạng thái xử lý/giao hàng.
- Gửi thông tin bàn giao/giao hàng.
- Xác nhận thu COD nếu đúng điều kiện.

## 12. Các API Quan Trọng

```txt
GET    /api/health
POST   /api/Auth/register
POST   /api/Auth/login
GET    /api/Auth/me

GET    /api/products
GET    /api/products/{id}
GET    /api/categories

POST   /api/orders
GET    /api/orders/my-orders
GET    /api/orders/{id}
PUT    /api/orders/{id}/cancel
PUT    /api/orders/{id}/complete
POST   /api/orders/{id}/reorder

POST   /api/vnpay/orders/{orderId}/payment-url
GET    /api/vnpay/callback
GET    /api/vnpay/ipn

GET    /api/admin/dashboard
GET    /api/admin/orders
PUT    /api/admin/orders/{id}/status
GET    /api/admin/reports

GET    /api/provider/orders
PUT    /api/provider/orders/{id}/status
```

## 13. Lưu Ý Về Database Và Migration

Nếu database đã có bảng nhưng bảng `__EFMigrationsHistory` rỗng, không nên chạy thẳng:

```bash
dotnet ef database update
```

Vì EF có thể cố chạy lại migration đầu và báo bảng đã tồn tại. Khi cần cập nhật schema trong trường hợp này, nên:

- Backup database trước.
- Baseline lại migration history, hoặc
- Chạy script SQL idempotent cho đúng cột/index cần thêm.

## 14. Lỗi Thường Gặp

### Frontend không gọi được API

Kiểm tra backend có chạy chưa:

```txt
http://localhost:5194/api/health
```

Kiểm tra cấu hình API base URL trong `FE/src/api/client.js`.

### Không vào được trang Admin/Provider

Kiểm tra tài khoản đăng nhập có đúng role chưa. Route được bảo vệ theo role.

### VNPay không chuyển trang hoặc không tạo link

Kiểm tra:

- `TmnCode` và `HashSecret`.
- Backend đang chạy ở `http://localhost:5194`.
- Callback URL đúng.
- Đơn chưa bị hủy, chưa hoàn tất, chưa paid, và chưa có giao dịch VNPay đang chờ.

### Build frontend

```bash
cd FE
npm run build
```

### Build backend

```bash
cd BE
dotnet build
```
