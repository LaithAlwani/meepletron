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
    min_players: {
      type: Number,
      required: true,
    },
    max_players: {
      type: Number,
      required: true,
    },
    min_age: {
      type: String,
      required: true,
    },
    play_time: {
      type: Number,
      required: true,
    },
    is_expansion: Boolean,
    description: String,
    bgg_id: String,
    designers: [],
    artists: [],
    publishers: [],
    categories: [],
    game_mechanics: [],
    urls: [],
    parent_id: { type: Schema.Types.ObjectId, ref: "Boardgame" },
    counter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Boardgame = models.Boardgame || model("Boardgame", boardgameSchema);

export default Boardgame;
