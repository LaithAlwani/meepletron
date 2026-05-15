import { model, models, Schema } from "mongoose";
import { makeSlugHook } from "@/utils/slugify";

const boardgameSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
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
    expansions:[{type: Schema.Types.ObjectId, ref: "Expansion"}],
    description: String,
    bgg_id: String,
    designers: [],
    artists: [],
    publishers: [],
    categories: [],
    game_mechanics: [],
    urls: [],
    counter: { type: Number, default: 0 },
    // Which RAG pipeline version the chunks for this game are stored under.
    // 1 = legacy (text-embedding-3-large in PINECONE_INDEX_NAME)
    // 2 = new (text-embedding-3-small + semantic chunks in PINECONE_INDEX_NAME_V2)
    // Set to 2 by the migration commit endpoint after re-embedding.
    embed_version: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);

boardgameSchema.pre("save", makeSlugHook((doc) => doc.title));

const Boardgame = models.Boardgame || model("Boardgame", boardgameSchema);

export default Boardgame;
