---
name: tauri
description: Use this skill for Tauri 2 desktop apps — Rust commands, JS↔Rust bridge (invoke/listen), SQLite offline, keychain/secure storage, auto-updater, build/release pipeline. Proyectos: yalo-trackeo-desktop.
---

# tauri

Asistente para apps desktop con **Tauri 2**. Cubre el stack completo de `yalo-trackeo-desktop`: Rust commands, bridge TS↔Rust, SQLite offline, keychain, auto-updater silencioso, y pipeline de release con GitHub Actions.

## Uso

```
/tauri cmd <nombre>        → genera comando Rust + wrapper TypeScript invoke()
/tauri sql <nombre>        → genera helper SQLite offline (tauri-plugin-sql)
/tauri store <nombre>      → genera store Zustand + sync SQLite
/tauri keychain <op>       → get/set/delete credencial con tauri-plugin-keychain
/tauri updater             → implementa auto-updater silencioso (banner no-bloqueante)
/tauri release             → checklist y script de release (publish-release.mjs)
/tauri window <nombre>     → crea ventana nueva (config + handler Rust)
/tauri tray                → agrega system tray con menú
/tauri fix                 → diagnostica errores comunes (permisos, bridge, IPC)
```

## Instrucciones de comportamiento

### Paso 1 — Verificar stack del proyecto

Leer `src-tauri/tauri.conf.json` para confirmar versión y plugins habilitados.
Stack base de yalo-trackeo-desktop:
- Tauri 2.x (`@tauri-apps/api` 2.x)
- React + TypeScript (frontend)
- `tauri-plugin-sql` (SQLite offline)
- `tauri-plugin-keychain` (credenciales seguras)
- `tauri-plugin-updater` (auto-update)
- `tauri-plugin-notification` (notificaciones nativas)
- Supabase (sync online cuando hay conexión)

---

## Generadores

### `/tauri cmd <nombre>` — Comando Rust + bridge TypeScript

**Rust** — en `src-tauri/src/commands/<nombre>.rs`:
```rust
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct <Nombre>Result {
    pub success: bool,
    pub data: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn <nombre>_command(
    payload: String,
    // state: State<'_, AppState>,  // si necesitás acceso a state global
) -> Result<<Nombre>Result, String> {
    // lógica aquí
    Ok(<Nombre>Result {
        success: true,
        data: Some(payload),
        error: None,
    })
}
```

Registrar en `src-tauri/src/main.rs` o `lib.rs`:
```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        <nombre>_command,
        // otros comandos
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

**TypeScript** — wrapper en `src/lib/ipc.ts`:
```typescript
import { invoke } from '@tauri-apps/api/core';

export interface <Nombre>Result {
  success: boolean;
  data?: string;
  error?: string;
}

export async function <nombre>Command(payload: string): Promise<<Nombre>Result> {
  return invoke('<nombre>_command', { payload });
}
```

**Eventos bidireccionales** (Rust → TS):
```rust
// En Rust — emitir evento
app.emit("<nombre>-update", payload).unwrap();
```
```typescript
// En TS — escuchar evento
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<<Nombre>Result>('<nombre>-update', (event) => {
  console.log(event.payload);
});
// cleanup: unlisten();
```

---

### `/tauri sql <nombre>` — SQLite offline

Verificar `tauri.conf.json` tiene `tauri-plugin-sql` en plugins y permisos.

**Inicialización** en `src/lib/db.ts`:
```typescript
import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:yalo-trackeo.db');
  }
  return db;
}

