import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { OrderGroupCard } from '@/components/store/Orders';
import { getCustomer, getOrderGroup } from '@/lib/actions/account';
import { formatINR } from '@/lib/config';

export const metadata = { title: 'Order details', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }) {
  const { id } = await params;
  if (!(await getCustomer())) redirect('/account');
  const group = await getOrderGroup(id);
  if (!group) notFound();
  const address = group.orders?.[0]?.shipping_address;

  return (
    <div className="page">
      <header className="page__head">
        <p className="eyebrow eyebrow--dark"><Link href="/account">My orders</Link></p>
        <h1 className="page__title">Order {group.display_id ? `#${group.display_id}` : ''}</h1>
        <p className="page__line">Each weaver packs and ships their pieces separately; you will see each one’s progress below.</p>
      </header>
      <div className="order__grid">
        <OrderGroupCard group={group} link={false} />
        <aside className="order__aside">
          {address && (
            <div className="panel-box">
              <p className="panel-box__title">Delivering to</p>
              <p>{[address.first_name, address.last_name].filter(Boolean).join(' ')}</p>
              <p>{[address.address_1, address.address_2].filter(Boolean).join(', ')}</p>
              <p>{[address.city, address.province, address.postal_code].filter(Boolean).join(', ')}</p>
              {address.phone && <p>{address.phone}</p>}
            </div>
          )}
          <div className="panel-box">
            <p className="panel-box__title">Total paid</p>
            <p className="order__total">{formatINR(group.total)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
