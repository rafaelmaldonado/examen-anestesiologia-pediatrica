'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from './providers';
import type { Certification } from '@/types';
import { getAvailability, formatCdmx } from '@/lib/schedule';

export default function HomePage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/certifications', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to fetch certifications');
        }
        const data = await res.json();
        setCertifications(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresca el estado de disponibilidad cada minuto.
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto p-6 sm:p-8 flex justify-center items-center py-20">
        <div className="text-center">
          <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-[var(--foreground-muted)]">Cargando exámenes...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
      <div className="text-center mb-10 sm:mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-3">Examen Anestesiología Pediátrica</h1>
        <p className="text-base sm:text-lg text-[var(--foreground-muted)]">Selecciona un examen para comenzar</p>
      </div>

      {error && (
        <div className="text-[var(--error)] bg-[var(--error-light)] border border-red-200 p-4 rounded-lg mb-8">
          <div className="flex items-center">
            <span>⚠️</span>
            <span className="ml-2">{error}</span>
          </div>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certifications.map((cert) => {
            const status = cert.isActive === false
              ? 'inactive'
              : getAvailability({ availableFrom: cert.availableFrom, availableUntil: cert.availableUntil }, now);
            const isOpen = status === 'open';
            return (
              <div key={cert.id} className={`card-dark p-6 sm:p-8 rounded-xl h-full transition-all duration-200 group ${!isOpen ? 'opacity-60' : ''}`}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-200">
                      {cert.name}
                    </h2>
                    {status === 'upcoming' && (
                      <span className="inline-block bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                        🕒 Próximamente
                      </span>
                    )}
                    {status === 'closed' && (
                      <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-300 whitespace-nowrap">
                        🔒 Cerrado
                      </span>
                    )}
                    {status === 'inactive' && (
                      <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-300 whitespace-nowrap">
                        🔒 Inactivo
                      </span>
                    )}
                  </div>
                  <p className="font-normal text-[var(--foreground-muted)] mb-4 leading-relaxed text-sm">
                    {cert.description || ''}
                  </p>

                  {status === 'upcoming' && cert.availableFrom != null && (
                    <p className="text-xs text-amber-700 mb-3">
                      Disponible a partir del {formatCdmx(cert.availableFrom)} (hora de México).
                    </p>
                  )}
                  {status === 'closed' && cert.availableUntil != null && (
                    <p className="text-xs text-gray-500 mb-3">
                      Cerró el {formatCdmx(cert.availableUntil)} (hora de México).
                    </p>
                  )}
                  {isOpen && cert.availableUntil != null && (
                    <p className="text-xs text-[var(--foreground-muted)] mb-3">
                      Cierra el {formatCdmx(cert.availableUntil)} (hora de México).
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    {isOpen ? (
                      user ? (
                        <Link href={`/quiz/${cert.id}`} className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors duration-200 font-semibold text-sm">
                          Iniciar Examen →
                        </Link>
                      ) : (
                        <Link href="/auth" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors duration-200 font-semibold text-sm">
                          Inicia sesión para comenzar →
                        </Link>
                      )
                    ) : (
                      <span className="text-gray-400 text-sm cursor-not-allowed">
                        Examen no disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
