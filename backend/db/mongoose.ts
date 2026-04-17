import mongoose from "mongoose"

mongoose.set("strictQuery", false)

mongoose.connect("mongodb://127.0.0.1:27017/streaks")

const db = mongoose.connection

db.on("error", (err) => console.error(err))
db.once("connected", () => console.log("Successfully connected to db"))

export default db
