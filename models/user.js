import { model, models, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String },
    username: { type: String },
    email_address: { type: String, required: true },
    clerk_id: { type: String, required: true },
    avatar: String,
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
