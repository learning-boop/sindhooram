import TrackOrder from '@/components/store/TrackOrder';

export const metadata = {
  title: 'Track your order',
  description: 'Follow a Sindhooram order with the email you ordered with and your order number.',
  robots: { index: false },
};

export default function TrackOrderPage() {
  return (
    <div className="page page--narrow">
      <header className="page__head">
        <p className="eyebrow eyebrow--dark">Orders</p>
        <h1 className="page__title">Track your order</h1>
        <p className="page__line">Enter the email you ordered with and the order number from your confirmation.</p>
      </header>
      <TrackOrder />
    </div>
  );
}
