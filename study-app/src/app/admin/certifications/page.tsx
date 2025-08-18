'use client';

import { useState, useEffect, FormEvent } from 'react';
import type { Certification } from '@/types';

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

    const handleDelete = async (id: number) => {
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
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Manage Certifications</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold mb-4">Existing Certifications</h2>
                    {loading && <p>Loading...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="space-y-4">
                        {certifications.map(cert => (
                            <div key={cert.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-black">{cert.name}</p>
                                    <p className="text-sm text-gray-600">{cert.description}</p>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => handleEdit(cert)} className="bg-yellow-500 text-white py-1 px-3 rounded">Edit</button>
                                    <button onClick={() => handleDelete(cert.id)} className="bg-red-500 text-white py-1 px-3 rounded">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">{isEditing ? 'Edit Certification' : 'Add New Certification'}</h2>
                    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg shadow">
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2 text-black">Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded text-black" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2 text-black">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded text-black" />
                        </div>
                        <div className="mb-4">
                            <label className="flex items-center">
                                <input type="checkbox" checked={isAdobe} onChange={e => setIsAdobe(e.target.checked)} className="mr-2" />
                                <span className="text-sm text-black">Is this an Adobe Certification?</span>
                            </label>
                        </div>
                        <div className="flex justify-between">
                            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">{isEditing ? 'Update' : 'Create'}</button>
                            {isEditing && <button type="button" onClick={resetForm} className="bg-gray-300 text-black py-2 px-4 rounded">Cancel</button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
