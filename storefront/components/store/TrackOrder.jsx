'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { trackOrder } from '@/lib/actions/orders';
import { OrderGroupCard } from './Orders';

/* Order lookup for guests (and anyone signed out): email + order number. */
export default function TrackOrder() {
  const [state, action, pending] = useActionState(trackOrder, null);
  const group = state?.group;
  const address = group?.orders?.[0]?.shipping_address;

  return (
    <>
      <form action={action} className="form auth" noValidate>
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" defaultValue={state?.email || ''} required /></label>
        <label className="field"><span>Order number</span><input name="order" inputMode="numeric" placeholder="e.g. 12" defaultValue={state?.order || ''} required /></label>
        {state?.error && <p className="form__error" role="alert">{state.error}</p>}
        <button type="submit" className="btn btn--dark btn--block" disabled={pending}>{pending ? 'Looking it up…' : 'Find my order'}</button>
      </form>

      {group && (
        <section className="track__result" aria-live="polite">
          <OrderGroupCard group={group} link={false} />
          {address && (
            <div className="panel-box">
              <p className="panel-box__title">Delivering to</p>
              <p>{[address.first_name, address.last_name].filter(Boolean).join(' ')}</p>
              <p>{[address.address_1, address.address_2, address.city, address.province, address.postal_code].filter(Boolean).join(', ')}</p>
            </div>
          )}
        </section>
      )}

      <p className="page__aside">
        Have an account? <Link href="/account">Sign in</Link> to see all your orders.
      </p>
    </>
  );
}
