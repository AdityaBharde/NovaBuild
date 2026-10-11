import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {isDestructive && (
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg border border-border hover:bg-surface-elevated transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-medium text-white rounded-lg flex items-center gap-1.5 transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800'
                : 'bg-accent hover:bg-accent-hover disabled:bg-accent/50'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
