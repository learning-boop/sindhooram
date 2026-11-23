'use client';

import { useState } from 'react';
import Link from 'next/link';
import { shopHref } from '@/lib/shop-filters';
import { usePathname } from 'next/navigation';
import { CONFIG, IMG } from '@/lib/config';
import { InstagramIcon, WhatsAppIcon, ArrowIcon } from './Icons';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
          body: JSON.stringify({ email: email.trim(), source: 'store-footer', page: window.location.href }),
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

export default function Footer() {
  const home = usePathname() === '/';
  const wa = CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}` : null;
  const ig = CONFIG.instagram ? `https://instagram.com/${CONFIG.instagram}` : null;
  const year = new Date().getFullYear();

  const columns = [
    { title: 'Shop', links: [['New Arrivals', 'new'], ['Sarees', 'saree'], ...(CONFIG.showDresses ? [['Dresses', 'dress']] : []), ['Kalakaari', '?weave=kalakaari'], ['Best Sellers', '?show=bestseller'], ['All Collections', 'all']] },
    { title: 'About', links: [['Our Story', '#story'], ['Craftsmanship', '#kalakaari'], ['Sell on Sindhooram', `${CONFIG.vendorPanelUrl}/register`], ['Contact Us', CONFIG.email ? `mailto:${CONFIG.email}` : null]] },
    { title: 'Help', links: [['My Account', '/account'], ['Track Your Order', '/track-order'], ['Shipping & Delivery'], ['Returns & Exchanges'], [CONFIG.showDresses ? 'Size Guide' : 'Draping Guide'], ['FAQs']] },
  ];

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <span className="footer__crest"><img src={IMG.mark560} alt="" width="560" height="603" /></span>
          <p className="footer__name">Sindhooram</p>
          <p className="footer__sub">The color of tradition</p>
          <p className="footer__tag">Thoughtfully curated sarees and timeless pieces from India’s finest weavers, brought to your everyday.</p>
          <p className="script footer__script">Tradition Lives Beautifully</p>
        </div>
        {columns.map((col) => (
          <div className="footer__col" key={col.title}>
            <p className="footer__title">{col.title}</p>
            {col.links.map(([label, to]) => {
              if (!to) return <span key={label}>{label}</span>;
              if (to.startsWith('#')) return <a key={label} href={home ? to : `/${to}`}>{label}</a>;
              if (to.startsWith('/')) return <Link key={label} href={to}>{label}</Link>;
              if (/^(https?:|mailto:)/.test(to)) return <a key={label} href={to} target={to.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{label}</a>;
              return <Link key={label} href={shopHref(to)}>{label}</Link>;
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
        <p>© {year} Sindhooram. All rights reserved.</p>
        <p>Privacy Policy · Terms of Service</p>
      </div>
    </footer>
  );
}
