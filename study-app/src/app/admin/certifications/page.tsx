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
                    isFree 
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
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this certification? This will also delete all associated questions.')) {
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
    };

    return (
        <AdminGuard>
            <div className="container mx-auto p-8 max-w-6xl min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Manage Certifications</h1>
                    <p className="text-sm text-[var(--foreground-muted)]">Create and manage certification categories</p>
                </div>
                <Link href="/admin" className="btn-neon-purple py-2 px-4 rounded-lg text-sm font-medium">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-5 text-[var(--foreground)]">Existing Certifications</h2>
                    {loading && (
                        <div className="text-center py-8">
                            <div className="spinner-neon w-8 h-8 mx-auto mb-4"></div>
                            <p className="text-[var(--foreground-muted)]">Loading...</p>
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
                                        {cert.isAdobe && (
                                            <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full border border-red-200">
                                                Adobe
                                            </span>
                                        )}
                                        {cert.isFree ? (
                                            <span className="bg-[var(--success-light)] text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                                                Free
                                            </span>
                                        ) : (
                                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                                                ${cert.price ? (cert.price / 100).toFixed(2) : '29.99'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[var(--foreground-muted)]">{cert.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    <Link 
                                        href={`/admin/questions/${cert.id}`}
                                        className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                    >
                                        Questions
                                    </Link>
                                    <button 
                                        onClick={() => handleEdit(cert)} 
                                        className="bg-[var(--accent-lighter)] hover:bg-amber-100 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(cert.id)} 
                                        className="bg-[var(--error-light)] hover:bg-red-100 border border-red-200 text-[var(--error)] px-3 py-1.5 rounded-lg transition-colors text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-5 text-[var(--foreground)]">
                        {isEditing ? 'Edit Certification' : 'Add New Certification'}
                    </h2>
                    <div className="card-dark p-6 rounded-xl">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Name</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="input-neon w-full px-4 py-2.5 rounded-lg" 
                                    placeholder="Certification name"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Description</label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    className="input-neon w-full px-4 py-2.5 rounded-lg h-28 resize-none" 
                                    placeholder="Brief description of the certification"
                                />
                            </div>
                            <div>
                                <label className="flex items-center space-x-3">
                                    <input 
                                        type="checkbox" 
                                        checked={isAdobe} 
                                        onChange={e => setIsAdobe(e.target.checked)} 
                                        className="w-4 h-4 text-[var(--primary)] border-[var(--border-hover)] rounded focus:ring-[var(--primary)] focus:ring-2"
                                    />
                                    <span className="text-sm text-[var(--foreground)]">Is this an Adobe Certification?</span>
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center space-x-3 mb-3">
                                    <input 
                                        type="checkbox" 
                                        checked={isFree} 
                                        onChange={e => setIsFree(e.target.checked)} 
                                        className="w-4 h-4 text-[var(--success)] border-[var(--border-hover)] rounded focus:ring-[var(--success)] focus:ring-2"
                                    />
                                    <span className="text-sm text-[var(--foreground)]">Free certification (no payment required)</span>
                                </label>
                                {!isFree && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Price (USD)</label>
                                        <input 
                                            type="number" 
                                            value={price} 
                                            onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                                            className="input-neon w-full px-4 py-2.5 rounded-lg" 
                                            placeholder="29.99"
                                            min="0"
                                            step="0.01"
                                        />
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                            Leave empty to use default price ($29.99)
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between pt-2">
                                <button 
                                    type="submit" 
                                    className="btn-neon-purple py-2.5 px-6 rounded-lg font-medium"
                                >
                                    {isEditing ? '✓ Update' : '+ Create'}
                                </button>
                                {isEditing && (
                                    <button 
                                        type="button" 
                                        onClick={resetForm} 
                                        className="bg-[var(--background-tertiary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground-muted)] py-2.5 px-6 rounded-lg transition-colors"
                                    >
                                        Cancel
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
