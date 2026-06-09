# Database Notes

## Thông tin Database

- **Database Name:** `NgocAnhPhuThinhIceDb`
- **DBMS:** Microsoft SQL Server
- **Connection String:** `Server=.\SQLEXPRESS;Database=NgocAnhPhuThinhIceDb;Trusted_Connection=True;TrustServerCertificate=True;`

## Cấu trúc bảng

### Users
Lưu thông tin người dùng hệ thống: khách hàng, nhân sự công ty và quản trị viên.

- `Id` (PK)
- `FullName`
- `Email` (Unique)
- `PasswordHash`
- `PhoneNumber`
- `Role` (`Customer`, `Provider`, `Admin`)
- `IsActive`
- `CreatedAt`, `UpdatedAt`

### Suppliers
Thông tin đơn vị cung cấp và vận hành sản phẩm đá tinh khiết.

- `Id` (PK)
- `UserId` (FK -> Users)
- `SupplierName`
- `Description`
- `CapabilitiesJson`
- `Rating`
- `CompletedOrders`
- `IsVerifiedSupplier`
- `CreatedAt`, `UpdatedAt`

### ProductCategories
Danh mục sản phẩm đá tinh khiết.

- `Id` (PK)
- `Name`
- `Description`
- `Icon`
- `CreatedAt`

### Products
Sản phẩm đá tinh khiết đang bán trên hệ thống.

- `Id` (PK)
- `SupplierId` (FK -> Suppliers)
- `Name`
- `ShortDescription`
- `Description`
- `Price`
- `Category`
- `DeliveryDays`
- `MinOrderQuantity`
- `SpecificationsJson`
- `Sku`
- `Unit`
- `StockQuantity`
- `ImageUrl`
- `IsFeatured`
- `IsActive`
- `IsPublished`
- `CreatedAt`, `UpdatedAt`

### Orders
Đơn đặt hàng của khách.

- `Id` (PK)
- `CustomerId` (FK -> Users)
- `SupplierId` (FK -> Suppliers)
- `PrimaryProductId` (FK -> Products)
- `Status`
- `TotalPrice`
- `Requirements`
- `ShippingName`
- `ShippingPhone`
- `ShippingAddress`
- `DeliveryMethod`
- `CreatedAt`, `UpdatedAt`, `CompletedAt`

### OrderItems
Chi tiết sản phẩm trong đơn hàng.

- `Id` (PK)
- `OrderId` (FK -> Orders)
- `ProductId` (FK -> Products)
- `Quantity`
- `UnitPrice`
- `LineTotal`

### Payments
Thông tin thanh toán.

- `Id` (PK)
- `OrderId` (FK -> Orders)
- `Amount`
- `PaymentMethod`
- `PaymentStatus`
- `PaidAt`
- `CreatedAt`

### Reviews
Đánh giá của khách hàng.

- `Id` (PK)
- `OrderId` (FK -> Orders)
- `CustomerId` (FK -> Users)
- `SupplierId` (FK -> Suppliers)
- `Rating`
- `Comment`
- `CreatedAt`

### ShipmentUpdates
Lịch sử giao hàng và cập nhật xử lý đơn.

- `Id` (PK)
- `OrderId` (FK -> Orders)
- `TrackingCode`
- `Notes`
- `AttachmentsJson`
- `Status`
- `SubmittedAt`
- `ReviewedAt`

### OrderMessages
Tin nhắn trao đổi trong đơn hàng.

- `Id` (PK)
- `OrderId` (FK -> Orders)
- `SenderId` (FK -> Users)
- `Content`
- `CreatedAt`

### Notifications
Thông báo cho người dùng.

- `Id` (PK)
- `UserId` (FK -> Users)
- `Title`
- `Content`
- `IsRead`
- `CreatedAt`

## Quan hệ chính

```text
Users (1) ---> (0..1) Suppliers
Users (1) ---> (N) Orders
Users (1) ---> (N) Reviews

Suppliers (1) ---> (N) Products
Suppliers (1) ---> (N) Orders
Suppliers (1) ---> (N) Reviews

Products (1) ---> (N) OrderItems
Orders (1) ---> (N) OrderItems
Orders (1) ---> (N) ShipmentUpdates
Orders (1) ---> (N) OrderMessages
Orders (1) ---> (0..1) Review
```

## Cách chạy scripts

```powershell
sqlcmd -S .\SQLEXPRESS -E -b -f 65001 -i .\Database\init.sql
sqlcmd -S .\SQLEXPRESS -E -b -f 65001 -i .\Database\seed.sql
```

## Tài khoản test

Tất cả tài khoản đều có mật khẩu: `123456`

- **Admin:** `admin@ngocanhphuthinh9.vn`
- **Nhân sự công ty:** `sales@ngocanhphuthinh9.vn`
- **Khách hàng:** `customer1@example.com`, `customer2@example.com`, `customer3@example.com`

## Lưu ý

- Password được hash bằng SHA256.
- Các cột JSON được lưu dạng chuỗi để dễ chạy trên SQL Server Express.
- Script seed dùng UTF-8, nên khi chạy bằng `sqlcmd` cần thêm `-f 65001`.
