export interface RevisionMemoria {
  id: string;
  proyectoId: string;
  revisionId: string;
  revisionPadreId: string | null;
  origen: "engram" | "markdown";
  contenido: string;
  eliminada: boolean;
}
export interface CambioAceptado {
  operacion: "insertar" | "actualizar";
  memoria: RevisionMemoria;
}
export interface ConflictoMemoria {
  id: string;
  motivo: "revision-divergente" | "mismo-id-distinto-contenido" | "origen-distinto";
  local: RevisionMemoria;
  remoto: RevisionMemoria;
}
export interface PlanSincronizacion {
  cambios: CambioAceptado[];
  conflictos: ConflictoMemoria[];
  omitidos: number;
}
function mismaRevision(a: RevisionMemoria, b: RevisionMemoria): boolean {
  return a.id === b.id && a.proyectoId === b.proyectoId &&
    a.revisionId === b.revisionId && a.revisionPadreId === b.revisionPadreId &&
    a.origen === b.origen && a.contenido === b.contenido && a.eliminada === b.eliminada;
}
function validar(memoria: RevisionMemoria): void {
  if (!memoria.id.trim() || !memoria.proyectoId.trim() || !memoria.revisionId.trim()) {
    throw new Error("La identidad de la memoria, proyecto y revision es obligatoria.");
  }
  if (memoria.revisionPadreId === memoria.revisionId) {
    throw new Error("Una revision no puede ser su propio padre.");
  }
  if (!memoria.eliminada && !memoria.contenido.trim()) {
    throw new Error("Una memoria activa no puede tener contenido vacio.");
  }
}
/** Planifica sin escribir en Engram; el consumidor persiste cambios y checkpoint atomicamente. */
export function planificarSincronizacion(
  existentes: ReadonlyMap<string, RevisionMemoria>,
  entrantes: readonly RevisionMemoria[],
): PlanSincronizacion {
  const temporal = new Map(existentes);
  const cambios: CambioAceptado[] = [];
  const conflictos: ConflictoMemoria[] = [];
  let omitidos = 0;
  for (const remoto of entrantes) {
    validar(remoto);
    const local = temporal.get(remoto.id);
    if (!local) {
      if (remoto.revisionPadreId !== null) {
        throw new Error(`Revision padre ausente para ${remoto.id}.`);
      }
      temporal.set(remoto.id, remoto);
      cambios.push({ operacion: "insertar", memoria: remoto });
      continue;
    }
    if (local.proyectoId !== remoto.proyectoId || local.origen !== remoto.origen) {
      conflictos.push({ id: remoto.id, motivo: "origen-distinto", local, remoto });
      continue;
    }
    if (local.revisionId === remoto.revisionId) {
      if (mismaRevision(local, remoto)) omitidos++;
      else conflictos.push({ id: remoto.id, motivo: "mismo-id-distinto-contenido", local, remoto });
      continue;
    }
    if (remoto.revisionPadreId === local.revisionId) {
      temporal.set(remoto.id, remoto);
      cambios.push({ operacion: "actualizar", memoria: remoto });
      continue;
    }
    if (local.revisionPadreId === remoto.revisionId) {
      omitidos++;
      continue;
    }
    conflictos.push({ id: remoto.id, motivo: "revision-divergente", local, remoto });
  }
  return { cambios, conflictos, omitidos };
}
