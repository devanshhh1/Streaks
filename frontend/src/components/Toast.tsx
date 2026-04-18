import React, { useEffect } from 'react'
import './Toast.css'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  isVisible: boolean
  onClose: () => void
  autoCloseDuration?: number
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  autoCloseDuration = 3000
}) => {
  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(onClose, autoCloseDuration)
    return () => clearTimeout(timer)
  }, [isVisible, autoCloseDuration, onClose])

  if (!isVisible) return null

  return (
    <div className={`toast toast-${type} slide-in-right`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon(type)}</span>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close toast">
        ✕
      </button>
    </div>
  )
}

function getIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    default:
      return '●'
  }
}

export default Toast
