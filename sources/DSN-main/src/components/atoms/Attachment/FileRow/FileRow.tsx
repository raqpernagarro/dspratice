import { Download, Link2, X } from 'lucide-react';
import { Button } from '../../Button';
import { ButtonGroup } from '../../ButtonGroup';
import { Tooltip } from '../../../molecules/Tooltip';
import { FileThumbnail, type FileThumbnailVariant } from '../FileThumbnail';
import { ProgressBar } from '../../ProgressBar';
import './FileRow.css';

export type FileRowState = 'default' | 'hover' | 'uploading';

export interface FileRowProps {
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  previewVariant?: FileThumbnailVariant;
  previewSrc?: string;
  state?: FileRowState;
  uploadProgress?: number;
  className?: string;
  onCopyLink?: () => void;
  onDownload?: () => void;
  onCancelUpload?: () => void;
  'aria-label'?: string;
}

/**
 * File list row with thumbnail, name, type, size, optional copy-link and download actions, or upload progress with cancel.
 *
 * @aiSelectWhen Listing files that belong to a record, or showing upload progress below UploadArea
 *
 * @aiAvoid Do not use for a visual gallery — use AttachmentCard instead
 * @aiAvoid Do not use for composer attachments — use AttachmentChip instead
 * @aiAvoid Do not use for many sortable files — use DataTable instead
 *
 * @aiVariant state="default" — available file; "uploading" — progress + cancel; "hover" — static previews only
 *
 * @aiSpatial Spans the list width; the list container owns gaps between rows.
 */
export function FileRow({
  fileName = 'File name',
  fileType,
  fileSize,
  previewVariant = 'file',
  previewSrc,
  state = 'default',
  uploadProgress = 0,
  className,
  onCopyLink,
  onDownload,
  onCancelUpload,
  'aria-label': ariaLabel,
}: FileRowProps) {
  const isUploading = state === 'uploading';
  const rootClass = ['dsn-file-row', className].filter(Boolean).join(' ');
  const hasMeta = Boolean(fileType || fileSize);
  const hasActions = Boolean(onCopyLink || onDownload);

  return (
    <article
      className={rootClass}
      data-state={state}
      data-has-actions={hasActions || undefined}
      aria-label={ariaLabel ?? fileName}
    >
      <div className="dsn-file-row-thumbnail">
        <FileThumbnail
          variant={previewVariant}
          imageSrc={previewSrc}
          size="large"
          aria-label={`${previewVariant} preview`}
        />
      </div>

      <div className="dsn-file-row-content">
        <div className="dsn-file-row-title-wrap">
          <p className="dsn-file-row-title">{fileName}</p>

          {isUploading && (
            <Button
              variant="ghost"
              size="sm"
              showLabel={false}
              showLeadingIcon
              leadingIcon={<X size={16} aria-hidden="true" />}
              className="dsn-file-row-action-btn"
              aria-label={`Cancel upload for ${fileName}`}
              onClick={onCancelUpload}
            />
          )}
        </div>

        {!isUploading && hasMeta && (
          <p className="dsn-file-row-meta">
            {fileType && <span>{fileType}</span>}
            {fileType && fileSize && <span aria-hidden="true">•</span>}
            {fileSize && <span>{fileSize}</span>}
          </p>
        )}

        {!isUploading && hasActions && (
          <ButtonGroup
            size="sm"
            spaceBetween
            className="dsn-file-row-actions"
            aria-label={`Actions for ${fileName}`}
          >
            {onCopyLink && (
              <Tooltip content="Copy link">
                <Button
                  variant="ghost"
                  size="sm"
                  showLabel={false}
                  showLeadingIcon
                  leadingIcon={<Link2 size={16} aria-hidden="true" />}
                  className="dsn-file-row-action-btn"
                  aria-label={`Copy link for ${fileName}`}
                  onClick={onCopyLink}
                />
              </Tooltip>
            )}
            {onDownload && (
              <Tooltip content="Download">
                <Button
                  variant="ghost"
                  size="sm"
                  showLabel={false}
                  showLeadingIcon
                  leadingIcon={<Download size={16} aria-hidden="true" />}
                  className="dsn-file-row-action-btn"
                  aria-label={`Download ${fileName}`}
                  onClick={onDownload}
                />
              </Tooltip>
            )}
          </ButtonGroup>
        )}

        {isUploading && (
          <div className="dsn-file-row-progress">
            <ProgressBar value={uploadProgress} label={`Uploading ${fileName}`} />
          </div>
        )}
      </div>
    </article>
  );
}

export default FileRow;
