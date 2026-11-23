import Checkout from '@/components/store/Checkout';
import { getCustomer } from '@/lib/actions/account';
import { getDeliveryOptions } from '@/lib/actions/checkout';
import { fetchCart, toBag } from '@/lib/bag';

export const metadata = { title: 'Checkout', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const [customer, cart] = await Promise.all([getCustomer(), fetchCart()]);
  const bag = toBag(cart);
  const groups = bag?.shippingAddress ? await getDeliveryOptions() : [];
  return <Checkout initialBag={bag} customer={customer} initialGroups={groups} />;
}
