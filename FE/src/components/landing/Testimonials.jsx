import { Star } from 'lucide-react';

const reviews = [
  ['Minh Khang', 'Chủ quán cafe', 'Đá bi giữ lạnh tốt, giao đúng giờ nên ca sáng không bị thiếu đá.'],
  ['Thảo Vy', 'Gia đình', 'Đặt túi 5kg cho tiệc nhỏ rất tiện, đá sạch và đóng gói gọn.'],
  ['Quốc Bảo', 'Nhà hàng', 'Combo sự kiện xử lý nhanh, số lượng lớn mà vẫn giao đúng lịch.'],
  ['Anh Phúc', 'Đại lý', 'Giá sỉ rõ ràng, nhập lại dễ, đội giao hàng phản hồi nhanh.'],
];

function Testimonials() {
  return (
    <section className="pi-section pi-testimonials" id="reviews">
      <div className="pi-container">
        <div className="pi-section-head">
          <span className="pi-kicker">Testimonials</span>
          <h2>Khách hàng nói gì?</h2>
          <p>Một vài phản hồi mẫu để mô phỏng trải nghiệm mua hàng tại Ngọc Anh Phú Thịnh 9.</p>
        </div>

        <div className="pi-review-grid">
          {reviews.map(([name, role, text]) => (
            <article className="pi-review-card" key={name}>
              <div className="pi-stars">
                {Array.from({ length: 5 }, (_, index) => <Star size={16} fill="currentColor" key={index} />)}
              </div>
              <p>{text}</p>
              <div>
                <strong>{name}</strong>
                <span>{role}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
