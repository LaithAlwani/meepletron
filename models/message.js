import { model, models, Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    chat_id: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true }, // "user" or "bot"
    content: { type: String, required: true }, // The actual message content
  },
  { timestamps: true }
);

const Message = models.Message || model("Message", MessageSchema);

export default Message;
