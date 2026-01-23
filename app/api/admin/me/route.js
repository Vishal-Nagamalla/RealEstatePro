import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email || "";
  return NextResponse.json({ isAdmin: !!session && isAdminEmail(email) });
}