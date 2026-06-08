'use client';
export const dynamic = 'force-dynamic';

import { useAuth } from '@/app/providers';
import Link from "next/link";
import SignOutButton from './SignOutButton';
import AdminGuard from '@/components/AdminGuard';

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <AdminGuard>
      <div className="container mx-auto p-8 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Panel Administrativo</h1>
          <div className="flex items-center space-x-4">
              <p className="text-[var(--foreground-muted)] text-sm">Bienvenido, {user?.email}</p>
              <SignOutButton />
          </div>
        </div>

        <p className="text-[var(--foreground-muted)] mb-8">Administra la plataforma de exámenes desde este panel.</p>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-5">Secciones de administración</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/admin/certifications" className="block group">
                <div className="card-dark p-6 sm:p-8 rounded-xl h-full">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">📜</span>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">Gestionar Exámenes</h3>
                    </div>
                    <p className="text-[var(--foreground-muted)] text-sm">Crea, edita y elimina los exámenes.</p>
                  <div className="mt-4 text-[var(--primary)] group-hover:text-[var(--primary-light)] transition-colors text-sm font-medium">
                    Acceder →
                  </div>
              </div>
            </Link>

            <Link href="/admin/students" className="block group">
              <div className="card-dark p-6 sm:p-8 rounded-xl h-full">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🎓</span>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Calificaciones</h3>
                  </div>
                  <p className="text-[var(--foreground-muted)] text-sm">Visualiza las calificaciones de todos los estudiantes registrados.</p>
                  <div className="mt-4 text-[var(--primary)] group-hover:text-[var(--primary-light)] transition-colors text-sm font-medium">
                    Ver calificaciones →
                  </div>
              </div>
            </Link>

            <Link href="/admin/stats" className="block group">
              <div className="card-dark p-6 sm:p-8 rounded-xl h-full">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">📊</span>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Estadísticas</h3>
                  </div>
                  <p className="text-[var(--foreground-muted)] text-sm">Consulta estadísticas generales de preguntas y exámenes.</p>
                  <div className="mt-4 text-[var(--primary)] group-hover:text-[var(--primary-light)] transition-colors text-sm font-medium">
                    Ver estadísticas →
                  </div>
              </div>
            </Link>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}
