import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { email, phone, socials } from '../content/contact';
import styles from './Phone.module.css';

/** The phone's screen: the ways to reach Alex, laid out like a phone's home screen. */
export default function ContactsPanel() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showQr) setShowQr(false);
      else void router.push('/diorama');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, showQr]);

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
    <div className={styles.screen}>
      <div className={styles.status}>
        <span>Alex</span>
        <span className={styles.island} aria-hidden="true" />
        <span>5G</span>
      </div>

      <div className={styles.content}>
        {showQr ? (
          <div className={styles.qrView}>
            <button type="button" className={styles.backButton} onClick={() => setShowQr(false)}>
              ‹ Back
            </button>
            <h1 className={styles.title}>微信 WeChat</h1>
            <Image src="/wechatQRcode.jpg" alt="WeChat QR code" width={240} height={240} className={styles.qr} />
            <p className={styles.appNote}>Scan to add me</p>
          </div>
        ) : (
          <>
            <p className={styles.kicker}>1 new notification</p>
            <h1 className={styles.title}>Let&apos;s connect!</h1>

            <div className={styles.card}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{email}</span>
              <button type="button" className={styles.small} onClick={copyEmail}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className={styles.card}>
              <span className={styles.label}>Phone</span>
              <span className={styles.value}>{phone}</span>
            </div>

            {socials.map((link) => (
              <a
                key={link.name}
                className={styles.app}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <span className={styles.appName}>{link.name} ↗</span>
                <span className={styles.appNote}>{link.note}</span>
              </a>
            ))}
            <button type="button" className={styles.app} onClick={() => setShowQr(true)}>
              <span className={styles.appName}>微信 WeChat</span>
              <span className={styles.appNote}>Scan to add me</span>
            </button>
          </>
        )}
      </div>

      <div className={styles.home}>
        <Link href="/diorama" className={styles.homeLabel} aria-label="Back to the room">
          <span className={styles.homeBar} />
          <span style={{ display: 'block', marginTop: 6 }}>← The room</span>
        </Link>
      </div>
    </div>
  );
}
