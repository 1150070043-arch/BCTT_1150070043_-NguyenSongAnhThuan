import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function AdminSelect({ value, options, onChange, label, disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  const syncMenuPosition = () => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 230);
    const left = Math.min(rect.left, window.innerWidth - width - 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 300 && rect.top > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      top: openUp ? 'auto' : `${rect.bottom + 8}px`,
      bottom: openUp ? `${window.innerHeight - rect.top + 8}px` : 'auto',
      left: `${Math.max(12, left)}px`,
      width: `${width}px`,
    });
  };

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    syncMenuPosition();

    const handlePosition = () => syncMenuPosition();
    window.addEventListener('scroll', handlePosition, true);
    window.addEventListener('resize', handlePosition);
    return () => {
      window.removeEventListener('scroll', handlePosition, true);
      window.removeEventListener('resize', handlePosition);
    };
  }, [open]);

  const menu = open ? (
    <div className="admin-select__menu" role="listbox" style={menuStyle} ref={menuRef}>
      {options.map((option) => (
        <button
          className={`admin-select__option status-tone--${String(option.value || '').toLowerCase()} ${option.value === value ? 'is-selected' : ''}`}
          type="button"
          role="option"
          aria-selected={option.value === value}
          key={option.value}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange(option.value);
            setOpen(false);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className={`admin-select ${className} ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`} ref={rootRef}>
      {label && <span className="admin-select__label">{label}</span>}
      <button
        className="admin-select__button"
        type="button"
        disabled={disabled}
        onClick={() => {
          syncMenuPosition();
          setOpen((current) => !current);
        }}
      >
        <span>{selected?.label || 'Chọn'}</span>
        <ChevronDown size={17} />
      </button>
      {typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </div>
  );
}

export default AdminSelect;
