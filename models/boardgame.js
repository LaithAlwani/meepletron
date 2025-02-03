import { model, models, Schema } from "mongoose";

const boardgameSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    year: String,
    minPlayers: {
      type: Number,
      required: true,
    },
    maxPlayers: {
      type: Number,
      required: true,
    },
    playTime: {
      type: Number,
      required: true,
    },
    description: String,
    bggId: String,
    designers: [],
    artists: [],
    publishers: [],
    categories: [],
    rule_book_url:String,
  },
  { timestamps: true }
);

const Boardgame = models.Boardgame || model("Boardgame", boardgameSchema);

export default Boardgame;
