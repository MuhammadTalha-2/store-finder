import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const templates = await db
    .select()
    .from(emailTemplates)
    .orderBy(desc(emailTemplates.createdAt));

  return NextResponse.json(templates);
}

const createSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = createSchema.parse(body);

  const [template] = await db
    .insert(emailTemplates)
    .values(data)
    .returning();

  return NextResponse.json(template, { status: 201 });
}
