# Streaks: Recurring Financial Discipline Engine

## 🎯 System Architecture Overview

The Streaks platform has been refactored from a **one-time task tracker** into a **smart recurring financial discipline engine**.

---

## 📊 1. Data Model (MongoDB Schema)

### Streak Document Structure

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to User
  streakName: "Weekly FD",            // User-friendly name
  frequency: "weekly",                // "weekly" | "monthly"
  streakCount: 5,                     // Number of successful completions
  nextDueDate: "2026-04-25T00:00:00", // When next deposit is due
  completionHistory: [
    { date: "2026-04-18", status: "success" },
    { date: "2026-04-11", status: "missed" }
  ],
  status: "pending",                  // "pending" | "completed"
  investmentAmount: 10000,            // ₹ (validated: max 1,00,000)
  verified: false,
  influenceLevel: 42,                 // Trust score (0-95 scale)
  investmentType: "SIP",              // Type of investment
  tenure: 12,                         // Duration in months
  bank: "HDFC",                       // Bank/Platform name
  autoDebit: true,                    // Auto-transfer enabled
  createdAt: Date,
  updatedAt: Date
}
```

### Key Constraints

✅ **DO NOT delete streaks after completion** - Historical data is preserved
✅ **completionHistory is append-only** - Immutable audit trail
✅ **Auto-log "missed" entries** - When nextDueDate passes without completion
✅ **Amount validation** - Max ₹1,00,000 per deposit

---

## 🔄 2. Recurring Logic (Core Engine)

### State Transitions

#### 2.1 On Application Load / Dashboard Access

```
GET /streaks
├─ For each streak:
│  ├─ Check: if (today >= nextDueDate && status === 'pending')
│  │  └─ Auto-log: { date: today, status: 'missed' }
│  ├─ Evaluate today's completion
│  └─ Return updated streak list
└─ Display pending streaks at top
```

#### 2.2 On "Complete Deposit" Click

```
POST /streaks/:id/complete
├─ Validate investmentAmount <= 1,00,000
├─ Check: if already completed today
│  └─ Error: "Streak already completed today"
├─ On Success:
│  ├─ Increment: streakCount += 1
│  ├─ Append: { date: today, status: "success" }
│  ├─ Calculate: nextDueDate = today + (frequency)
│  ├─ Set: status = "completed" (UI state for today only)
│  ├─ Recalculate: influenceLevel based on streakCount
│  └─ Update user.influenceLevel
└─ Return updated streak
```

#### 2.3 Next Day Behavior

```
On day change (every 24 hours):
├─ If today < nextDueDate
│  └─ status = "pending" (will show in dashboard)
├─ If today == nextDueDate + 1 and not completed
│  └─ Auto-log: { date: yesterday, status: "missed" }
└─ If user completes today
   └─ status = "completed" (temporary UI state)
```

---

## 💰 3. Investment Constraint Validation

### Amount Validation Rules

```typescript
// In RecurringStreakForm & complete endpoint
if (investmentAmount > 100000) {
  Error: "Investment amount at once cannot exceed 1 Lakh"
}

if (investmentAmount < 1000) {
  Error: "Minimum investment is ₹1,000"
}
```

### Error Display

```
👉 "Investment amount at once cannot exceed 1 Lakh"
   Shown in red banner with warning icon (⚠️)
```

---

## 📈 4. Influence Score System (Trust Score)

### Scale: 0-100 (Max 95)

The influence score represents a user's financial discipline trust rating.

```typescript
// Calculation Formula
baseScore = amountScore + streakScore + tenureScore + typeBonus + autoDebitBonus

where:
  amountScore    = min(20, (amount / 100000) * 20)    // 0-20 points
  streakScore    = min(40, streakCount * 2)          // 0-40 points
  tenureScore    = min(15, tenureMonths * 0.5)       // 0-15 points
  typeBonus      = 8 (RD) | 6 (SIP) | 0 (others)    // 0-8 points
  autoDebitBonus = 5 (if enabled) | 0                // 0-5 points

