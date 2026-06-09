import { Building2, Coffee, Home, Store, UsersRound } from 'lucide-react';

const customers = [
  ['Gia đình', 'Dùng hằng ngày, tiệc nhỏ, picnic cuối tuần.', Home],
  ['Quán cafe / trà sữa', 'Nguồn đá ổn định cho giờ cao điểm.', Coffee],
  ['Nhà hàng', 'Đóng gói sạch cho bếp và khu phục vụ.', Building2],
  ['Tiệc cưới / sự kiện', 'Combo số lượng lớn, giao theo lịch.', UsersRound],
  ['Đại lý / kho phân phối', 'Giá sỉ, tuyến giao đều, dễ nhập lại.', Store],
];

function CustomerTypes() {
  return (
    <section className="pi-section pi-customers">
      <div className="pi-container">
        <div className="pi-section-head pi-section-head-wide">
          <span className="pi-kicker">Customer types</span>
          <h2>Phục vụ từ gia đình đến khách sỉ</h2>
          <p>Ngọc Anh Phú Thịnh 9 thiết kế quy cách sản phẩm theo từng nhóm khách để việc đặt hàng gọn hơn.</p>
        </div>

        <div className="pi-customer-strip">
          {customers.map(([title, text, Icon]) => (
            <article className="pi-customer-card" key={title}>
              <Icon size={26} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CustomerTypes;
