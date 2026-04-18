/**
 * Calculates the influence level for a recurring streak.
 * Scale: 0-100 (max 95 to maintain aspiration)
 * Formula: baseScore + (streakCount * 2) + (autoDebit bonus) + (investmentType bonus)
 */
export function calculateInfluenceLevel(
  streakCount: number,
  investmentAmount: number,
  tenureMonths: number = 0,
  investmentType: string = '',
  autoDebit: boolean = false
): number {
  // Base score from investment amount: (amount / 100,000) * 20 = max 20 points
  const amountScore = Math.min(20, (investmentAmount / 100000) * 20)

  // Streak count score: 2 points per streak (capped at 40 points)
  const streakScore = Math.min(40, streakCount * 2)

  // Tenure bonus: 0.5 points per month (capped at 15 points)
  const tenureScore = Math.min(15, tenureMonths * 0.5)

  // Investment type bonus
  let typeBonus = 0
  if (investmentType === "RD") {
    typeBonus = 8 // Fixed Deposit gets 8 points
  } else if (investmentType === "SIP") {
    typeBonus = 6 // SIP gets 6 points
  }

  // Auto-debit bonus
  const autoDebitBonus = autoDebit ? 5 : 0

  // Calculate total, but cap at 95
  const totalScore = amountScore + streakScore + tenureScore + typeBonus + autoDebitBonus
  const cappedScore = Math.min(95, Math.max(0, totalScore))

  return Math.round(cappedScore * 100) / 100
}

/**
 * Updates influence level for investment submission (legacy support)
 */
export function updateInfluenceForInvestment(
  currentScore: number,
  amount: number,
  tenureMonths: number,
  investmentType: string,
  autoDebit: boolean
): number {
  return calculateInfluenceLevel(
    0, // streakCount for new investment
    amount,
    tenureMonths,
    investmentType,
    autoDebit
  )
}