finalScore = min(95, max(0, baseScore))              // Capped at 95
```

### Trust Level Interpretation

| Score | Level | Meaning |
|-------|-------|---------|
| 0-24  | Low   | ⚠️ New user / Few commitments |
| 25-49 | Medium | 📊 Growing discipline |
| 50-74 | High  | ⭐ Consistent investor |
| 75-95 | Excellent | 🏆 Trusted investor |

### Score Display

Shows both numeric score and visual indicator:
```
Trust Score: 65 ⭐⭐⭐ (High)
```

---

## 🗓️ 5. Consistency Heatmap (GitHub Style)

### Library

**react-calendar-heatmap** - GitHub contribution graph style visualization

### Color Scheme

```css
🟩 Green (#22c55e)   → "success" (completed)
🟥 Red (#ef4444)     → "missed" (due date passed)
⬜ Light Blue (#eef2ff) → future / no activity
```

### Heatmap Data Generation

```typescript
// From completionHistory
heatmapData = completionHistory.map(record => ({
  date: new Date(record.date),
  count: record.status === 'success' ? 1 : -1
}))

// Display past 12 months
displayRange = [today - 1 year, today]
```

### Features

✅ Tooltip on hover showing date & status
✅ Stats bar showing:
   - Total Completed
   - Times Missed
   - Consistency Rate (%)
✅ Legend explaining colors

---

## 🎛️ 6. UI/UX Features

### 6.1 Three-Dot Menu (⋮)

**Location:** LEFT of "Complete Deposit" button

**Dropdown Options:**
```
┌─────────────────────────────────┐
│ 📊 View Your Consistency Graph  │  ← Opens heatmap modal
├─────────────────────────────────┤
│ ✏️  Edit Streak                  │  ← Edit dialog
├─────────────────────────────────┤
│ 🗑️  Delete Streak               │  ← Confirmation + delete
└─────────────────────────────────┘
```

### 6.2 Leaderboard Button Redesign

**OLD:**
```
Simple white button with text
```

**NEW:**
```
Modern Premium Button:
├─ Gradient: linear-gradient(135deg, #1f4037, #99f2c8)
├─ Shadow: 0 20px 50px rgba(79, 172, 254, 0.15)
├─ Border-radius: 20px
├─ Hover Glow: Box-shadow expansion
├─ Icon: 🏆 Trophy emoji
└─ Smooth transitions
```

---

## ⚡ 7. Dashboard Behavior

### Display Logic

```
GET /streaks → Filter streaks by status:

┌─ PENDING Section (Due today or overdue)
│  ├─ Sort by nextDueDate (ascending)
│  └─ Show: "Complete Deposit" button
├─ COMPLETED Section (Completed today)
│  ├─ Show completion date
│  └─ Show: "Next due: [date]"
└─ UPCOMING Section (Future streaks)
   └─ Show: "Due on [date]"
```

### State Update Flow

```
1. Page Load
   ├─ Check all streaks for due/missed dates
   └─ Display current state

2. User completes streak
   ├─ Increment streakCount
   ├─ Add completion record
   ├─ Set nextDueDate
   ├─ Recalculate influence
   └─ Move to COMPLETED section

3. Midnight / Day change
   ├─ System re-evaluates
   ├─ Moves streak back to PENDING
   └─ User can complete again
```

---

## 📁 8. Deliverables

### Backend Files

#### `models/streak.ts`
- ✅ Updated schema with frequency, completionHistory, status
- ✅ Validation for amount (max ₹1,00,000)
- ✅ Compound indices for efficient queries

#### `controllers/streakController.ts` (NEW)
- ✅ `createRecurringStreak()` - Create new recurring investment
- ✅ `completeStreak()` - Mark streak as completed
- ✅ `checkAndMarkMissed()` - Auto-log missed dates
- ✅ `getUserStreaks()` - Get all streaks with evaluation
- ✅ `getHeatmapData()` - Generate heatmap data
- ✅ `updateUserInfluenceLevel()` - Calculate aggregate score

#### `routes/streak_route.ts`
- ✅ `POST /` - Create new streak
- ✅ `GET /` - Get all streaks
- ✅ `POST /:id/complete` - Complete a streak
- ✅ `GET /:id/heatmap` - Get heatmap data
- ✅ `PATCH /:id` - Update streak
- ✅ `DELETE /:id` - Delete streak

#### `utils/influenceCalculator.ts`
- ✅ Updated `calculateInfluenceLevel()` - 0-100 scale
- ✅ `getTrustLevel()` - Map score to text level

### Frontend Components

#### `ConsistencyHeatmap.tsx` + `.css`
- ✅ GitHub-style heatmap visualization
- ✅ Completion statistics
- ✅ Past 12-month view
- ✅ Modal overlay with close button

#### `StreakMenu.tsx` + `.css`
- ✅ Three-dot menu (⋮)
- ✅ Dropdown with options
- ✅ "View Consistency Graph" action
- ✅ Edit & Delete options
- ✅ Click-outside auto-close

#### `RecurringStreakForm.tsx` + `.css`
- ✅ Create new recurring streak form
- ✅ Frequency selector (weekly/monthly)
- ✅ Amount validation with error display
- ✅ Investment type selection
- ✅ Auto-debit checkbox with hint
- ✅ Responsive design

---

## 🔌 9. API Integration Guide

### Creating a Recurring Streak

```typescript
// Frontend
const createStreak = async (data: RecurringStreakData) => {
  const response = await fetch('http://localhost:5030/streaks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      streakName: 'Weekly FD',
      frequency: 'weekly',
      investmentAmount: 10000,
      investmentType: 'SIP',
      tenure: 12,
      bank: 'HDFC',
      autoDebit: true
    })
  })
  return response.json()
}
```

### Completing a Streak

```typescript
// Frontend
const completeStreak = async (streakId: string, amount: number) => {
  const response = await fetch(
    `http://localhost:5030/streaks/${streakId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ investmentAmount: amount })
    }
  )
  return response.json()
}
```

### Getting Heatmap Data

```typescript
// Frontend
const getHeatmap = async (streakId: string) => {
  const response = await fetch(
    `http://localhost:5030/streaks/${streakId}/heatmap`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
  return response.json()
}
```

---

## 🧪 10. Testing Scenarios

### Scenario 1: New Weekly Streak

```
User creates: "Weekly FD" every 7 days, ₹5,000
Day 1: Status = pending, nextDueDate = Day 8
Day 1 (Complete): streakCount = 1, status = completed
Day 2: Status = pending (ready for next week)
Day 8: Show "due today"
Day 8 (Complete): streakCount = 2, nextDueDate = Day 15
Day 9 (not completed by Day 8): Auto-log missed
```

### Scenario 2: Monthly Streak with Auto-Debit

```
User creates: "Monthly SIP" every 30 days, ₹25,000, auto-debit ✓
influenceLevel = 8 (amount) + 0 (first time) + 1 (tenure) + 6 (SIP) + 5 (auto-debit) = 20
After 5 completions: 8 + 10 (streakCount) + 1 + 6 + 5 = 30
```

### Scenario 3: Amount Validation

```
User enters: ₹1,50,000
Error shown: "Investment amount at once cannot exceed 1 Lakh"
Form prevents submission
```

### Scenario 4: Heatmap Display

```
6 months of history: 12 successful, 2 missed
Heatmap shows:
- Green squares (12)
- Red squares (2)
- Stats: 12 completed, 2 missed, 85.7% consistency
```

---

## 🚀 11. Deployment Checklist

**Backend:**
- ✅ Deploy updated streak schema
- ✅ Run migrations (if needed)
- ✅ Deploy streak controller
- ✅ Update routes
- ✅ Test all endpoints

**Frontend:**
- ✅ Install react-calendar-heatmap
- ✅ Deploy ConsistencyHeatmap component
- ✅ Deploy StreakMenu component
- ✅ Deploy RecurringStreakForm component
- ✅ Update Dashboard component to use new features
- ✅ Update Leaderboard button styling

**Quality Assurance:**
- ✅ E2E test: Create streak → Complete → View heatmap
- ✅ Test amount validation
- ✅ Test auto-missed logging
- ✅ Test influence score calculation
- ✅ Test state transitions
- ✅ Mobile responsiveness

---

## 📞 Support & Troubleshooting

### Issue: Heatmap shows no data
**Solution:** Ensure completionHistory has records. Check API response for heatmap endpoint.

### Issue: Amount validation not working
**Solution:** Check if validation is in both backend and frontend. Backend must enforce limit.

### Issue: Streak not marked as missed
**Solution:** Ensure `checkAndMarkMissed()` runs on dashboard load. Check nextDueDate calculation.

### Issue: Influence score stuck at old value
**Solution:** Call `updateUserInfluenceLevel()` after streak completion. Check calculation formula.

---

**🎉 System is now ready for recurring financial discipline tracking!**
