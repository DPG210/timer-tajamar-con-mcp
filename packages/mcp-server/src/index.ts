import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { httpClient, setToken } from './client.js';

const server = new McpServer({
  name: 'timer-api-server',
  version: '1.0.0',
});

// ---------------------------------------------------------------------------
// Utilidad: formatear errores de la API
// ---------------------------------------------------------------------------
function formatError(tool: string, error: unknown) {
  let detail = error instanceof Error ? error.message : 'Error desconocido';
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: unknown } }).response;
    if (response) {
      detail = `HTTP ${response.status ?? '?'}: ${JSON.stringify(response.data)}`;
    }
  }
  return {
    content: [{ type: 'text' as const, text: `[Error en ${tool}] ${detail}` }],
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
server.tool(
  'login',
  'Autentica con la API de temporizadores y guarda el token JWT para las llamadas subsiguientes.',
  {
    userName: z.string().min(1).describe('Nombre de usuario'),
    password: z.string().min(1).describe('Contrasena'),
  },
  async ({ userName, password }) => {
    try {
      const { data } = await httpClient.post<unknown>('Auth/Login', { userName, password });
      const parsed = z.object({ response: z.string().min(1) }).parse(data);
      setToken(parsed.response);
      return { content: [{ type: 'text', text: 'Autenticacion correcta. Token guardado.' }] };
    } catch (error) {
      return formatError('login', error);
    }
  }
);

// ---------------------------------------------------------------------------
// SALAS
// ---------------------------------------------------------------------------
server.tool('listar_salas', 'Devuelve la lista completa de salas fisicas.', {}, async () => {
  try {
    const { data } = await httpClient.get<unknown>('api/salas');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return formatError('listar_salas', error);
  }
});

server.tool(
  'crear_sala',
  'Crea una nueva sala fisica en el sistema.',
  { nombreSala: z.string().min(1).describe('Nombre de la nueva sala') },
  async ({ nombreSala }) => {
    try {
      await httpClient.post(`api/salas/createsala/${encodeURIComponent(nombreSala)}`);
      return { content: [{ type: 'text', text: `Sala "${nombreSala}" creada correctamente.` }] };
    } catch (error) {
      return formatError('crear_sala', error);
    }
  }
);

server.tool(
  'actualizar_sala',
  'Cambia el nombre de una sala existente.',
  {
    idSala: z.number().int().min(1).describe('ID de la sala'),
    nombreSala: z.string().min(1).describe('Nuevo nombre'),
  },
  async ({ idSala, nombreSala }) => {
    try {
      await httpClient.put(`api/salas/updatesala/${idSala}/${encodeURIComponent(nombreSala)}`);
      return { content: [{ type: 'text', text: `Sala ${idSala} actualizada.` }] };
    } catch (error) {
      return formatError('actualizar_sala', error);
    }
  }
);

server.tool(
  'eliminar_sala',
  'Elimina una sala y todas sus asignaciones TES dependientes en cascada.',
  { idSala: z.number().int().min(1).describe('ID de la sala a eliminar') },
  async ({ idSala }) => {
    try {
      const { data } = await httpClient.get<unknown>('api/TiempoEmpresaSala');
      const tesList = z.array(z.object({ id: z.number(), idSala: z.number() })).parse(data);
      const ids = tesList.filter((t) => t.idSala === idSala).map((t) => t.id);
      await Promise.all(ids.map((id) => httpClient.delete(`api/TiempoEmpresaSala/${id}`)));
      await httpClient.delete(`api/salas/${idSala}`);
      return {
        content: [{
          type: 'text',
          text: `Sala ${idSala} eliminada. ${ids.length} asignacion(es) TES eliminadas en cascada.`,
        }],
      };
    } catch (error) {
      return formatError('eliminar_sala', error);
    }
  }
);

// ---------------------------------------------------------------------------
// EMPRESAS
// ---------------------------------------------------------------------------
server.tool('listar_empresas', 'Devuelve la lista completa de empresas.', {}, async () => {
  try {
    const { data } = await httpClient.get<unknown>('api/empresas');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return formatError('listar_empresas', error);
  }
});

server.tool(
  'crear_empresa',
  'Registra una nueva empresa en el sistema.',
  { nombreEmpresa: z.string().min(1).describe('Nombre de la empresa') },
  async ({ nombreEmpresa }) => {
    try {
      await httpClient.post(`api/empresas/createempresa/${encodeURIComponent(nombreEmpresa)}`);
      return { content: [{ type: 'text', text: `Empresa "${nombreEmpresa}" creada.` }] };
    } catch (error) {
      return formatError('crear_empresa', error);
    }
  }
);

server.tool(
  'actualizar_empresa',
  'Cambia el nombre de una empresa existente.',
  {
    idEmpresa: z.number().int().min(1).describe('ID de la empresa'),
    nombreEmpresa: z.string().min(1).describe('Nuevo nombre'),
  },
  async ({ idEmpresa, nombreEmpresa }) => {
    try {
      await httpClient.put(`api/empresas/updateempresa/${idEmpresa}/${encodeURIComponent(nombreEmpresa)}`);
      return { content: [{ type: 'text', text: `Empresa ${idEmpresa} actualizada.` }] };
    } catch (error) {
      return formatError('actualizar_empresa', error);
    }
  }
);

server.tool(
  'eliminar_empresa',
  'Elimina una empresa y todas sus asignaciones TES dependientes en cascada.',
  { idEmpresa: z.number().int().min(1).describe('ID de la empresa a eliminar') },
  async ({ idEmpresa }) => {
    try {
      const { data } = await httpClient.get<unknown>('api/TiempoEmpresaSala');
      const tesList = z.array(z.object({ id: z.number(), idEmpresa: z.number() })).parse(data);
      const ids = tesList.filter((t) => t.idEmpresa === idEmpresa).map((t) => t.id);
      await Promise.all(ids.map((id) => httpClient.delete(`api/TiempoEmpresaSala/${id}`)));
      await httpClient.delete(`api/empresas/${idEmpresa}`);
      return {
        content: [{
          type: 'text',
          text: `Empresa ${idEmpresa} eliminada. ${ids.length} asignacion(es) TES eliminadas en cascada.`,
        }],
      };
    } catch (error) {
      return formatError('eliminar_empresa', error);
    }
  }
);

// ---------------------------------------------------------------------------
// CATEGORIAS
// ---------------------------------------------------------------------------
server.tool('listar_categorias', 'Devuelve la lista completa de categorias de temporizador.', {}, async () => {
  try {
    const { data } = await httpClient.get<unknown>('api/categoriastimer');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return formatError('listar_categorias', error);
  }
});

server.tool(
  'crear_categoria',
  'Crea una nueva categoria de temporizador con nombre y duracion en minutos.',
  {
    categoria: z.string().min(1).describe('Nombre de la categoria'),
    duracion: z.number().int().min(1).describe('Duracion en minutos'),
  },
  async ({ categoria, duracion }) => {
    try {
      await httpClient.post('api/categoriastimer', { idCategoria: 0, categoria, duracion });
      return { content: [{ type: 'text', text: `Categoria "${categoria}" creada.` }] };
    } catch (error) {
      return formatError('crear_categoria', error);
    }
  }
);

server.tool(
  'actualizar_categoria',
  'Modifica el nombre y duracion de una categoria existente.',
  {
    idCategoria: z.number().int().min(0).describe('ID de la categoria'),
    categoria: z.string().min(1).describe('Nuevo nombre'),
    duracion: z.number().int().min(1).describe('Nueva duracion en minutos'),
  },
  async ({ idCategoria, categoria, duracion }) => {
    try {
      await httpClient.put('api/categoriastimer', { idCategoria, categoria, duracion });
      return { content: [{ type: 'text', text: `Categoria ${idCategoria} actualizada.` }] };
    } catch (error) {
      return formatError('actualizar_categoria', error);
    }
  }
);

server.tool(
  'eliminar_categoria',
  'Elimina una categoria y en cascada: TES dependientes y temporizadores que la referencian.',
  { idCategoria: z.number().int().min(1).describe('ID de la categoria a eliminar') },
  async ({ idCategoria }) => {
    try {
      const [tesData, timersData] = await Promise.all([
        httpClient.get<unknown>('api/TiempoEmpresaSala'),
        httpClient.get<unknown>('api/timers'),
      ]);
      const tesList = z.array(z.object({ id: z.number(), idTimer: z.number() })).parse(tesData.data);
      const timersList = z.array(z.object({ idTemporizador: z.number(), idCategoria: z.number() })).parse(timersData.data);
      const timerIds = timersList.filter((t) => t.idCategoria === idCategoria).map((t) => t.idTemporizador);
      const tesIds = tesList.filter((t) => timerIds.includes(t.idTimer)).map((t) => t.id);
      await Promise.all(tesIds.map((id) => httpClient.delete(`api/TiempoEmpresaSala/${id}`)));
      await Promise.all(timerIds.map((id) => httpClient.delete(`api/timers/${id}`)));
      await httpClient.delete(`api/categoriastimer/${idCategoria}`);
      return {
        content: [{
          type: 'text',
          text: `Categoria ${idCategoria} eliminada. ${timerIds.length} timer(s) y ${tesIds.length} TES eliminados en cascada.`,
        }],
      };
    } catch (error) {
      return formatError('eliminar_categoria', error);
    }
  }
);

// ---------------------------------------------------------------------------
// TEMPORIZADORES
// ---------------------------------------------------------------------------
server.tool('listar_temporizadores', 'Devuelve la lista completa de temporizadores.', {}, async () => {
  try {
    const { data } = await httpClient.get<unknown>('api/timers');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return formatError('listar_temporizadores', error);
  }
});

server.tool(
  'crear_temporizador',
  'Crea un nuevo temporizador con hora de inicio y categoria.',
  {
    inicio: z.string().describe('Fecha y hora ISO 8601: "YYYY-MM-DDTHH:mm:ss"'),
    idCategoria: z.number().int().min(1).describe('ID de la categoria'),
  },
  async ({ inicio, idCategoria }) => {
    try {
      await httpClient.post('api/timers', { idTemporizador: 0, inicio, idCategoria, pausa: false });
      return { content: [{ type: 'text', text: `Temporizador creado (inicio: ${inicio}, categoria: ${idCategoria}).` }] };
    } catch (error) {
      return formatError('crear_temporizador', error);
    }
  }
);

server.tool(
  'actualizar_temporizador',
  'Actualiza un temporizador existente.',
  {
    idTemporizador: z.number().int().min(1).describe('ID del temporizador'),
    inicio: z.string().describe('Nueva fecha y hora ISO 8601: "YYYY-MM-DDTHH:mm:ss"'),
    idCategoria: z.number().int().min(1).describe('ID de la categoria'),
    pausa: z.boolean().describe('Estado de pausa'),
  },
  async ({ idTemporizador, inicio, idCategoria, pausa }) => {
    try {
      await httpClient.put('api/timers', { idTemporizador, inicio, idCategoria, pausa });
      return { content: [{ type: 'text', text: `Temporizador ${idTemporizador} actualizado.` }] };
    } catch (error) {
      return formatError('actualizar_temporizador', error);
    }
  }
);

server.tool(
  'adelantar_todos_los_temporizadores',
  'Adelanta el horario de TODOS los temporizadores en un numero de minutos.',
  { minutes: z.number().int().min(1).describe('Minutos a adelantar') },
  async ({ minutes }) => {
    try {
      await httpClient.put(`api/timers/increasetimers/${minutes}`);
      return { content: [{ type: 'text', text: `Todos los temporizadores adelantados ${minutes} minuto(s).` }] };
    } catch (error) {
      return formatError('adelantar_todos_los_temporizadores', error);
    }
  }
);

server.tool(
  'eliminar_temporizador',
  'Elimina un temporizador y sus asignaciones TES dependientes en cascada.',
  { idTemporizador: z.number().int().min(1).describe('ID del temporizador a eliminar') },
  async ({ idTemporizador }) => {
    try {
      const { data } = await httpClient.get<unknown>('api/TiempoEmpresaSala');
      const tesList = z.array(z.object({ id: z.number(), idTimer: z.number() })).parse(data);
      const ids = tesList.filter((t) => t.idTimer === idTemporizador).map((t) => t.id);
      await Promise.all(ids.map((id) => httpClient.delete(`api/TiempoEmpresaSala/${id}`)));
      await httpClient.delete(`api/timers/${idTemporizador}`);
      return {
        content: [{
          type: 'text',
          text: `Temporizador ${idTemporizador} eliminado. ${ids.length} asignacion(es) TES eliminadas en cascada.`,
        }],
      };
    } catch (error) {
      return formatError('eliminar_temporizador', error);
    }
  }
);

// ---------------------------------------------------------------------------
// TES (TiempoEmpresaSala)
// ---------------------------------------------------------------------------
server.tool('listar_asignaciones', 'Devuelve todas las asignaciones TES (empresa-sala-timer).', {}, async () => {
  try {
    const { data } = await httpClient.get<unknown>('api/TiempoEmpresaSala');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return formatError('listar_asignaciones', error);
  }
});

server.tool(
  'crear_asignacion',
  'Asigna una empresa a una sala para el slot de un temporizador concreto.',
  {
    idTimer: z.number().int().min(1).describe('ID del temporizador'),
    idEmpresa: z.number().int().min(1).describe('ID de la empresa'),
    idSala: z.number().int().min(1).describe('ID de la sala'),
  },
  async ({ idTimer, idEmpresa, idSala }) => {
    try {
      await httpClient.post('api/TiempoEmpresaSala', { id: 0, idEvento: 1, idTimer, idEmpresa, idSala });
      return {
        content: [{
          type: 'text',
          text: `Asignacion creada: empresa ${idEmpresa} en sala ${idSala} para timer ${idTimer}.`,
        }],
      };
    } catch (error) {
      return formatError('crear_asignacion', error);
    }
  }
);

server.tool(
  'eliminar_asignacion',
  'Elimina una asignacion TES por su ID.',
  { id: z.number().int().min(1).describe('ID de la asignacion TES') },
  async ({ id }) => {
    try {
      await httpClient.delete(`api/TiempoEmpresaSala/${id}`);
      return { content: [{ type: 'text', text: `Asignacion TES ${id} eliminada.` }] };
    } catch (error) {
      return formatError('eliminar_asignacion', error);
    }
  }
);

// ---------------------------------------------------------------------------
// EVENTOS (solo lectura)
// ---------------------------------------------------------------------------
server.tool(
  'listar_empresas_con_timers',
  'Devuelve las empresas que tienen al menos un temporizador asignado.',
  {},
  async () => {
    try {
      const { data } = await httpClient.get<unknown>('api/timereventos/empresastimers');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      return formatError('listar_empresas_con_timers', error);
    }
  }
);

server.tool(
  'obtener_eventos_empresa',
  'Devuelve todos los eventos (slots) asociados a una empresa concreta.',
  { idEmpresa: z.number().int().min(1).describe('ID de la empresa') },
  async ({ idEmpresa }) => {
    try {
      const { data } = await httpClient.get<unknown>(`api/timereventos/eventosempresa/${idEmpresa}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      return formatError('obtener_eventos_empresa', error);
    }
  }
);

server.tool(
  'obtener_eventos_actuales_empresa',
  'Devuelve los eventos actuales y proximos para una empresa.',
  { idEmpresa: z.number().int().min(1).describe('ID de la empresa') },
  async ({ idEmpresa }) => {
    try {
      const { data } = await httpClient.get<unknown>(`api/timereventos/eventosactualesempresa/${idEmpresa}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      return formatError('obtener_eventos_actuales_empresa', error);
    }
  }
);

server.tool(
  'obtener_eventos_sala',
  'Devuelve todos los eventos programados para una sala.',
  { idSala: z.number().int().min(1).describe('ID de la sala') },
  async ({ idSala }) => {
    try {
      const { data } = await httpClient.get<unknown>(`api/timereventos/eventossala/${idSala}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      return formatError('obtener_eventos_sala', error);
    }
  }
);

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[timer-mcp] Servidor MCP iniciado. Escuchando en stdio.');
}

main().catch((err) => {
  console.error('[timer-mcp] Error fatal:', err);
  process.exit(1);
});
