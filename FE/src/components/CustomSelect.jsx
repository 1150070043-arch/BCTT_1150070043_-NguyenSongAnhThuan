import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function CustomSelect({ label, icon: Icon, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const handleClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`custom-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      {label && (
        <span className="custom-select__label">
          {Icon && <Icon size={16} />}
          {label}
        </span>
      )}
      <button className="custom-select__button" type="button" onClick={() => setOpen((current) => !current)}>
        <span>{selected?.label || ''}</span>
        <ChevronDown size={17} />
      </button>
      {open && (
        <div className="custom-select__menu">
          {options.map((option) => (
            <button
              className={`custom-select__option ${option.value === value ? 'is-selected' : ''}`}
              type="button"
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
