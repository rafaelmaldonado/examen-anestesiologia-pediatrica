'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import RatingsDisplay from '@/components/RatingsDisplay';
import PaymentButton from '@/components/PaymentButton';
import type { Certification } from '@/types';

export default function CertificationRatingsPage() {
  const params = useParams();
  const certificationId = params.certificationId as string;
  const [certification, setCertification] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<any>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch certification details
        const certResponse = await fetch(`/api/certifications/${certificationId}`);
        if (certResponse.ok) {
          const certData = await certResponse.json();
          setCertification(certData);
        } else {
          setError('Certification not found');
          return;
        }

        // Check user access
        try {
          const accessResponse = await fetch(`/api/user-access?certificationId=${certificationId}`);
          if (accessResponse.ok) {
            const accessData = await accessResponse.json();
            setAccessStatus(accessData);
          }
        } catch (accessError) {
          // User might not be logged in, that's okay
          console.log('Access check failed:', accessError);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load certification');
      } finally {
        setLoading(false);
        setCheckingAccess(false);
      }
    };

    if (certificationId) {
      fetchData();
    }
  }, [certificationId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-glow-purple">Loading Ratings...</div>
        </div>
      </div>
    );
  }

  if (error || !certification) {
    return (
      <div className="container mx-auto p-8 min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-lg text-gray-300 mb-6">{error || 'Certification not found'}</p>
          <Link href="/" className="btn-primary px-6 py-3 rounded-lg text-white font-semibold hover:bg-purple-700 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl min-h-screen">
      <div className="mb-8">
        <Link href="/" className="text-purple-400 hover:text-orange-400 transition-colors mb-4 inline-block">
          ← Back to Certifications
        </Link>
        <h1 className="text-4xl font-bold text-glow-purple mb-2">{certification.name}</h1>
        <p className="text-lg text-gray-300">{certification.description}</p>
        {certification.isAdobe && (
          <span className="inline-block mt-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-300 text-sm font-semibold px-4 py-2 rounded-full border border-orange-500/30">
            Adobe Certification
          </span>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-200">Student Reviews & Ratings</h2>
          {accessStatus?.canTakeQuiz ? (
            <Link 
              href={`/quiz/${certificationId}`}
              className="btn-neon-purple px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
            >
              {accessStatus.hasUsedFreeTrial && !accessStatus.hasPaidAccess ? 'Continue Quiz' : 'Take Quiz'}
            </Link>
          ) : (
            <div className="text-sm text-gray-400">
              {!checkingAccess && 'Login to take quiz'}
            </div>
          )}
        </div>
        
        {/* Show payment section if user needs to pay */}
        {accessStatus?.needsPayment && certification && (
          <div className="mb-8">
            <PaymentButton
              certificationId={certificationId}
              certificationName={certification.name}
              price={certification.price}
              isFree={certification.isFree}
              onSuccess={() => window.location.reload()}
            />
          </div>
        )}

        {/* Show free trial info */}
        {!accessStatus?.hasPaidAccess && !certification?.isFree && !accessStatus?.hasUsedFreeTrial && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2">🎯 Free Trial Available</h3>
            <p className="text-gray-300 text-sm">
              Try this certification for free! You get one free quiz attempt before needing to purchase full access.
            </p>
          </div>
        )}
        
        <RatingsDisplay certificationId={certificationId} showAllRatings={true} />
      </div>
    </div>
  );
}
