import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OrderGroupCard } from '@/components/store/Orders';
import SaveOrderToAccount from '@/components/store/SaveOrderToAccount';
import { getCustomer, getOrderGroup } from '@/lib/actions/account';
import { getLastOrderGroup } from '@/lib/actions/orders';
import { LotusIcon } from '@/components/store/Icons';

export const metadata = { title: 'Thank you', robots: { index: false } };
export const dynamic = 'force-dynamic';

/* Works for signed-in customers (their own order) and for guests (the order this browser just placed). */
export default async function ConfirmedPage({ params }) {
  const { id } = await params;
  const customer = await getCustomer();
  let group = customer ? await getOrderGroup(id) : null;
  const inAccount = !!group;
  let guestEmail = null;
  if (!group) {
    const last = await getLastOrderGroup(id);
    group = last?.group || null;
    guestEmail = last?.email || null;
  }
  if (!group) redirect('/track-order');

  const weavers = group.orders?.length || 0;
  const address = group.orders?.[0]?.shipping_address || {};

  return (
    <div className="page page--narrow confirm">
      <header className="page__head confirm__head">
        <LotusIcon size={34} />
        <p className="eyebrow eyebrow--dark">Order placed</p>
        <h1 className="page__title">Thank you for your order</h1>
        <p className="page__line">
          {weavers > 1
            ? `Your order went to ${weavers} weavers. Each one packs and ships their pieces separately.`
            : 'Your order is with the weaver, who will pack and ship it to you.'}
        </p>
        {!inAccount && (
          <p className="confirm__keep">
            Your order number is <b>#{group.display_id}</b>. Keep it handy: you can follow the order any time on{' '}
            <Link href="/track-order">Track order</Link> with this number and {guestEmail}.
          </p>
        )}
      </header>
      <OrderGroupCard group={group} link={false} />
      {inAccount && (
        <p className="confirm__saved">
          This order is saved in your account. Follow it any time under <Link href="/account">My account</Link>.
        </p>
      )}
      {!inAccount && guestEmail && (
        <SaveOrderToAccount
          orderGroupId={group.id}
          email={guestEmail}
          firstName={address.first_name || ''}
          lastName={address.last_name || ''}
          phone={address.phone || ''}
          signedInAs={customer?.email || null}
        />
      )}
      <div className="confirm__ctas">
        {inAccount
          ? <Link className="btn btn--cream" href={`/account/orders/${group.id}`}>Track this order</Link>
          : <Link className="btn btn--cream" href="/track-order">Track this order</Link>}
        <Link className="btn btn--line" href="/shop">Continue shopping</Link>
      </div>
    </div>
  );
}
