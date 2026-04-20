import express from "express"
import dotenv from "dotenv"
const cors = require("cors")

dotenv.config()

import "./db/mongoose"
import streakRouter from "./routes/streak_route"
import authRouter from "./routes/auth"
import userRouter from "./routes/user"
import commentsRouter from "./routes/comments"

const app = express()

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, "")

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean)

const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true)
      return
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizeOrigin(origin))) {
      callback(null, true)
      return
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`))
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
}

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Streaks API is running", status: "ok" })
})

app.use("/auth", authRouter)
app.use("/streaks", streakRouter)
app.use("/comments", commentsRouter)
app.use("/", userRouter)

const PORT = process.env.PORT || 5030
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
