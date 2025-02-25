import { model, models, Schema } from "mongoose";

const ChatSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    boardgame_id: { type: Schema.Types.ObjectId, ref: "Boardgame", required: true },
  },
  { timestamps: true }
);

const Chat = models.Chat || model("Chat", ChatSchema);

export default Chat;
