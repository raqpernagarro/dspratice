import { redirect } from 'next/navigation';

// The patterns index lives on the Docs overview, next to the shared Docs menu.
export default function Page() {
  redirect('/docs#patterns');
}
