import { model, models, Schema } from "mongoose";

const UserSchema = new Schema({
  firstname: String,
  lastname: Strting,
  email: String,
  avatar: String,
  visitedLast: [{ type: mongoose.Schema.Types.ObjectId, ref: "Boardgame" }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Boardgame" }],
});

const User = models.User || model("User", UserSchema);

export default User;
