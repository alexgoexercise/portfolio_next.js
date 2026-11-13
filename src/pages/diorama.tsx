import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';

// three.js needs the browser, so the scene is never rendered on the server.
const DioramaScene = dynamic(() => import('@/diorama/DioramaScene'), { ssr: false });

/**
 * Work-in-progress sandbox for the 3D bedroom. Not linked from the navbar.
 * The slider panel shows in local development, or anywhere with ?edit=1.
 */
export default function DioramaPage() {
  const { query } = useRouter();
  const editable = process.env.NODE_ENV === 'development' || query.edit === '1';

  return (
    <>
      <Head>
        <title>Diorama sandbox</title>
        <meta name="robots" content="noindex" />
      </Head>
      <DioramaScene editable={editable} />
    </>
  );
}
