'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define a more specific type for the results data
interface ResultDetails {
    questionId: number;
    questionText: string;
    selectedOptionId: number;
    correctOption: {
        id: number;
        questionId: number;
        optionText: string;
        isCorrect: boolean;
        explanation: string | null;
    };
    isCorrect: boolean;
    allOptions: any[];
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
        const resultsDataString = localStorage.getItem('quizResults');
        if (resultsDataString) {
            setResults(JSON.parse(resultsDataString));
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="text-xl font-semibold">Loading Results...</div></div>;
    }

    if (!results) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <p className="text-xl font-semibold">No results found.</p>
                <Link href="/">
                    <span className="mt-4 text-blue-500 hover:underline">Go back to home</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
            <h1 className="text-4xl font-bold mb-4 text-center">Quiz Results</h1>
            <div className="text-center mb-8 p-6 bg-white rounded-lg shadow-md">
                <p className="text-2xl">Your Final Score:</p>
                <p className={`text-7xl font-bold ${results.score >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.score}%
                </p>
            </div>

            <div className="space-y-6">
                {results.results.map((res, index) => (
                    <div key={res.questionId} className="p-6 rounded-lg border-2 bg-white">
                        <h3 className="font-bold text-xl mb-4">Question {index + 1}: {res.questionText}</h3>

                        <div className="space-y-3">
                            {res.allOptions.map((opt) => {
                                const isSelected = opt.id === res.selectedOptionId;
                                const isCorrect = opt.id === res.correctOption.id;

                                let itemClass = 'p-3 rounded-lg border';
                                if (isCorrect) {
                                    itemClass += ' bg-green-100 border-green-300';
                                } else if (isSelected && !res.isCorrect) {
                                    itemClass += ' bg-red-100 border-red-300';
                                }

                                return (
                                    <div key={opt.id} className={itemClass}>
                                        <p className="font-medium text-black">{opt.optionText}</p>
                                        {isSelected && <span className="text-sm font-bold text-gray-700"> (Your answer)</span>}
                                        {isCorrect && !res.isCorrect && <span className="text-sm font-bold text-green-700"> (Correct answer)</span>}
                                    </div>
                                );
                            })}
                        </div>

                        {!res.isCorrect && res.correctOption.explanation && (
                            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
                                <h4 className="font-bold">Explanation:</h4>
                                <p>{res.correctOption.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="text-center mt-10">
                <Link href="/">
                    <span className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg">
                        Take Another Quiz
                    </span>
                </Link>
            </div>
        </div>
    );
}
