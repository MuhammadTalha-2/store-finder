import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeListMembers, storeLists } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

// POST — Add stores to a manual list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listId = Number(id);
  const body = await request.json();
  const { storeIds } = body;

  if (isNaN(listId)) {
    return NextResponse.json({ error: "Invalid list ID" }, { status: 400 });
  }

  if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
    return NextResponse.json(
      { error: "storeIds array is required" },
      { status: 400 }
    );
  }

  // Verify the list exists and is manual
  const [list] = await db
    .select()
    .from(storeLists)
    .where(eq(storeLists.id, listId))
    .limit(1);

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  if (list.type !== "manual") {
    return NextResponse.json(
      { error: "Cannot manually add stores to a smart segment" },
      { status: 400 }
    );
  }

  const members = storeIds.map((storeId: number) => ({
    listId,
    storeId,
  }));

  await db
    .insert(storeListMembers)
    .values(members)
    .onConflictDoNothing();

  // Update the list's updatedAt
  await db
    .update(storeLists)
    .set({ updatedAt: new Date() })
    .where(eq(storeLists.id, listId));

  return NextResponse.json({ added: storeIds.length });
}

// DELETE — Remove stores from a manual list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listId = Number(id);
  const body = await request.json();
  const { storeIds } = body;

  if (isNaN(listId)) {
    return NextResponse.json({ error: "Invalid list ID" }, { status: 400 });
  }

  if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
    return NextResponse.json(
      { error: "storeIds array is required" },
      { status: 400 }
    );
  }

  await db
    .delete(storeListMembers)
    .where(
      and(
        eq(storeListMembers.listId, listId),
        inArray(storeListMembers.storeId, storeIds)
      )
    );

  // Update the list's updatedAt
  await db
    .update(storeLists)
    .set({ updatedAt: new Date() })
    .where(eq(storeLists.id, listId));

  return NextResponse.json({ removed: storeIds.length });
}
