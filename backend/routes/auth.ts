import { Router, Request, Response } from "express"
import User, { IUser } from "../models/user"

const router = Router()

// Helper function to generate token
const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
}

// POST /register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const token = generateToken()
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const user = new User({
      name,
      email,
      password, // In production, hash this
      token,
      tokenExpiry,
    })

    await user.save()

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: user.token,
      tokenExpiry: user.tokenExpiry,
      influenceLevel: user.influenceLevel,
      verified: user.verified,
      profileImage: user.profileImage,
    }

    res.status(201).json(userResponse)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// POST /login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await User.findOne({ email })
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = generateToken()
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    user.token = token
    user.tokenExpiry = tokenExpiry
    await user.save()

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: user.token,
      tokenExpiry: user.tokenExpiry,
      influenceLevel: user.influenceLevel,
      verified: user.verified,
      profileImage: user.profileImage,
    }

    res.status(200).json(userResponse)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// GET /me - Get current user data
router.get("/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    const user = await User.findOne({ token })
    if (!user) {
      return res.status(401).json({ message: "Invalid token" })
    }

    if (user.tokenExpiry && user.tokenExpiry < new Date()) {
      return res.status(401).json({ message: "Token expired" })
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: user.token,
      tokenExpiry: user.tokenExpiry,
      influenceLevel: user.influenceLevel,
      verified: user.verified,
      profileImage: user.profileImage,
    }

    res.status(200).json(userResponse)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// POST /logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    const user = await User.findOne({ token })
    if (user) {
      user.token = undefined
      user.tokenExpiry = undefined
      await user.save()
    }

    res.status(200).json({ message: "Logged out successfully" })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// GET /me
router.get("/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    const user = await User.findOne({ token })
    if (!user || !user.tokenExpiry || user.tokenExpiry < new Date()) {
      return res.status(401).json({ message: "Invalid or expired token" })
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: user.token,
      tokenExpiry: user.tokenExpiry,
      influenceLevel: user.influenceLevel,
      verified: user.verified,
      profileImage: user.profileImage,
    }

    res.status(200).json(userResponse)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router
