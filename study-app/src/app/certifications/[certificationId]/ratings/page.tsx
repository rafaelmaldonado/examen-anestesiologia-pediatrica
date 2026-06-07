'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import RatingsDisplay from '@/components/RatingsDisplay';
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
          <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-[var(--foreground-muted)]">Loading ratings...</div>
        </div>
      </div>
    );
  }

  if (error || !certification) {
    return (
      <div className="container mx-auto p-8 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--error)] mb-4">Error</h1>
          <p className="text-[var(--foreground-muted)] mb-6">{error || 'Certification not found'}</p>
          <Link href="/" className="btn-neon-purple px-6 py-3 rounded-lg font-medium">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl min-h-screen">
      <div className="mb-8">
        <Link href="/" className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors mb-4 inline-block text-sm">
          ← Back to Certifications
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">{certification.name}</h1>
        <p className="text-[var(--foreground-muted)]">{certification.description}</p>
        {certification.isAdobe && (
          <span className="inline-block mt-3 bg-red-50 text-red-700 text-sm font-medium px-4 py-1.5 rounded-full border border-red-200">
            Adobe Certification
          </span>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Student Reviews & Ratings</h2>
          {accessStatus?.canTakeQuiz ? (
            <Link 
              href={`/quiz/${certificationId}`}
              className="btn-neon-purple px-5 py-2.5 rounded-lg font-medium text-sm"
            >
              {accessStatus.hasUsedFreeTrial && !accessStatus.hasPaidAccess ? 'Continue Quiz' : 'Take Quiz'}
            </Link>
          ) : (
            <div className="text-sm text-[var(--foreground-muted)]">
              {!checkingAccess && 'Login to take quiz'}
            </div>
          )}
        </div>

        {/* Show free trial info */}
        {!accessStatus?.hasPaidAccess && !certification?.isFree && !accessStatus?.hasUsedFreeTrial && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-semibold mb-1">🎯 Free Trial Available</h3>
            <p className="text-blue-700 text-sm">
              Try this certification for free! You get one free quiz attempt before needing to purchase full access.
            </p>
          </div>
        )}
        
        <RatingsDisplay certificationId={certificationId} showAllRatings={true} />
      </div>
    </div>
  );
}
