import dynamic from 'next/dynamic';
import Head from 'next/head';

const WebsiteCoach = dynamic(() => import('../components/WebsiteCoach'), { ssr: false });

export default function CoachEmbed() {
  return (
    <>
      <Head>
        <title>Ezra</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { background: transparent !important; overflow: hidden; height: 100%; width: 100%; }
        `}</style>
      </Head>
      <WebsiteCoach />
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
