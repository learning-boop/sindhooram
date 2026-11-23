import Link from 'next/link';
import AuthForms from '@/components/store/AuthForms';
import LogoutButton from '@/components/store/LogoutButton';
import { OrderGroupCard } from '@/components/store/Orders';
import { getCustomer, listOrders } from '@/lib/actions/account';
import { CONFIG } from '@/lib/config';

export const metadata = { title: 'My account', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const customer = await getCustomer();

  if (!customer) {
    return (
      <div className="page page--narrow">
        <header className="page__head">
          <p className="eyebrow eyebrow--dark">My account</p>
          <h1 className="page__title">Welcome to Sindhooram</h1>
          <p className="page__line">Sign in to follow your orders and check out faster. You can also shop without an account.</p>
        </header>
        <AuthForms />
        <p className="page__aside">
          Ordered without an account? <Link href="/track-order">Track your order</Link>
        </p>
        <p className="page__aside">
          Are you a weaver or a saree house? <a href={`${CONFIG.vendorPanelUrl}/register`} target="_blank" rel="noopener noreferrer">Sell on Sindhooram</a>
        </p>
      </div>
    );
  }

  const groups = await listOrders();
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email;

  return (
    <div className="page">
      <header className="page__head page__head--row">
        <div>
          <p className="eyebrow eyebrow--dark">My account</p>
          <h1 className="page__title">Namaste, {customer.first_name || name}</h1>
          <p className="page__line">{customer.email}{customer.phone ? ` · ${customer.phone}` : ''}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="account__orders">
        <h2 className="page__sub">My orders</h2>
        {groups.length === 0 ? (
          <div className="account__empty">
            <p className="empty">You have not placed an order yet.</p>
            <Link className="btn btn--cream" href="/shop">Explore the collection</Link>
          </div>
        ) : (
          groups.map((g) => <OrderGroupCard key={g.id} group={g} />)
        )}
      </section>
    </div>
  );
}
