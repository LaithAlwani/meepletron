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
    parent_id: { type: Schema.Types.ObjectId, ref: "Boardgame", required: true },
    designers: [],
    artists: [],
    publishers: [],
    categories: [],
    game_mechanics:[],
    rule_book_url:String,
  },
  { timestamps: true }
);

const Expansion = models.Expansion || model("Expansion", expansionSchema);

export default Expansion;
