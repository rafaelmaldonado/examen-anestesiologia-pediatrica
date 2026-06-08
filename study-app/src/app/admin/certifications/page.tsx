'use client';

import { useState, useEffect, FormEvent } from 'react';
import type { Certification } from '@/types';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';

export default function CertificationsAdminPage() {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isEditing, setIsEditing] = useState<Certification | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isAdobe, setIsAdobe] = useState(false);
    const [price, setPrice] = useState<number | ''>('');
    const [isFree, setIsFree] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [examDurationMinutes, setExamDurationMinutes] = useState<number>(30);

    useEffect(() => {
        fetchCertifications();
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
        const url = isEditing ? `/api/certifications/${isEditing.id}` : '/api/certifications';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const priceInCents = isFree ? 0 : (typeof price === 'number' ? price * 100 : 0);
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    description, 
                    isAdobe, 
                    price: priceInCents,
                    isFree,
                    isActive,
                    examDurationMinutes,
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
        setIsAdobe(cert.isAdobe);
        setPrice(cert.price ? cert.price / 100 : '');
        setIsFree(cert.isFree || false);
        setIsActive(cert.isActive !== false);
        setExamDurationMinutes(cert.examDurationMinutes ?? 30);
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
        setIsAdobe(false);
        setPrice('');
        setIsFree(false);
        setIsActive(true);
        setExamDurationMinutes(30);
    };

    return (
        <AdminGuard>
            <div className="container mx-auto p-8 max-w-6xl min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Gestionar Exámenes</h1>
                    <p className="text-sm text-[var(--foreground-muted)]">Crea y administra los exámenes</p>
                </div>
                <Link href="/admin" className="btn-neon-purple py-2 px-4 rounded-lg text-sm font-medium">
                    ← Panel Admin
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-5 text-[var(--foreground)]">Exámenes existentes</h2>
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
                        {certifications.map(cert => (
                            <div key={cert.id} className="card-dark p-5 rounded-xl flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-semibold text-[var(--foreground)]">{cert.name}</h3>
                                        {cert.isActive !== false ? (
                                            <span className="bg-[var(--success-light)] text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                                                ✓ Activo
                                            </span>
                                        ) : (
                                            <span className="bg-[var(--error-light)] text-red-700 text-xs px-2 py-0.5 rounded-full border border-red-200">
                                                ✗ Inactivo
                                            </span>
                                        )}
                                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                                            ⏱ {cert.examDurationMinutes ?? 30} min
                                        </span>
                                    </div>
                                        <p className="text-sm text-[var(--foreground-muted)]">{cert.description || 'Sin descripción'}</p>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
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
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-5 text-[var(--foreground)]">
                        {isEditing ? 'Editar Examen' : 'Agregar Nuevo Examen'}
                    </h2>
                    <div className="card-dark p-6 rounded-xl">
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
                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={e => setIsActive(e.target.checked)}
                                        className="w-4 h-4 text-[var(--success)] border-[var(--border-hover)] rounded focus:ring-[var(--success)] focus:ring-2"
                                    />
                                    <span className="text-sm text-[var(--foreground)]">
                                        Examen activo (visible para estudiantes)
                                    </span>
                                </label>
                                {!isActive && (
                                    <p className="text-xs text-[var(--error)] mt-1 ml-7">
                                        El examen está desactivado. Los estudiantes no podrán acceder aunque tengan el link.
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-between pt-2">
                                <button 
                                    type="submit" 
                                    className="btn-neon-purple py-2.5 px-6 rounded-lg font-medium"
                                >
                                    {isEditing ? '✓ Actualizar' : '+ Crear'}
                                </button>
                                {isEditing && (
                                    <button 
                                        type="button" 
                                        onClick={resetForm} 
                                        className="bg-[var(--background-tertiary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground-muted)] py-2.5 px-6 rounded-lg transition-colors"
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
