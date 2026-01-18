import Link from 'next/link';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="border-t bg-white"
      data-testid="site-footer"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center sm:text-left">
          © {year} Choices. All rights reserved.
        </p>

        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-4 text-blue-600"
        >
          <Link
            href="/terms"
            prefetch={false}
            className="font-medium transition-colors hover:text-blue-700 focus-visible:underline"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            prefetch={false}
            className="font-medium transition-colors hover:text-blue-700 focus-visible:underline"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;

