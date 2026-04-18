import mongoose from "mongoose"

mongoose.set("strictQuery", false)

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/streaks"

mongoose.connect(mongoUri)

const db = mongoose.connection

db.on("error", (err) => console.error(err))
db.once("connected", () => console.log("Successfully connected to db"))

export default db
