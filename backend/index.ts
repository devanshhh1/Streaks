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

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((origin: string) => origin.trim())

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
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
