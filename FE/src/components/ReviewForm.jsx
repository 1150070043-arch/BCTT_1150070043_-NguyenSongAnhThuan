import { useState } from 'react';
import interactionsApi from '../api/interactions.js';

function ReviewForm({ orderId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await interactionsApi.createReview({ orderId, rating: Number(rating), comment });
      setMessage(response.message);
      if (response.success) onDone?.();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể gửi đánh giá.');
    }
  };

  return (
    <section className="work-panel">
      <h2>Đánh giá đơn hàng</h2>
      <form className="auth-form" onSubmit={submit}>
        <label>
          Điểm đánh giá
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </label>
        <label>
          Nhận xét
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="4" />
        </label>
        {message && <p className="form-message">{message}</p>}
        <button className="btn btn--primary" type="submit">Gửi đánh giá</button>
      </form>
    </section>
  );
}

export default ReviewForm;
