import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";

export const getBoardgames = async ({ fields = "", sort, limit } = {}) => {
  await connectToDB();
  try {
    let query = Boardgame.find();

    // Apply field selection if fields are provided
    if (fields) {
      query = query.select(fields);
    }

    // Apply sorting if provided; default to { createdAt: -1 } if neither sort nor limit is specified

    query = query.sort(sort || { createdAt: -1 });

    // Apply limit only if it's explicitly provided (not undefined or null)
    if (limit !== undefined && limit !== null) {
      query = query.limit(limit);
    }

    const boardgames = await query.lean();
    return boardgames;
  } catch (err) {
    console.log(err);
    return err;
  }
};
