interface LogoProps {
  className?: string;
  /** Tamaño del isotipo en px. */
  size?: number;
}

/**
 * Isotipo de la aplicación: un estetoscopio estilizado dentro de un círculo,
 * usando el color primario del tema. Reemplaza el emoji 🩺 por una marca
 * vectorial coherente con la identidad clínica.
 */
export default function Logo({ className, size = 32 }: LogoProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--primary-lighter)',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 3v5a4 4 0 0 0 8 0V3" />
        <path d="M8.5 16a5 5 0 0 0 10 0v-2" />
        <circle cx="18.5" cy="11" r="2.5" />
      </svg>
    </span>
  );
}
