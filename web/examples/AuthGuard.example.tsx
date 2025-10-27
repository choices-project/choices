// Example usage of AuthGuard
import { AuthGuard } from '@/components/business';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard redirectTo="/auth" fallback={<div>Loading...</div>}>
      {children}
    </AuthGuard>
  );
}