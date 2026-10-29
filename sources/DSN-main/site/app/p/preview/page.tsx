import { PreviewFrame } from '@/components/prototype/PreviewFrame';

export const metadata = { title: 'Preview', robots: { index: false } };

/** Unsaved preview, fed by the playground over postMessage. */
export default function PreviewPage() {
  return <PreviewFrame />;
}
