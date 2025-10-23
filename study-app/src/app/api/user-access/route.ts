import { NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";
import { getUserAccessStatus } from "@/lib/stripe/helpers";

export async function GET(request: Request) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const certificationId = searchParams.get("certificationId");

  if (!certificationId) {
    return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
  }

  try {
    const accessStatus = await getUserAccessStatus(user.uid, certificationId);
    return NextResponse.json(accessStatus);
  } catch (error) {
    console.error("Error checking user access:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
