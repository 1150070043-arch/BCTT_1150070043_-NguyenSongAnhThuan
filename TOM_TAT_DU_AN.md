# Tóm Tắt Dự Án

## 1. Tên Dự Án

Hệ thống quản lý bán đá Ngọc Anh Phú Thịnh 9.

## 2. Mục Tiêu

Dự án xây dựng một hệ thống thương mại điện tử nội bộ cho doanh nghiệp cung cấp nước đá, hỗ trợ khách hàng đặt sản phẩm, theo dõi đơn hàng, thanh toán, đồng thời hỗ trợ Admin và Provider quản lý sản phẩm, kho vận, giao hàng và báo cáo.

## 3. Phạm Vi Chức Năng

### Khách hàng

- Xem trang chủ, danh sách sản phẩm và chi tiết sản phẩm.
- Tìm kiếm, lọc danh mục, sắp xếp sản phẩm.
- Đăng ký, đăng nhập, quên mật khẩu.
- Quản lý hồ sơ và địa chỉ giao hàng.
- Tạo đơn hàng.
- Chọn phương thức thanh toán: COD, chuyển khoản, VNPay, ví/thẻ mô phỏng.
- Xem danh sách đơn hàng cá nhân.
- Theo dõi trạng thái đơn hàng.
- Hủy đơn khi còn trong trạng thái hợp lệ.
- Xác nhận hoàn tất khi đã nhận hàng.
- Đặt lại đơn từ đơn cũ.
- Gửi yêu cầu hỗ trợ và đánh giá đơn hàng.

### Provider/Kho vận

- Xem dashboard xử lý đơn.
- Quản lý sản phẩm thuộc provider.
- Tạo, sửa, bật/tắt sản phẩm.
- Theo dõi đơn hàng được phân công.
- Cập nhật trạng thái xử lý và giao hàng.
- Gửi thông tin giao hàng/bàn giao.
- Xác nhận thu tiền COD khi đúng điều kiện.

### Admin

- Xem dashboard tổng quan hệ thống.
- Quản lý người dùng.
- Tạo tài khoản nội bộ Admin/Provider.
- Duyệt nhà cung cấp.
- Duyệt và quản lý sản phẩm.
- Quản lý toàn bộ đơn hàng.
- Cập nhật trạng thái đơn theo workflow.
- Xác nhận thanh toán COD/chuyển khoản.
- Xem báo cáo vận hành, doanh thu, COD, chuyển khoản, đơn hủy.
- Xem audit log thao tác quản trị.

## 4. Công Nghệ Sử Dụng

### Frontend

- ReactJS.
- Vite.
- React Router HashRouter.
- Axios.
- Framer Motion.
- Three.js.
- GSAP.
- Lucide React.
- CSS thuần.

### Backend

- ASP.NET Core 8 Web API.
- Entity Framework Core.
- SQL Server.
- JWT Bearer Authentication.
- Swagger/OpenAPI.
- VNPay.NET.
- SMTP email service cho quên mật khẩu.

## 5. Kiến Trúc Tổng Quan

```txt
Người dùng
   |
   v
Frontend React/Vite
   |
   v
Backend ASP.NET Core Web API
   |
   v
SQL Server
```

Các nhóm API chính:

- `AuthController`: đăng ký, đăng nhập, quên mật khẩu, thông tin tài khoản.
- `PackagesController`: sản phẩm.
- `OrdersController`: đơn hàng phía khách hàng.
- `VnpayController`: tạo URL thanh toán và nhận callback VNPay.
- `AdminController`: nghiệp vụ quản trị.
- `ProviderWorkController`: nghiệp vụ provider/kho vận.
- `ReviewsController`: đánh giá.
- `NotificationsController`: thông báo.
- `MessagesController`: trao đổi trong đơn.

## 6. Mô Hình Dữ Liệu Chính

Các bảng/model quan trọng:

- `Users`: tài khoản người dùng.
- `Providers`: thông tin provider/kho vận.
- `Packages`/`Products`: sản phẩm đá.
- `ProductImages`: hình ảnh sản phẩm.
- `Orders`: đơn hàng.
- `OrderItems`: chi tiết sản phẩm trong đơn.
- `Payments`: thông tin thanh toán.
- `OrderStatusHistories`: lịch sử trạng thái đơn.
- `InventoryTransactions`: lịch sử biến động tồn kho.
- `Notifications`: thông báo.
- `SupportRequests`: yêu cầu hỗ trợ.
- `Reviews`: đánh giá.
- `AdminAuditLogs`: lịch sử thao tác admin.

## 7. Workflow Đơn Hàng

Trạng thái đơn hàng chính:

```txt
Pending -> Confirmed -> Preparing -> Shipping -> Delivered -> Completed
```

Trạng thái đặc biệt:

```txt
Cancelled
DeliveryFailed
```

Quy tắc chính:

