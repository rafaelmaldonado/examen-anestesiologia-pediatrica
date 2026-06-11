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

  const statusBadge = (status: string) => {
    if (status === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1 bg-[var(--warning-light)] text-[var(--warning)] text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" /> Próximamente
        </span>
      );
    }
    if (status === 'closed' || status === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1 bg-[var(--background-tertiary)] text-[var(--foreground-muted)] text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-muted)]" /> {status === 'closed' ? 'Cerrado' : 'Inactivo'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-[var(--success-light)] text-[var(--success)] text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" /> Disponible
      </span>
    );
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-6xl">
      <div className="mb-10 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">Exámenes disponibles</h1>
        <p className="text-[var(--foreground-muted)] mt-2">Selecciona un examen para comenzar. Recuerda que cada examen permite un solo intento.</p>
      </div>

      {error && (
        <div className="text-[var(--error)] bg-[var(--error-light)] border border-[var(--error)]/30 p-4 rounded-xl mb-8">
          {error}
        </div>
      )}

      {!error && certifications.length === 0 && (
        <div className="card-dark rounded-xl p-10 text-center">
          <p className="text-[var(--foreground-muted)]">No hay exámenes disponibles por el momento.</p>
        </div>
      )}

      {!error && certifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => {
            const status = cert.isActive === false
              ? 'inactive'
              : getAvailability({ availableFrom: cert.availableFrom, availableUntil: cert.availableUntil }, now);
            const isOpen = status === 'open';
            const CardInner = (
              <div className={`card-dark ${isOpen ? 'card-interactive' : 'opacity-70'} h-full rounded-2xl p-6 flex flex-col`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)] leading-snug">
                    {cert.name}
                  </h2>
                  {statusBadge(status)}
                </div>

                {cert.description && (
                  <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-4">
                    {cert.description}
                  </p>
                )}

                <div className="mt-auto pt-4 border-t border-[var(--border)] space-y-2">
                  {cert.examDurationMinutes != null && (
                    <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      Duración: {cert.examDurationMinutes} min
                    </p>
                  )}
                  {status === 'upcoming' && cert.availableFrom != null && (
                    <p className="text-xs text-[var(--warning)]">
                      Disponible a partir del {formatCdmx(cert.availableFrom)} (hora de México).
                    </p>
                  )}
                  {status === 'closed' && cert.availableUntil != null && (
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Cerró el {formatCdmx(cert.availableUntil)} (hora de México).
                    </p>
                  )}
                  {isOpen && cert.availableUntil != null && (
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Cierra el {formatCdmx(cert.availableUntil)} (hora de México).
                    </p>
                  )}

                  <div className="pt-1">
                    {isOpen ? (
                      user ? (
                        <span className="inline-flex items-center gap-1.5 text-[var(--primary)] font-semibold text-sm">
                          Iniciar examen
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[var(--foreground-muted)] font-medium text-sm">
                          Inicia sesión para comenzar
                        </span>
                      )
                    ) : (
                      <span className="text-[var(--foreground-muted)] text-sm">
                        Examen no disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            if (isOpen) {
              return (
                <Link key={cert.id} href={user ? `/quiz/${cert.id}` : '/auth'} className="block">
                  {CardInner}
                </Link>
              );
            }
            return <div key={cert.id}>{CardInner}</div>;
          })}
        </div>
      )}
    </main>
  );
}
