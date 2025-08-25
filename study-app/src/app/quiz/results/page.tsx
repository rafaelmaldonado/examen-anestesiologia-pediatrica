'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeJsonStorage } from '@/lib/storage-helper';

// Define a more specific type for the results data
interface ResultDetails {
    questionId: string;
    questionText: string;
    selectedOptionId: string[]; // Changed to array for multi-select support
    correctOptions: Array<{
        id: string;
        optionText: string;
        isCorrect: boolean;
        explanation?: string | null;
    }>;
    isCorrect: boolean;
    allOptions: any[];
    isMultiSelect?: boolean;
}

interface ResultsData {
    score: number;
    results: ResultDetails[];
}

export default function ResultsPage() {
    const [results, setResults] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        try {
            const resultsData = safeJsonStorage.getItem<ResultsData>('quizResults');
            if (resultsData) {
                setResults(resultsData);
            }
        } catch (error) {
            console.error('Error loading quiz results:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
                    <div className="text-xl font-semibold text-glow-purple">Loading Results...</div>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="text-center card-dark p-8 rounded-2xl">
                    <p className="text-xl font-semibold text-gray-300 mb-4">No results found.</p>
                    <Link href="/">
                        <span className="btn-neon-purple py-2 px-6 rounded-lg inline-block">Go back to home</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-5xl min-h-screen">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4 text-glow-purple">Quiz Results</h1>
                <p className="text-gray-300">Here's how you performed on your certification quiz</p>
            </div>
            
            <div className="text-center mb-8 card-dark p-8 rounded-2xl">
                <p className="text-2xl text-gray-300 mb-4">Your Final Score:</p>
                <p className={`text-7xl font-bold mb-4 ${results.score >= 75 ? 'text-glow-cyan' : 'text-glow-orange'}`}>
                    {results.score}%
                </p>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${results.score >= 75 ? 'bg-gradient-to-r from-green-400 to-cyan-400' : 'bg-gradient-to-r from-orange-400 to-red-400'}`}
                        style={{width: `${results.score}%`}}
                    ></div>
                </div>
                <p className="text-gray-400">
                    {results.score >= 75 ? '🎉 Congratulations! You passed!' : '📚 Keep studying and try again!'}
                </p>
            </div>

            <div className="space-y-6">
                {results.results.map((res, index) => (
                    <div key={res.questionId} className="card-dark p-6 rounded-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-200">
                            Question {index + 1}: {res.questionText}
                            {res.isMultiSelect && (
                                <span className="ml-2 text-sm font-normal text-yellow-400">
                                    (Multi-select)
                                </span>
                            )}
                        </h3>

                        <div className="space-y-3">
                            {res.allOptions.map((opt) => {
                                const isSelected = res.selectedOptionId.includes(opt.id);
                                const isCorrect = res.correctOptions.some(correctOpt => correctOpt.id === opt.id);

                                let itemClass = 'p-4 rounded-lg border-2 transition-all';
                                if (isCorrect) {
                                    itemClass += ' bg-green-500/20 border-green-400 text-green-300';
                                } else if (isSelected && !isCorrect) {
                                    itemClass += ' bg-red-500/20 border-red-400 text-red-300';
                                } else {
                                    itemClass += ' bg-gray-600/20 border-gray-500 text-gray-300';
                                }

                                return (
                                    <div key={opt.id} className={itemClass}>
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">{opt.optionText}</p>
                                            <div className="flex items-center space-x-2">
                                                {isSelected && (
                                                    <span className="text-sm px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                                                        Your Answer
                                                    </span>
                                                )}
                                                {isCorrect && (
                                                    <span className="text-sm px-2 py-1 rounded bg-green-500/20 text-green-300">
                                                        ✓ Correct
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!res.isCorrect && res.correctOptions.length > 0 && res.correctOptions[0].explanation && (
                            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 rounded-lg">
                                <h4 className="font-bold mb-2 text-yellow-200">💡 Explanation:</h4>
                                <p>{res.correctOptions[0].explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="text-center mt-12">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/">
                        <span className="btn-neon-purple font-bold py-3 px-8 rounded-lg text-lg">
                            🏠 Back to Home
                        </span>
                    </Link>
                    <Link href="/history">
                        <span className="btn-neon-orange font-bold py-3 px-8 rounded-lg text-lg">
                            📊 View History
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
