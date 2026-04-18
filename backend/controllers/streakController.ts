import { Request, Response } from "express"
import Streak, { IStreak, CompletionRecord } from "../models/streak"
import User from "../models/user"
import { calculateInfluenceLevel } from "../utils/influenceCalculator"

/**
 * Calculate next due date based on frequency
 */
export function calculateNextDueDate(currentDate: Date, frequency: 'weekly' | 'monthly'): Date {
  const nextDate = new Date(currentDate)
  if (frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7)
  } else if (frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }
  return nextDate
}

/**
 * Check if streak is overdue and mark as missed if necessary
 */
export async function checkAndMarkMissed(streak: IStreak): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextDueDate = new Date(streak.nextDueDate)
  nextDueDate.setHours(0, 0, 0, 0)

  // If today is past nextDueDate and status is still pending
  if (today > nextDueDate && streak.status === 'pending') {
    const todayStr = today.toISOString().split('T')[0]
    
    // Check if we already logged this date
    const alreadyLogged = streak.completionHistory.some(
      record => record.date === todayStr
    )

    if (!alreadyLogged) {
      // Add missed record
      const missedRecord: CompletionRecord = {
        date: todayStr,
        status: 'missed'
      }
      streak.completionHistory.push(missedRecord)
      streak.status = 'pending'
      await streak.save()
    }
  }
}

/**
 * Complete a streak (recurring deposit made)
 */
