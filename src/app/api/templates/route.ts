import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(desc(emailTemplates.createdAt));

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const [template] = await db
      .insert(emailTemplates)
      .values(data)
      .returning();

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 });
    }
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