- Khách hàng chỉ được hủy đơn khi đơn còn ở trạng thái cho phép.
- Khách hàng chỉ được xác nhận hoàn tất khi đơn đã giao.
- Provider/Admin chỉ cập nhật trạng thái theo workflow hợp lệ.
- Đơn đã `Completed` hoặc `Cancelled` không được tiếp tục thay đổi nghiệp vụ thông thường.
- Khi tạo đơn, hệ thống giữ tồn kho bằng cách trừ số lượng sản phẩm.
- Khi hủy đơn hợp lệ, hệ thống hoàn tồn kho.

## 8. Workflow Thanh Toán

Các phương thức thanh toán:

- `MockCOD`: thanh toán khi nhận hàng.
- `MockBanking`: chuyển khoản, chờ admin đối soát.
- `VNPAY`: thanh toán qua cổng VNPay.
- `MockWallet` và `MockCard`: mô phỏng thanh toán online thành công.

Trạng thái thanh toán:

- `Pending`: chờ thanh toán/thu tiền.
- `AwaitingTransfer`: chờ xác nhận chuyển khoản.
- `AwaitingVnpay`: chờ giao dịch VNPay.
- `Paid`: đã thanh toán.
- `Failed`: giao dịch thất bại.
- `Cancelled`: thanh toán bị hủy theo đơn.

Nghiệp vụ VNPay đã siết:

- Không tạo link thanh toán cho đơn đã paid.
- Không tạo link thanh toán cho đơn đã hủy hoặc hoàn tất.
- Không tạo nhiều giao dịch VNPay song song cho cùng một đơn.
- Cho phép retry khi giao dịch trước thất bại.

## 9. Chống Tạo Đơn Trùng

Frontend tạo `draftId` cho mỗi lượt nhập form đặt hàng. Khi checkout, `draftId` được gửi lên backend dưới dạng `ClientOrderKey`.

Backend kiểm tra:

```txt
CustomerId + ClientOrderKey
```

Nếu đã có đơn với cặp khóa này, API trả về đơn cũ thay vì tạo đơn mới. Quy tắc này giúp chặn các trường hợp:

- Người dùng bấm back rồi submit lại cùng checkout.
- Trình duyệt phục hồi tab checkout cũ.
- Request tạo đơn bị gửi lại.
- Double submit ở cùng một draft.

Mỗi lần đặt đơn mới hợp lệ sẽ có `ClientOrderKey` mới nên không chặn nhầm việc khách hàng đặt thêm đơn khác.

## 10. Bảo Mật Và Phân Quyền

- Hệ thống dùng JWT Bearer Token.
- Route frontend được bảo vệ theo vai trò.
- API backend dùng `[Authorize]` và `[Authorize(Roles = "...")]`.
- Customer chỉ truy cập đơn hàng của chính mình.
- Provider chỉ truy cập đơn hàng/sản phẩm thuộc provider của mình.
- Admin có quyền quản lý toàn hệ thống.

## 11. Điểm Nổi Bật

- Giao diện sản phẩm và đơn hàng responsive.
- Trạng thái đơn hàng phân màu theo từng trạng thái.
- Custom select thay thế select mặc định.
- Dashboard và báo cáo cho Admin.
- Quản lý tồn kho qua inventory transaction.
- Tích hợp VNPay sandbox.
- Có audit log cho thao tác quản trị.
- Có cơ chế chống tạo đơn trùng ở tầng nghiệp vụ backend.

## 12. Cấu Trúc Thư Mục

```txt
.
├── BE
│   ├── Controllers
│   ├── Data
│   ├── DTOs
│   ├── Helpers
│   ├── Migrations
│   ├── Models
│   ├── Services
│   ├── Program.cs
│   └── appsettings.json
│
├── FE
│   ├── public
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── pages
│   │   ├── routes
│   │   ├── styles
│   │   └── utils
│   ├── package.json
│   └── vite.config.js
│
├── HDSD.md
└── TOM_TAT_DU_AN.md
```

## 13. Hạn Chế Hiện Tại

- VNPay IPN local cần public URL hoặc tunnel như ngrok nếu muốn VNPay gọi trực tiếp về máy dev.
- Database hiện tại có thể đã tồn tại dữ liệu nhưng migration history không đồng bộ, cần cẩn thận khi chạy `dotnet ef database update`.
- Chưa có bộ test tự động đầy đủ cho toàn bộ workflow.
- Một số nội dung cũ trong README gốc còn mô tả theo dự án website service trước đó, tài liệu này là bản tóm tắt cập nhật theo hệ thống bán đá hiện tại.

## 14. Hướng Phát Triển

- Bổ sung test tự động cho workflow đặt hàng, thanh toán và trạng thái đơn.
- Chuẩn hóa migration history cho database hiện tại.
- Tách thêm service layer cho các nghiệp vụ lớn như order, payment, inventory.
- Bổ sung thông báo real-time.
- Hoàn thiện IPN VNPay qua môi trường public/staging.
- Bổ sung phân tích doanh thu theo thời gian, sản phẩm và khu vực giao hàng.
