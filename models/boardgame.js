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
    isExpansion: Boolean,
    description: String,
    bggId: String,
    designers: [],
    artists: [],
    publishers: [],
    categories: [],
    game_mechanics: [],
    urls: [],
    parent_id:{type: Schema.Types.ObjectId, ref:"Boardgame"},
    parent_bgg_Id: String,
    counter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Boardgame = models.Boardgame || model("Boardgame", boardgameSchema);

export default Boardgame;
