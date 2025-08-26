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
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, isAdobe }),
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
    };

    return (
        <AdminGuard>
            <div className="container mx-auto p-8 max-w-6xl min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-glow-purple mb-2">Manage Certifications</h1>
                    <p className="text-gray-400">Create and manage certification categories</p>
                </div>
                <Link href="/admin" className="btn-neon-orange py-2 px-4 rounded-lg">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-200">Existing Certifications</h2>
                    {loading && (
                        <div className="text-center py-8">
                            <div className="spinner-neon w-8 h-8 mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading...</p>
                        </div>
                    )}
                    {error && (
                        <p className="text-red-400 bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-4">
                            {error}
                        </p>
                    )}
                    <div className="space-y-4">
                        {certifications.map(cert => (
                            <div key={cert.id} className="card-dark p-6 rounded-xl flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="font-bold text-lg text-gray-200">{cert.name}</h3>
                                        {cert.isAdobe && (
                                            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full border border-red-500/30">
                                                Adobe
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">{cert.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center space-x-3 ml-4">
                                    <Link 
                                        href={`/admin/questions/${cert.id}`}
                                        className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg transition-all text-sm"
                                    >
                                        Questions
                                    </Link>
                                    <button 
                                        onClick={() => handleEdit(cert)} 
                                        className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-lg transition-all text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(cert.id)} 
                                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg transition-all text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-6 text-gray-200">
                        {isEditing ? 'Edit Certification' : 'Add New Certification'}
                    </h2>
                    <div className="card-dark p-6 rounded-xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-3 text-gray-300">Name</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="input-neon w-full px-4 py-3 rounded-lg" 
                                    placeholder="Certification name"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-3 text-gray-300">Description</label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    className="input-neon w-full px-4 py-3 rounded-lg h-32 resize-none" 
                                    placeholder="Brief description of the certification"
                                />
                            </div>
                            <div>
                                <label className="flex items-center space-x-3">
                                    <input 
                                        type="checkbox" 
                                        checked={isAdobe} 
                                        onChange={e => setIsAdobe(e.target.checked)} 
                                        className="w-5 h-5 text-purple-500 bg-transparent border-2 border-purple-500/50 rounded focus:ring-purple-500 focus:ring-2"
                                    />
                                    <span className="text-sm text-gray-300">Is this an Adobe Certification?</span>
                                </label>
                            </div>
                            <div className="flex justify-between pt-4">
                                <button 
                                    type="submit" 
                                    className="btn-neon-purple py-3 px-6 rounded-lg"
                                >
                                    {isEditing ? '✓ Update' : '+ Create'}
                                </button>
                                {isEditing && (
                                    <button 
                                        type="button" 
                                        onClick={resetForm} 
                                        className="bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 text-gray-400 hover:text-gray-300 py-3 px-6 rounded-lg transition-all"
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
