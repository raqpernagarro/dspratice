import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLoading } from './SkeletonLoading';

function getRoot(container: HTMLElement) {
  return container.querySelector('.dsn-skeleton-loading') as HTMLElement;
}

describe('SkeletonLoading', () => {
  it('renders with default avatar type', () => {
    const { container } = render(<SkeletonLoading />);
    expect(getRoot(container)).toBeTruthy();
    expect(getRoot(container).getAttribute('data-type')).toBe('avatar');
  });

  it('renders pill type', () => {
    const { container } = render(<SkeletonLoading type="pill" />);
    expect(getRoot(container).getAttribute('data-type')).toBe('pill');
  });

  it('renders image type', () => {
    const { container } = render(<SkeletonLoading type="image" />);
    expect(getRoot(container).getAttribute('data-type')).toBe('image');
  });

  it('renders card type', () => {
    const { container } = render(<SkeletonLoading type="card" />);
    expect(getRoot(container).getAttribute('data-type')).toBe('card');
  });

  it('is hidden from assistive technology by default', () => {
    const { container } = render(<SkeletonLoading />);
    expect(getRoot(container).getAttribute('aria-hidden')).toBe('true');
  });

  it('merges custom className', () => {
    const { container } = render(<SkeletonLoading className="custom-skeleton" />);
    expect(getRoot(container).classList.contains('custom-skeleton')).toBe(true);
  });
});
