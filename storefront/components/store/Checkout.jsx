'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { INDIAN_STATES, formatINR } from '@/lib/config';
import { chooseDelivery, placeOrder, saveDelivery } from '@/lib/actions/checkout';
import AuthForms from './AuthForms';
import { useStore } from './StoreProvider';
import { CheckIcon, StoreIcon } from './Icons';

/* Checkout on one page, no account needed: contact and address, delivery per weaver, then place the order.
   Returning customers can sign in instead (their details are filled in and the order lands in My orders).
   Payment is a test payment for now — no money moves until Razorpay is switched on. */
export default function Checkout({ initialBag, customer, initialGroups }) {
  const router = useRouter();
  const { refreshBag } = useStore();
  const [bag, setBag] = useState(initialBag);
  const [groups, setGroups] = useState(initialGroups);
  const [editing, setEditing] = useState(!initialBag?.shippingAddress);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [placing, startPlacing] = useTransition();
  const [saveState, saveAction, saving] = useActionState(saveDelivery, null);

  useEffect(() => { setBag(initialBag); setGroups(initialGroups); }, [initialBag, initialGroups]);
  useEffect(() => {
    if (saveState?.ok) {
      setBag(saveState.bag);
      setGroups(saveState.groups);
      setEditing(false);
    }
  }, [saveState]);

  const items = bag?.items || [];
  const bySeller = useMemo(() => {
    const map = new Map();
    items.forEach((l) => {
      const key = l.seller?.id || 'other';
      if (!map.has(key)) map.set(key, { name: l.seller?.name || 'Sindhooram', items: [] });
      map.get(key).items.push(l);
    });
    return [...map.entries()];
  }, [items]);

  if (!items.length) {
    return (
      <div className="page page--narrow">
        <header className="page__head">
          <p className="eyebrow eyebrow--dark">Checkout</p>
          <h1 className="page__title">Your bag is empty</h1>
          <p className="page__line">Find a piece you love and it will wait for you here.</p>
        </header>
        <Link className="btn btn--cream" href="/shop">Explore the collection</Link>
      </div>
    );
  }

  const address = bag.shippingAddress;
  const prefill = address || customer?.addresses?.[0] || {};
  const selected = (g) => g.options.find((o) => bag.shippingMethods.some((m) => m.optionId === o.id));
  const deliveryReady = !!address && groups.length > 0 && groups.every((g) => selected(g));
  const email = customer?.email || bag.email || '';
  const showSignIn = !customer && signingIn; // once signed in, straight back to the form
  const canPlace = !!email && deliveryReady && !placing;

  const pick = async (optionId) => {
    setError('');
    const res = await chooseDelivery(optionId);
    if (res.bag) setBag(res.bag);
    if (res.error) setError(res.error);
  };

  const submitOrder = () => startPlacing(async () => {
    setError('');
    const res = await placeOrder();
    if (res.error) { setError(res.error); return; }
    await refreshBag();
    router.push(`/order/confirmed/${res.orderGroupId}`);
  });

  return (
    <div className="page checkout">
      <header className="page__head">
        <p className="eyebrow eyebrow--dark">Checkout</p>
        <h1 className="page__title">Almost yours</h1>
      </header>

      <div className="checkout__grid">
        <div className="checkout__steps">
          {/* returning customers: sign in instead of typing everything again */}
          {showSignIn && (
            <section className="step">
              <h2 className="step__title"><span>1</span> Sign in</h2>
              <p className="step__hint">Sign in to use your saved details and keep this order in My orders.</p>
              <AuthForms compact onDone={() => setSigningIn(false)} />
              <button type="button" className="link-btn step__alt" onClick={() => setSigningIn(false)}>Continue as a guest instead</button>
            </section>
          )}

          {/* 1–2. contact + delivery address: one form, so a guest fills it in once */}
          {!showSignIn && (editing || !address) && (
            <form action={saveAction} className="checkout__form" noValidate>
              <section className="step">
                <h2 className="step__title"><span>1</span> Contact</h2>
                {customer ? (
                  <>
                    <p className="step__summary">Signed in as <b>{customer.email}</b></p>
                    <input type="hidden" name="email" value={customer.email} />
                  </>
                ) : (
                  <>
                    <p className="step__hint">
                      No account needed. We use these to confirm and deliver your order.{' '}
                      <button type="button" className="link-btn" onClick={() => setSigningIn(true)}>Have an account? Sign in</button>
                    </p>
                    <label className="field"><span>Email *</span><input name="email" type="email" defaultValue={bag.email || ''} autoComplete="email" inputMode="email" /></label>
                  </>
                )}
              </section>
              <section className="step">
                <h2 className="step__title"><span>2</span> Delivery address</h2>
                <div className="form">
                  <div className="form__row">
                    <label className="field"><span>First name *</span><input name="first_name" defaultValue={prefill.first_name || customer?.first_name || ''} autoComplete="given-name" /></label>
                    <label className="field"><span>Last name</span><input name="last_name" defaultValue={prefill.last_name || customer?.last_name || ''} autoComplete="family-name" /></label>
                  </div>
                  <label className="field"><span>Mobile number *</span><input name="phone" type="tel" defaultValue={prefill.phone || customer?.phone || ''} autoComplete="tel" placeholder="+91 98765 43210" /></label>
                  <label className="field"><span>House / flat, street *</span><input name="address_1" defaultValue={prefill.address_1 || ''} autoComplete="address-line1" /></label>
                  <label className="field"><span>Area, landmark</span><input name="address_2" defaultValue={prefill.address_2 || ''} autoComplete="address-line2" /></label>
                  <div className="form__row form__row--3">
                    <label className="field"><span>City *</span><input name="city" defaultValue={prefill.city || ''} autoComplete="address-level2" /></label>
                    <label className="field"><span>State *</span>
                      <select name="province" defaultValue={prefill.province || ''} autoComplete="address-level1">
                        <option value="" disabled>Choose</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="field"><span>PIN code *</span><input name="postal_code" inputMode="numeric" maxLength={6} defaultValue={prefill.postal_code || ''} autoComplete="postal-code" /></label>
                  </div>
                  {saveState?.error && <p className="form__error" role="alert">{saveState.error}</p>}
                  <button type="submit" className="btn btn--dark" disabled={saving}>{saving ? 'Saving…' : 'Continue to delivery'}</button>
                </div>
              </section>
            </form>
          )}

          {/* contact + address, saved */}
          {address && !editing && (
            <section className="step is-done">
              <h2 className="step__title"><span>1</span> Contact &amp; address <CheckIcon size={18} /></h2>
              <div className="step__summary">
                <p><b>{[address.first_name, address.last_name].filter(Boolean).join(' ')}</b> · {address.phone}</p>
                <p>{email}{customer ? ' (your account)' : ''}</p>
                <p>{[address.address_1, address.address_2, address.city, address.province, address.postal_code].filter(Boolean).join(', ')}</p>
                <button type="button" className="link-btn" onClick={() => { setSigningIn(false); setEditing(true); }}>Change</button>
              </div>
            </section>
          )}

          {/* delivery per weaver */}
          <section className={`step${address && !editing ? '' : ' is-locked'}`}>
            <h2 className="step__title"><span>{address && !editing ? 2 : 3}</span> Delivery {address && !editing && deliveryReady && <CheckIcon size={18} />}</h2>
            {!(address && !editing) && <p className="step__hint">Choose how fast each weaver ships once your address is in.</p>}
            {address && !editing && groups.length === 0 && <p className="step__hint">No delivery options are available for this address yet.</p>}
            {address && !editing && groups.map((g) => {
              const sel = selected(g);
              return (
                <fieldset className="ship-group" key={g.sellerId}>
                  <legend><StoreIcon size={16} /> {g.sellerName}</legend>
                  {g.options.map((o) => (
                    <label key={o.id} className={`ship-opt${sel?.id === o.id ? ' is-on' : ''}`}>
                      <input type="radio" name={`ship-${g.sellerId}`} checked={sel?.id === o.id} onChange={() => pick(o.id)} />
                      <span className="ship-opt__name">{o.name}<em>{o.description}</em></span>
                      <b>{o.amount > 0 ? formatINR(o.amount) : 'Free'}</b>
                    </label>
                  ))}
                </fieldset>
              );
            })}
          </section>

          {/* 3. payment */}
          <section className={`step${!deliveryReady || editing ? ' is-locked' : ''}`}>
            <h2 className="step__title"><span>{address && !editing ? 3 : 4}</span> Payment</h2>
            <label className="ship-opt is-on">
              <input type="radio" name="payment" checked readOnly />
              <span className="ship-opt__name">Test payment<em>Demo mode: the order is placed and no money is charged. Online payment (Razorpay) is coming soon.</em></span>
            </label>
          </section>
        </div>

        <aside className="summary">
          <h2 className="summary__title">Order summary</h2>
          {bySeller.map(([key, s]) => {
            const g = groups.find((x) => x.sellerId === key);
            const sel = g && selected(g);
            return (
              <div className="summary__seller" key={key}>
                <p className="summary__by"><StoreIcon size={15} /> {s.name}</p>
                {s.items.map((l) => (
                  <div className="summary__line" key={l.key}>
                    <img src={l.image} alt="" />
                    <div>
                      <p>{l.name}</p>
                      <em>Qty {l.qty}{l.variant ? ` · ${l.variant}` : ''}</em>
                    </div>
                    <b>{formatINR(l.unitPrice * l.qty)}</b>
                  </div>
                ))}
                {sel && <p className="summary__ship"><span>{sel.name}</span><span>{sel.amount > 0 ? formatINR(sel.amount) : 'Free'}</span></p>}
              </div>
            );
          })}
          <div className="summary__totals">
            <p><span>Subtotal</span><span>{formatINR(bag.subtotal)}</span></p>
            <p><span>Delivery</span><span>{bag.shippingTotal > 0 ? formatINR(bag.shippingTotal) : address ? 'Free' : '—'}</span></p>
            <p className="summary__grand"><span>Total</span><span>{formatINR(bag.total)}</span></p>
            <p className="summary__fine">Inclusive of all taxes.</p>
          </div>
          {error && <p className="form__error" role="alert">{error}</p>}
          <button type="button" className="btn btn--dark btn--block" disabled={!canPlace} onClick={submitOrder}>
            {placing ? 'Placing your order…' : `Place order · ${formatINR(bag.total)}`}
          </button>
          {!address && <p className="summary__fine">Add your contact details and address to place the order.</p>}
        </aside>
      </div>
    </div>
  );
}
