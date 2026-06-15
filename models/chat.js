import { model, models, Schema } from "mongoose";

const ChatSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" , required:true},
    boardgame_id: { type: Schema.Types.ObjectId, ref: "Boardgame", required: true },
    parent_id: { type: Schema.Types.ObjectId, ref: "Boardgame" },
    last_message_at: { type: Date, default: Date.now() },
    last_message: { type: String, default: "" }
  },
  { timestamps: true }
);

// Chat is fetched by (boardgame_id, user_id) when loading a game's chat.
ChatSchema.index({ boardgame_id: 1, user_id: 1 });

const Chat = models.Chat || model("Chat", ChatSchema);

export default Chat;
