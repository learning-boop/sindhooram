/* Line icons drawn at 24×24 with currentColor, so they take the colour of the text around them. */
const Svg = ({ children, size = 20, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></Svg>;
export const BagIcon = (p) => <Svg {...p}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></Svg>;
export const HeartIcon = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </Svg>
);
export const MenuIcon = (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Svg>;
export const CloseIcon = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const ArrowIcon = (p) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const ChevronIcon = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const PlusIcon = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const MinusIcon = (p) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const EyeIcon = (p) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></Svg>;

/* The four promises */
export const LoomIcon = (p) => <Svg {...p}><path d="M4 4v16M20 4v16M4 7h16M4 17h16" /><path d="M8 7v10M12 7v10M16 7v10" /><path d="M6 12h12" strokeDasharray="1.5 1.5" /></Svg>;
export const GemIcon = (p) => <Svg {...p}><path d="M6 4h12l3 5-9 11L3 9l3-5Z" /><path d="M3 9h18M9 4l3 16M15 4l-3 16" /></Svg>;
export const LotusIcon = (p) => <Svg {...p}><path d="M12 5c2 2.2 3 4.6 3 7s-1 4.3-3 6c-2-1.7-3-3.6-3-6s1-4.8 3-7Z" /><path d="M9.4 9.4C7 8.6 4.8 8.8 3 9.6c.4 3.6 2.4 6.6 6.4 8.1M14.6 9.4c2.4-.8 4.6-.6 6.4.2-.4 3.6-2.4 6.6-6.4 8.1" /><path d="M5 20h14" /></Svg>;
export const ShieldIcon = (p) => <Svg {...p}><path d="M12 3 5 6v5c0 4.6 3 8.3 7 10 4-1.7 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>;

export const InstagramIcon = (p) => <Svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" /></Svg>;
export const WhatsAppIcon = (p) => <Svg {...p}><path d="M4 20l1.2-4A8 8 0 1 1 8 18.8L4 20Z" /><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1.2-.5-2.2-1.5-2.8-2.8l.9-1-1-2L9 8.5Z" /></Svg>;
