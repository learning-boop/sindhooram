import { useRef, useState } from 'react';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function NotifyForm({ endpoint }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | done | error
  const [hint, setHint] = useState('One email when the doors open. Nothing else.');
  const inputRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setStatus('error');
      setHint('Enter a valid email address, like priya@example.com.');
      inputRef.current?.focus();
      return;
    }
    setStatus('saving');
    try {
      if (endpoint) {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value, source: 'coming-soon', page: window.location.href }),
        });
        if (!r.ok) throw new Error(String(r.status));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500)); // nothing configured: just thank them
      }
      setStatus('done');
      setHint('You’re on the list. We’ll write to you before the doors open.');
    } catch {
      setStatus('error');
      setHint('Couldn’t save your email. Try again, or message us on WhatsApp.');
    }
  }

  return (
    <form className={`notify reveal${status === 'done' ? ' is-done' : ''}`} style={{ '--d': '.85s' }} onSubmit={onSubmit} noValidate>
      <label className="notify__label" htmlFor="email">Be the first to see the collection</label>
      <div className="notify__row">
        <input
          ref={inputRef}
          className="notify__input"
          id="email"
          name="email"
          type="email"
          placeholder="Your email address"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="notify__btn" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Notify me'}
        </button>
      </div>
      <p className={`notify__hint${status === 'error' ? ' is-error' : ''}`} aria-live="polite">{hint}</p>
    </form>
  );
}
