import express from "express"
const cors = require("cors")
import "./db/mongoose"
import streakRouter from "./routes/streak_route"
import authRouter from "./routes/auth"
import userRouter from "./routes/user"
import commentsRouter from "./routes/comments"

const app = express()

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: true
}))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))

app.use("/auth", authRouter)
app.use("/streaks", streakRouter)
app.use("/comments", commentsRouter)
app.use("/", userRouter)

app.listen(5030, () => {
  console.log("Listening on port 5030")
})
