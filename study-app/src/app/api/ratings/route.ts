import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";

// GET ratings for a certification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const certificationId = searchParams.get("certificationId");

  if (!certificationId) {
    return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
  }


  try {
    const ratingsSnapshot = await getAdminDb()
      .collection("ratings")
      .where("certificationId", "==", certificationId)
      .get();

    const ratings = ratingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as any[]; // Type assertion to handle Firebase document data

    // Sort by createdAt in descending order (newest first)
    ratings.sort((a: any, b: any) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Sort by createdAt in descending order (newest first)
    ratings.sort((a: any, b: any) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Calculate statistics
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum: number, rating: any) => sum + rating.rating, 0) / totalRatings 
      : 0;

    const ratingBreakdown = {
      1: ratings.filter((r: any) => r.rating === 1).length,
      2: ratings.filter((r: any) => r.rating === 2).length,
      3: ratings.filter((r: any) => r.rating === 3).length,
      4: ratings.filter((r: any) => r.rating === 4).length,
      5: ratings.filter((r: any) => r.rating === 5).length,
    };

    return NextResponse.json({
      ratings,
      stats: {
        certificationId,
        averageRating: Number(averageRating.toFixed(1)),
        totalRatings,
        ratingBreakdown
      }
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST a new rating
export async function POST(request: Request) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  try {
    const body = await request.json();
    const { certificationId, rating, comment } = body;

    if (!certificationId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: "certificationId and rating (1-5) are required" 
      }, { status: 400 });
    }

    // Get user information
    const userRecord = await require("@/lib/firebase/admin").getAdminAuth().getUser(user.uid);

    // Check if user has already rated this certification
    const existingRatingSnapshot = await getAdminDb()
      .collection("ratings")
      .where("userId", "==", user.uid)
      .where("certificationId", "==", certificationId)
      .get();

    if (!existingRatingSnapshot.empty) {
      // Update existing rating
      const existingRatingDoc = existingRatingSnapshot.docs[0];
      await existingRatingDoc.ref.update({
        rating,
        comment: comment || "",
        updatedAt: new Date(),
      });

      return NextResponse.json({ 
        id: existingRatingDoc.id,
        message: "Rating updated successfully" 
      });
    } else {
      // Create new rating
      const ratingData = {
        userId: user.uid,
        userEmail: userRecord.email,
        certificationId,
        rating,
        comment: comment || "",
        createdAt: new Date(),
      };

      const docRef = await getAdminDb().collection("ratings").add(ratingData);

      return NextResponse.json({ 
        id: docRef.id,
        message: "Rating submitted successfully" 
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
