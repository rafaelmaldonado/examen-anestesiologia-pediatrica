// Horario de exámenes en hora de México (CDMX).
// CDMX es UTC-6 todo el año (sin horario de verano desde 2022), así que usamos
// un offset fijo para convertir entre la hora local de CDMX y epoch (ms UTC).

const CDMX_OFFSET_MINUTES = -6 * 60;

export interface ExamSchedule {
  availableFrom?: number | null;   // epoch ms (UTC). null/undefined = sin apertura programada
  availableUntil?: number | null;  // epoch ms (UTC). null/undefined = sin cierre programado
}

export type AvailabilityStatus = 'open' | 'upcoming' | 'closed';

/** Determina si el examen está disponible en el instante `now` (epoch ms). */
export function getAvailability(s: ExamSchedule, now: number): AvailabilityStatus {
  if (s.availableFrom != null && now < s.availableFrom) return 'upcoming';
  if (s.availableUntil != null && now > s.availableUntil) return 'closed';
  return 'open';
}

/** "2026-06-10T09:00" (hora de CDMX) -> epoch ms. Devuelve null si está vacío/ inválido. */
export function cdmxLocalToEpoch(local: string): number | null {
  if (!local) return null;
  const ms = Date.parse(`${local}:00-06:00`);
  return Number.isNaN(ms) ? null : ms;
}

/** epoch ms -> "2026-06-10T09:00" (hora de CDMX) para un input datetime-local. */
export function epochToCdmxLocal(epoch: number | null | undefined): string {
  if (epoch == null) return '';
  const d = new Date(epoch + CDMX_OFFSET_MINUTES * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** epoch ms -> texto legible en hora de CDMX, p.ej. "10 jun 2026, 09:00". */
export function formatCdmx(epoch: number | null | undefined): string {
  if (epoch == null) return '';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(epoch));
}
