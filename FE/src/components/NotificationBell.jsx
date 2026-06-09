import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import interactionsApi from '../api/interactions.js';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const response = await interactionsApi.notifications();
      if (response.success) setNotifications(response.data || []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unread = notifications.filter((item) => !item.isRead).length;

  const markRead = async (id) => {
    await interactionsApi.markNotificationRead(id);
    load();
  };

  return (
    <div className="notification-wrap">
      <button className="icon-button" type="button" onClick={() => setOpen((current) => !current)} aria-label="Thông báo">
        <Bell size={19} />
        {unread > 0 && <span>{unread}</span>}
      </button>
      {open && (
        <div className="notification-menu">
          {notifications.length === 0 ? (
            <p>Chưa có thông báo.</p>
          ) : (
            notifications.slice(0, 6).map((item) => (
              <button type="button" key={item.id} onClick={() => markRead(item.id)}>
                <strong>{item.title}</strong>
                <span>{item.content}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
