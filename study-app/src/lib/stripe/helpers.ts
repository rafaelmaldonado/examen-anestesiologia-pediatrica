import { adminDb } from '@/lib/firebase/admin';
import { UserSubscription, UserQuizAttempt } from '@/types';

/**
 * Check if user has already taken a free trial for a certification
 */
export async function hasUserTakenFreeTrial(userId: string, certificationId: string): Promise<boolean> {
  try {
    if (!adminDb) {
      throw new Error('Database not initialized');
    }
    
    const attemptsRef = adminDb.collection('quizAttempts');
    const snapshot = await attemptsRef
      .where('userId', '==', userId)
      .where('certificationId', '==', certificationId)
      .where('isFreeAttempt', '==', true)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking free trial:', error);
    return false;
  }
}

/**
 * Check if user has paid access to a certification
 */
export async function hasUserPaidAccess(userId: string, certificationId: string): Promise<boolean> {
  try {
    if (!adminDb) {
      throw new Error('Database not initialized');
    }
    
    const subscriptionsRef = adminDb.collection('userSubscriptions');
    const snapshot = await subscriptionsRef
      .where('userId', '==', userId)
      .where('certificationId', '==', certificationId)
      .where('status', '==', 'paid')
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking paid access:', error);
    return false;
  }
}

/**
 * Record a quiz attempt
 */
export async function recordQuizAttempt(
  userId: string, 
  certificationId: string, 
  isFreeAttempt: boolean
): Promise<void> {
  try {
    if (!adminDb) {
      throw new Error('Database not initialized');
    }
    
    await adminDb.collection('quizAttempts').add({
      userId,
      certificationId,
      isFreeAttempt,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error recording quiz attempt:', error);
    throw error;
  }
}

/**
 * Create or update user subscription record
 */
export async function createUserSubscription(subscription: Omit<UserSubscription, 'id'>): Promise<string> {
  try {
    if (!adminDb) {
      throw new Error('Database not initialized');
    }
    
    const docRef = await adminDb.collection('userSubscriptions').add(subscription);
    return docRef.id;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string, 
  status: UserSubscription['status'],
  paidAt?: Date
): Promise<void> {
  try {
    if (!adminDb) {
      throw new Error('Database not initialized');
    }
    
    const updateData: any = { status };
    if (paidAt) {
      updateData.paidAt = paidAt;
    }
    
    await adminDb.collection('userSubscriptions').doc(subscriptionId).update(updateData);
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

/**
 * Get user access status for a certification
 */
export async function getUserAccessStatus(userId: string, certificationId: string) {
  const [hasPaidAccess, hasUsedFreeTrial] = await Promise.all([
    hasUserPaidAccess(userId, certificationId),
    hasUserTakenFreeTrial(userId, certificationId)
  ]);

  return {
    hasPaidAccess,
    hasUsedFreeTrial,
    canTakeQuiz: hasPaidAccess || !hasUsedFreeTrial,
    needsPayment: !hasPaidAccess && hasUsedFreeTrial
  };
}
