import { Router, Request, Response } from "express"
import Streak, { IStreak } from "../models/streak"
import User from "../models/user"
import { calculateInfluenceLevel, updateInfluenceForInvestment } from "../utils/influenceCalculator"
import { authenticate } from "../middleware/auth"
import { deleteStreak, getHeatmapData, completeStreak } from "../controllers/streakController"

const router = Router()

// Apply authentication to all streak routes
router.use(authenticate)

// Helper function to update user's influence level based on events
const updateUserInfluenceForEvent = async (userId: string, event: 'verification' | 'milestone' | 'tenure' | 'broken_promise' | 'delete_pending' | 'early_withdrawal' | 'inconsistency', streak?: IStreak) => {
  const user = await User.findById(userId)
  if (!user) return

  let influenceChange = 0

  switch (event) {
    case 'verification':
      // Increase influence based on investment amount
      if (streak && streak.investmentAmount) {
        // Base influence: amount / 1000, with tenure bonus
        influenceChange = (streak.investmentAmount / 1000) + (streak.tenure * 0.1)
        
        // Apply investment type bonuses
        if (streak.investmentType === "RD") {
          influenceChange *= 1.2
        }
        
        // Apply auto-debit bonus
        if (streak.autoDebit) {
          influenceChange += 2
        }
      } else {
        influenceChange = 0.5 // Fallback if no investment data
      }
      break
    case 'milestone':
      if (streak && streak.streakCount % 7 === 0) {
        influenceChange = 1
      }
      break
    case 'tenure':
      // Check if tenure is completed (this would need more logic based on dates)
      influenceChange = 2
      break
    case 'broken_promise':
      influenceChange = -0.2
      break
    case 'delete_pending':
      influenceChange = -0.1
      break
    case 'early_withdrawal':
      influenceChange = -1
      break
    case 'inconsistency':
      influenceChange = -0.2
      break
  }

  user.influenceLevel = Math.max(0, user.influenceLevel + influenceChange)
  user.verified = user.influenceLevel >= 100
  await user.save()
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const userStreaks = await Streak.find({ userId: req.user._id })
    res.status(200).json(userStreaks)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/", async (req: Request, res: Response) => {
  try {
    const streak = await Streak.findOne({ streakName: req.body.streakName, userId: req.user._id })

    if (req.body.streakName == null)
      return res.status(400).json({ message: "Bad request: No streakName" })
    if (streak != null)
      return res.status(403).json({ message: "Bad request: The Streak already exists" })

    const investmentAmount = req.body.investmentAmount ?? req.body.amount ?? 0
    const dates = req.body.dates || []
    const investmentType = req.body.investmentType || ''
    const tenure = req.body.tenure || 0
    const bank = req.body.bank || ''
    const autoDebit = req.body.autoDebit || false

    const newStreak = new Streak({
      userId: req.user._id,
      streakCount: 0,
      streakName: req.body.streakName,
      nextDueDate: req.body.nextDueDate || new Date(),
      completionHistory: [],
      status: 'pending',
      investmentAmount: investmentAmount,
      influenceLevel: updateInfluenceForInvestment(0, investmentAmount, tenure, investmentType, autoDebit),
      investmentType: investmentType,
      tenure: tenure,
      bank: bank,
      autoDebit: autoDebit,
    })

    await newStreak.save()

    // No score change when creating a promise
    // await updateUserInfluenceLevel(req.user._id)

    res.status(201).json(newStreak)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
})

