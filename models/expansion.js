import { model, models, Schema } from "mongoose";

const expansionSchema = new Schema(
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
    play_time: {
      type: Number,
      required: true,
    },
    min_age: String,
    is_expansion: Boolean,
    description: String,
    bgg_id: {
      type: String,
      required: true,
    },
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

const Expansion = models.Expansion || model("Expansion", expansionSchema);

export default Expansion;
