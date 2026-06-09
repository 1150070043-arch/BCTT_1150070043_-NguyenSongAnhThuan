import { CheckCircle2, ClipboardList, MapPin, PackageSearch } from 'lucide-react';

const steps = [
  ['Chọn loại đá', 'Chọn đúng sản phẩm và quy cách đóng gói.', PackageSearch],
  ['Nhập số lượng', 'Điền số túi/khối cần giao trong ngày.', ClipboardList],
  ['Xác nhận đơn hàng', 'Kiểm tra giá, địa chỉ và phương thức thanh toán.', CheckCircle2],
  ['Giao đá tận nơi', 'Ngọc Anh Phú Thịnh 9 chuẩn bị đơn và giao theo tuyến.', MapPin],
];

function OrderProcess() {
  return (
    <section className="pi-section pi-process" id="process">
      <div className="pi-container">
        <div className="pi-section-head">
          <span className="pi-kicker">Order process</span>
          <h2>Đặt đá nhanh trong 4 bước</h2>
          <p>Từ chọn sản phẩm đến giao tận nơi, mọi bước được gom gọn để đặt hàng nhanh hơn.</p>
        </div>

        <div className="pi-process-map">
          <div className="pi-process-line">
            <span className="pi-process-line-fill" />
          </div>
          {steps.map(([title, text, Icon], index) => (
            <article className="pi-process-step" key={title}>
              <span className="pi-process-number">{index + 1}</span>
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

export default OrderProcess;
