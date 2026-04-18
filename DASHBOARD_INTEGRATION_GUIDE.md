# Dashboard Integration Guide

## 🎯 Quick Start: Integrating New Streak Components

This guide walks you through updating your Dashboard component to use the new recurring streak system.

---

## 📋 Step 1: Update Imports

Add these imports at the top of `Dashboard.tsx`:

```typescript
import { ConsistencyHeatmap } from './ConsistencyHeatmap'
import { StreakMenu } from './StreakMenu'
import { RecurringStreakForm } from './RecurringStreakForm'
import type { RecurringStreakData } from './RecurringStreakForm'
```

---

## 📌 Step 2: Add State Management

Add these state variables inside your Dashboard component:

```typescript
// Heatmap modal state
const [showHeatmap, setShowHeatmap] = useState(false)
const [selectedStreak, setSelectedStreak] = useState<any>(null)

// Create streak form state
const [showCreateForm, setShowCreateForm] = useState(false)

// Loading/error states
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

---

## 🔌 Step 3: Add API Helper Functions

Add these functions to handle API calls:

```typescript
// Create new recurring streak
const handleCreateStreak = async (data: RecurringStreakData) => {
  setLoading(true)
  setError(null)
  try {
    const response = await fetch('http://localhost:5030/streaks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) throw new Error('Failed to create streak')
    
    await fetchStreaks() // Refresh the list
    setShowCreateForm(false)
  } catch (err: any) {
    setError(err.message || 'Failed to create streak')
    throw err // Re-throw for form to handle
  } finally {
    setLoading(false)
  }
}

// Complete a streak
const handleCompleteStreak = async (streakId: string, amount: number) => {
  setLoading(true)
  setError(null)
  try {
    const response = await fetch(`http://localhost:5030/streaks/${streakId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ investmentAmount: amount })
    })
    
    if (!response.ok) throw new Error('Failed to complete streak')
    
    await fetchStreaks() // Refresh
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

// Get heatmap data
const handleViewHeatmap = async (streakId: string) => {
  try {
    const response = await fetch(`http://localhost:5030/streaks/${streakId}/heatmap`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) throw new Error('Failed to get heatmap')
    
    const streak = streaks.find(s => s._id === streakId)
    setSelectedStreak(streak)
    setShowHeatmap(true)
  } catch (err: any) {
    setError(err.message)
  }
}

// Delete a streak
const handleDeleteStreak = async (streakId: string) => {
  if (!window.confirm('Are you sure you want to delete this streak?')) return
  
  setLoading(true)
  try {
    const response = await fetch(`http://localhost:5030/streaks/${streakId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) throw new Error('Failed to delete streak')
    await fetchStreaks()
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

// Edit a streak (update)
const handleEditStreak = async (streakId: string) => {
  // Show edit form / modal with streakId
  // Implementation depends on your edit UI
}
```

---

## 🎨 Step 4: Update Streak Card Rendering

Replace your existing streak card rendering with this updated version:

```typescript
{streaks.map(streak => (
  <div key={streak._id} className="streak-card">
    {/* Header with title and menu */}
    <div className="streak-card-header">
      <div className="streak-info">
        <h3 className="streak-name">{streak.streakName}</h3>
        <span className="frequency-badge">
          {streak.frequency === 'weekly' ? '📅 Weekly' : '📅 Monthly'}
        </span>
      </div>
      
      {/* Three-dot menu */}
      <StreakMenu
        streakId={streak._id}
        streakName={streak.streakName}
        onViewHeatmap={handleViewHeatmap}
        onEdit={handleEditStreak}
        onDelete={handleDeleteStreak}
      />
    </div>

    {/* Streak stats */}
    <div className="streak-stats">
      <div className="stat">
        <span className="stat-label">Completed</span>
        <span className="stat-value">{streak.streakCount}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Next Due</span>
        <span className="stat-value">
          {new Date(streak.nextDueDate).toLocaleDateString()}
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">Amount</span>
        <span className="stat-value">₹{streak.investmentAmount?.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Trust Score</span>
        <span className="stat-value">{streak.influenceLevel}</span>
      </div>
    </div>

    {/* Investment details */}
    <div className="streak-details">
      {streak.investmentType && (
        <span className="detail-tag">{streak.investmentType}</span>
      )}
      {streak.bank && (
        <span className="detail-tag">{streak.bank}</span>
      )}
      {streak.autoDebit && (
        <span className="detail-tag">🔄 Auto-debit</span>
      )}
    </div>

    {/* Status badge */}
    <div className="streak-status">
      {streak.status === 'pending' && (
        <span className="status-badge pending">⏳ Pending</span>
      )}
      {streak.status === 'completed' && (
        <span className="status-badge completed">✅ Completed Today</span>
      )}
    </div>

    {/* Action button */}
    {streak.status === 'pending' && (
      <button
        className="btn-complete"
        onClick={() => handleCompleteStreak(streak._id, streak.investmentAmount)}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Complete Deposit'}
      </button>
    )}
  </div>
))}
```

---

## 📝 Step 5: Add Modal Components

Add these to your Dashboard render, typically at the end:

```typescript
return (
  <div className="dashboard">
    {/* Main dashboard content */}
    
    {/* Error message */}
    {error && (
      <div className="error-banner">
        <span>⚠️ {error}</span>
        <button onClick={() => setError(null)}>✕</button>
      </div>
    )}

    {/* Create Streak Modal */}
    {showCreateForm && (
      <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <RecurringStreakForm
            onSubmit={handleCreateStreak}
            onCancel={() => setShowCreateForm(false)}
            isLoading={loading}
          />
        </div>
      </div>
    )}

    {/* Consistency Heatmap Modal */}
    {showHeatmap && selectedStreak && (
      <ConsistencyHeatmap
        completionHistory={selectedStreak.completionHistory || []}
        streakName={selectedStreak.streakName}
        onClose={() => {
          setShowHeatmap(false)
          setSelectedStreak(null)
        }}
      />
    )}

    {/* Add Streak Button */}
    <button
      className="btn-add-streak"
      onClick={() => setShowCreateForm(true)}
    >
      + Create New Streak
    </button>
  </div>
)
```

---

## 🎨 Step 6: Add Styling

Add this to your `Dashboard.css`:

```css
.streak-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  border: 1px solid rgba(79, 172, 254, 0.15);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.streak-card:hover {
  box-shadow: 0 12px 32px rgba(79, 172, 254, 0.12);
  transform: translateY(-2px);
}

.streak-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.streak-info {
  flex: 1;
}

.streak-name {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.frequency-badge {
  display: inline-block;
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  margin-top: 6px;
}

.streak-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.stat-value {
  font-size: 16px;
  font-weight: 800;
  color: #1e3a8a;
  margin-top: 4px;
}

.streak-details {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.detail-tag {
  background: linear-gradient(135deg, #e0f2fe 0%, #e8eef5 100%);
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.streak-status {
  margin-bottom: 12px;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%);
  color: #92400e;
}

.status-badge.completed {
  background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
  color: #166534;
}

.btn-complete {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-complete:hover:not(:disabled) {
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
}

.btn-complete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-add-streak {
  padding: 14px 24px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin: 24px 0;
  transition: all 0.3s ease;
}

.btn-add-streak:hover {
  box-shadow: 0 12px 32px rgba(34, 197, 94, 0.25);
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-banner {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
  padding: 16px 20px;
  border-radius: 10px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2000;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.error-banner button {
  border: none;
  background: transparent;
  color: #991b1b;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 768px) {
  .streak-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-content {
    width: 95%;
  }
}
```

---

## 🧪 Step 7: Test the Integration

1. **Create a Streak:**
   - Click "Create New Streak"
   - Fill in form with valid data
   - Submit and verify it appears in the list

2. **Complete a Streak:**
   - Click "Complete Deposit" on a pending streak
   - Verify streakCount increases
   - Verify status changes to "Completed Today"

3. **View Heatmap:**
   - Click three-dot menu on any streak
   - Select "View Your Consistency Graph"
   - Verify heatmap modal opens with data

4. **Test Validation:**
   - Try entering amount > ₹1,00,000
   - Verify error message displays

---

## ⚡ Quick Reference: State Flow

```
User Creates Streak
  ↓
POST /streaks
  ↓
Streak added with status='pending'
  ↓
Dashboard displays in PENDING section
  ↓
User clicks "Complete Deposit"
  ↓
POST /streaks/:id/complete
  ↓
- streakCount increments
- nextDueDate updates
- completionHistory appended
- status='completed'
  ↓
Dashboard refreshes
  ↓
Next day: status back to 'pending'
```

---

## 🆘 Troubleshooting

**Q: Modal won't close**
A: Make sure `onClick={(e) => e.stopPropagation()}` is on modal-content

**Q: Heatmap showing no data**
A: Check if completionHistory has records in the API response

**Q: Form validation not working**
A: Ensure error state is being displayed in the error banner

**Q: Streak counts not updating**
A: Verify `fetchStreaks()` is called after API success

---

## ✅ Checklist

- [ ] Imports added
- [ ] State management added
- [ ] API helper functions created
- [ ] Streak card rendering updated
- [ ] Modal components added
- [ ] Styling applied
- [ ] All tests passing
- [ ] Ready to deploy

---

**🎉 Dashboard integration complete!**

For any issues, reference the `REFACTOR_DOCUMENTATION.md` file.
