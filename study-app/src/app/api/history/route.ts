import { NextResponse } from "next/server";
import { getAdminDb as adminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";

export async function GET() {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = user.uid;

    // Fetch user's test results
    const resultsRef = adminDb.collection("testResults");
    const snapshot = await resultsRef
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    // Get certification names for each result
    const results = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Fetch certification name
      let certificationName = 'Unknown Certification';
      try {
        const certDoc = await adminDb.collection('certifications').doc(data.certificationId).get();
        if (certDoc.exists) {
          certificationName = certDoc.data()?.name || 'Unknown Certification';
        }
      } catch (error) {
        console.warn(`Failed to fetch certification name for ${data.certificationId}:`, error);
      }

      results.push({
        id: doc.id,
        userId: data.userId,
        certificationId: data.certificationId,
        certificationName,
        score: data.score,
        createdAt: data.createdAt.toDate(),
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
