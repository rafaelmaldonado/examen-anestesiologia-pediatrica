'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, FormEvent } from 'react';
import type { Certification } from '@/types';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import { cdmxLocalToEpoch, epochToCdmxLocal, formatCdmx, getAvailability } from '@/lib/schedule';

export default function CertificationsAdminPage() {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(() => Date.now());

    // Form state
    const [isEditing, setIsEditing] = useState<Certification | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [examDurationMinutes, setExamDurationMinutes] = useState<number>(30);
    // Horario (hora de CDMX). Cadenas "YYYY-MM-DDTHH:mm" para <input type="datetime-local">.
    const [availableFromLocal, setAvailableFromLocal] = useState('');
    const [availableUntilLocal, setAvailableUntilLocal] = useState('');

    useEffect(() => {
        fetchCertifications();
        // Refresca el estado de disponibilidad cada minuto.
        const interval = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const fetchCertifications = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/certifications');
            if (!res.ok) throw new Error('Failed to fetch certifications');
            const data = await res.json();
            setCertifications(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const availableFrom = cdmxLocalToEpoch(availableFromLocal);
        const availableUntil = cdmxLocalToEpoch(availableUntilLocal);

        if (availableFrom != null && availableUntil != null && availableUntil <= availableFrom) {
            setError('La hora de cierre debe ser posterior a la de apertura.');
            return;
        }

        const url = isEditing ? `/api/certifications/${isEditing.id}` : '/api/certifications';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    examDurationMinutes,
                    availableFrom,
                    availableUntil,
                }),
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to save certification');
            }
            resetForm();
            fetchCertifications();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = (cert: Certification) => {
        setIsEditing(cert);
        setName(cert.name);
        setDescription(cert.description || '');
        setExamDurationMinutes(cert.examDurationMinutes ?? 30);
        setAvailableFromLocal(epochToCdmxLocal(cert.availableFrom));
        setAvailableUntilLocal(epochToCdmxLocal(cert.availableUntil));
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar este examen? También se eliminarán todas sus preguntas.')) {
            try {
                const res = await fetch(`/api/certifications/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete certification');
                fetchCertifications();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    const resetForm = () => {
        setIsEditing(null);
        setName('');
        setDescription('');
        setExamDurationMinutes(30);
        setAvailableFromLocal('');
        setAvailableUntilLocal('');
    };

    return (
        <AdminGuard>
            <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-6xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-1">Gestionar Exámenes</h1>
                    <p className="text-sm text-[var(--foreground-muted)]">Crea y administra los exámenes</p>
                </div>
                <Link href="/admin" className="btn-neon-purple py-2 px-4 rounded-lg text-sm font-medium self-start sm:self-auto">
                    ← Panel Admin
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-[var(--foreground)]">Exámenes existentes</h2>
                    {loading && (
                        <div className="text-center py-8">
                            <div className="spinner-neon w-8 h-8 mx-auto mb-4"></div>
                            <p className="text-[var(--foreground-muted)]">Cargando...</p>
                        </div>
                    )}
                    {error && (
                        <p className="text-[var(--error)] bg-[var(--error-light)] border border-red-200 p-4 rounded-lg mb-4">
                            {error}
                        </p>
                    )}
                    <div className="space-y-4">
                        {certifications.map(cert => {
                            const status = cert.isActive === false
                                ? 'inactive'
                                : getAvailability({ availableFrom: cert.availableFrom, availableUntil: cert.availableUntil }, now);
                            return (
                            <div key={cert.id} className="card-dark p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-[var(--foreground)]">{cert.name}</h3>
                                        {status === 'inactive' && (
                                            <span className="bg-[var(--error-light)] text-red-700 text-xs px-2 py-0.5 rounded-full border border-red-200">
                                                ✗ Inactivo
                                            </span>
                                        )}
                                        {status === 'open' && (
                                            <span className="bg-[var(--success-light)] text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                                                ✓ Disponible
                                            </span>
                                        )}
                                        {status === 'upcoming' && (
                                            <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-200">
                                                🕒 Próximamente
                                            </span>
                                        )}
                                        {status === 'closed' && (
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-300">
                                                🔒 Cerrado
                                            </span>
                                        )}
                                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                                            ⏱ {cert.examDurationMinutes ?? 30} min
                                        </span>
                                    </div>
                                        <p className="text-sm text-[var(--foreground-muted)]">{cert.description || 'Sin descripción'}</p>
                                        {(cert.availableFrom != null || cert.availableUntil != null) && (
                                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                                {cert.availableFrom != null && <>Apertura: {formatCdmx(cert.availableFrom)}</>}
                                                {cert.availableFrom != null && cert.availableUntil != null && ' · '}
                                                {cert.availableUntil != null && <>Cierre: {formatCdmx(cert.availableUntil)}</>}
                                                {' (hora de México)'}
                                            </p>
                                        )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:ml-4 w-full sm:w-auto">
                                    <Link 
                                        href={`/admin/questions/${cert.id}`}
                                        className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                    >
                                        Preguntas
                                    </Link>
                                    <button 
                                        onClick={() => handleEdit(cert)} 
                                        className="bg-[var(--accent-lighter)] hover:bg-amber-100 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(cert.id)} 
                                        className="bg-[var(--error-light)] hover:bg-red-100 border border-red-200 text-[var(--error)] px-3 py-1.5 rounded-lg transition-colors text-sm"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-[var(--foreground)]">
                        {isEditing ? 'Editar Examen' : 'Agregar Nuevo Examen'}
                    </h2>
                    <div className="card-dark p-5 sm:p-6 rounded-xl">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Nombre</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="input-neon w-full px-4 py-2.5 rounded-lg" 
                                    placeholder="Nombre del examen"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Descripción</label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    className="input-neon w-full px-4 py-2.5 rounded-lg h-28 resize-none" 
                                    placeholder="Breve descripción del examen"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Duración del examen (minutos)</label>
                                <input
                                    type="number"
                                    value={examDurationMinutes}
                                    onChange={e => setExamDurationMinutes(Math.max(5, parseInt(e.target.value) || 30))}
                                    className="input-neon w-full px-4 py-2.5 rounded-lg"
                                    placeholder="30"
                                    min="5"
                                    max="180"
                                    required
                                />
                                <p className="text-xs text-[var(--foreground-muted)] mt-1">Mínimo 5 min, máximo 180 min</p>
                            </div>
                            <div className="border-t border-[var(--border)] pt-4">
                                <p className="text-sm font-medium mb-1 text-[var(--foreground)]">Horario de disponibilidad</p>
                                <p className="text-xs text-[var(--foreground-muted)] mb-3">
                                    Define cuándo pueden los estudiantes presentar el examen (hora de México). Deja un campo vacío para no limitar ese extremo.
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-[var(--foreground-muted)]">Apertura</label>
                                        <input
                                            type="datetime-local"
                                            value={availableFromLocal}
                                            onChange={e => setAvailableFromLocal(e.target.value)}
                                            className="input-neon w-full px-4 py-2.5 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-[var(--foreground-muted)]">Cierre</label>
                                        <input
                                            type="datetime-local"
                                            value={availableUntilLocal}
                                            onChange={e => setAvailableUntilLocal(e.target.value)}
                                            className="input-neon w-full px-4 py-2.5 rounded-lg"
                                        />
                                    </div>
                                    {(availableFromLocal || availableUntilLocal) && (
                                        <button
                                            type="button"
                                            onClick={() => { setAvailableFromLocal(''); setAvailableUntilLocal(''); }}
                                            className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors underline"
                                        >
                                            Limpiar horario (disponible siempre)
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between pt-2">
                                <button 
                                    type="submit" 
                                    className="btn-neon-purple py-2.5 px-6 rounded-lg font-medium w-full sm:w-auto"
                                >
                                    {isEditing ? '✓ Actualizar' : '+ Crear'}
                                </button>
                                {isEditing && (
                                    <button 
                                        type="button" 
                                        onClick={resetForm} 
                                        className="bg-[var(--background-tertiary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground-muted)] py-2.5 px-6 rounded-lg transition-colors w-full sm:w-auto"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </AdminGuard>
    );
}
