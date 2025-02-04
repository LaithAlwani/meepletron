import { model, models, Schema } from "mongoose";

const UserSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String },
  username: { type: String, required: true },
  email_address: { type: String,  required: true },
  avatar: String,
  last_visited: [{ type: Schema.Types.ObjectId, ref: "Boardgame" }],
  favorites: [{ type: Schema.Types.ObjectId, ref: "Boardgame" }],
});

const User = models.User || model("User", UserSchema);

export default User;