export async function completeStreak(
  userId: string,
  streakId: string,
  investmentAmount: number
): Promise<{ success: boolean; streak?: IStreak; error?: string }> {
  try {
    // Validate investment amount
    if (investmentAmount > 100000) {
      return {
        success: false,
        error: 'Investment amount at once cannot exceed 1 Lakh'
      }
    }

    const streak = await Streak.findOne({ _id: streakId, userId })
    if (!streak) {
      return { success: false, error: 'Streak not found' }
    }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Check if already completed today
    const todayRecord = streak.completionHistory.find(
      record => record.date === todayStr && record.status === 'success'
    )

    if (todayRecord) {
      return { success: false, error: 'Streak already completed today' }
    }

    // Increment streak count
    streak.streakCount += 1

    // Add success record
    const successRecord: CompletionRecord = {
      date: todayStr,
      status: 'success'
    }
    streak.completionHistory.push(successRecord)

    // Update next due date
    streak.nextDueDate = calculateNextDueDate(today, streak.frequency)

    // Set status to completed for today (will reset tomorrow)
    streak.status = 'completed'

    // Recalculate influence level based on new streak count
    streak.influenceLevel = calculateInfluenceLevel(
      streak.streakCount,
      streak.investmentAmount,
      streak.tenure,
      streak.investmentType,
      streak.autoDebit
    )

    // Update timestamp
    streak.updatedAt = new Date()

    await streak.save()

    // Update user's overall influence level
    await updateUserInfluenceLevel(userId)

    return { success: true, streak }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get all streaks for a user with evaluation
 */
export async function getUserStreaks(userId: string): Promise<IStreak[]> {
  const streaks = await Streak.find({ userId }).sort({ nextDueDate: 1 })

  // Check each streak for missed dates
  for (const streak of streaks) {
    await checkAndMarkMissed(streak)
  }

  // Evaluate today's status
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const streak of streaks) {
    const nextDueDate = new Date(streak.nextDueDate)
    nextDueDate.setHours(0, 0, 0, 0)

    // If today >= nextDueDate, mark as pending
    if (today >= nextDueDate) {
      streak.status = 'pending'
    }

    // Check if completed today
    const todayStr = today.toISOString().split('T')[0]
    const completedToday = streak.completionHistory.some(
      record => record.date === todayStr && record.status === 'success'
    )

    if (completedToday) {
      streak.status = 'completed'
    }
  }

  return streaks
}

/**
 * Get completion history heatmap data
 */
export function getHeatmapData(completionHistory: CompletionRecord[]): Record<string, 'success' | 'missed' | 'future'> {
  const heatmap: Record<string, 'success' | 'missed' | 'future'> = {}

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Add all records from completion history
  for (const record of completionHistory) {
    heatmap[record.date] = record.status
  }

  // Add future dates that should exist based on frequency
  // This will be handled in frontend based on nextDueDate

  return heatmap
}

/**
 * Update user's overall influence level
 */
export async function updateUserInfluenceLevel(userId: string): Promise<void> {
  try {
    const streaks = await Streak.find({ userId })
    const user = await User.findById(userId)

    if (!user) return

    let totalInfluence = 0
    for (const streak of streaks) {
      totalInfluence += streak.influenceLevel || 0
    }

    // Cap at 950 (representing 95 per 10 streaks, or scale accordingly)
    user.influenceLevel = Math.min(950, totalInfluence)
    user.verified = user.influenceLevel >= 100

    await user.save()
  } catch (error) {
    console.error('Error updating user influence:', error)
  }
}

/**
 * Create a new recurring streak
 */
export async function createRecurringStreak(
  userId: string,
  data: {
    streakName: string
    frequency: 'weekly' | 'monthly'
    investmentAmount: number
    investmentType?: string
    tenure?: number
    bank?: string
    autoDebit?: boolean
  }
): Promise<{ success: boolean; streak?: IStreak; error?: string }> {
  try {
    // Validate
    if (!data.streakName) {
      return { success: false, error: 'Streak name is required' }
    }

    if (data.investmentAmount > 100000) {
      return { success: false, error: 'Investment amount at once cannot exceed 1 Lakh' }
    }

    // Check if streak already exists
    const existingStreak = await Streak.findOne({
      userId,
      streakName: data.streakName
    })

    if (existingStreak) {
      return { success: false, error: 'A streak with this name already exists' }
    }

    // Calculate next due date (today + frequency period)
    const today = new Date()
    const nextDueDate = calculateNextDueDate(today, data.frequency)

    // Create streak
    const newStreak = new Streak({
      userId,
      streakName: data.streakName,
      frequency: data.frequency,
      streakCount: 0,
      nextDueDate,
      completionHistory: [],
      status: 'pending',
      investmentAmount: data.investmentAmount,
      investmentType: data.investmentType || '',
      tenure: data.tenure || 0,
      bank: data.bank || '',
      autoDebit: data.autoDebit || false,
      influenceLevel: calculateInfluenceLevel(
        0,
        data.investmentAmount,
        data.tenure,
        data.investmentType,
        data.autoDebit
      )
    })

    await newStreak.save()

    // Update user influence
    await updateUserInfluenceLevel(userId)

    return { success: true, streak: newStreak }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete a streak with influence score penalty
 */
export async function deleteStreak(
  userId: string,
  streakId: string
): Promise<{ success: boolean; message?: string; updatedInfluenceScore?: number; error?: string }> {
  try {
    const streak = await Streak.findOne({ _id: streakId, userId })
    if (!streak) {
      return { success: false, error: 'Streak not found' }
    }

    const user = await User.findById(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Calculate penalty based on streak count
    // Dynamic penalty: streak count * 0.5 (or fixed 5 if you prefer)
    const penalty = Math.min(streak.streakCount * 0.5, 25) // Cap at 25 to prevent extreme penalties

    // Apply penalty and ensure score never goes below 0
    user.influenceLevel = Math.max(0, user.influenceLevel - penalty)
    user.verified = user.influenceLevel >= 100

    // Save updated user
    await user.save()

    // Delete the streak
    await Streak.deleteOne({ _id: streakId })

    return {
      success: true,
      message: `Streak deleted. Influence dropped by ${penalty.toFixed(1)} points due to inconsistency.`,
      updatedInfluenceScore: user.influenceLevel
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
