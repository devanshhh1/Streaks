export interface CompletionHistoryEntry {
  date: string
  status: 'success' | 'missed'
}

export interface StreakInterface {
  _id?: string
  streakName: string
  frequency: 'weekly' | 'monthly'
  streakCount: number
  nextDueDate: string
  completionHistory: CompletionHistoryEntry[]
  status: 'pending' | 'completed'
  influenceLevel: number
  verified: boolean
  investmentAmount: number
  investmentType: string
  tenure: number
  bank: string
  autoDebit: boolean
  createdAt: string
  updatedAt: string
}

export interface DiscussionComment {
  _id?: string
  userId?: string
  text: string
  userName: string
  userInfluence: number
  timestamp?: string
  isStatic?: boolean
}
