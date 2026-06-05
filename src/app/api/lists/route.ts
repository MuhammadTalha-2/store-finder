import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeLists, storeListMembers, stores } from "@/lib/db/schema";
import { desc, eq, count, sql, and, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — List all store lists/segments with member counts
export async function GET() {
  try {
    const lists = await db
      .select({
        id: storeLists.id,
        name: storeLists.name,
        description: storeLists.description,
        color: storeLists.color,
        type: storeLists.type,
        filtersJson: storeLists.filtersJson,
        createdBy: storeLists.createdBy,
        createdAt: storeLists.createdAt,
        updatedAt: storeLists.updatedAt,
        memberCount: count(storeListMembers.id),
      })
      .from(storeLists)
      .leftJoin(storeListMembers, eq(storeLists.id, storeListMembers.listId))
      .groupBy(storeLists.id)
      .orderBy(desc(storeLists.updatedAt));

    // For smart segments, compute the dynamic count
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        if (list.type === "smart" && list.filtersJson) {
          // We'll compute the count by querying with the saved filters
          // For now, return 0 — the actual count is fetched when viewing the list
          return { ...list, memberCount: list.memberCount };
        }
        return list;
      })
    );

    return NextResponse.json({ lists: listsWithCounts });
  } catch (error) {
    console.error("Error fetching lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch lists" },
      { status: 500 }
    );
  }
}

// POST — Create a new store list or smart segment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      color = "#6366f1",
      type = "manual", // "manual" | "smart"
      filtersJson,
      storeIds, // optional: initial store IDs for manual lists
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (type === "smart" && !filtersJson) {
      return NextResponse.json(
        { error: "Filters are required for smart segments" },
        { status: 400 }
      );
    }

    const [list] = await db
      .insert(storeLists)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        color,
        type,
        filtersJson: type === "smart" ? filtersJson : null,
      })
      .returning();

    // If manual list with initial store IDs, add them
    if (type === "manual" && storeIds && Array.isArray(storeIds) && storeIds.length > 0) {
      const members = storeIds.map((storeId: number) => ({
        listId: list.id,
        storeId,
      }));

      await db
        .insert(storeListMembers)
        .values(members)
        .onConflictDoNothing();
    }

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json(
      { error: "Failed to create list" },
      { status: 500 }
    );
  }
}
