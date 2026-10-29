import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Star } from 'lucide-react';
import { Avatar, AvatarGroup } from './Avatar';

// =============================================================================
// Helpers
// =============================================================================

function renderAvatar(ui: React.ReactElement) {
  return render(ui);
}

function renderGroup(ui: React.ReactElement) {
  return render(ui);
}

// =============================================================================
// Avatar
// =============================================================================

describe('Avatar', () => {

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders a <div> with role="img"', () => {
      renderAvatar(<Avatar name="Ana Costa" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('sets aria-label from name prop', () => {
      renderAvatar(<Avatar name="Ana Costa" />);
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Ana Costa');
    });

    it('sets aria-hidden when name is not provided', () => {
      renderAvatar(<Avatar />);
      const el = document.querySelector('.dsn-avatar');
      expect(el).toHaveAttribute('aria-hidden', 'true');
    });

    it('forwards className to the root element', () => {
      renderAvatar(<Avatar name="Test" className="my-avatar" />);
      expect(screen.getByRole('img')).toHaveClass('my-avatar');
    });

    it('always has dsn-avatar class', () => {
      renderAvatar(<Avatar name="Test" />);
      expect(screen.getByRole('img')).toHaveClass('dsn-avatar');
    });
  });

  // ── Sizes ──────────────────────────────────────────────────────────────────

  describe('sizes', () => {
    const sizes = ['xxs', 'xs', 'sm', 'lg', 'xl', 'xxl'] as const;

    sizes.forEach((size) => {
      it(`sets data-size="${size}"`, () => {
        renderAvatar(<Avatar size={size} name="Test" />);
        expect(screen.getByRole('img')).toHaveAttribute('data-size', size);
      });
    });

    it('defaults to size="sm"', () => {
      renderAvatar(<Avatar name="Test" />);
      expect(screen.getByRole('img')).toHaveAttribute('data-size', 'sm');
    });
  });

  // ── Variants ───────────────────────────────────────────────────────────────

  describe('variants', () => {
    it('sets data-variant="profile" by default', () => {
      renderAvatar(<Avatar name="Test" />);
      expect(screen.getByRole('img')).toHaveAttribute('data-variant', 'profile');
    });

    it('sets data-variant="organization"', () => {
      renderAvatar(<Avatar variant="organization" name="Ngr" />);
      expect(screen.getByRole('img')).toHaveAttribute('data-variant', 'organization');
    });
  });

  // ── Fill: initials ──────────────────────────────────────────────────────────

  describe('fill: initials', () => {
    it('renders the initials text', () => {
      renderAvatar(<Avatar fill="initials" initials="AC" name="Ana Costa" />);
      expect(screen.getByRole('img')).toHaveTextContent('AC');
    });

    it('uppercases initials automatically', () => {
      renderAvatar(<Avatar fill="initials" initials="ac" name="Ana Costa" />);
      expect(screen.getByRole('img')).toHaveTextContent('AC');
    });

    it('trims initials to 2 characters', () => {
      renderAvatar(<Avatar fill="initials" initials="ABC" name="Ana B Costa" />);
      expect(screen.getByRole('img')).toHaveTextContent('AB');
    });

    it('sets data-fill="initials"', () => {
      renderAvatar(<Avatar fill="initials" initials="AC" name="Ana Costa" />);
      expect(screen.getByRole('img')).toHaveAttribute('data-fill', 'initials');
    });
  });

  // ── Fill: picture ──────────────────────────────────────────────────────────

  describe('fill: picture', () => {
    it('renders an <img> with the correct src', () => {
      renderAvatar(
        <Avatar fill="picture" src="https://example.com/photo.jpg" name="Ana Costa" />
      );
      const img = document.querySelector('.dsn-avatar-image') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('photo.jpg');
    });

    it('uses name as img alt when alt is not provided', () => {
      renderAvatar(
        <Avatar fill="picture" src="https://example.com/photo.jpg" name="Ana Costa" />
      );
      const img = document.querySelector('.dsn-avatar-image') as HTMLImageElement;
      expect(img.alt).toBe('Ana Costa');
    });

    it('uses explicit alt prop when provided', () => {
      renderAvatar(
        <Avatar fill="picture" src="https://example.com/photo.jpg" name="Ana Costa" alt="Photo of Ana" />
      );
      const img = document.querySelector('.dsn-avatar-image') as HTMLImageElement;
      expect(img.alt).toBe('Photo of Ana');
    });

    it('does not render an img when src is missing', () => {
      renderAvatar(<Avatar fill="picture" name="Ana Costa" />);
      expect(document.querySelector('.dsn-avatar-image')).toBeNull();
    });

    it('sets data-fill="picture"', () => {
      renderAvatar(<Avatar fill="picture" src="https://example.com/photo.jpg" name="Ana Costa" />);
      // Use querySelector to target the dsn-avatar root div specifically
      // (getByRole('img') matches both the outer div and the inner <img>)
      const avatar = document.querySelector('.dsn-avatar') as HTMLElement;
      expect(avatar).toHaveAttribute('data-fill', 'picture');
    });
  });

  // ── Fill: icon ─────────────────────────────────────────────────────────────

  describe('fill: icon', () => {
    it('renders the icon wrapper', () => {
      renderAvatar(<Avatar fill="icon" name="Anonymous" />);
      expect(document.querySelector('.dsn-avatar-icon')).toBeInTheDocument();
    });

    it('renders the default profile SVG when no icon prop is given', () => {
      renderAvatar(<Avatar fill="icon" variant="profile" name="Anonymous" />);
      const iconEl = document.querySelector('.dsn-avatar-icon');
      expect(iconEl?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders a custom Lucide icon when provided', () => {
      // Pass the component reference (LucideIcon), not JSX: icon={Star} not icon={<Star />}
      renderAvatar(<Avatar fill="icon" icon={Star} name="Custom" />);
      expect(document.querySelector('.dsn-avatar-icon svg')).toBeInTheDocument();
    });

    it('sets data-fill="icon"', () => {
      renderAvatar(<Avatar fill="icon" name="Anonymous" />);
      expect(screen.getByRole('img')).toHaveAttribute('data-fill', 'icon');
    });
  });

  // ── Default fill ────────────────────────────────────────────────────────────

  describe('default fill', () => {
    it('defaults to fill="initials"', () => {
      renderAvatar(<Avatar initials="AC" name="Ana Costa" />);
      expect(screen.getByRole('img')).toHaveAttribute('data-fill', 'initials');
    });
  });
});


