import React from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import './ConsistencyHeatmap.css'

interface CompletionRecord {
  date: string
  status: 'success' | 'missed'
}

interface ConsistencyHeatmapProps {
  completionHistory: CompletionRecord[]
  streakName: string
  onClose: () => void
}

interface HeatmapValue {
  date: Date
  count: number
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({
  completionHistory,
  streakName,
  onClose,
}) => {
  const heatmapData: HeatmapValue[] = completionHistory.map((record) => ({
    date: new Date(record.date),
    count: record.status === 'success' ? 1 : -1,
  }))

  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)

  return (
    <div className="heatmap-overlay" onClick={onClose}>
      <div className="heatmap-modal" onClick={(event) => event.stopPropagation()}>
        <div className="heatmap-header">
          <h2>{streakName} - Consistency Graph</h2>
          <button type="button" className="heatmap-close" onClick={onClose} aria-label="Close consistency graph">
            x
          </button>
        </div>

        <div className="heatmap-content">
          <div className="heatmap-container">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={heatmapData}
              classForValue={(value: HeatmapValue | null) => {
                if (!value) {
                  return 'color-empty'
                }

                if (value.count > 0) {
                  return 'color-success'
                }

                if (value.count < 0) {
                  return 'color-missed'
                }

                return 'color-empty'
              }}
              tooltipDataAttrs={(value: HeatmapValue | null) => {
                if (!value || !value.date) {
                  return {}
                }

                const dateStr = value.date.toISOString().split('T')[0]
                const status =
                  value.count > 0 ? 'Completed' : value.count < 0 ? 'Missed' : 'No activity'

                return {
                  'data-tooltip': `${dateStr}: ${status}`,
                }
              }}
              onClick={(_value: HeatmapValue | null) => undefined}
            />
          </div>

          <div className="heatmap-legend">
            <div className="legend-item">
              <div className="legend-box success"></div>
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <div className="legend-box missed"></div>
              <span>Missed</span>
            </div>
            <div className="legend-item">
              <div className="legend-box empty"></div>
              <span>No Activity</span>
            </div>
          </div>

          <div className="heatmap-stats">
            <div className="stat-box">
              <div className="stat-label">Total Completed</div>
              <div className="stat-value">
                {completionHistory.filter((record) => record.status === 'success').length}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Times Missed</div>
              <div className="stat-value">
                {completionHistory.filter((record) => record.status === 'missed').length}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Consistency Rate</div>
              <div className="stat-value">
                {completionHistory.length > 0
                  ? Math.round(
                      (completionHistory.filter((record) => record.status === 'success').length /
                        completionHistory.length) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsistencyHeatmap
