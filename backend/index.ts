import express from "express"
const cors = require("cors")
import "./db/mongoose"
import streakRouter from "./routes/streak_route"
import authRouter from "./routes/auth"

const app = express()

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: true
}))

app.use(express.json())

app.use("/auth", authRouter)
app.use("/streaks", streakRouter)

app.listen(5030, () => {
  console.log("Listening on port 5030")
})
