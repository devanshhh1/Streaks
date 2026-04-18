import { Router, Request, Response } from "express"
import Comment from "../models/comment"
import User from "../models/user"
import { authenticate } from "../middleware/auth"

const router = Router()

router.get("/", async (_req: Request, res: Response) => {
  try {
    const comments = await Comment.find().sort({ timestamp: -1 })
    
    // Enrich comments with current user influence
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        let currentInfluence = comment.userInfluence
        
        if (comment.userId) {
          const user = await User.findById(comment.userId)
          if (user) {
            currentInfluence = Math.floor(user.influenceLevel)
          }
        }
        
        return {
          _id: comment._id,
          userId: comment.userId,
          text: comment.text,
          userName: comment.userName,
          userInfluence: currentInfluence,
          timestamp: comment.timestamp,
        }
      })
    )
    
    // Sort by influence then timestamp
    enrichedComments.sort((a, b) => {
      if (b.userInfluence !== a.userInfluence) {
        return b.userInfluence - a.userInfluence
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    
    res.status(200).json(enrichedComments)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : ""

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" })
    }

    if (req.user.influenceLevel < 1) {
      return res
        .status(403)
        .json({ message: "Complete at least 1 verified transaction to comment" })
    }

    const comment = new Comment({
      userId: req.user._id,
      text,
      userName: req.user.name,
      userInfluence: Math.floor(req.user.influenceLevel),
    })

    await comment.save()

    res.status(201).json(comment)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router
