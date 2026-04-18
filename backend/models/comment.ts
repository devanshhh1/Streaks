import mongoose from "mongoose"

export interface IComment extends mongoose.Document {
  userId?: mongoose.Types.ObjectId
  text: string
  userName: string
  userInfluence: number
  timestamp: Date
}

const commentSchema = new mongoose.Schema<IComment>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  userInfluence: {
    type: Number,
    required: true,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

const Comment = mongoose.model<IComment>("Comment", commentSchema)

export default Comment
