import Link from 'next/link';
import { formatINR, NO_PHOTO, sizeLabel } from '@/lib/config';

const STATUS = {
  pending: 'Order placed',
  completed: 'Completed',
  canceled: 'Cancelled',
  archived: 'Archived',
  requires_action: 'Needs attention',
  draft: 'Draft',
};
// How far each vendor's parcel has got (the backend works it out: src/lib/order-progress.ts).
const FULFILMENT = {
  not_fulfilled: 'Order placed',
  partially_fulfilled: 'Partly packed',
  fulfilled: 'Packed',
  partially_shipped: 'Partly shipped',
  shipped: 'Shipped',
  partially_delivered: 'Partly delivered',
  delivered: 'Delivered',
  canceled: 'Cancelled',
};

export const orderStatus = (o) => (o.status === 'canceled' ? STATUS.canceled : FULFILMENT[o.fulfillment_status] || STATUS[o.status] || o.status);
const statusClass = (o) => (o.status === 'canceled' ? 'canceled' : o.fulfillment_status || o.status);

const date = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/* One checkout = one order group; inside it, one order per weaver. */
export function OrderGroupCard({ group, link = true }) {
  const orders = group.orders || [];
  return (
    <article className="og">
      <header className="og__head">
        <div>
          <p className="og__no">Order {group.display_id ? `#${group.display_id}` : ''}</p>
          <p className="og__meta">{date(group.created_at)} · {orders.length} {orders.length === 1 ? 'weaver' : 'weavers'}</p>
        </div>
        <p className="og__total">{formatINR(group.total)}</p>
      </header>
      {orders.map((o) => (
        <div className="og__order" key={o.id}>
          <div className="og__seller">
            <span>Sold by <b>{o.seller?.name || 'Sindhooram weaver'}</b></span>
            <span className={`og__status og__status--${statusClass(o)}`}>{orderStatus(o)}</span>
          </div>
          {(o.items || []).map((i) => (
            <div className="og__item" key={i.id}>
              <img src={i.thumbnail || NO_PHOTO} alt="" />
              <div>
                <p className="og__item-name">{i.product_handle ? <Link href={`/products/${i.product_handle}`}>{i.product_title || i.title}</Link> : (i.product_title || i.title)}</p>
                <p className="og__item-meta">Qty {i.quantity}{sizeLabel(i.variant_title) ? ` · ${sizeLabel(i.variant_title)}` : ''}</p>
              </div>
              <p className="og__item-price">{formatINR(Number(i.unit_price) * i.quantity)}</p>
            </div>
          ))}
          {(o.tracking || []).map((t) => (
            <p className="og__track" key={t.number}>
              Tracking number{' '}
              {/^https?:\/\//.test(t.url || '') ? <a href={t.url} target="_blank" rel="noopener noreferrer">{t.number}</a> : <b>{t.number}</b>}
            </p>
          ))}
          <p className="og__ordline">Weaver order #{o.display_id}{Number(o.shipping_total) > 0 ? ` · Delivery ${formatINR(o.shipping_total)}` : ' · Free delivery'}</p>
        </div>
      ))}
      {link && <Link className="og__link" href={`/account/orders/${group.id}`}>View order details</Link>}
    </article>
  );
}
