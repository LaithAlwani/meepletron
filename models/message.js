import { model, models, Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    _id: String,
    chat_id: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    parent_id: { type: Schema.Types.ObjectId, ref: "Boardgame" },
    role: { type: String, enum: ["user", "assistant"], required: true }, // "user" or "bot"
    content: { type: String, required: true },// The actual message content
    annotations:[],
    rating: { type: String, default: "" },
  },
  { timestamps: true }
);

const Message = models.Message || model("Message", MessageSchema);

export default Message;
