import mongoose from "mongoose"
import { Router, Request, Response } from "express"
import User from "../models/user"
import Streak from "../models/streak"
import { authenticate } from "../middleware/auth"

const router = Router()
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_PROFILE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

const parseProfileImage = (profileImage: string) => {
  const match = profileImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    return null
  }

  const [, mimeType, base64Data] = match
  const padding = base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0
  const sizeInBytes = Math.max(0, Math.floor((base64Data.length * 3) / 4) - padding)

  return {
    mimeType,
    sizeInBytes,
  }
}

const buildUserResponse = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  token: user.token,
  tokenExpiry: user.tokenExpiry,
  influenceLevel: user.influenceLevel,
  verified: user.verified,
  profileImage: user.profileImage,
})

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

router.patch("/user/:userId/profile-image", authenticate, async (req: Request, res: Response) => {
  try {
    const { profileImage, userId: bodyUserId } = req.body
    const { userId } = req.params

    if (String(req.user._id) !== userId || (bodyUserId && bodyUserId !== userId)) {
      return res.status(403).json({
        error: "Unauthorized to update this profile",
        message: "Unauthorized",
      })
    }

    if (typeof profileImage !== "string" || !profileImage.trim()) {
      return res.status(400).json({ message: "A profile image is required" })
    }

    const parsedProfileImage = parseProfileImage(profileImage)

    if (!parsedProfileImage) {
      return res.status(400).json({
        message: "Profile image must be a valid base64 data URL",
      })
    }

    if (!ALLOWED_PROFILE_IMAGE_TYPES.has(parsedProfileImage.mimeType)) {
      return res.status(400).json({
        message: "Only JPG, PNG, WEBP, or GIF images are allowed",
      })
    }

    if (parsedProfileImage.sizeInBytes > MAX_PROFILE_IMAGE_BYTES) {
      return res.status(400).json({
        message: "Profile image must be 2MB or smaller",
      })
    }

    req.user.profileImage = profileImage
    await req.user.save()

    res.status(200).json(buildUserResponse(req.user))
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router
