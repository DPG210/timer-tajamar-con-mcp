/**
 * HorarioActualEmpresaPopUp — popup showing the current schedule for a company.
 * Migrated from HorarioActualEmpresaPopUp.js.
 * Uses duracion directly (correct approach, as noted in data-models.md).
 */

import { useEventosActualesEmpresa } from '../../hooks/useTimerEventos';
import { formatInicio, calcularFin } from '../../utils/time';

interface HorarioActualEmpresaPopUpProps {
  idEmpresa: number;
  nombreEmpresa?: string;
  onClose: () => void;
}

export function HorarioActualEmpresaPopUp({
  idEmpresa,
  nombreEmpresa,
  onClose,
}: HorarioActualEmpresaPopUpProps) {
  const { data: eventos = [], isLoading, isError } = useEventosActualesEmpresa(idEmpresa);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Horario de ${nombreEmpresa ?? 'empresa'}`}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {nombreEmpresa ? `Horario: ${nombreEmpresa}` : 'Horario actual'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>

        {isLoading && <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando…</p>}
        {isError && <p className="text-red-600 text-sm">Error al cargar el horario.</p>}

        {!isLoading && !isError && eventos.length === 0 && (
          <p className="text-gray-400 text-sm">No hay eventos activos o próximos.</p>
        )}

        {eventos.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 text-xs text-gray-500 font-medium">Sala</th>
                <th className="text-left py-2 text-xs text-gray-500 font-medium">Inicio</th>
                <th className="text-left py-2 text-xs text-gray-500 font-medium">Fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {eventos.map((evento, i) => (
                <tr key={`${evento.sala}-${evento.inicioTimer}-${i}`}>
                  <td className="py-2 text-gray-700 dark:text-gray-200">{evento.sala}</td>
                  <td className="py-2 text-gray-700 dark:text-gray-200">{formatInicio(evento.inicioTimer)}</td>
                  <td className="py-2 text-gray-500 dark:text-gray-400">{calcularFin(evento.inicioTimer, evento.duracion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
