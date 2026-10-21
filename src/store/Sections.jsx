import { IMG, RED_EDIT, formatINR } from './data';
import { useStore } from './cart';
import { Echo, Leaves } from './Motion';
import { ArrowIcon, GemIcon, LoomIcon, LotusIcon, ShieldIcon } from './Icons';

const follow = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

function Head({ eyebrow, title, line, dark }) {
  return (
    <header className={`head${dark ? ' head--dark' : ''}`} data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <Echo className="title">{title}</Echo>
      {line && <p className="head__line">{line}</p>}
      <span className="divider" aria-hidden="true"><i /></span>
    </header>
  );
}

/* New collections: three arches on a sunlit green wall under swaying leaf shadows. */
const ARCHES = [
  { title: 'Sarees', line: 'Timeless drapes', image: IMG.archIvory, filter: 'saree' },
  { title: 'Banarasi', line: 'Woven in gold', image: IMG.archBlush, filter: 'saree' },
  { title: 'Bridal', line: 'For the day you begin', image: IMG.archBridal, filter: 'all' },
];

export function NewCollections({ onShop }) {
  return (
    <section className="newc" id="new">
      <Leaves />
      <Head eyebrow="New arrivals" title="New Collections for Women" line="Fresh silhouettes. Timeless craftsmanship. Made for you." />
      <div className="arches">
        {ARCHES.map((a, i) => (
          <button type="button" className="arch" key={a.title} onClick={() => onShop(a.filter)} data-reveal="clip" style={{ '--d': `${0.12 + i * 0.14}s` }}>
            <span className="arch__img"><img src={a.image} alt="" loading="lazy" /></span>
            <span className="arch__label">
              <strong>{a.title}</strong>
              <em>{a.line}</em>
              <span className="arch__cta">Explore <ArrowIcon size={12} /></span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* Explore the collection: the sunlit wall as a banner, two framed cards rising over its edge. */
export function Explore({ onShop }) {
  return (
    <section className="explore" id="explore">
      <div className="explore__band">
        <Leaves className="leaves--soft" />
        <Head eyebrow="Discover" title="Explore the Collection" line="Timeless traditions. Modern stories." />
      </div>
      <div className="explore__cards">
        <button type="button" className="panel panel--wide" onClick={() => onShop('saree')} data-reveal="clip">
          <img src={IMG.womenCard} alt="" loading="lazy" />
          <span className="panel__copy">
            <strong>Women</strong>
            <em>Elegance in every drape, for every you.</em>
            <span className="btn btn--line">Explore <ArrowIcon size={14} /></span>
          </span>
        </button>
        <button type="button" className="panel" onClick={() => onShop('all')} data-reveal="clip" style={{ '--d': '.15s' }}>
          <img src={IMG.kalamkariDrape} alt="" loading="lazy" />
          <span className="panel__copy">
            <strong>Kalamkari</strong>
            <em>Art that tells a story.</em>
            <span className="btn btn--line">Explore <ArrowIcon size={14} /></span>
          </span>
        </button>
      </div>
    </section>
  );
}

/* Kalakaari: a full-width room, then the feature with the artistry rail and three tall cards. */
const KALA_CARDS = [
  { title: 'Kalakaari Sarees', line: 'Painted by hand, one at a time', image: IMG.kalamkariDrapeDetail },
  { title: 'Handloom Silks', line: 'Soft, light, made to last', image: IMG.archBlushDetail },
  { title: 'The Bridal Edit', line: 'Reds for every beginning', image: IMG.archBridalDetail },
];

export function Kalakaari({ onShop }) {
  return (
    <section className="kala" id="kalakaari">
      <div className="kala__room">
        <img src={IMG.kalakaariWindow} alt="A woman in a Kalamkari saree seated by a carved wooden window" loading="lazy" data-parallax="0.1" />
        <div className="kala__room-copy" data-reveal>
          <p className="eyebrow">Discover</p>
          <Echo className="title">Kalakaari Collection</Echo>
          <p className="head__line">Art, culture, craftsmanship. Woven into every story.</p>
        </div>
      </div>

      <div className="kala__grid">
        <aside className="rail" data-reveal>
          <LotusIcon size={30} />
          <p>Rooted in Indian artistry</p>
        </aside>
        <div className="kala__feature" data-reveal="clip">
          <img src={IMG.kalakaariSeated} alt="" loading="lazy" />
          <div className="kala__feature-copy">
            <p className="kala__quote">A canvas of tradition, for today’s world.</p>
            <button type="button" className="btn btn--line" onClick={() => onShop('all')}>Explore Kalakaari <ArrowIcon size={14} /></button>
            <ul className="kala__list"><li>Art</li><li>People</li><li>Places</li><li>Stories</li></ul>
          </div>
        </div>
        <div className="kala__cards">
          {KALA_CARDS.map((c, i) => (
            <button type="button" className="kcard" key={c.title} onClick={() => onShop('saree')} data-reveal="clip" style={{ '--d': `${0.1 + i * 0.12}s` }}>
              <img src={c.image} alt="" loading="lazy" />
              <span className="kcard__copy">
                <strong>{c.title}</strong>
                <em>{c.line}</em>
                <span className="kcard__go" aria-hidden="true"><ArrowIcon size={14} /></span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* The Sindoor Edit: red sarees on crimson velvet. Cards sit at staggered heights, lift on hover
   and open the quick view. */
export function SindoorEdit({ onShop }) {
  const { openQuickView } = useStore();
  return (
    <section className="sindoor" id="sindoor">
      <div className="sindoor__copy" data-reveal>
        <p className="eyebrow">The Sindoor Edit</p>
        <Echo className="title title--serif">Red, the colour of <em>every beginning.</em></Echo>
        <p className="sindoor__line">
          Sindhooram began with one colour: the vermillion of the sindoor. These are the reds we love most,
          woven in silk and gold.
        </p>
        <button type="button" className="btn btn--cream" onClick={() => onShop('red')}>Shop the Red Edit <ArrowIcon size={14} /></button>
      </div>
      <div className="sindoor__row">
        {RED_EDIT.slice(0, 4).map((p, i) => (
          <button type="button" className="rcard" key={p.id} onClick={() => openQuickView(p)} data-reveal="clip" style={{ '--d': `${i * 0.12}s` }}>
            <span className="rcard__img">
              <img src={p.images[0]} alt={p.name} loading="lazy" />
              {p.images[1] && <img src={p.images[1]} alt="" loading="lazy" className="rcard__alt" />}
            </span>
            <span className="rcard__copy">
              <strong>{p.name}</strong>
              <em>{formatINR(p.price)}</em>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* Best sellers bento. A white "View" disc follows the pointer over each tile. */
const TILES = [
  { title: 'Embroidered Sarees', line: 'Grace in every drape', image: IMG.embroidered, area: 'a', tone: 'light' },
  { title: 'Sindoor Silks', line: 'Reds for every beginning', image: IMG.redJasmine, area: 'b', filter: 'red' },
  { title: 'Kalakaari Collection', line: 'Stories, painted by hand', image: IMG.kalakaariSeated, area: 'c' },
  { title: 'Handloom Ivory', line: 'Quiet, everyday luxury', image: IMG.archIvoryDetail, area: 'd' },
  { title: 'Bridal Kanjeevaram', line: 'For the wedding morning', image: IMG.archBridalDetail, area: 'e' },
];

export function BestSellers({ onShop }) {
  return (
    <section className="best" id="bestsellers">
      <p className="rail rail--side" aria-hidden="true">Timeless in every thread</p>
      <Head eyebrow="Sindhooram select" title="Best Sellers" line="The pieces our customers reach for most." />
      <div className="bento">
        {TILES.map((t, i) => (
          <button type="button" key={t.title} className={`tile tile--${t.area}${t.tone ? ` tile--${t.tone}` : ''}`}
            onMouseMove={follow} onClick={() => onShop(t.filter || 'saree')} data-reveal="clip" style={{ '--d': `${i * 0.08}s` }}>
            <img src={t.image} alt="" loading="lazy" />
            <span className="tile__copy">
              <strong>{t.title}</strong>
              <em>{t.line}</em>
              <span className="kcard__go" aria-hidden="true"><ArrowIcon size={14} /></span>
            </span>
            <span className="tile__view" aria-hidden="true">View</span>
          </button>
        ))}
      </div>
      <div className="best__foot" data-reveal>
        <span className="bokeh" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        <p className="best__rooted"><LotusIcon size={22} />Rooted in Indian artistry</p>
        <button type="button" className="btn btn--line" onClick={() => onShop('all')}>Shop Best Sellers <ArrowIcon size={14} /></button>
      </div>
    </section>
  );
}

const PROMISES = [
  { Icon: LotusIcon, title: 'Authentic Craftsmanship', line: 'Woven by master weavers' },
  { Icon: GemIcon, title: 'Premium Quality', line: 'Pure silks, checked by hand' },
  { Icon: ShieldIcon, title: 'Safe & Reliable Delivery', line: 'Packed with care, tracked to you' },
  { Icon: LoomIcon, title: 'Handpicked with Love', line: 'Each piece chosen for its drape' },
];

export function Promises() {
  return (
    <section className="promises" aria-label="Our promises">
      {PROMISES.map(({ Icon, title, line }, i) => (
        <div className="promise" key={title} data-reveal style={{ '--d': `${i * 0.1}s` }}>
          <span className="promise__icon"><Icon size={26} /></span>
          <strong>{title}</strong>
          <span>{line}</span>
        </div>
      ))}
    </section>
  );
}

export function Story() {
  return (
    <section className="story" id="story">
      <div className="story__img" data-reveal="clip">
        <img src={IMG.archIvory} alt="A woman in an ivory saree by a sunlit window" loading="lazy" data-parallax="0.06" />
      </div>
      <div className="story__copy" data-reveal style={{ '--d': '.15s' }}>
        <p className="eyebrow">Our story</p>
        <Echo className="title title--serif">Tradition lives <em>beautifully.</em></Echo>
        <p>
          Sindhooram means vermillion: the red of the sindoor, the first colour of every new beginning.
          We built this house around that red, with handloom silks from Kanchipuram to Banaras,
          each one chosen for how it drapes.
        </p>
        <blockquote>“Rooted in tradition, woven for tomorrow.”</blockquote>
        <a className="btn btn--line" href="#feeling">Discover Our Story <ArrowIcon size={14} /></a>
      </div>
    </section>
  );
}

export function Feeling() {
  return (
    <section className="feeling" id="feeling" data-reveal>
      <LotusIcon size={30} />
      <p className="eyebrow">More than fashion</p>
      <Echo className="title">A Feeling</Echo>
      <p className="feeling__text">Rooted in tradition. Woven for tomorrow.<br />Thank you for being a part of our story.</p>
    </section>
  );
}
