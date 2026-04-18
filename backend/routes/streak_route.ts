import { Router, Request, Response } from "express"
import Streak, { IStreak } from "../models/streak"
import User from "../models/user"
import { calculateInfluenceLevel, updateInfluenceForInvestment } from "../utils/influenceCalculator"
import { authenticate } from "../middleware/auth"

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
      if (streak && streak.streak % 7 === 0) {
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
      streak: 0,
      streakName: req.body.streakName,
      lastDate: req.body.lastDate,
      dates: dates,
      done: req.body.done,
      investmentAmount: investmentAmount,
      verified: req.body.verified || false,
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

    for (let i = 0; i < streak.dates.length; i++) {
      if (streak.dates[i] != req.body.dates[i])
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
    const prevDate = Date.parse(streak.lastDate)
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
      streak.lastDate = req.body.lastDate
      streak.streak += 1
      streak.dates = req.body.dates
      
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
        message: `Streak updated: The streak is now ${updStreak.streak}`,
      })
    }
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
})

router.delete("/", async (req: Request, res: Response) => {
  const streak: IStreak | null = await Streak.findOne({ streakName: req.body.streakName, userId: req.user._id })

  if (streak == null)
    return res.status(404).json({ message: "Bad request: Streak not found", code: -1 })

  // If deleting a pending streak, apply penalty
  if (!streak.done) {
    await updateUserInfluenceForEvent(req.user._id, 'delete_pending')
  }
  // Deleting completed streaks has no penalty

  await streak.deleteOne()

  res.status(200).json({ deleted: true, streak })
})

router.post("/penalty", async (req: Request, res: Response) => {
  const { type, streakName } = req.body
  
  if (type === 'broken_promise') {
    await updateUserInfluenceForEvent(req.user._id, 'broken_promise')
  }
  
  res.status(200).json({ applied: true })
})

export default router
