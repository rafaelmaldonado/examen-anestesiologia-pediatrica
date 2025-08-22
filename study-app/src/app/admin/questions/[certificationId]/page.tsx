'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import type { Certification, Question, AdminOption } from '@/types';
import Link from 'next/link';

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
    const [options, setOptions] = useState<AdminOption[]>([
        { id: 'new1', optionText: '', isCorrect: true, explanation: '' },
        { id: 'new2', optionText: '', isCorrect: false, explanation: '' },
    ]);

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
        setOptions(options.map((opt, i) => ({ ...opt, isCorrect: i === index })));
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
        const body = { certificationId, questionText, questionOptions: options };

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
        setOptions([
            { id: 'new1', optionText: '', isCorrect: true, explanation: '' },
            { id: 'new2', optionText: '', isCorrect: false, explanation: '' },
        ]);
    };

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-8">
            <Link href="/admin/certifications"><span className="text-blue-500 hover:underline">&larr; Back to Certifications</span></Link>
            <h1 className="text-3xl font-bold my-4">Manage Questions for: <span className="text-blue-600">{certification?.name}</span></h1>

            <div className="space-y-4 mb-8">
                {questions.map((q, index) => (
                    <div key={q.id} className="p-4 bg-white rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-lg text-black">{index + 1}. {q.questionText}</p>
                                <ul className="list-disc pl-5 mt-2 text-sm">
                                    {q.options.map(opt => (
                                        <li key={opt.id} className={opt.isCorrect ? 'font-bold text-green-600' : 'text-gray-700'}>{opt.optionText}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-x-2 flex-shrink-0">
                                <button onClick={() => handleEdit(q)} className="bg-yellow-500 text-white py-1 px-3 rounded">Edit</button>
                                <button onClick={() => handleDelete(q.id)} className="bg-red-500 text-white py-1 px-3 rounded">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <hr className="my-12"/>

            <div>
                <h2 className="text-2xl font-semibold mb-4">{isEditing ? 'Edit Question' : 'Add New Question'}</h2>
                <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2 text-black">Question Text</label>
                        <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full px-3 py-2 border rounded text-black" required />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Options</h3>
                    {options.map((opt, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2 p-2 border rounded">
                            <input type="radio" name="correct-option" checked={opt.isCorrect} onChange={() => handleCorrectChange(index)} className="form-radio h-5 w-5 text-blue-600"/>
                            <input type="text" placeholder="Option text" value={opt.optionText} onChange={e => handleOptionChange(index, 'optionText', e.target.value)} className="w-full px-3 py-2 border rounded text-black" required />
                            <input type="text" placeholder="Explanation (optional)" value={opt.explanation || ''} onChange={e => handleOptionChange(index, 'explanation', e.target.value)} className="w-full px-3 py-2 border rounded text-black" />
                            <button type="button" onClick={() => removeOption(index)} className="bg-red-500 text-white py-1 px-2 rounded">&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={addOption} className="text-sm bg-gray-200 py-1 px-3 rounded mt-2">+ Add Option</button>
                    <div className="flex justify-between mt-6">
                        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">{isEditing ? 'Update Question' : 'Create Question'}</button>
                        {isEditing && <button type="button" onClick={resetForm} className="bg-gray-300 text-black py-2 px-4 rounded">Cancel Edit</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}
