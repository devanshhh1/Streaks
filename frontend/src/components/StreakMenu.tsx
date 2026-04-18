import React, { useEffect, useRef, useState } from 'react'
import './StreakMenu.css'

interface StreakMenuProps {
  streakId: string
  streakName: string
  onViewHeatmap: (streakId: string) => void
  onEdit?: (streakId: string) => void
  onDelete?: (streakId: string) => void
}

export const StreakMenu: React.FC<StreakMenuProps> = ({
  streakId,
  streakName,
  onViewHeatmap,
  onEdit,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (!isOpen) {
      return undefined
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)

  return (
    <div className="streak-menu" ref={menuRef}>
      <button
        type="button"
        className="streak-menu-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`More Options for ${streakName}`}
        title="More Options"
      >
        <span className="streak-menu-dots" aria-hidden="true">...</span>
      </button>

      {isOpen && (
        <div className="streak-menu-dropdown">
          {onEdit && (
            <button
              type="button"
              className="menu-item edit"
              onClick={() => {
                onEdit(streakId)
                closeMenu()
              }}
            >
              Edit Streak
            </button>
          )}

          <button
            type="button"
            className="menu-item view-heatmap"
            onClick={() => {
              onViewHeatmap(streakId)
              closeMenu()
            }}
          >
            View Consistency
          </button>

          {onDelete && (
            <button
              type="button"
              className="menu-item delete"
              onClick={() => {
                onDelete(streakId)
                closeMenu()
              }}
            >
              Delete Streak
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default StreakMenu
