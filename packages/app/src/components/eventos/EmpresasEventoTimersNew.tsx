import { useState } from 'react';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';
import { useEmpresasTimers, useEventosActualesEmpresa, fetchEventosActualesEmpresa } from '../../hooks/useTimerEventos';
import { formatInicio, calcularFin } from '../../utils/time';
import type { Empresa, EventoActual } from '../../types/models';

function EmpresaCard({ empresa, onClick }: { empresa: Empresa; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all w-full"
    >
      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{empresa.nombreEmpresa}</p>
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Ver horario →</p>
    </button>
  );
}

function buildScheduleHtml(eventos: EventoActual[]): string {
  if (eventos.length === 0) {
    return '<p style="color:#6b7280;margin:0">Sin eventos actuales o próximos.</p>';
  }
  const rows = eventos
    .map(
      (ev) => `
      <tr>
        <td style="padding:6px 12px;text-align:left">${ev.sala}</td>
        <td style="padding:6px 12px;text-align:left">${formatInicio(ev.inicioTimer)}</td>
        <td style="padding:6px 12px;text-align:left">${calcularFin(ev.inicioTimer, ev.duracion)}</td>
      </tr>`
    )
    .join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="border-bottom:1px solid #e5e7eb">
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500">Sala</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500">Inicio</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280;font-weight:500">Fin</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function EmpresasEventoTimersNew() {
  const queryClient = useQueryClient();
  const { data: empresas = [], isLoading, isError } = useEmpresasTimers();
  const [activeEmpresaId, setActiveEmpresaId] = useState<number | null>(null);
  const { data: eventos = [], isLoading: loadingEventos } = useEventosActualesEmpresa(activeEmpresaId);

  async function handleEmpresaClick(empresa: Empresa) {
    setActiveEmpresaId(empresa.idEmpresa);

    // Pre-fetch data (uses cache if fresh) BEFORE opening Swal — no "Cargando…" needed.
    const eventosData = await fetchEventosActualesEmpresa(queryClient, empresa.idEmpresa);

    await Swal.fire({
      title: empresa.nombreEmpresa,
      html: buildScheduleHtml(eventosData),
      confirmButtonText: 'Cerrar',
      width: 480,
    });
  }

  if (isLoading) return <div className="p-6 text-gray-500 dark:text-gray-400">Cargando empresas…</div>;
  if (isError) return <div className="p-6 text-red-600">Error al cargar las empresas.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Seguimiento de empresas</h1>

      {empresas.length === 0 && (
        <p className="text-gray-400 text-sm">No hay empresas con timers asignados.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {empresas.map((empresa) => (
          <EmpresaCard
            key={empresa.idEmpresa}
            empresa={empresa}
            onClick={() => void handleEmpresaClick(empresa)}
          />
        ))}
      </div>

      {/* Inline panel — keyboard-accessible fallback, updates reactively */}
      {activeEmpresaId !== null && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            {empresas.find((e) => e.idEmpresa === activeEmpresaId)?.nombreEmpresa} — Horario actual
          </h2>

          {loadingEventos && <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando…</p>}

          {!loadingEventos && eventos.length === 0 && (
            <p className="text-gray-400 text-sm">Sin eventos actuales o próximos.</p>
          )}

          {eventos.length > 0 && (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 font-medium">Sala</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Inicio</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {eventos.map((ev, i) => (
                  <tr key={`${ev.sala}-${ev.inicioTimer}-${i}`}>
                    <td className="py-2 text-gray-700 dark:text-gray-200">{ev.sala}</td>
                    <td className="py-2 text-gray-700 dark:text-gray-200">{formatInicio(ev.inicioTimer)}</td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">{calcularFin(ev.inicioTimer, ev.duracion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
