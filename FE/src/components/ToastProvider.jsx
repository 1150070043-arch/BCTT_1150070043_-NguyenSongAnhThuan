import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { consumePendingToasts, showToast, TOAST_EVENT } from '../utils/toast.js';

const ToastContext = createContext({ notify: () => {} });

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

function getToastType(element) {
  if (element.classList.contains('form-message--error')) return 'error';
  if (element.classList.contains('admin-message')) return 'info';
  return 'success';
}

function normalizeToast(toast) {
  if (typeof toast === 'string') {
    return { message: toast, type: 'info' };
  }

  return {
    type: toast?.type || 'info',
    title: toast?.title || '',
    message: toast?.message || '',
    duration: toast?.duration ?? 4200,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const lastToastRef = useRef({ key: '', time: 0 });

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((input) => {
    const toast = normalizeToast(input);
    if (!toast.message) return;

    const key = `${toast.type}:${toast.title}:${toast.message}`;
    const now = Date.now();
    if (lastToastRef.current.key === key && now - lastToastRef.current.time < 1400) {
      return;
    }
    lastToastRef.current = { key, time: now };

    const id = `${now}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { ...toast, id }].slice(-5));

    window.setTimeout(() => removeToast(id), toast.duration);
  }, [removeToast]);

  useEffect(() => {
    const handleToast = (event) => notify(event.detail);
    window.addEventListener(TOAST_EVENT, handleToast);

    consumePendingToasts().forEach((toast) => notify(toast));

    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, [notify]);

  useEffect(() => {
    const seen = new WeakMap();

    const scanMessages = () => {
      document.querySelectorAll('.form-message, .admin-message').forEach((element) => {
        const message = element.textContent?.trim();
        if (!message) return;
        if (seen.get(element) === message) return;

        seen.set(element, message);
        notify({ type: getToastType(element), message });
      });
    };

    const observer = new MutationObserver(scanMessages);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    scanMessages();
    return () => observer.disconnect();
  }, [notify]);

  const value = useMemo(() => ({ notify, showToast }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <article className={`toast toast--${toast.type}`} key={toast.id}>
              <span className="toast__icon"><Icon size={20} /></span>
              <div className="toast__body">
                {toast.title && <strong>{toast.title}</strong>}
                <p>{toast.message}</p>
              </div>
              <button className="toast__close" type="button" aria-label="Dong thong bao" onClick={() => removeToast(toast.id)}>
                <X size={16} />
              </button>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
