import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FileThumbnail } from './FileThumbnail';

describe('FileThumbnail', () => {
  it('renders a file thumbnail by default', () => {
    render(<FileThumbnail />);
    const thumbnail = screen.getByRole('img', { name: 'File thumbnail' });
    expect(thumbnail).toHaveAttribute('data-variant', 'file');
    expect(thumbnail).toHaveAttribute('data-size', 'xxSmall');
  });

  it('renders image variant when source is provided', () => {
    render(<FileThumbnail variant="image" size="large" imageSrc="/tmp/sample.png" />);
    const thumbnail = screen.getByRole('img', { name: 'Image thumbnail' });
    expect(thumbnail).toHaveAttribute('data-variant', 'image');
    expect(thumbnail.querySelector('.dsn-file-thumbnail-image')).toBeInTheDocument();
  });

  it('falls back to the file icon when the image variant has no source', () => {
    render(<FileThumbnail variant="image" />);
    const thumbnail = screen.getByRole('img', { name: 'Image thumbnail' });
    expect(thumbnail).toHaveAttribute('data-variant', 'file');
    expect(thumbnail.querySelector('img')).not.toBeInTheDocument();
    expect(thumbnail.querySelector('.dsn-file-thumbnail-icon')).toBeInTheDocument();
  });

  it('supports all figma thumbnail sizes', () => {
    const sizes = ['xxSmall', 'xSmall', 'small', 'medium', 'large', 'xLarge', 'xxLarge'] as const;
    render(
      <div>
        {sizes.map((size) => (
          <FileThumbnail key={size} size={size} aria-label={`thumb-${size}`} />
        ))}
      </div>,
    );

    sizes.forEach((size) => {
      expect(screen.getByRole('img', { name: `thumb-${size}` })).toHaveAttribute('data-size', size);
    });
  });
});
