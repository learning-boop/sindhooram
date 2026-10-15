import { useEffect, useState } from 'react';
import mark from '../assets/mark-160.png';
import { NAV } from './data';
import { useStore } from './cart';
import { BagIcon, ChevronIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon } from './Icons';

/* The bar: links left, emblem centred, shop tools right.
   Transparent over the hero; turns solid green once the page scrolls. */
export default function Header({ onShop, onSearch }) {
  const { count, wishlist, setBagOpen } = useStore();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(null);       // label of the open mega menu
  const [drawer, setDrawer] = useState(false);  // mobile menu
  const [section, setSection] = useState(null); // open accordion in the mobile menu

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = drawer ? 'hidden' : '';
    if (!drawer) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  const go = (filter) => { setOpen(null); setDrawer(false); onShop(filter); };

  return (
    <>
      <header className={`nav${solid || open ? ' is-solid' : ''}`} onMouseLeave={() => setOpen(null)}>
        <div className="nav__bar">
          <button className="icon-btn nav__burger" type="button" aria-label="Open menu" onClick={() => setDrawer(true)}>
            <MenuIcon size={24} />
          </button>

          <nav className="nav__links" aria-label="Main">
            <a href="#top" onMouseEnter={() => setOpen(null)}>Home</a>
            {NAV.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`nav__link${open === item.label ? ' is-open' : ''}`}
                aria-expanded={open === item.label}
                onMouseEnter={() => setOpen(item.label)}
                onFocus={() => setOpen(item.label)}
                onClick={() => go(item.filter)}
              >
                {item.label}<ChevronIcon size={14} />
              </button>
            ))}
          </nav>

          <a className="logo" href="#top" aria-label="Sindhooram, home">
            <img src={mark} alt="" width="160" height="172" />
            <span>Sindhooram</span>
          </a>

          <div className="nav__tools">
            <button type="button" className="nav__text" onClick={() => go('new')} onMouseEnter={() => setOpen(null)}>New Arrivals</button>
            <a className="nav__text" href="#bestsellers" onMouseEnter={() => setOpen(null)}>Best Sellers</a>
            <a className="nav__text" href="#story" onMouseEnter={() => setOpen(null)}>Our Story</a>
            <button className="icon-btn" type="button" aria-label="Search" onClick={onSearch}><SearchIcon /></button>
            <button className="icon-btn nav__wish" type="button" aria-label={`Wishlist, ${wishlist.length} items`} onClick={() => go('wishlist')}>
              <HeartIcon />{wishlist.length > 0 && <b className="badge">{wishlist.length}</b>}
            </button>
            <button className="icon-btn" type="button" aria-label={`Bag, ${count} items`} onClick={() => setBagOpen(true)}>
              <BagIcon />{count > 0 && <b className="badge" key={count}>{count}</b>}
            </button>
          </div>
        </div>

        {NAV.map((item) => (
          <div key={item.label} className={`mega${open === item.label ? ' is-open' : ''}`} aria-hidden={open !== item.label}>
            <div className="mega__inner">
              {item.columns.map((col) => (
                <div className="mega__col" key={col.title}>
                  <p className="mega__title">{col.title}</p>
                  {col.links.map((l) => (
                    <button type="button" key={l} tabIndex={open === item.label ? 0 : -1} onClick={() => go(item.filter)}>{l}</button>
                  ))}
                </div>
              ))}
              <button type="button" className="mega__feature" tabIndex={open === item.label ? 0 : -1} onClick={() => go(item.filter)}>
                <img src={item.feature.image} alt="" loading="lazy" />
                <span className="mega__feature-copy">
                  <em>{item.feature.line}</em>
                  <strong>{item.feature.title}</strong>
                </span>
              </button>
            </div>
          </div>
        ))}
      </header>

      <div className={`drawer-scrim${drawer ? ' is-open' : ''}`} onClick={() => setDrawer(false)} />
      <aside className={`menu${drawer ? ' is-open' : ''}`} aria-label="Menu" aria-hidden={!drawer}>
        <div className="menu__head">
          <span className="menu__brand">Sindhooram</span>
          <button className="icon-btn" type="button" aria-label="Close menu" onClick={() => setDrawer(false)} tabIndex={drawer ? 0 : -1}>
            <CloseIcon size={24} />
          </button>
        </div>
        <a className="menu__link" href="#top" onClick={() => setDrawer(false)} tabIndex={drawer ? 0 : -1}>Home</a>
        {NAV.map((item) => (
          <div key={item.label} className={`menu__group${section === item.label ? ' is-open' : ''}`}>
            <button type="button" className="menu__link" tabIndex={drawer ? 0 : -1}
              aria-expanded={section === item.label}
              onClick={() => setSection(section === item.label ? null : item.label)}>
              {item.label}<ChevronIcon size={18} />
            </button>
            <div className="menu__sub">
              {item.columns.flatMap((c) => c.links).map((l) => (
                <button type="button" key={l} tabIndex={drawer && section === item.label ? 0 : -1} onClick={() => go(item.filter)}>{l}</button>
              ))}
            </div>
          </div>
        ))}
        <button type="button" className="menu__link" onClick={() => go('new')} tabIndex={drawer ? 0 : -1}>New Arrivals</button>
        <a className="menu__link" href="#bestsellers" onClick={() => setDrawer(false)} tabIndex={drawer ? 0 : -1}>Best Sellers</a>
        <a className="menu__link" href="#story" onClick={() => setDrawer(false)} tabIndex={drawer ? 0 : -1}>Our Story</a>
      </aside>
    </>
  );
}
