import { useState } from 'react'
import './AddInvestmentForm.css'

interface AddInvestmentFormProps {
  onClose: () => void
  onSubmit: (data: InvestmentData) => void
}

export interface InvestmentData {
  investmentType: string
  amount: number
  tenure: number
  frequency?: string
  bank: string
  autoDebit: boolean
}

const AddInvestmentForm = ({ onClose, onSubmit }: AddInvestmentFormProps) => {
  const [investmentType, setInvestmentType] = useState('')
  const [amount, setAmount] = useState('')
  const [tenure, setTenure] = useState('')
  const [frequency, setFrequency] = useState('')
  const [bank, setBank] = useState('')
  const [autoDebit, setAutoDebit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numAmount = parseInt(amount)
    if (numAmount < 500) {
      setError("Minimum investment is ₹500")
      return
    }

    setLoading(true)
    setVerificationMessage('Verifying with Blostem SDK...')

    // Simulate Blostem verification with randomized duration
    const verificationDuration = 1500 + Math.random() * 1000
    await new Promise(resolve => setTimeout(resolve, verificationDuration))

    setVerificationMessage('✅ Verified Successfully')

    const data: InvestmentData = {
      investmentType,
      amount: numAmount,
      tenure: parseInt(tenure),
      frequency,
      bank,
      autoDebit
    }

    await new Promise(resolve => setTimeout(resolve, 800))

    onSubmit(data)
    setSuccess(true)

    // Close after showing success
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  if (success) {
    return (
      <div className="investment-form-overlay">
        <div className="investment-form success fade-in-scale">
          <div className="success-content">
            <h2>✅ Verification Successful</h2>
            <p>Streak +1. Influence Level Updated.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="investment-form-overlay">
        <div className="investment-form loading-modal fade-in-scale">
          <div className="loader-content">
            <div className="spinner-large"></div>
            <p className="verification-message pulsing">{verificationMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="investment-form-overlay" onClick={onClose}>
      <div className="investment-form" onClick={(e) => e.stopPropagation()}>
        <h2>Add Investment</h2>
        {!loading && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Investment Type</label>
              <div className="investment-types">
                {['Fixed Deposit', 'Recurring Deposit', 'Savings Goal'].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`type-btn ${investmentType === type ? 'active' : ''}`}
                    onClick={() => setInvestmentType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount (₹)</label>
              <input
                id="amount"
                type="number"
                min="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                required
              />
            </div>

            <div className="form-group">
              <label>Tenure</label>
              <div className="tenure-options">
                {[6, 12, 24].map(months => (
                  <button
                    key={months}
                    type="button"
                    className={`tenure-btn ${tenure === months.toString() ? 'active' : ''}`}
                    onClick={() => setTenure(months.toString())}
                  >
                    {months} months
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Frequency</label>
              <div className="frequency-options">
                {['Monthly', 'Weekly'].map(freq => (
                  <button
                    key={freq}
                    type="button"
                    className={`freq-btn ${frequency === freq ? 'active' : ''}`}
                    onClick={() => setFrequency(freq)}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bank">Bank / Provider</label>
              <select
                id="bank"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                required
              >
                <option value="">Select Bank</option>
                <option value="HDFC">HDFC</option>
                <option value="ICICI">ICICI</option>
                <option value="Axis">Axis</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoDebit}
                  onChange={(e) => setAutoDebit(e.target.checked)}
                />
                Enable Auto-pay for this streak?
              </label>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Complete Deposit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
}

export default AddInvestmentForm