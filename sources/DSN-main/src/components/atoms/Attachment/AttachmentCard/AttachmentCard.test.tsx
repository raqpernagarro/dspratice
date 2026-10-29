import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AttachmentCard } from './AttachmentCard';

describe('AttachmentCard', () => {
  it('renders title and metadata by default', () => {
    render(<AttachmentCard title="Report.pdf" metaData="10 MB" />);
    expect(screen.getByText('Report.pdf')).toBeInTheDocument();
    expect(screen.getByText('10 MB')).toBeInTheDocument();
  });

  it('renders picture variant image when imageSrc is provided', () => {
    render(<AttachmentCard variant="picture" imageSrc="https://example.com/pic.jpg" imageAlt="Preview" />);
    expect(screen.getByAltText('Preview')).toBeInTheDocument();
  });

  it('renders loading indicator when loading is true', () => {
    render(<AttachmentCard loading title="Loading file" />);
    expect(screen.getByRole('status', { name: 'Loading Loading file' })).toBeInTheDocument();
  });

  it('renders no action button by default', () => {
    render(<AttachmentCard title="Proposal.pdf" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows action on hover by default', () => {
    const { container } = render(<AttachmentCard title="Proposal.pdf" action="remove" />);
    expect(container.querySelector('.dsn-attachment-card')).toHaveAttribute('data-show-action-on-hover', 'true');
  });

  it('can disable hover-only action visibility', () => {
    const { container } = render(
      <AttachmentCard title="Proposal.pdf" action="remove" showActionOnHover={false} />,
    );
    expect(container.querySelector('.dsn-attachment-card')).not.toHaveAttribute('data-show-action-on-hover');
  });

  it('calls action callback when action button is clicked', () => {
    const onActionClick = vi.fn();
    render(
      <AttachmentCard
        title="Proposal.pdf"
        action="remove"
        showActionOnHover={false}
        onActionClick={onActionClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove Proposal.pdf' }));
    expect(onActionClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when action is none', () => {
    render(<AttachmentCard action="none" title="No action file" />);
    expect(screen.queryByRole('button', { name: /No action file/ })).not.toBeInTheDocument();
  });
});
