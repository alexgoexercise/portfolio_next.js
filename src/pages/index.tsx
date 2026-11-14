import Image from 'next/image';
import Link from 'next/link';

/**
 * The front door: two ways in. The 3D room is the fun one; the plain site is
 * for anyone in a hurry or on a device that would struggle with the room.
 */
export default function Landing() {
  return (
    <main className="landing">
      <div className="landing-inner">
        <h1 className="landing-title">alexgosleep</h1>
        <p className="landing-lede">
          This is Alex Zhao&apos;s site. Alex is asleep. You can let yourself into his room and look around, or read the
          short version and leave him be.
        </p>

        <div className="choices">
          <Link href="/diorama" className="choice">
            <div className="choice-media">
              <Image src="/room-preview.jpg" alt="A small bedroom at night with a drum kit, a desk and a bed" width={1400} height={1050} priority />
            </div>
            <div className="choice-body">
              <p className="eyebrow">Option one</p>
              <h2>Come in quietly</h2>
              <p>A 3D bedroom you can poke around in. Everything you touch makes noise. Best on a laptop.</p>
              <span className="choice-cta">Open the room →</span>
            </div>
          </Link>

          <Link href="/home" className="choice">
            <ul className="choice-media choice-index" aria-hidden="true">
              <li>About<span>01</span></li>
              <li>Projects<span>02</span></li>
              <li>Music<span>03</span></li>
              <li>Contacts<span>04</span></li>
            </ul>
            <div className="choice-body">
              <p className="eyebrow">Option two</p>
              <h2>Just the facts</h2>
              <p>The plain site: who I am, what I have built, and how to reach me. Loads fast, works anywhere.</p>
              <span className="choice-cta">Read the site →</span>
            </div>
          </Link>
        </div>

        <p className="landing-foot">Made by Alex Zhao, who should have been in bed hours ago.</p>
      </div>
    </main>
  );
}
