import { NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";

export async function GET(request: Request) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // All authenticated users have free access — no payment required
  return NextResponse.json({
    canTakeQuiz: true,
    hasPaidAccess: true,
    isFree: true,
    needsPayment: false,
  });
}
