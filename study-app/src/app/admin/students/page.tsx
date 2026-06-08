'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';

interface StudentResult {
  id: string;
  userId: string;
  userEmail: string;
  certificationId: string;
  certificationName: string;
  score: number;
  correctCount: number | null;
  totalQuestions: number | null;
  timeTaken: number | null;
  finishedAt: string | null;
  createdAt: string | null;
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function AdminStudentsPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMateria, setFilterMateria] = useState('');
  const [sortField, setSortField] = useState<keyof StudentResult>('finishedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch('/api/admin/students');
        if (!res.ok) throw new Error('No se pudieron cargar los resultados');
        const data = await res.json();
        setResults(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const materias = Array.from(new Set(results.map(r => r.certificationName))).sort();

  const filtered = results.filter(r =>
    filterMateria === '' || r.certificationName === filterMateria
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortField] ?? '';
    const vb = b[sortField] ?? '';
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: keyof StudentResult) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortIcon = (field: keyof StudentResult) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <AdminGuard>
      <div className="container mx-auto p-6 sm:p-8 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Calificaciones de Estudiantes</h1>
            <p className="text-[var(--foreground-muted)] text-sm mt-1">
              {results.length} resultado{results.length !== 1 ? 's' : ''} en total
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Panel Admin
          </Link>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterMateria}
            onChange={e => setFilterMateria(e.target.value)}
            className="bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">Todos los exámenes</option>
            {materias.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
              <div className="text-[var(--foreground-muted)]">Cargando resultados...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[var(--error-light)] border border-red-200 text-[var(--error)] p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="text-center card-dark p-12 rounded-xl">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-[var(--foreground-muted)]">No hay resultados para mostrar.</p>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="card-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <th
                      className="text-left px-4 py-3 font-semibold text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap"
                      onClick={() => toggleSort('userEmail')}
                    >
                      Estudiante{sortIcon('userEmail')}
                    </th>
                    <th
                      className="text-left px-4 py-3 font-semibold text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap"
                      onClick={() => toggleSort('certificationName')}
                    >
                      Examen{sortIcon('certificationName')}
                    </th>
                    <th
                      className="text-center px-4 py-3 font-semibold text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap"
                      onClick={() => toggleSort('score')}
                    >
                      Calificación{sortIcon('score')}
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-[var(--foreground-muted)] whitespace-nowrap">
                      Aciertos
                    </th>
                    <th
                      className="text-center px-4 py-3 font-semibold text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap"
                      onClick={() => toggleSort('timeTaken')}
                    >
                      Tiempo usado{sortIcon('timeTaken')}
                    </th>
                    <th
                      className="text-right px-4 py-3 font-semibold text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap"
                      onClick={() => toggleSort('finishedAt')}
                    >
                      Fecha de término{sortIcon('finishedAt')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((result, idx) => (
                    <tr
                      key={result.id}
                      className={`border-b border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors ${
                        idx % 2 === 0 ? '' : 'bg-[var(--background-tertiary)]'
                      }`}
                    >
                      <td className="px-4 py-3 text-[var(--foreground)] max-w-[200px] truncate">
                        {result.userEmail}
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground-muted)]">
                        {result.certificationName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block font-bold text-base px-3 py-1 rounded-lg ${
                          result.score >= 75
                            ? 'bg-[var(--success-light)] text-green-700'
                            : result.score >= 50
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-[var(--error-light)] text-red-700'
                        }`}>
                          {result.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--foreground-muted)] text-sm">
                        {result.correctCount !== null && result.totalQuestions !== null
                          ? `${result.correctCount} / ${result.totalQuestions}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[var(--foreground-muted)]">
                        {formatTime(result.timeTaken)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--foreground-muted)] whitespace-nowrap">
                        {(result.finishedAt || result.createdAt)
                          ? new Date(result.finishedAt || result.createdAt!).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
