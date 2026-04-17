import mongoose from "mongoose"

export interface IUser extends mongoose.Document {
  name: string
  email: string
  password: string
  token?: string
  tokenExpiry?: Date
  influenceLevel: number
  verified: boolean
  profileImage?: string
  createdAt: Date
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: String,
  tokenExpiry: Date,
  influenceLevel: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  profileImage: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
})

const User = mongoose.model<IUser>("User", userSchema)

export default User
