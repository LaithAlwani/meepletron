import { model, models, Schema } from "mongoose";

const SearchSchema = new Schema(
  {
    query: { type: String, required: true, unique: true, lowercase: true, trim: true },
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

SearchSchema.index({ count: -1 });

const Search = models.Search || model("Search", SearchSchema);

export default Search;
