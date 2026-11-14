import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';

// three.js needs the browser, so the scene is never rendered on the server.
const DioramaScene = dynamic(() => import('@/diorama/DioramaScene'), { ssr: false });

/**
 * The 3D bedroom. Reached from the landing page and from the "room" button on
 * every other page; ?at=projects (or music, about, contacts) opens that object.
 * The slider panel shows in local development, or anywhere with ?edit=1.
 */
export default function DioramaPage() {
  const { query } = useRouter();
  const editable = process.env.NODE_ENV === 'development' || query.edit === '1';

  return (
    <>
      <Head>
        <title>The room · alexgosleep</title>
      </Head>
      <DioramaScene editable={editable} initialSpot={typeof query.at === 'string' ? query.at : undefined} />
    </>
  );
}
