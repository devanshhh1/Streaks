/**
 * Calculates the Influence Level for a streak
 * Formula: influenceLevel = log(streak + 1) × consistencyScore × (investmentAmount / 1000)
 * Where: consistencyScore = (number of unique dates) / (total possible days between first and last date)
 */
export function calculateInfluenceLevel(
  streak: number,
  dates: string[],
  investmentAmount: number
): number {
  // Handle edge cases
  if (!dates || dates.length === 0) {
    return 0
  }

  if (dates.length === 1) {
    // Only one date, consistency is 100% for that single day
    const oneDayInfluence = Math.log(streak + 1) * 1 * (investmentAmount / 1000)
    return Math.round(oneDayInfluence * 100) / 100
  }

  // Calculate consistency score
  const firstDate = new Date(dates[0])
  const lastDate = new Date(dates[dates.length - 1])

  // Calculate total possible days between first and last date
  const timeDiff = lastDate.getTime() - firstDate.getTime()
  const totalPossibleDays = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1 // +1 to include the first day

  // Avoid division by zero
  if (totalPossibleDays <= 0) {
    return 0
  }

  const uniqueDatesCount = dates.length
  const consistencyScore = uniqueDatesCount / totalPossibleDays

  // Calculate influence level
  const influenceLevel =
    Math.log(streak + 1) * consistencyScore * (investmentAmount / 1000)

  // Round to 2 decimal places
  return Math.round(influenceLevel * 100) / 100
}

/**
 * Updates influence level for investment submission
 * Formula: newScore = currentScore + (amount / 1000) + (tenureMonths * 0.1)
 * Bonuses: RD *1.2, autoDebit +2
 */
export function updateInfluenceForInvestment(
  currentScore: number,
  amount: number,
  tenureMonths: number,
  investmentType: string,
  autoDebit: boolean
): number {
  let newScore = currentScore + (amount / 1000) + (tenureMonths * 0.1)

  if (investmentType === "RD") {
    newScore *= 1.2
  }

  if (autoDebit) {
    newScore += 2
  }

  return Math.round(newScore * 100) / 100
}
