/* WhatsApp and Instagram links. Until a value is set in config.js the link stays visible but does nothing. */
function SocialLink({ href, children }) {
  if (!href) {
    return <a href="#" onClick={(e) => e.preventDefault()}>{children}</a>;
  }
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export default function Links({ whatsapp, instagram }) {
  const wa = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi Sindhooram, please tell me when the collection launches.')}`
    : '';
  const ig = instagram ? `https://instagram.com/${instagram}` : '';
  return (
    <p className="links reveal" style={{ '--d': '1s' }}>
      <span className="links__lead">Reach us on</span>{' '}
      <SocialLink href={wa}>WhatsApp</SocialLink>{' '}
      <SocialLink href={ig}>Instagram</SocialLink>
    </p>
  );
}
