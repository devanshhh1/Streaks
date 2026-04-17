import { Request, Response, NextFunction } from "express"
import User from "../models/user"

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
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

    req.user = user
    next()
  } catch (err) {
    res.status(500).json({ message: "Authentication error" })
  }
}