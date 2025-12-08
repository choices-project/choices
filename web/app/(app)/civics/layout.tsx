// Disable SSR for civics page to work around Next.js route group path resolution bug
// See: https://github.com/vercel/next.js/issues/55717
// This prevents Next.js from trying to load the source file at runtime
export const dynamic = 'force-dynamic';
export const ssr = false;

export default function CivicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

