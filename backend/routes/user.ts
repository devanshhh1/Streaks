import mongoose from "mongoose"
import { Router, Request, Response } from "express"
import User from "../models/user"
import Streak from "../models/streak"
import { authenticate } from "../middleware/auth"

const router = Router()

router.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const activeUserIds = await Streak.distinct("userId")

    const topUsers = await User.find({
      _id: { $in: activeUserIds },
      influenceLevel: { $gt: 0 },
    })
      .sort({ influenceLevel: -1 })
      .limit(5)
      .select("name influenceLevel profileImage verified")

    res.status(200).json(topUsers)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

router.get("/user/:id", async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" })
    }

    const profile = await User.findById(req.params.id).select(
      "name influenceLevel profileImage verified"
    )

    if (!profile) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json(profile)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

router.patch("/user/profile-image", authenticate, async (req: Request, res: Response) => {
  try {
    const { profileImage } = req.body

    if (typeof profileImage !== "string" || !profileImage.trim()) {
      return res.status(400).json({ message: "A profile image is required" })
    }

    req.user.profileImage = profileImage
    await req.user.save()

    res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      token: req.user.token,
      tokenExpiry: req.user.tokenExpiry,
      influenceLevel: req.user.influenceLevel,
      verified: req.user.verified,
      profileImage: req.user.profileImage,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router
