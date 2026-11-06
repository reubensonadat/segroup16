import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Check, ChevronDown, Clock3, X } from 'lucide-react';

export interface DropdownReactOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

function ShipmentIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="currentColor" d="M23 30a4.006 4.006 0 0 1-3.873-3h-6.253c-.446 1.724-2.014 3-3.874 3s-3.428-1.276-3.873-3H3a1 1 0 0 1-1-1v-8h2v7h1.127C5.572 23.276 7.14 22 9 22s3.428 1.276 3.874 3h6.253A4 4 0 0 1 21 22.537V10h-3V8h4a1 1 0 0 1 1 1v2h3c.4 0 .762.238.919.606l3 7A1 1 0 0 1 30 19v7a1 1 0 0 1-1 1h-2.127A4.006 4.006 0 0 1 23 30m0-6c-1.102 0-2 .898-2 2s.898 2 2 2s2-.897 2-2s-.897-2-2-2M9 24c-1.103 0-2 .898-2 2s.897 2 2 2s2-.897 2-2s-.897-2-2-2m17.873 1H28v-5h-5v2a4.006 4.006 0 0 1 3.873 3M23 18h4.483l-2.142-5H23zM9 16c-3.86 0-7-3.14-7-7s3.14-7 7-7s7 3.14 7 7s-3.14 7-7 7M9 4C6.243 4 4 6.243 4 9s2.243 5 5 5s5-2.243 5-5s-2.243-5-5-5m1.293 7.707l-2-2A1 1 0 0 1 8 9V6h2v2.586l1.707 1.707z" />
    </svg>
  );
}

interface DropdownReactProps {
  options: DropdownReactOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export function DropdownReact({ options, selectedValue, onChange }: DropdownReactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUp, setOpensUp] = useState(false);
  const [currentValue, setCurrentValue] = useState(selectedValue);
  const [menuPosition, setMenuPosition] = useState<CSSProperties>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === currentValue) || options[0];
  if (!selected) return null;

  useEffect(() => {
    setCurrentValue(selectedValue);
  }, [selectedValue]);

  const icon = (option: DropdownReactOption): ReactNode => (
    <span className="dropdown-react-icon" aria-hidden="true">
      {option.icon === 'shipment' && <ShipmentIcon />}
      {option.icon === 'processing' && <Clock3 />}
      {option.icon === 'delivered' && <Check />}
      {option.icon === 'cancelled' && <X />}
    </span>
  );
  useEffect(() => {
    const closeOnOtherDropdown = () => setIsOpen(false);
    document.addEventListener('dropdown-open', closeOnOtherDropdown);
    if (!isOpen) return () => document.removeEventListener('dropdown-open', closeOnOtherDropdown);
    const closeOnOutsideClick = (event: globalThis.MouseEvent) => {
      const target = event.target as Node;
      if (!dropdownRef.current?.contains(target) && !menuRef.current?.contains(target)) setIsOpen(false);
    };
    document.addEventListener('click', closeOnOutsideClick);
    return () => {
      document.removeEventListener('dropdown-open', closeOnOtherDropdown);
      document.removeEventListener('click', closeOnOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    const currentHost = dropdownRef.current?.closest('.dropdown-react-host');
    currentHost?.classList.toggle('is-open', isOpen);
    return () => currentHost?.classList.remove('is-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const updateMenuPosition = () => {
      const trigger = dropdownRef.current?.querySelector('.dropdown-react-trigger');
      const menu = menuRef.current;
      if (!(trigger instanceof HTMLElement) || !menu) return;
      const triggerBounds = trigger.getBoundingClientRect();
      const menuBounds = menu.getBoundingClientRect();
      const gap = 6;
      const margin = 8;
      const fitsBelow = triggerBounds.bottom + gap + menuBounds.height <= window.innerHeight - margin;
      const nextOpensUp = !fitsBelow && triggerBounds.top - gap - menuBounds.height >= margin;
      const top = nextOpensUp
        ? triggerBounds.top - gap - menuBounds.height
        : Math.min(triggerBounds.bottom + gap, window.innerHeight - margin - menuBounds.height);
      const left = Math.min(
        Math.max(margin, triggerBounds.left),
        Math.max(margin, window.innerWidth - margin - menuBounds.width)
      );
      setOpensUp(nextOpensUp);
      setMenuPosition({ top, left });
    };
    const frame = window.requestAnimationFrame(updateMenuPosition);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, options.length]);

  const toggleDropdown = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      const bounds = event.currentTarget.getBoundingClientRect();
      setMenuPosition(undefined);
      document.dispatchEvent(new Event('dropdown-open'));
    }
    setIsOpen((open) => !open);
  };

  const menu = isOpen ? (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        key="options"
        className="dropdown-react-expanded"
        style={menuPosition}
        initial={{ opacity: 0, y: opensUp ? 6 : -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: opensUp ? 6 : -6, scale: 0.97 }}
      >
        <div className="dropdown-react-options">
          {options.map((option) => (
            <motion.button
              type="button"
              key={option.value}
              className={`dropdown-react-option ${option.value === selected.value ? 'is-selected' : ''}`}
              onClick={() => {
                setCurrentValue(option.value);
                onChange(option.value);
                setIsOpen(false);
              }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{icon(option)}</span>
              <span className="dropdown-react-option-copy">
                <strong>{option.label}</strong>
                {option.description && <small>{option.description}</small>}
              </span>
              <span className={`dropdown-react-selection ${option.value === selected.value ? 'is-selected' : ''}`} aria-hidden="true" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  ) : null;

  return (
    <MotionConfig transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 1 }}>
      <motion.div
        ref={dropdownRef}
        className={`dropdown-react ${isOpen ? 'is-open' : ''} ${opensUp ? 'opens-up' : ''}`}
        style={{ borderRadius: 4 }}
      >
        <div className="dropdown-react-inner">
          <button type="button" className="dropdown-react-trigger" onClick={toggleDropdown} aria-expanded={isOpen}>
            <span>{icon(selected)}</span>
            <span>{selected.label}</span>
            <ChevronDown className="dropdown-react-chevron" />
          </button>
        </div>
      </motion.div>
      {menu && createPortal(menu, document.body)}
    </MotionConfig>
  );
}
