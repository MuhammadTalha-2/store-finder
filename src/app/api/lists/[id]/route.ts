import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeLists, storeListMembers } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — Get a single list with member count
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listId = Number(id);

  if (isNaN(listId)) {
    return NextResponse.json({ error: "Invalid list ID" }, { status: 400 });
  }

  const [list] = await db
    .select()
    .from(storeLists)
    .where(eq(storeLists.id, listId))
    .limit(1);

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  // Get member count
  const [countResult] = await db
    .select({ count: count() })
    .from(storeListMembers)
    .where(eq(storeListMembers.listId, listId));

  return NextResponse.json({
    list: {
      ...list,
      memberCount: countResult.count,
    },
  });
}

// PATCH — Update a list
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listId = Number(id);
  const body = await request.json();

  if (isNaN(listId)) {
    return NextResponse.json({ error: "Invalid list ID" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.color !== undefined) updates.color = body.color;
  if (body.filtersJson !== undefined) updates.filtersJson = body.filtersJson;

  const [updated] = await db
    .update(storeLists)
    .set(updates)
    .where(eq(storeLists.id, listId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json({ list: updated });
}

// DELETE — Delete a list
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listId = Number(id);

  if (isNaN(listId)) {
    return NextResponse.json({ error: "Invalid list ID" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(storeLists)
    .where(eq(storeLists.id, listId))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
