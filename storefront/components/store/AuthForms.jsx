'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/lib/actions/account';
import { useStore } from './StoreProvider';

/* Sign in / create account. On success it refreshes the page (and the bag, which now belongs to the customer). */
export default function AuthForms({ compact = false, onDone }) {
  const [mode, setMode] = useState('login');
  return (
    <div className={`auth${compact ? ' auth--compact' : ''}`}>
      <div className="auth__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => setMode('login')}>Sign in</button>
        <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => setMode('register')}>Create account</button>
      </div>
      {mode === 'login' ? <LoginForm onDone={onDone} /> : <RegisterForm onDone={onDone} />}
    </div>
  );
}

function useDone(state, onDone) {
  const router = useRouter();
  const { refreshBag } = useStore();
  useEffect(() => {
    if (!state?.ok) return;
    refreshBag();
    if (onDone) onDone();
    router.refresh();
  }, [state, onDone, router, refreshBag]);
}

function LoginForm({ onDone }) {
  const [state, action, pending] = useActionState(login, null);
  useDone(state, onDone);
  return (
    <form action={action} className="form" noValidate>
      <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
      {state?.error && <p className="form__error" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn--dark btn--block" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}

function RegisterForm({ onDone }) {
  const [state, action, pending] = useActionState(register, null);
  useDone(state, onDone);
  return (
    <form action={action} className="form" noValidate>
      <div className="form__row">
        <label className="field"><span>First name *</span><input name="first_name" autoComplete="given-name" required /></label>
        <label className="field"><span>Last name</span><input name="last_name" autoComplete="family-name" /></label>
      </div>
      <label className="field"><span>Email *</span><input name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Mobile</span><input name="phone" type="tel" autoComplete="tel" placeholder="+91" /></label>
      <label className="field"><span>Password * <em>(8+ characters)</em></span><input name="password" type="password" autoComplete="new-password" required minLength={8} /></label>
      {state?.error && <p className="form__error" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn--dark btn--block" disabled={pending}>{pending ? 'Creating your account…' : 'Create account'}</button>
    </form>
  );
}
