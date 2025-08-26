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
                    <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
                    <div className="text-xl font-semibold text-glow-purple">Loading Questions...</div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="container mx-auto p-8">
                <div className="text-red-400 bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
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
                    <Link href="/admin/certifications" className="text-glow-orange hover:text-glow-cyan transition-all mb-2 inline-block">
                        ← Back to Certifications
                    </Link>
                    <h1 className="text-3xl font-bold text-glow-purple">
                        Questions for: <span className="text-glow-orange">{certification?.name}</span>
                    </h1>
                </div>
            </div>

            <div className="space-y-6 mb-8">
                {questions.map((q, index) => (
                    <div key={q.id} className="card-dark p-6 rounded-xl">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-200 mb-4">
                                    {index + 1}. {q.questionText}
                                    {q.isMultiSelect && (
                                        <span className="ml-2 text-sm font-normal text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                                            Multi-select
                                        </span>
                                    )}
                                </h3>
                                <div className="space-y-2">
                                    {q.options.map(opt => (
                                        <div 
                                            key={opt.id} 
                                            className={`p-3 rounded-lg border-2 ${
                                                opt.isCorrect 
                                                    ? 'border-green-400/50 bg-green-500/10 text-green-300' 
                                                    : 'border-gray-500/30 bg-gray-600/10 text-gray-400'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{opt.optionText}</span>
                                                {opt.isCorrect && (
                                                    <span className="text-green-400 text-sm font-semibold">✓ Correct</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-x-2 flex-shrink-0">
                                <button 
                                    onClick={() => handleEdit(q)} 
                                    className="btn-neon-orange px-4 py-2 rounded-lg hover:scale-105 transition-all"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(q.id)} 
                                    className="bg-red-600/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/30 hover:scale-105 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-600/30 my-12"></div>

            <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-glow-orange">Bulk Import from JSON</h2>
                <div className="card-dark p-6 rounded-xl">
                    <p className="text-sm text-gray-400 mb-4">Upload a JSON file with an array of questions. See README for schema.</p>
                    <input
                        type="file"
                        accept=".json"
                        onChange={(e) => setJsonFile(e.target.files ? e.target.files[0] : null)}
                        className="input-neon w-full mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-500/30 file:transition-all"
                    />
                    <button
                        onClick={handleBulkImport}
                        disabled={!jsonFile || importing}
                        className="btn-neon-purple disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importing ? 'Importing...' : 'Import Questions'}
                    </button>
                    {importError && <p className="text-red-400 text-sm mt-2">{importError}</p>}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4 text-glow-purple">{isEditing ? 'Edit Question' : 'Add New Question'}</h2>
                <form onSubmit={handleSubmit} className="card-dark p-6 rounded-xl">
                    <div className="mb-6">
                        <label className="block text-sm font-bold mb-2 text-gray-300">Question Text</label>
                        <textarea 
                            value={questionText} 
                            onChange={e => setQuestionText(e.target.value)} 
                            className="input-neon w-full h-24 resize-none" 
                            placeholder="Enter your question here..."
                            required 
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isMultiSelect}
                                onChange={(e) => setIsMultiSelect(e.target.checked)}
                                className="w-5 h-5 text-purple-500 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-2"
                            />
                            <span className="text-sm font-bold text-gray-300">
                                Allow multiple correct answers (Multi-select question)
                            </span>
                        </label>
                        {isMultiSelect && (
                            <p className="text-xs text-yellow-400 mt-2">
                                ⚡ Students will need to select ALL correct answers to get this question right.
                            </p>
                        )}
                    </div>
                    <h3 className="text-lg font-semibold mb-4 text-glow-orange">
                        Options {isMultiSelect && <span className="text-sm text-yellow-400">(Multiple correct answers allowed)</span>}
                    </h3>
                    {options.map((opt, index) => (
                        <div key={index} className="flex items-center space-x-3 mb-4 p-4 border border-gray-600/30 rounded-lg bg-gray-700/20">
                            <input 
                                type={isMultiSelect ? "checkbox" : "radio"}
                                name={isMultiSelect ? undefined : "correct-option"}
                                checked={opt.isCorrect} 
                                onChange={() => handleCorrectChange(index)} 
                                className="w-5 h-5 text-green-500 bg-gray-600 border-gray-500 focus:ring-green-500 focus:ring-2"
                            />
                            <input 
                                type="text" 
                                placeholder="Option text" 
                                value={opt.optionText} 
                                onChange={e => handleOptionChange(index, 'optionText', e.target.value)} 
                                className="input-neon flex-1" 
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Explanation (optional)" 
                                value={opt.explanation || ''} 
                                onChange={e => handleOptionChange(index, 'explanation', e.target.value)} 
                                className="input-neon flex-1" 
                            />
                            <button 
                                type="button" 
                                onClick={() => removeOption(index)} 
                                className="bg-red-600/20 border border-red-500/50 text-red-300 py-2 px-3 rounded-lg hover:bg-red-500/30 hover:scale-105 transition-all"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={addOption} 
                        className="text-sm bg-gray-600/30 border border-gray-500/50 text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-500/30 hover:scale-105 transition-all mb-6"
                    >
                        + Add Option
                    </button>
                    <div className="flex justify-between mt-6">
                        <button 
                            type="submit" 
                            className="btn-neon-cyan"
                        >
                            {isEditing ? 'Update Question' : 'Create Question'}
                        </button>
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={resetForm} 
                                className="bg-gray-600/30 border border-gray-500/50 text-gray-300 py-2 px-6 rounded-lg hover:bg-gray-500/30 hover:scale-105 transition-all"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
        </AdminGuard>
    );
}
