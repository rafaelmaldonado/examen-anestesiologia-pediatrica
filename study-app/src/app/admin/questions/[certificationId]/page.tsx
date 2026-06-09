'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import type { Certification, Question, AdminOption } from '@/types';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';

export default function QuestionsAdminPage() {
    const params = useParams();
    const certificationId = params.certificationId as string;

    const [certification, setCertification] = useState<Certification | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isEditing, setIsEditing] = useState<Question | null>(null);
    const [questionText, setQuestionText] = useState('');
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    const [options, setOptions] = useState<AdminOption[]>([
        { id: 'new1', optionText: '', isCorrect: true, explanation: '' },
        { id: 'new2', optionText: '', isCorrect: false, explanation: '' },
    ]);

    // State for bulk import
    const [jsonFile, setJsonFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    useEffect(() => {
        if (certificationId) {
            fetchData();
        }
    }, [certificationId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const certRes = await fetch(`/api/certifications`);
            if (!certRes.ok) throw new Error('Failed to fetch certifications');
            const allCerts: Certification[] = await certRes.json();
            setCertification(allCerts.find(c => c.id === certificationId) || null);

            const qRes = await fetch(`/api/questions?certificationId=${certificationId}`);
            if (!qRes.ok) throw new Error('Failed to fetch questions');
            const qData = await qRes.json();
            setQuestions(qData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionChange = (index: number, field: 'optionText' | 'explanation', value: string) => {
        const newOptions = [...options];
        newOptions[index][field] = value;
        setOptions(newOptions);
    };

    const handleCorrectChange = (index: number) => {
        if (isMultiSelect) {
            // For multi-select, toggle the option
            const newOptions = [...options];
            newOptions[index].isCorrect = !newOptions[index].isCorrect;
            setOptions(newOptions);
        } else {
            // For single-select, only one option can be correct
            setOptions(options.map((opt, i) => ({ ...opt, isCorrect: i === index })));
        }
    };

    const addOption = () => setOptions([...options, { id: `new${options.length + 1}`, optionText: '', isCorrect: false, explanation: '' }]);
    const removeOption = (index: number) => {
        if (options.length <= 2) return;
        const newOptions = options.filter((_, i) => i !== index);
        if (!newOptions.some(opt => opt.isCorrect)) {
            newOptions[0].isCorrect = true;
        }
        setOptions(newOptions);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const url = isEditing ? `/api/questions/${isEditing.id}?certificationId=${certificationId}` : `/api/questions`;
        const method = isEditing ? 'PUT' : 'POST';
        const body = { certificationId, questionText, isMultiSelect, questionOptions: options };

        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to save question');
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = (q: Question) => {
        setIsEditing(q);
        setQuestionText(q.questionText);
        setIsMultiSelect(q.isMultiSelect || false);
        setOptions(q.options);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleDelete = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        try {
            const res = await fetch(`/api/questions/${questionId}?certificationId=${certificationId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete question');
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setIsEditing(null);
        setQuestionText('');
        setIsMultiSelect(false);
        setOptions([
            { id: 'new1', optionText: '', isCorrect: true, explanation: '' },
            { id: 'new2', optionText: '', isCorrect: false, explanation: '' },
        ]);
    };

    const handleBulkImport = async () => {
        if (!jsonFile) {
            setImportError("Please select a JSON file to import.");
            return;
        }
        setImporting(true);
        setImportError(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') throw new Error("Could not read file content.");

                const data = JSON.parse(content);
                if (!data.questions || !Array.isArray(data.questions)) {
                    throw new Error("Invalid JSON format: 'questions' array not found.");
                }

                const res = await fetch('/api/questions/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ certificationId, questions: data.questions }),
                });

                if (!res.ok) {
                    throw new Error((await res.json()).error || "Failed to import questions.");
                }

                alert("Import successful!");
                fetchData(); // Refresh the questions list
            } catch (err: any) {
                setImportError(err.message);
            } finally {
                setImporting(false);
                setJsonFile(null);
            }
        };
        reader.onerror = () => {
            setImportError("Failed to read the file.");
            setImporting(false);
        };
        reader.readAsText(jsonFile);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
                    <div className="text-lg font-semibold text-[var(--foreground-muted)]">Loading Questions...</div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="container mx-auto p-8">
                <div className="text-[var(--error)] bg-[var(--error-light)] border border-red-200 p-4 rounded-lg">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <AdminGuard>
            <div className="container mx-auto p-8 max-w-6xl min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link href="/admin/certifications" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors mb-2 inline-block text-sm font-medium">
                        ← Regresar a Examenes
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">
                        Preguntas para: <span className="text-[var(--primary)]">{certification?.name}</span>
                    </h1>
                </div>
            </div>

            <div className="space-y-6 mb-8">
                {questions.map((q, index) => (
                    <div key={q.id} className="card-dark p-5 rounded-xl">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="font-semibold text-[var(--foreground)] mb-3">
                                    {index + 1}. {q.questionText}
                                    {q.isMultiSelect && (
                                        <span className="ml-2 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                            Multi-select
                                        </span>
                                    )}
                                </h3>
                                <div className="space-y-2">
                                    {q.options.map(opt => (
                                        <div 
                                            key={opt.id} 
                                            className={`p-2.5 rounded-lg border ${
                                                opt.isCorrect 
                                                    ? 'border-green-200 bg-[var(--success-light)] text-green-800' 
                                                    : 'border-[var(--border)] bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{opt.optionText}</span>
                                                {opt.isCorrect && (
                                                    <span className="text-green-700 text-xs font-semibold">✓ Correct</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-x-2 flex-shrink-0 ml-4">
                                <button 
                                    onClick={() => handleEdit(q)} 
                                    className="bg-[var(--accent-lighter)] hover:bg-amber-100 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(q.id)} 
                                    className="bg-[var(--error-light)] hover:bg-red-100 border border-red-200 text-[var(--error)] px-3 py-1.5 rounded-lg transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-[var(--border)] my-10"></div>

            <div>
                <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">{isEditing ? 'Editar Pregunta' : 'Agregar Nueva Pregunta'}</h2>
                <form onSubmit={handleSubmit} className="card-dark p-6 rounded-xl">
                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Texto de la Pregunta</label>
                        <textarea 
                            value={questionText} 
                            onChange={e => setQuestionText(e.target.value)} 
                            className="input-neon w-full h-24 resize-none" 
                            placeholder="Pon tu pregunta aquí..."
                            required 
                        />
                    </div>
                    
                    <div className="mb-5">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isMultiSelect}
                                onChange={(e) => setIsMultiSelect(e.target.checked)}
                                className="w-4 h-4 text-[var(--primary)] border-[var(--border-hover)] rounded focus:ring-[var(--primary)] focus:ring-2"
                            />
                            <span className="text-sm font-medium text-[var(--foreground)]">
                                Permitir multiples respuetas correctas (Pregunta multi selección)
                            </span>
                        </label>
                        {isMultiSelect && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 mt-2 inline-block">
                                Los estudiantes deberán seleccionar todas las respuestas correctas para tener bien la pregunta.
                            </p>
                        )}
                    </div>
                    <h3 className="text-base font-semibold mb-4 text-[var(--foreground)]">
                        Opciones {isMultiSelect && <span className="text-sm font-normal text-[var(--foreground-muted)]">(Multiple correct answers allowed)</span>}
                    </h3>
                    {options.map((opt, index) => (
                        <div key={index} className="flex items-center space-x-3 mb-3 p-3 border border-[var(--border)] rounded-lg bg-[var(--background-tertiary)]">
                            <input 
                                type={isMultiSelect ? "checkbox" : "radio"}
                                name={isMultiSelect ? undefined : "correct-option"}
                                checked={opt.isCorrect} 
                                onChange={() => handleCorrectChange(index)} 
                                className="w-4 h-4 text-[var(--success)] border-[var(--border-hover)] focus:ring-[var(--success)] focus:ring-2"
                            />
                            <input 
                                type="text" 
                                placeholder="Texto de la opción" 
                                value={opt.optionText} 
                                onChange={e => handleOptionChange(index, 'optionText', e.target.value)} 
                                className="input-neon flex-1" 
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Explicación (opcional)" 
                                value={opt.explanation || ''} 
                                onChange={e => handleOptionChange(index, 'explanation', e.target.value)} 
                                className="input-neon flex-1" 
                            />
                            <button 
                                type="button" 
                                onClick={() => removeOption(index)} 
                                className="bg-[var(--error-light)] hover:bg-red-100 border border-red-200 text-[var(--error)] py-1.5 px-3 rounded-lg transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={addOption} 
                        className="text-sm bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground-muted)] py-2 px-4 rounded-lg hover:bg-[var(--border)] transition-colors mb-6"
                    >
                        + Agregar opción
                    </button>
                    <div className="flex justify-between mt-5">
                        <button 
                            type="submit" 
                            className="btn-neon-purple py-2.5 px-6 rounded-lg font-medium"
                        >
                            {isEditing ? 'Actualizar Pregunta' : 'Crear Pregunta'}
                        </button>
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={resetForm} 
                                className="bg-[var(--background-tertiary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground-muted)] py-2.5 px-6 rounded-lg transition-colors"
                            >
                                Cancelar Edición
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
        </AdminGuard>
    );
}
