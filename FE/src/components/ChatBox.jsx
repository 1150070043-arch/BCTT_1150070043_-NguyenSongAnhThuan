import { useEffect, useState } from 'react';
import interactionsApi from '../api/interactions.js';

function ChatBox({ orderId }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const loadMessages = async () => {
    try {
      const response = await interactionsApi.messages(orderId);
      if (response.success) setMessages(response.data || []);
    } catch {
      setError('Không thể tải tin nhắn.');
    }
  };

  useEffect(() => {
    if (orderId) loadMessages();
  }, [orderId]);

  const send = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;

    try {
      const response = await interactionsApi.sendMessage({ orderId, content });
      if (response.success) {
        setContent('');
        loadMessages();
      }
    } catch {
      setError('Không thể gửi tin nhắn.');
    }
  };

  return (
    <section className="work-panel">
      <h2>Trao đổi trong đơn hàng</h2>
      {error && <p className="form-message form-message--error">{error}</p>}
      <div className="chat-list">
        {messages.length === 0 ? (
          <p className="form-message">Chưa có tin nhắn.</p>
        ) : (
          messages.map((message) => (
            <article className="chat-message" key={message.id}>
              <strong>{message.senderName}</strong>
              <p>{message.content}</p>
            </article>
          ))
        )}
      </div>
      <form className="inline-form" onSubmit={send}>
        <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Nhập tin nhắn..." />
        <button className="btn btn--primary" type="submit">Gửi</button>
      </form>
    </section>
  );
}

export default ChatBox;
