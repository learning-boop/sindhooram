'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/actions/account';
import { useStore } from './StoreProvider';

export default function LogoutButton() {
  const router = useRouter();
  const { refreshBag } = useStore();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn--line" disabled={pending}
      onClick={() => start(async () => { await logout(); await refreshBag(); router.push('/'); router.refresh(); })}>
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
