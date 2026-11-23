import Image from 'next/image';
import { useState } from 'react';
import { email, phone, socials } from '../content/contact';
import PanelBar from './PanelBar';
import styles from './ProjectsPanel.module.css';

/** Ways to reach Alex, beside the phone on the nightstand. */
export default function ContactsPanel() {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const copyEmail = () => {
    navigator.clipboard
      .writeText(email)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className={styles.layer}>
      <aside className={styles.panel} aria-label="Contact Alex">
        <PanelBar />
        <p className={styles.count}>1 new notification</p>
        <h1 className={styles.title}>Let&apos;s connect!</h1>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{email}</span>
            <button type="button" className={styles.small} onClick={copyEmail}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Phone</span>
            <span className={styles.value}>{phone}</span>
          </div>
        </div>

        <div className={styles.links}>
          {socials.map((link) => (
            <a key={link.name} className={styles.link} href={link.href} target="_blank" rel="noopener noreferrer">
              <span>{link.name} ↗</span>
              <span className={styles.linkNote}>{link.note}</span>
            </a>
          ))}
          <button type="button" className={styles.link} onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
            <span>微信 WeChat</span>
            <span className={styles.linkNote}>{showQr ? 'Hide the code' : 'Scan to add me'}</span>
          </button>
        </div>

        {showQr && (
          <Image src="/wechatQRcode.jpg" alt="WeChat QR code" width={200} height={200} className={styles.qr} />
        )}
        <p className={styles.hint}>Esc for the room</p>
      </aside>
    </div>
  );
}
