import Search from "@/models/search";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PAGE_SIZE = 30;
const VALID_SORT_FIELDS = ["count", "updatedAt", "query"];

export async function GET(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const skip = (page - 1) * PAGE_SIZE;
  const sortBy = VALID_SORT_FIELDS.includes(searchParams.get("sortBy"))
    ? searchParams.get("sortBy")
    : "count";
  const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;

  try {
    await connectToDB();

    const [searches, total] = await Promise.all([
      Search.find({})
        .sort({ [sortBy]: sortDir, _id: 1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
      Search.countDocuments({}),
    ]);

    return NextResponse.json({
      data: searches,
      total,
      hasMore: skip + searches.length < total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error fetching searches" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all") === "true";

  if (!id && !all) {
    return NextResponse.json({ message: "id or all=true is required" }, { status: 400 });
  }

  try {
    await connectToDB();
    if (all) {
      const { deletedCount } = await Search.deleteMany({});
      return NextResponse.json({ message: "All searches deleted", deletedCount });
    }
    const result = await Search.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ message: "Search not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error deleting search" }, { status: 500 });
  }
}
