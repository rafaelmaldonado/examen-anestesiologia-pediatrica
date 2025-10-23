'use client';

interface SocialAuthProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

function SocialAuth({ mode, onSuccess }: SocialAuthProps) {
  return (
    <div className="text-center text-white">
      <p>SocialAuth component loaded successfully</p>
      <p>Mode: {mode}</p>
    </div>
  );
}

export default SocialAuth;
