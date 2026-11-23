'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { saveOrderToAccount } from '@/lib/actions/orders';

/* Optional, after a guest checkout: create an account with one password (or sign in) and the order
   moves into "My orders". The email is the one used for the order. */
export default function SaveOrderToAccount({ orderGroupId, email, firstName, lastName, phone, signedInAs }) {
  const [mode, setMode] = useState(signedInAs ? 'claim' : 'register');
  const [state, action, pending] = useActionState(saveOrderToAccount, null);

  // An account with this email already exists: offer to sign in instead.
  useEffect(() => {
    if (state?.mode === 'register' && /already exists/i.test(state.error || '')) setMode('login');
  }, [state]);

  if (state?.ok) {
    return (
      <div className="save-acc">
        <p className="save-acc__title">Saved to your account</p>
        <p>You are signed in, and this order is now under <Link href="/account">My account</Link>.</p>
      </div>
    );
  }

  return (
    <div className="save-acc">
      <p className="save-acc__title">Save this order to an account <em>(optional)</em></p>
      {mode === 'claim' ? (
        <p>You are signed in as {signedInAs}. Add this order to your account to see it under My orders.</p>
      ) : mode === 'login' ? (
        <p>Sign in with your Sindhooram password and this order will be added to your account.</p>
      ) : (
        <p>Choose a password to follow your orders in one place and check out faster next time.</p>
      )}
      <form action={action} className="form" noValidate>
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="order_group_id" value={orderGroupId} />
        <input type="hidden" name="first_name" value={firstName || 'Customer'} />
        <input type="hidden" name="last_name" value={lastName} />
        <input type="hidden" name="phone" value={phone} />
        {mode !== 'claim' && (
          <>
            <label className="field"><span>Email</span>
              {mode === 'login'
                ? <input name="email" type="email" defaultValue={email} autoComplete="email" />
                : <><input type="email" value={email} readOnly aria-readonly="true" /><input type="hidden" name="email" value={email} /></>}
            </label>
            <label className="field"><span>Password {mode === 'register' && <em>(8+ characters)</em>}</span>
              <input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : undefined} />
            </label>
          </>
        )}
        {state?.error && <p className="form__error" role="alert">{state.error}</p>}
        <div className="save-acc__actions">
          <button type="submit" className="btn btn--dark" disabled={pending}>
            {pending ? 'Saving…' : mode === 'claim' ? 'Add to my account' : mode === 'login' ? 'Sign in and save' : 'Create account'}
          </button>
          {mode === 'register' && <button type="button" className="link-btn" onClick={() => setMode('login')}>I already have an account</button>}
          {mode === 'login' && !signedInAs && <button type="button" className="link-btn" onClick={() => setMode('register')}>Create a new account</button>}
        </div>
      </form>
    </div>
  );
}
