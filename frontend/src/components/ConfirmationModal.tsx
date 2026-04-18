import React from 'react'
import './ConfirmationModal.css'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDangerous?: boolean
  isLoading?: boolean
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false
}) => {
  if (!isOpen) return null

  return (
    <div className="confirmation-overlay" onClick={onCancel}>
      <div className="confirmation-modal fade-in-scale" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-header">
          <h2>{title}</h2>
        </div>

        <div className="confirmation-body">
          <p>{message}</p>
        </div>

        <div className="confirmation-actions">
          <button
            className="btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`btn-confirm ${isDangerous ? 'btn-danger' : ''}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal
