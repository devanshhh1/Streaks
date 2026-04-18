import React, { useEffect, useState } from 'react'
import './RecurringStreakForm.css'

export interface RecurringStreakData {
  streakName: string
  frequency: 'weekly' | 'monthly'
  investmentAmount: number
  nextDueDate?: string
  investmentType?: string
  tenure?: number
  bank?: string
  autoDebit?: boolean
}

interface RecurringStreakFormProps {
  onSubmit: (data: RecurringStreakData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
  initialData?: Partial<RecurringStreakData>
  title?: string
  submitLabel?: string
}

const buildInitialData = (initialData?: Partial<RecurringStreakData>): RecurringStreakData => ({
  streakName: initialData?.streakName ?? '',
  frequency: initialData?.frequency ?? 'weekly',
  investmentAmount: initialData?.investmentAmount ?? 1000,
  nextDueDate: initialData?.nextDueDate ?? '',
  investmentType: initialData?.investmentType ?? 'SIP',
  tenure: initialData?.tenure ?? 12,
  bank: initialData?.bank ?? '',
  autoDebit: initialData?.autoDebit ?? false,
})

export const RecurringStreakForm: React.FC<RecurringStreakFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
  initialData,
  title,
  submitLabel,
}) => {
  const [formData, setFormData] = useState<RecurringStreakData>(buildInitialData(initialData))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFormData(buildInitialData(initialData))
    setError(null)
  }, [initialData, mode])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target

    let nextValue: string | number | boolean = value

    if (type === 'checkbox') {
      nextValue = (event.target as HTMLInputElement).checked
    } else if (name === 'investmentAmount' || name === 'tenure') {
      nextValue = value === '' ? 0 : Number(value)
    }

    setFormData((previous) => ({
      ...previous,
      [name]: nextValue,
    }))
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.streakName.trim()) {
      setError('Streak name is required')
      return
    }

    if (formData.investmentAmount > 100000) {
      setError('Investment amount at once cannot exceed 1 Lakh')
      return
    }

    if (formData.investmentAmount < 1000) {
      setError('Minimum investment is Rs 1,000')
      return
    }

    if (mode === 'edit' && !formData.nextDueDate) {
      setError('Next due date is required')
      return
    }

    try {
      await onSubmit({
        ...formData,
        streakName: formData.streakName.trim(),
      })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : mode === 'edit'
            ? 'Failed to update streak'
            : 'Failed to create streak'
      )
    }
  }

  const resolvedTitle = title ?? (mode === 'edit' ? 'Edit Streak' : 'Create Recurring Investment')
  const resolvedSubmitLabel = submitLabel ?? (mode === 'edit' ? 'Save Changes' : 'Create Streak')

  return (
    <form className="recurring-streak-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>{resolvedTitle}</h3>
        <button
          type="button"
          className="form-close"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close form"
        >
          x
        </button>
      </div>

      {error && (
        <div className="form-error">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="streakName">Streak Name *</label>
        <input
          type="text"
          id="streakName"
          name="streakName"
          value={formData.streakName}
          onChange={handleChange}
          placeholder="e.g., Weekly FD, Monthly SIP"
          required
          disabled={isLoading}
        />
      </div>

      <div className={`form-grid ${mode === 'edit' ? 'form-grid-two' : ''}`}>
        <div className="form-group">
          <label htmlFor="frequency">Frequency *</label>
          <select
            id="frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="investmentAmount">Amount (Rs) *</label>
          <input
            type="number"
            id="investmentAmount"
            name="investmentAmount"
            value={formData.investmentAmount}
            onChange={handleChange}
            placeholder="1000 - 100000"
            min="1000"
            max="100000"
            step="500"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {mode === 'edit' && (
        <div className="form-group">
          <label htmlFor="nextDueDate">Next Due Date *</label>
          <input
            type="date"
            id="nextDueDate"
            name="nextDueDate"
            value={formData.nextDueDate ?? ''}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
      )}

      {mode === 'create' && (
        <>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="investmentType">Type</label>
              <select
                id="investmentType"
                name="investmentType"
                value={formData.investmentType}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="SIP">SIP</option>
                <option value="RD">Fixed Deposit (RD)</option>
                <option value="PPF">PPF</option>
                <option value="NSC">NSC</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tenure">Tenure (months)</label>
              <input
                type="number"
                id="tenure"
                name="tenure"
                value={formData.tenure}
                onChange={handleChange}
                min="1"
                max="360"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bank">Bank/Instrument</label>
            <input
              type="text"
              id="bank"
              name="bank"
              value={formData.bank}
              onChange={handleChange}
              placeholder="e.g., HDFC, ICICI, Groww"
              disabled={isLoading}
            />
          </div>

          <div className="form-checkbox">
            <input
              type="checkbox"
              id="autoDebit"
              name="autoDebit"
              checked={Boolean(formData.autoDebit)}
              onChange={handleChange}
              disabled={isLoading}
            />
            <label htmlFor="autoDebit">
              <span className="checkbox-label">Auto-debit from account</span>
              <span className="checkbox-hint">Automatic monthly or weekly transfers</span>
            </label>
          </div>
        </>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-submit"
          disabled={isLoading}
        >
          {isLoading ? (mode === 'edit' ? 'Saving...' : 'Creating...') : resolvedSubmitLabel}
        </button>
      </div>
    </form>
  )
}

export default RecurringStreakForm
