// Integration tests for restored components
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '@/components/business';
import { GlobalNavigation } from '@/components/shared';

describe('Restored Components Integration', () => {
  test('AuthGuard renders without crashing', () => {
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  test('GlobalNavigation renders without crashing', () => {
    render(<GlobalNavigation />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});