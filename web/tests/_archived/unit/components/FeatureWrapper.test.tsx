import { render, screen } from '@testing-library/react';
import React from 'react';

import {
  FeatureWrapper,
  FeatureWrapperBatch,
  FeatureWrapperWithDependencies,
  withFeatureFlag,
  withFeatureFlagsBatch
} from '@/components/shared/FeatureWrapper';

jest.mock('@/features/pwa/hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn(),
  useFeatureFlagsBatch: jest.fn(),
  useFeatureFlagWithDependencies: jest.fn(),
  useFeatureFlags: jest.fn()
}));

const mockUseFeatureFlag = jest.requireMock('@/features/pwa/hooks/useFeatureFlags').useFeatureFlag as jest.Mock;
const mockUseFeatureFlagsBatch = jest.requireMock('@/features/pwa/hooks/useFeatureFlags').useFeatureFlagsBatch as jest.Mock;
const mockUseFeatureFlagWithDependencies =
  jest.requireMock('@/features/pwa/hooks/useFeatureFlags').useFeatureFlagWithDependencies as jest.Mock;

describe('FeatureWrapper components', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseFeatureFlag.mockReturnValue({
      enabled: true,
      disabled: false,
      loading: false
    });
    mockUseFeatureFlagsBatch.mockReturnValue({
      allEnabled: true,
      anyEnabled: true,
      loading: false
    });
    mockUseFeatureFlagWithDependencies.mockReturnValue({
      enabled: true,
      disabled: false,
      dependenciesMet: true,
      loading: false
    });
  });

  it('renders children when feature is enabled', () => {
    render(
      <FeatureWrapper feature="test">
        <p>child content</p>
      </FeatureWrapper>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders fallback when feature is disabled', () => {
    mockUseFeatureFlag.mockReturnValue({
      enabled: false,
      disabled: true,
      loading: false
    });

    render(
      <FeatureWrapper feature="test" fallback={<span>disabled</span>}>
        <p>child content</p>
      </FeatureWrapper>
    );
    expect(screen.getByText('disabled')).toBeInTheDocument();
  });

  it('FeatureWrapperBatch respects anyEnabled=false by requiring all flags', () => {
    mockUseFeatureFlagsBatch.mockReturnValue({
      allEnabled: false,
      anyEnabled: true,
      loading: false
    });

    render(
      <FeatureWrapperBatch features={['a', 'b']} fallback={<span>blocked</span>}>
        <p>batch child</p>
      </FeatureWrapperBatch>
    );

    expect(screen.getByText('blocked')).toBeInTheDocument();
  });

  it('FeatureWrapperBatch renders when anyEnabled=true and any flag enabled', () => {
    mockUseFeatureFlagsBatch.mockReturnValue({
      allEnabled: false,
      anyEnabled: true,
      loading: false
    });

    render(
      <FeatureWrapperBatch features={['a', 'b']} anyEnabled fallback={<span>blocked</span>}>
        <p>batch child</p>
      </FeatureWrapperBatch>
    );

    expect(screen.getByText('batch child')).toBeInTheDocument();
  });

  it('FeatureWrapperWithDependencies renders dependencies fallback when unmet', () => {
    mockUseFeatureFlagWithDependencies.mockReturnValue({
      enabled: true,
      disabled: false,
      dependenciesMet: false,
      loading: false
    });

    render(
      <FeatureWrapperWithDependencies feature="dep" dependenciesFallback={<span>deps missing</span>}>
        <p>dependent child</p>
      </FeatureWrapperWithDependencies>
    );

    expect(screen.getByText('deps missing')).toBeInTheDocument();
  });

  it('withFeatureFlag falls back when disabled', () => {
    mockUseFeatureFlag.mockReturnValue({
      enabled: false,
      disabled: true,
      loading: false
    });

    const Wrapped = () => <div>wrapped</div>;
    const Fallback = () => <div>fallback</div>;
    const Component = withFeatureFlag(Wrapped, 'flag', Fallback);

    render(<Component />);

    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('withFeatureFlagsBatch requires all flags unless anyEnabled is true', () => {
    mockUseFeatureFlagsBatch.mockReturnValue({
      allEnabled: false,
      anyEnabled: true,
      loading: false
    });

    const Wrapped = () => <div>wrapped</div>;
    const Fallback = () => <div>fallback</div>;
    const Component = withFeatureFlagsBatch(Wrapped, ['a', 'b'], Fallback);

    render(<Component />);

    expect(screen.getByText('fallback')).toBeInTheDocument();
  });
});

