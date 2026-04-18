export interface CompletionRecord {
  date: string
  status: 'success' | 'missed'
}

export interface StreakInterface {
  _id?: string
  streakName: string
  frequency: 'weekly' | 'monthly'
  streakCount: number
  nextDueDate: string
  completionHistory: CompletionRecord[]
  status: string
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
  userName: string
  userInfluence: number
  text: string
  userId?: string
  isStatic?: boolean
}
