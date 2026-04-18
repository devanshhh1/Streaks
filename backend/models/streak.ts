import mongoose from "mongoose"

export interface CompletionRecord {
  date: string
  status: 'success' | 'missed'
}

export interface IStreak extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  streakName: string
  frequency: 'weekly' | 'monthly'
  streakCount: number
  nextDueDate: Date
  completionHistory: CompletionRecord[]
  status: 'pending' | 'completed'
  investmentAmount: number
  verified: boolean
  influenceLevel: number
  investmentType: string
  tenure: number
  bank: string
  autoDebit: boolean
  createdAt: Date
  updatedAt: Date
}

const completionRecordSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'missed'],
    required: true
  }
})

const streakSchema = new mongoose.Schema<IStreak>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  streakName: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'weekly',
    required: true
  },
  streakCount: {
    type: Number,
    default: 0,
    required: true
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  completionHistory: {
    type: [completionRecordSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
    required: true
  },
  investmentAmount: {
    type: Number,
    default: 0,
    validate: {
      validator: (v: number) => v <= 100000,
      message: 'Investment amount cannot exceed ₹1,00,000'
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  influenceLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 95
  },
  investmentType: {
    type: String,
    default: ''
  },
  tenure: {
    type: Number,
    default: 0
  },
  bank: {
    type: String,
    default: ''
  },
  autoDebit: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// Index for efficient queries
streakSchema.index({ userId: 1, nextDueDate: 1 })
streakSchema.index({ userId: 1, status: 1 })

const Streak = mongoose.model<IStreak>("Streak", streakSchema)

export default Streak
