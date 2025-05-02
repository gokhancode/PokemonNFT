import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import Layout from '../components/Layout';

interface AboutPageProps {
  content: string;
}

export async function getStaticProps() {
  const readmePath = path.join(process.cwd(), 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const content = marked(readmeContent);

  return {
    props: {
      content
    }
  };
}

export default function AboutPage({ content }: AboutPageProps) {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">About Pokemon NFT Marketplace</h1>
        <div 
          className="prose prose-lg max-w-none bg-white shadow-lg rounded-lg p-8"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </Layout>
  );
} 