// =============================================================================
// AvatarGroup
// =============================================================================

const sampleAvatars = [
  { name: 'Ana Costa',     initials: 'AC' },
  { name: 'João Silva',    initials: 'JS' },
  { name: 'Maria Nunes',   initials: 'MN' },
  { name: 'Pedro Dias',    initials: 'PD' },
  { name: 'Sara Ferreira', initials: 'SF' },
];

describe('AvatarGroup', () => {

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders a group element', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders up to maxVisible avatars', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} maxVisible={3} />);
      const group = screen.getByRole('group');
      // 3 avatar elements (role=img) inside the group
      expect(within(group).getAllByRole('img')).toHaveLength(3);
    });

    it('renders all avatars when count ≤ maxVisible', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} maxVisible={5} />);
      const group = screen.getByRole('group');
      expect(within(group).getAllByRole('img')).toHaveLength(5);
    });

    it('sets data-size on the group container', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} size="xs" />);
      expect(screen.getByRole('group')).toHaveAttribute('data-size', 'xs');
    });

    it('defaults to size="sm"', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} />);
      expect(screen.getByRole('group')).toHaveAttribute('data-size', 'sm');
    });

    it('forwards className to the group container', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} className="my-group" />);
      expect(screen.getByRole('group')).toHaveClass('my-group');
    });
  });

  // ── Overflow ───────────────────────────────────────────────────────────────

  describe('overflow', () => {
    it('shows "+N" overflow chip when avatars exceed maxVisible', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} maxVisible={3} />);
      expect(document.querySelector('.dsn-avatar-group-overflow')).toHaveTextContent('+2');
    });

    it('does not show overflow chip when count equals maxVisible', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} maxVisible={5} />);
      expect(document.querySelector('.dsn-avatar-group-overflow')).toBeNull();
    });

    it('does not show overflow chip when count is below maxVisible', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars.slice(0, 3)} maxVisible={5} />);
      expect(document.querySelector('.dsn-avatar-group-overflow')).toBeNull();
    });

    it('overflow count equals total − maxVisible', () => {
      // 8 avatars, maxVisible=5 → "+3"
      const eightAvatars = [
        ...sampleAvatars,
        { name: 'X1', initials: 'X1' },
        { name: 'X2', initials: 'X2' },
        { name: 'X3', initials: 'X3' },
      ];
      renderGroup(<AvatarGroup avatars={eightAvatars} maxVisible={5} />);
      expect(document.querySelector('.dsn-avatar-group-overflow')).toHaveTextContent('+3');
    });

    it('keeps overflow chip above the last visible avatar', () => {
      renderGroup(<AvatarGroup avatars={sampleAvatars} maxVisible={4} />);
      const avatarNodes = document.querySelectorAll('.dsn-avatar-group .dsn-avatar');
      const lastVisibleAvatar = avatarNodes[avatarNodes.length - 1] as HTMLElement;
      const overflowNode = document.querySelector('.dsn-avatar-group-overflow') as HTMLElement;

      expect(lastVisibleAvatar.style.zIndex).toBe('4');
      expect(overflowNode.style.zIndex).toBe('5');
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('uses provided aria-label on the group', () => {
      renderGroup(
        <AvatarGroup avatars={sampleAvatars} aria-label="Assigned team members" />
      );
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Assigned team members');
    });

    it('auto-builds aria-label from names when all visible', () => {
      const threePeople = sampleAvatars.slice(0, 3);
      renderGroup(<AvatarGroup avatars={threePeople} maxVisible={5} />);
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-label',
        'Ana Costa, João Silva, Maria Nunes'
      );
    });

    it('auto-builds aria-label with overflow suffix (visible names + count)', () => {
      // 5 avatars, maxVisible=3 → shows 3, overflow=2
      // aria-label lists all avatar names then adds the overflow note
      renderGroup(<AvatarGroup avatars={sampleAvatars} maxVisible={3} />);
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-label',
        'Ana Costa, João Silva, Maria Nunes, and 2 others'
      );
    });

    it('uses singular "other" when overflow is 1', () => {
      const sixAvatars = [...sampleAvatars, { name: 'Extra One', initials: 'EO' }];
      renderGroup(<AvatarGroup avatars={sixAvatars} maxVisible={5} />);
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('and 1 other')
      );
    });
  });

  // ── Hover lift ─────────────────────────────────────────────────────────────

  describe('hover lift', () => {
    it('lifts the hovered avatar and falls off for neighbors', async () => {
      const user = userEvent.setup();
      renderGroup(<AvatarGroup avatars={sampleAvatars} />);
      const group = screen.getByRole('group');
      const avatars = within(group).getAllByRole('img');

      await user.hover(avatars[0]);

      expect(avatars[0].style.getPropertyValue('--dsn-avatar-shift')).toBe('-4.000px');
      expect(avatars[1].style.getPropertyValue('--dsn-avatar-shift')).toBe('-1.800px');
      expect(avatars[2].style.getPropertyValue('--dsn-avatar-shift')).toBe('-0.810px');
      expect(avatars[0].style.getPropertyValue('--dsn-avatar-scale')).toBe('1.05');
      expect(avatars[1].style.getPropertyValue('--dsn-avatar-scale')).toBe('1');
    });

    it('moves the comb when hovering a different avatar', async () => {
      const user = userEvent.setup();
      renderGroup(<AvatarGroup avatars={sampleAvatars} />);
      const group = screen.getByRole('group');
      const avatars = within(group).getAllByRole('img');

      await user.hover(avatars[0]);
      await user.hover(avatars[2]);

      expect(avatars[2].style.getPropertyValue('--dsn-avatar-shift')).toBe('-4.000px');
      expect(avatars[2].style.getPropertyValue('--dsn-avatar-scale')).toBe('1.05');
      expect(avatars[0].style.getPropertyValue('--dsn-avatar-scale')).toBe('1');
      expect(avatars[1].style.getPropertyValue('--dsn-avatar-shift')).toBe('-1.800px');
    });

    it('returns to rest when the pointer leaves the group', async () => {
      const user = userEvent.setup();
      renderGroup(<AvatarGroup avatars={sampleAvatars} />);
      const group = screen.getByRole('group');
      const avatars = within(group).getAllByRole('img');

      await user.hover(avatars[1]);
      await user.unhover(avatars[1]);

      avatars.forEach((avatar) => {
        expect(avatar.style.getPropertyValue('--dsn-avatar-shift')).toBe('0px');
        expect(avatar.style.getPropertyValue('--dsn-avatar-scale')).toBe('1');
      });
    });

    it('includes the overflow chip in the falloff', async () => {
      const user = userEvent.setup();
      renderGroup(<AvatarGroup avatars={sampleAvatars} maxVisible={3} />);
      const overflow = document.querySelector('.dsn-avatar-group-overflow') as HTMLElement;

      await user.hover(overflow);

      expect(overflow.style.getPropertyValue('--dsn-avatar-shift')).toBe('-4.000px');
      expect(overflow.style.getPropertyValue('--dsn-avatar-scale')).toBe('1.05');
    });
  });
});

describe('AvatarGroup — Figma API (Code Connect)', () => {
  const people = [{ name: 'Ana Costa', initials: 'AC' }, { name: 'João Silva', initials: 'JS' }];

  it('renders the add button and label when enabled', async () => {
    const onButtonClick = vi.fn();
    render(
      <AvatarGroup avatars={people} showButton onButtonClick={onButtonClick} showLabel label="2 members" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add person' }));
    expect(onButtonClick).toHaveBeenCalledOnce();
    expect(screen.getByText('2 members')).toBeInTheDocument();
  });

  it('renders neither by default', () => {
    render(<AvatarGroup avatars={people} label="2 members" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('2 members')).toBeNull();
  });
});

describe('Avatar — icon source', () => {
  it('accepts an icon element', () => {
    const { container } = render(<Avatar fill="icon" icon={<Star />} name="Starred" />);
    expect(container.querySelector('.dsn-avatar-icon svg')).not.toBeNull();
  });
});
