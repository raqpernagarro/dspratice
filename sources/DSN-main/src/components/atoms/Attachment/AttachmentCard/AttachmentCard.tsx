import { EllipsisVertical, File, X } from 'lucide-react';
import { Button } from '../../Button';
import { ProgressRing } from '../../ProgressRing';
import './AttachmentCard.css';

export type AttachmentCardVariant = 'file' | 'picture';
export type AttachmentCardDescriptionPosition = 'inside' | 'outside';
export type AttachmentCardAction = 'none' | 'more' | 'remove';

export interface AttachmentCardProps {
  variant?: AttachmentCardVariant;
  descriptionPosition?: AttachmentCardDescriptionPosition;
  loading?: boolean;
  title?: string;
  metaData?: string;
  hasMetadata?: boolean;
  showDescription?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  action?: AttachmentCardAction;
  showActionOnHover?: boolean;
  onActionClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Square attachment tile with picture or file-icon preview, title, metadata and optional remove/overflow action.
 *
 * @aiSelectWhen Showing attachments as a visual grid where the preview matters
 *
 * @aiAvoid Do not use for a scannable file list — use FileRow instead
 * @aiAvoid Do not use for composer attachments — use AttachmentChip instead
 * @aiAvoid Do not use as a content card — use Card instead
 *
 * @aiVariant variant="picture" — images (imageSrc + imageAlt); variant="file" — other files
 * @aiVariant descriptionPosition="outside" — default; "inside" — dense galleries
 *
 * @aiSpatial Fixed tile size; lay tiles out in a wrapping flex or grid that owns the gaps.
 *
 * @aiCompose action="more" renders no menu — open a PopoverMenu from onActionClick
 */
export function AttachmentCard({
  variant = 'file',
  descriptionPosition = 'outside',
  loading = false,
  title = 'Title',
  metaData = 'Meta data',
  hasMetadata = true,
  showDescription = true,
  imageSrc,
  imageAlt = 'Attachment preview',
  action = 'none',
  showActionOnHover = true,
  onActionClick,
  className,
  'aria-label': ariaLabel,
}: AttachmentCardProps) {
  const rootClass = ['dsn-attachment-card', className].filter(Boolean).join(' ');
  const showActionButton = action !== 'none';
  const actionLabel = action === 'more' ? `More options for ${title}` : `Remove ${title}`;

  return (
    <article
      className={rootClass}
      data-variant={variant}
      data-description-position={descriptionPosition}
      data-loading={loading || undefined}
      data-show-action-on-hover={showActionOnHover || undefined}
      aria-label={ariaLabel ?? title}
    >
      <div className="dsn-attachment-card-thumbnail">
        {variant === 'picture' && imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            className="dsn-attachment-card-image"
          />
        ) : null}

        {variant === 'file' && !loading && (
          <span className="dsn-attachment-card-file-icon" aria-hidden="true">
            <File size={32} strokeWidth={1.75} />
          </span>
        )}

        {loading && (
          <span className="dsn-attachment-card-loading">
            <ProgressRing size="lg" label={`Loading ${title}`} />
          </span>
        )}

        {showActionButton && (
          <Button
            variant="secondary"
            size="sm"
            showLabel={false}
            showLeadingIcon
            leadingIcon={
              action === 'more' ? (
                <EllipsisVertical size={16} aria-hidden="true" />
              ) : (
                <X size={16} aria-hidden="true" />
              )
            }
            className="dsn-attachment-card-action"
            onClick={onActionClick}
            aria-label={actionLabel}
            aria-haspopup={action === 'more' ? 'menu' : undefined}
          />
        )}

        {showDescription && descriptionPosition === 'inside' && (
          <div className="dsn-attachment-card-info dsn-attachment-card-info--inside">
            <p className="dsn-attachment-card-title">{title}</p>
            {hasMetadata && <p className="dsn-attachment-card-meta">{metaData}</p>}
          </div>
        )}
      </div>

      {showDescription && descriptionPosition === 'outside' && (
        <div className="dsn-attachment-card-info dsn-attachment-card-info--outside">
          <p className="dsn-attachment-card-title">{title}</p>
          {hasMetadata && <p className="dsn-attachment-card-meta">{metaData}</p>}
        </div>
      )}
    </article>
  );
}

export default AttachmentCard;
