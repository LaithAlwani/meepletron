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

// Messages are fetched by chat_id and sorted by createdAt (latest N first).
MessageSchema.index({ chat_id: 1, createdAt: -1 });

const Message = models.Message || model("Message", MessageSchema);

export default Message;
