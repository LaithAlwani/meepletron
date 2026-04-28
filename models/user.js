import { model, models, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    first_name: { type: String },
    last_name: { type: String },
    username: { type: String },
    email_address: { type: String, required: true },
    clerk_id: { type: String, required: true },
    avatar: String,
    tokens_used_today: { type: Number, default: 0 },
    tokens_reset_at: { type: Date },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
