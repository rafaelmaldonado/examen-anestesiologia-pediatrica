'use client';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border-2 border-purple-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.3)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-glow-purple mb-2">Adobe Certification</h1>
            <p className="text-gray-300">Access your study materials and take quizzes</p>
          </div>
          
          <div className="text-center text-white">
            Auth component will be loaded here
          </div>
        </div>
      </div>
    </div>
  );
}
