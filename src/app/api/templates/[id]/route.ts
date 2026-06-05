import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const [template] = await db
      .update(emailTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailTemplates.id, Number(id)))
      .returning();

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 });
    }
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, Number(id)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
