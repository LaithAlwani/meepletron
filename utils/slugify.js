// Convert a title to a URL-safe slug.
// Examples:
//   "Catan" -> "catan"
//   "Wingspan: Asia"  -> "wingspan-asia"
//   "Ticket to Ride — Europe" -> "ticket-to-ride-europe"
export function slugify(input) {
  if (!input) return "";
  return String(input)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // drop punctuation/symbols
    .replace(/\s+/g, "-")          // spaces -> hyphens
    .replace(/-+/g, "-")           // collapse repeats
    .replace(/^-|-$/g, "");        // trim leading/trailing hyphen
}

// Ensure uniqueness across a Mongoose model. If the desired slug is already taken
// by a different document, append `-2`, `-3`, etc. until unused. Pass the document's
// own _id (when updating) so we don't collide with ourselves.
export async function uniqueSlug(Model, base, ownId = null) {
  const seed = slugify(base) || "game";
  let candidate = seed;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug: candidate };
    if (ownId) query._id = { $ne: ownId };
    const exists = await Model.exists(query);
    if (!exists) return candidate;
    candidate = `${seed}-${n++}`;
  }
}

// Mongoose pre-save hook factory. Use as:
//   schema.pre("save", makeSlugHook((doc) => doc.title));
// Generates slug from `getSource(doc)` when slug is missing or title changed.
export function makeSlugHook(getSource) {
  return async function slugHook(next) {
    try {
      const isNew = this.isNew;
      const titleChanged = this.isModified && this.isModified("title");
      if (this.slug && !isNew && !titleChanged) return next();

      const Model = this.constructor;
      const source = getSource(this);
      this.slug = await uniqueSlug(Model, source, this._id);
      next();
    } catch (err) {
      next(err);
    }
  };
}
