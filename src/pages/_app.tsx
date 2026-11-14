import '@/styles/site.css';
import 'swiper/css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { IBM_Plex_Mono, IBM_Plex_Sans, Young_Serif } from 'next/font/google';
import Navbar from '../components/Navbar';
import RoomButton from '../components/RoomButton';

// Typefaces: a warm old-style serif for headings, Plex for reading, Plex Mono
// for labels and dates. Next.js downloads these at build time and serves them
// from this site, so nothing is fetched from Google while browsing.
const youngSerif = Young_Serif({ weight: '400', subsets: ['latin'], variable: '--font-young-serif' });
const plexSans = IBM_Plex_Sans({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-plex-sans' });
const plexMono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-plex-mono' });

const TITLES: Record<string, string> = {
  '/': 'alexgosleep',
  '/home': 'Alex Zhao',
  '/about': 'About · Alex Zhao',
  '/projects': 'Projects · Alex Zhao',
  '/contacts': 'Contact · Alex Zhao',
  '/band/[id]': 'Music · Alex Zhao',
};

export default function App({ Component, pageProps, router }: AppProps) {
  const path = router.pathname;
  const isLanding = path === '/';
  const isRoom = path === '/diorama';

  return (
    <div className={`site ${youngSerif.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <Head>
        <title>{TITLES[path] ?? 'alexgosleep'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* Brand icons on the Contacts page */}
      <Script src="https://kit.fontawesome.com/ec69074f3c.js" crossOrigin="anonymous" strategy="afterInteractive" />
      {!isLanding && <Navbar />}
      <Component {...pageProps} />
      {!isLanding && !isRoom && <RoomButton />}
    </div>
  );
}
