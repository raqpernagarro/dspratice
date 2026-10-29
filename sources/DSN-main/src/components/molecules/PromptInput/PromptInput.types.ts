import type { FileThumbnailVariant } from '../../atoms/Attachment';

export interface PromptInputQuickAction {
  id: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

export interface PromptInputAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  previewVariant?: FileThumbnailVariant;
  previewSrc?: string;
  loading?: boolean;
}

export interface PromptInputModelOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PromptInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;

  quickActions?: PromptInputQuickAction[];
  attachments?: PromptInputAttachment[];
  onAttachmentRemove?: (id: string) => void;

  onAttachClick?: () => void;
  accept?: string;
  multiple?: boolean;
  onFilesSelected?: (files: FileList) => void;

  modelOptions?: PromptInputModelOption[];
  modelValue?: string;
  defaultModelValue?: string;
  onModelChange?: (value: string) => void;

  onSubmit?: () => void;

  dictationLang?: string;
  onDictationChange?: (active: boolean) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;

  maxHeight?: string;
  className?: string;
  'aria-label'?: string;
}
