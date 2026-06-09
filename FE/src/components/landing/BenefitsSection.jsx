import { BadgeCheck, Factory, HandCoins, PackageCheck, ShieldCheck, Truck } from 'lucide-react';

const benefits = [
  ['Nguồn nước lọc đạt chuẩn', Factory],
  ['Đảm bảo vệ sinh an toàn thực phẩm', ShieldCheck],
  ['Đóng gói tiện lợi', PackageCheck],
  ['Giao nhanh trong ngày', Truck],
  ['Phù hợp gia đình, quán nước, nhà hàng, sự kiện', BadgeCheck],
  ['Giá tốt cho khách sỉ và đại lý', HandCoins],
];

function BenefitsSection() {
  return (
    <section className="pi-section pi-benefits" id="benefits">
      <div className="pi-container pi-benefit-grid">
        <div className="pi-benefit-copy">
          <span className="pi-kicker">Why Ngọc Anh Phú Thịnh 9</span>
          <h2>Vì sao chọn Ngọc Anh Phú Thịnh 9?</h2>
          <p>
            Công ty TNHH TM SX Ngọc Anh Phú Thịnh 9 tập trung vào chất lượng đá, quy cách đóng gói và tốc độ giao để khách mua nhanh,
            dùng an tâm và dễ đặt lại.
          </p>
          <div className="pi-benefit-stat">
            <strong>24h</strong>
            <span>Giao nhanh theo tuyến nội thành</span>
          </div>
        </div>

        <div className="pi-benefit-panels">
          {benefits.map(([label, Icon], index) => (
            <article className="pi-benefit-panel" key={label}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <Icon size={24} />
              <strong>{label}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BenefitsSection;
