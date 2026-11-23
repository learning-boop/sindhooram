import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="page page--narrow">
      <header className="page__head">
        <p className="eyebrow eyebrow--dark">404</p>
        <h1 className="page__title">This page has drifted away</h1>
        <p className="page__line">The piece or page you were looking for is not here any more.</p>
      </header>
      <Link className="btn btn--cream" href="/shop">Back to the collection</Link>
    </div>
  );
}
