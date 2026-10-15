import { useState } from 'react';
import mark from '../assets/mark-560.png';
import { CONFIG } from '../config';
import { SHOW_DRESSES } from './data';
import { InstagramIcon, WhatsAppIcon, ArrowIcon } from './Icons';

const YEAR = new Date().getFullYear();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLUMNS = [
  { title: 'Shop', links: [['New Arrivals', 'new'], ['Sarees', 'saree'], ...(SHOW_DRESSES ? [['Dresses', 'dress']] : []), ['Kalakaari', 'all'], ['Best Sellers', 'all'], ['All Collections', 'all']] },
  { title: 'About', links: [['Our Story', '#story'], ['Craftsmanship', '#kalakaari'], ['Journal'], ['Contact Us']] },
  { title: 'Help', links: [['Track Your Order'], ['Shipping & Delivery'], ['Returns & Exchanges'], [SHOW_DRESSES ? 'Size Guide' : 'Draping Guide'], ['FAQs']] },
];

/* Newsletter sign-up posts to CONFIG.formEndpoint, the same one the coming-soon page uses. */
function Newsletter() {
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState('idle'); // idle | error | sending | done

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setState('error'); return; }
    setState('sending');
    if (CONFIG.formEndpoint) {
      try {
        await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: email.trim(), source: 'store-footer', page: location.href }),
        });
      } catch { /* the thank-you still shows; the list is best effort */ }
    }
    setState('done');
  };

  if (state === 'done') return <p className="news__done">Thank you. New collections reach you first.</p>;
  return (
    <form className="news" onSubmit={submit} noValidate>
      <label htmlFor="news-email">Be the first to know about new collections, exclusive offers and stories.</label>
      <div className="news__row">
        <input id="news-email" type="email" placeholder="Your email address" value={email} autoComplete="email"
          onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
          aria-invalid={state === 'error'} />
        <button type="submit" aria-label="Subscribe" disabled={state === 'sending' || !agree}><ArrowIcon size={16} /></button>
      </div>
      <label className="news__agree">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        I agree to receive emails from Sindhooram.
      </label>
      {state === 'error' && <p className="news__err">Please enter a valid email.</p>}
    </form>
  );
}

export default function Footer({ onShop }) {
  const wa = CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}` : null;
  const ig = CONFIG.instagram ? `https://instagram.com/${CONFIG.instagram}` : null;
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <span className="footer__crest"><img src={mark} alt="" width="560" height="603" /></span>
          <p className="footer__name">Sindhooram</p>
          <p className="footer__sub">The color of tradition</p>
          <p className="footer__tag">Thoughtfully curated sarees and timeless pieces, bringing India’s finest craftsmanship to your everyday.</p>
          <p className="script footer__script">Tradition Lives Beautifully</p>
        </div>
        {COLUMNS.map((col) => (
          <div className="footer__col" key={col.title}>
            <p className="footer__title">{col.title}</p>
            {col.links.map(([label, to]) => {
              if (!to) return <span key={label}>{label}</span>;
              if (to.startsWith('#')) return <a key={label} href={to}>{label}</a>;
              return <button type="button" key={label} onClick={() => onShop(to)}>{label}</button>;
            })}
          </div>
        ))}
        <div className="footer__col footer__col--news">
          <p className="footer__title">Stay in touch</p>
          <Newsletter />
          <div className="footer__social">
            {ig && <a href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon size={18} /></a>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><WhatsAppIcon size={18} /></a>}
            {CONFIG.email && <a className="footer__mail" href={`mailto:${CONFIG.email}`}>{CONFIG.email}</a>}
          </div>
        </div>
      </div>
      <div className="footer__base">
        <p>© {YEAR} Sindhooram. All rights reserved.</p>
        <p>Privacy Policy · Terms of Service</p>
      </div>
    </footer>
  );
}