export async function initSchema(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS <nombre>s (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campo TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0
    )
  `);
}
```

**Operaciones comunes**:
```typescript
// INSERT
await db.execute(
  'INSERT INTO <nombre>s (campo) VALUES (?)',
  [valor]
);

// SELECT con tipado
const rows = await db.select<{ id: number; campo: string }[]>(
  'SELECT * FROM <nombre>s WHERE synced = 0'
);

// UPDATE
await db.execute(
  'UPDATE <nombre>s SET synced = 1 WHERE id = ?',
  [id]
);

// Transacción
await db.execute('BEGIN');
try {
  await db.execute('INSERT INTO ...');
  await db.execute('UPDATE ...');
  await db.execute('COMMIT');
} catch {
  await db.execute('ROLLBACK');
}
```

**Patrón offline-first con sync**:
```typescript
export async function syncPendientes(): Promise<void> {
  const db = await getDb();
  const pendientes = await db.select<PendienteRow[]>(
    'SELECT * FROM <nombre>s WHERE synced = 0'
  );

  for (const row of pendientes) {
    try {
      await supabase.from('<tabla>').upsert({ ...row });
      await db.execute('UPDATE <nombre>s SET synced = 1 WHERE id = ?', [row.id]);
    } catch {
      // queda en cola para el próximo sync
    }
  }
}
```

---

### `/tauri keychain <op>` — Credenciales seguras

Usa `tauri-plugin-keychain` (Windows Credential Manager / macOS Keychain / Linux libsecret).

```typescript
import { getPassword, setPassword, deletePassword } from '@tauri-apps/plugin-keychain';

const SERVICE = 'yalo-trackeo';

// Guardar token
await setPassword(SERVICE, 'auth-token', token);

// Recuperar token
const token = await getPassword(SERVICE, 'auth-token');

// Eliminar (logout)
await deletePassword(SERVICE, 'auth-token');
```

**Helper recomendado** en `src/lib/auth-store.ts`:
```typescript
export const AuthStore = {
  async saveToken(token: string): Promise<void> {
    await setPassword(SERVICE, 'auth-token', token);
  },
  async getToken(): Promise<string | null> {
    try {
      return await getPassword(SERVICE, 'auth-token');
    } catch {
      return null;
    }
  },
  async clear(): Promise<void> {
    try { await deletePassword(SERVICE, 'auth-token'); } catch {}
  },
};
```

---

### `/tauri updater` — Auto-updater silencioso

El updater usa `updater.json` en Supabase y verifica al arrancar sin bloquear.

**`src-tauri/tauri.conf.json`** — agregar plugin:
```json
{
  "plugins": {
    "updater": {
      "pubkey": "<TAURI_SIGNING_PUBLIC_KEY>",
      "endpoints": ["https://<proyecto>.supabase.co/storage/v1/object/public/desktop-releases/updater.json"]
    }
  }
}
```

**`src/components/UpdateBanner.tsx`** — banner no-bloqueante:
```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useState, useEffect } from 'react';

export function UpdateBanner() {
  const [update, setUpdate] = useState<Awaited<ReturnType<typeof check>> | null>(null);

  useEffect(() => {
    check().then(setUpdate).catch(() => {}); // silencioso si falla
  }, []);

  if (!update?.available) return null;

  return (
    <div className="bg-indigo-600 text-white px-4 py-2 flex items-center gap-3 text-sm">
      <span>Nueva versión disponible: v{update.version}</span>
      <button
        onClick={() => update.downloadAndInstall().then(relaunch)}
        className="bg-white text-indigo-600 px-3 py-1 rounded font-medium"
      >
        Actualizar
      </button>
    </div>
  );
}
```

Montar en `App.tsx` sobre el contenido principal:
```tsx
<UpdateBanner />
<RouterProvider router={router} />
```

**`updater.json`** — formato esperado por Tauri:
```json
{
  "version": "1.2.0",
  "notes": "Fix en sincronización offline",
  "pub_date": "2026-09-05T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "<contenido del .sig>",
      "url": "https://<supabase>/yalo-trackeo_1.2.0_x64-setup.nsis.zip"
    },
    "darwin-aarch64": {
      "signature": "<contenido del .sig>",
      "url": "https://<supabase>/yalo-trackeo_1.2.0_aarch64.app.tar.gz"
    }
  }
}
```

---

### `/tauri release` — Pipeline de release

**Generar keypair** (solo una vez):
```bash
npm run tauri signer generate -- -w .tauri/tauri-signing-key.key
# → genera .key (privada) y .key.pub (pública)
# Guardar privada en GitHub Secret: TAURI_SIGNING_PRIVATE_KEY
# Poner pública en tauri.conf.json plugins.updater.pubkey
```

**Artefactos que genera Tauri build**:
```
src-tauri/target/release/bundle/
  nsis/yalo-trackeo_x.x.x_x64-setup.exe         ← instalador Windows
  nsis/yalo-trackeo_x.x.x_x64-setup.nsis.zip    ← para updater
  nsis/yalo-trackeo_x.x.x_x64-setup.nsis.zip.sig ← firma
  macos/yalo-trackeo.app.tar.gz                  ← para updater macOS
  macos/yalo-trackeo.app.tar.gz.sig              ← firma
```

**GitHub Actions** — `.github/workflows/release.yml`:
```yaml
name: Release Desktop

on:
  push:
    tags: ['v*']

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run tauri build
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with:
          name: windows-build
          path: src-tauri/target/release/bundle/nsis/*.{exe,zip,sig}

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with: { targets: aarch64-apple-darwin }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run tauri build -- --target aarch64-apple-darwin
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with:
          name: macos-build
          path: src-tauri/target/aarch64-apple-darwin/release/bundle/macos/*.{tar.gz,sig}

  publish:
    needs: [build-windows, build-macos]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: node publish-release.mjs
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          RELEASE_VERSION: ${{ github.ref_name }}
```

---

### `/tauri fix` — Diagnóstico errores comunes

| Error | Causa | Fix |
|---|---|---|
| `command not found: <cmd>` | No registrado en `invoke_handler![]` | Agregar al handler en main.rs/lib.rs |
| `IPC call failed: permission denied` | Plugin no declarado en `capabilities/` | Agregar permiso en `default.json` |
| `Plugin tauri-plugin-sql not initialized` | Falta init en builder | `.plugin(tauri_plugin_sql::Builder::new().build())` |
| `Failed to get password` en Linux | libsecret no instalado | `apt install libsecret-1-dev` |
| Build falla en CI por firma | Secret vacío o mal formateado | El key va **sin** newlines al final; usar `cat key \| tr -d '\n'` |
| `updater.json` signature inválida | Keypair no coincide | Regenerar con misma key que firmó el build |

---

### Permisos `src-tauri/capabilities/default.json`

```json
{
  "identifier": "default",
  "description": "permisos default",
  "platforms": ["linux", "macos", "windows"],
  "permissions": [
    "core:default",
    "sql:default",
    "keychain:default",
    "updater:default",
    "notification:default",
    "process:allow-relaunch"
  ]
}
```