router.patch("/", async (req: Request, res: Response) => {
  try {
    const streak = await Streak.findOne({ streakName: req.body.streakName, userId: req.user._id })

    

    if (streak == null) {
      return res.status(404).json({ message: "Bad request: Streak not found" })
    }
    if (req.body.lastDate == null) {
      return res.status(400).json({ message: "Bad request: No lastDate property" })
    }
    if (req.body.dates == null) {
      return res.status(400).json({ message: "Bad request: No dates array" })
    }

    for (let i = 0; i < streak.completionHistory.length; i++) {
      if (streak.completionHistory[i].date != req.body.dates[i])
        return res.status(400).json({
          message:
            "Bad request: the dates array does not match up with the records",
        })
    }

    if (req.body.dates[req.body.dates.length - 1] != req.body.lastDate)
      return res.status(400).json({
        message:
          "Bad request: the last entry in the dates array doesn not match up the lastDate value",
      })

    const currDate = Date.parse(req.body.lastDate)
    const prevDate = Date.parse(streak.nextDueDate.toString())
    let days = (currDate - prevDate) / (1000 * 3600 * 24)

    console.log(currDate, prevDate)

    if (isNaN(days))
      return res
        .status(500)
        .json({ message: `Invalid dates: ${currDate}, and ${prevDate}` })

    if (days < 1)
      return res.status(200).json({
        streak,
        days: days,
        message: "Streak not updated: A day hasn't passed yet",
        code: 0,
      })

    if (days > 2) {
      if (req.body.upd == true) {
        days = 1.5
      } else {
        return res.status(200).json({
          streak,
          days: days,
          message: "Streak not updated: It has been more than 2 days",
          code: 2,
        })
      }
    }

    if (days >= 1 && days <= 2) {
      streak.nextDueDate = new Date(req.body.lastDate)
      streak.streakCount += 1
      streak.completionHistory = req.body.dates.map((date: string) => ({
        date: date,
        status: 'success'
      }))
      
      // Update investment amount if provided
      if (req.body.investmentAmount !== undefined) {
        streak.investmentAmount = req.body.investmentAmount
      }
      
      const updStreak = await streak.save()

      // Score increases for verification success
      await updateUserInfluenceForEvent(req.user._id, 'verification', updStreak)
      
      // Check for milestone bonus
      await updateUserInfluenceForEvent(req.user._id, 'milestone', updStreak)

      return res.status(200).json({
        updStreak,
        message: `Streak updated: The streak is now ${updStreak.streakCount}`,
      })
    }
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
})

// Complete a streak (record an investment)
router.post("/:id/complete", async (req: Request, res: Response) => {
  try {
    const { investmentAmount } = req.body
    
    if (!investmentAmount) {
      return res.status(400).json({ message: "Investment amount is required" })
    }

    const result = await completeStreak(req.user._id, req.params.id, investmentAmount)
    
    if (!result.success) {
      return res.status(400).json({ message: result.error })
    }

    res.status(200).json(result.streak)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// Get heatmap data for a streak
router.get("/:id/heatmap", async (req: Request, res: Response) => {
  try {
    const streak = await Streak.findOne({ _id: req.params.id, userId: req.user._id })

    if (!streak) {
      return res.status(404).json({ message: "Streak not found" })
    }

    const heatmapData = getHeatmapData(streak.completionHistory)
    res.status(200).json({ heatmap: heatmapData, nextDueDate: streak.nextDueDate })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// Update streak by ID
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const streak = await Streak.findOne({ _id: req.params.id, userId: req.user._id })

    if (!streak) {
      return res.status(404).json({ message: "Streak not found" })
    }

    // Update allowed fields
    if (req.body.streakName) streak.streakName = req.body.streakName
    if (req.body.frequency) streak.frequency = req.body.frequency
    if (req.body.investmentAmount) streak.investmentAmount = req.body.investmentAmount
    if (req.body.nextDueDate) streak.nextDueDate = new Date(req.body.nextDueDate)
    if (req.body.investmentType) streak.investmentType = req.body.investmentType
    if (req.body.tenure) streak.tenure = req.body.tenure
    if (req.body.bank) streak.bank = req.body.bank
    if (req.body.autoDebit !== undefined) streak.autoDebit = req.body.autoDebit

    const updatedStreak = await streak.save()
    res.status(200).json(updatedStreak)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
})

router.delete("/", async (req: Request, res: Response) => {
  try {
    const streak: IStreak | null = await Streak.findOne({ streakName: req.body.streakName, userId: req.user._id })

    if (streak == null) {
      return res.status(404).json({ message: "Bad request: Streak not found", code: -1 })
    }

    // Call the controller function to handle deletion with penalty
    const result = await deleteStreak(req.user._id, streak._id.toString())

    if (!result.success) {
      return res.status(400).json({ message: result.error })
    }

    res.status(200).json({
      success: true,
      deleted: true,
      message: result.message,
      updatedInfluenceScore: result.updatedInfluenceScore,
      streak
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
})

router.post("/penalty", async (req: Request, res: Response) => {
  const { type, streakName } = req.body
  
  if (type === 'broken_promise') {
    await updateUserInfluenceForEvent(req.user._id, 'broken_promise')
  }
  
  res.status(200).json({ applied: true })
})

export default router
