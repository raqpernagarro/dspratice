import React from 'react';
import { File } from 'lucide-react';
import './FileThumbnail.css';

export type FileThumbnailVariant = 'file' | 'image';
export type FileThumbnailSize = 'xxSmall' | 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge' | 'xxLarge';

export interface FileThumbnailProps {
  variant?: FileThumbnailVariant;
  size?: FileThumbnailSize;
  imageSrc?: string;
  imageAlt?: string;
  icon?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

function getIconSize(size: FileThumbnailSize): number {
  switch (size) {
    case 'xxSmall':
      return 12;
    case 'xSmall':
    case 'small':
    case 'medium':
      return 16;
    case 'large':
    case 'xLarge':
      return 24;
    case 'xxLarge':
      return 48;
    default:
      return 16;
  }
}

/**
 * Small square image or file-icon preview (role="img") in seven sizes, used inside the attachment components.
 *
 * @aiSelectWhen A custom row or cell needs a file preview and a full attachment component is too much
 *
 * @aiAvoid Do not use for people or organizations — use Avatar instead
 * @aiAvoid Do not use for layout media — use AspectRatio instead
 * @aiAvoid Do not rebuild file pills or rows — use AttachmentChip, FileRow or AttachmentCard instead
 *
 * @aiVariant variant="file" — file icon (or icon); variant="image" — pass imageSrc (falls back to the file icon)
 *
 * @aiSpatial Fixed square per size; images are cropped to fill.
 */
export function FileThumbnail({
  variant = 'file',
  size = 'xxSmall',
  imageSrc,
  imageAlt = 'Image thumbnail',
  icon,
  className,
  'aria-label': ariaLabel,
}: FileThumbnailProps) {
  const rootClass = ['dsn-file-thumbnail', className].filter(Boolean).join(' ');
  const iconSize = getIconSize(size);
  // Without an image source, the image variant falls back to the file icon.
  const showImage = variant === 'image' && Boolean(imageSrc);

  return (
    <span
      className={rootClass}
      data-variant={showImage ? 'image' : 'file'}
      data-size={size}
      role="img"
      aria-label={ariaLabel ?? (variant === 'image' ? imageAlt : 'File thumbnail')}
    >
      {showImage ? (
        <img src={imageSrc} alt="" className="dsn-file-thumbnail-image" aria-hidden="true" />
      ) : (
        <span className="dsn-file-thumbnail-icon" aria-hidden="true">
          {icon ?? <File size={iconSize} strokeWidth={1.75} aria-hidden="true" />}
        </span>
      )}
    </span>
  );
}

export default FileThumbnail;
