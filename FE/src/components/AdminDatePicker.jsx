import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthTitle(date) {
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
}

function AdminDatePicker({ value, onChange, placeholder = 'Chọn ngày' }) {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const selectedDate = parseDate(value);
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const rootRef = useRef(null);
  const popoverRef = useRef(null);

  const syncPopoverPosition = () => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const width = 304;
    const left = Math.min(rect.left, window.innerWidth - width - 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 360 && rect.top > spaceBelow;

    setPopoverStyle({
      position: 'fixed',
      top: openUp ? 'auto' : `${rect.bottom + 8}px`,
      bottom: openUp ? `${window.innerHeight - rect.top + 8}px` : 'auto',
      left: `${Math.max(12, left)}px`,
      width: `${width}px`,
    });
  };

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    syncPopoverPosition();

    const handlePosition = () => syncPopoverPosition();
    window.addEventListener('scroll', handlePosition, true);
    window.addEventListener('resize', handlePosition);
    return () => {
      window.removeEventListener('scroll', handlePosition, true);
      window.removeEventListener('resize', handlePosition);
    };
  }, [open]);

  const days = useMemo(() => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [viewDate]);

  const changeMonth = (delta) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const selectDate = (date) => {
    onChange(toInputValue(date));
    setOpen(false);
  };

  const todayValue = toInputValue(new Date());

  const popover = open ? (
    <div className="admin-date-picker__popover" style={popoverStyle} ref={popoverRef}>
      <div className="admin-date-picker__header">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Tháng trước"><ChevronLeft size={17} /></button>
        <strong>{monthTitle(viewDate)}</strong>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Tháng sau"><ChevronRight size={17} /></button>
      </div>
      <div className="admin-date-picker__weekdays">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="admin-date-picker__grid">
        {days.map((date) => {
          const dateValue = toInputValue(date);
          const isCurrentMonth = date.getMonth() === viewDate.getMonth();
          return (
            <button
              className={[
                !isCurrentMonth ? 'is-muted' : '',
                dateValue === value ? 'is-selected' : '',
                dateValue === todayValue ? 'is-today' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              key={dateValue}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectDate(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <div className="admin-date-picker__footer">
        <button type="button" onClick={() => selectDate(new Date())}>Hôm nay</button>
        <button type="button" onClick={() => { onChange(''); setOpen(false); }}><X size={14} />Xóa</button>
      </div>
    </div>
  ) : null;

  return (
    <div className={`admin-date-picker ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        className="admin-date-picker__button"
        type="button"
        onClick={() => {
          syncPopoverPosition();
          setOpen((current) => !current);
        }}
      >
        <span>{selectedDate ? selectedDate.toLocaleDateString('vi-VN') : placeholder}</span>
        <CalendarDays size={17} />
      </button>
      {typeof document !== 'undefined' ? createPortal(popover, document.body) : popover}
    </div>
  );
}

export default AdminDatePicker;
