import { redirect } from 'next/navigation';

// Server-side redirect to avoid route group build issues with client components
export default function AppHomePage() {
  redirect('/feed');
}
