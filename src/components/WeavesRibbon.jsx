import { Fragment } from 'react';

/* The ribbon of weave names. The list is rendered twice so the loop is seamless; the copy is hidden from screen readers. */
function Group({ weaves, hidden }) {
  return (
    <div className="weaves__group" aria-hidden={hidden ? 'true' : undefined}>
      {weaves.map((w) => (
        <Fragment key={w}>
          <span>{w}</span>
          <i />
        </Fragment>
      ))}
    </div>
  );
}

export default function WeavesRibbon({ weaves }) {
  return (
    <div className="weaves" aria-label="Weaves in the first collection">
      <div className="weaves__track">
        <Group weaves={weaves} />
        <Group weaves={weaves} hidden />
      </div>
    </div>
  );
}
