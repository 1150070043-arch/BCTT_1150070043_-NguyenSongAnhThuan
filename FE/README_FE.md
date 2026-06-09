# Frontend

Frontend được xây dựng bằng ReactJS + Vite.

## Milestone 1

Landing page gồm header sticky, hero, dịch vụ nổi bật, quy trình, lý do chọn hệ thống, provider mẫu, bảng giá, đánh giá khách hàng và footer.

Animation hiện dùng CSS animation kết hợp Intersection Observer cho section reveal khi scroll.

## Route hiện có

- `#/` - Landing page
- `#/packages` - Danh sách gói dịch vụ, tìm kiếm, lọc, sort
- `#/packages/:id` - Chi tiết gói dịch vụ
- `#/login` - Đăng nhập
- `#/register` - Đăng ký
- `#/forgot-password` - Giao diện quên mật khẩu tạm
- `#/customer` - Customer dashboard cơ bản
- `#/orders/create/:packageId` - Nhập yêu cầu đặt gói
- `#/checkout/:packageId` - Checkout giả lập
- `#/orders/my` - Đơn hàng của tôi
- `#/orders/:id` - Chi tiết đơn, timeline, chat, review
- `#/provider` - Provider dashboard cơ bản
- `#/provider/packages` - Gói dịch vụ của provider
- `#/provider/packages/create` - Tạo gói provider
- `#/provider/orders` - Đơn hàng của provider
- `#/provider/orders/:id` - Chi tiết đơn provider
- `#/provider/orders/:id/delivery` - Nộp bàn giao
- `#/admin` - Admin dashboard cơ bản
- `#/admin/users` - Quản lý user
- `#/admin/providers` - Duyệt provider
- `#/admin/packages` - Duyệt gói dịch vụ
- `#/admin/orders` - Danh sách đơn hàng
- `#/admin/reports` - Báo cáo cơ bản

## Lệnh chạy

```bash
cd FE
npm install
npm run dev
```

## Lệnh build

```bash
cd FE
npm run build
```

