import { Suspense } from 'react';

import AuthFinishClient from './AuthFinishClient';

export const dynamic = 'force-dynamic';

export default function AuthFinishPage() {
  return (
    <Suspense fallback={null}>
      <AuthFinishClient />
    </Suspense>
  );
}
