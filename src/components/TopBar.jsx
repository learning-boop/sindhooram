import markSmall from '../assets/mark-160.png';

export default function TopBar() {
  return (
    <header className="top reveal" style={{ '--d': '.15s' }}>
      <a className="brand" href="#">
        <img src={markSmall} alt="" width="160" height="172" />
        Sindhooram
      </a>
      <div className="status">
        <span className="status__dot" aria-hidden="true" />
        Launching soon
      </div>
    </header>
  );
}
