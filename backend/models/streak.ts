import mongoose from "mongoose"

export interface IStreak extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  streak: number
  streakName: string
  lastDate: string
  dates: string[]
  done: boolean
  investmentAmount: number
  verified: boolean
  influenceLevel: number
  investmentType: string
  tenure: number
  bank: string
  autoDebit: boolean
  createdAt: Date
}

const streakSchema = new mongoose.Schema<IStreak>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  streak: Number,
  streakName: String,
  lastDate: String,
  dates: [String],
  done: Boolean,
  investmentAmount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  influenceLevel: { type: Number, default: 0 },
  investmentType: { type: String, default: '' },
  tenure: { type: Number, default: 0 },
  bank: { type: String, default: '' },
  autoDebit: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

const Streak = mongoose.model<IStreak>("Streak", streakSchema)

export default Streak
