---
description: Asistente para Supabase — storage, auth, realtime, queries — usado en La Bodega y YALO Admin con @supabase/supabase-js 2.x
---

# supabase

Asistente para Supabase en proyectos NestJS y Node.js. Cubre storage de archivos, autenticación, realtime y queries directas con el cliente de Supabase.

## Uso

```
/supabase storage upload <bucket>     → sube archivo a Supabase Storage
/supabase storage url <bucket>        → genera URL pública o firmada
/supabase storage delete              → elimina archivo
/supabase auth user                   → obtiene usuario actual o verifica token
/supabase query <tabla>               → query con filtros al DB de Supabase
/supabase realtime <tabla>            → suscripción a cambios en tiempo real
/supabase config                      → genera configuración del cliente
/supabase rpc <funcion>               → llama función PostgreSQL via RPC
```

## Proyectos que lo usan

| Alias | Uso principal |
|---|---|
| bodega bo api (LaBodegaBOAPI) | Storage de imágenes de productos |
| yalo admin api (YALO_API_Administrator) | Storage + Auth |

---

## Configuración

### Cliente en NestJS (Singleton via módulo)

```typescript
// supabase/supabase.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient =>
        createClient(
          config.getOrThrow('SUPABASE_URL'),
          config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'), // service role para backend
        ),
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
```

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # desde Settings > API > service_role
SUPABASE_ANON_KEY=eyJ...          # para frontend (si aplica)
```

### Inyectar en un servicio

```typescript
@Injectable()
export class ArchivosService {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}
}
```

---

## Storage

### `/supabase storage upload <bucket>`

```typescript
async uploadFile(
  bucket: string,
  filePath: string,
  file: Buffer | Blob,
  contentType: string,
): Promise<string> {
  const { data, error } = await this.supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType,
      upsert: true,  // sobreescribir si existe
    });

  if (error) throw new BadRequestException(`Error subiendo archivo: ${error.message}`);

  return data.path;
}

// Uso con multer (recibir archivo en el controller)
async uploadProductImage(
  productId: number,
  file: Express.Multer.File,
): Promise<string> {
  const extension = file.originalname.split('.').pop();
  const filePath = `productos/${productId}/${Date.now()}.${extension}`;

  return this.uploadFile('imagenes', filePath, file.buffer, file.mimetype);
}
```

### `/supabase storage url <bucket>`

```typescript
// URL pública (bucket debe ser público)
getPublicUrl(bucket: string, filePath: string): string {
  const { data } = this.supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

// URL firmada (bucket privado, expira en N segundos)
async getSignedUrl(
  bucket: string,
  filePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await this.supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw new BadRequestException(error.message);
  return data.signedUrl;
}
```

### `/supabase storage delete`

```typescript
async deleteFile(bucket: string, filePaths: string[]): Promise<void> {
  const { error } = await this.supabase.storage
    .from(bucket)
    .remove(filePaths);

  if (error) throw new BadRequestException(`Error eliminando archivo: ${error.message}`);
}
```

---

## Queries directas

### `/supabase query <tabla>`

```typescript
// SELECT con filtros
async findProductos(filters: { categoria?: string; activo?: boolean }) {
  let query = this.supabase
    .from('productos')
    .select('id, nombre, precio, imagen_url, categoria(id, nombre)')
    .order('created_at', { ascending: false });

  if (filters.categoria) {
    query = query.eq('categoria_id', filters.categoria);
  }
  if (filters.activo !== undefined) {
    query = query.eq('activo', filters.activo);
  }

  const { data, error } = await query;
  if (error) throw new BadRequestException(error.message);
  return data;
}

// INSERT
async createRegistro(payload: Record<string, any>) {
  const { data, error } = await this.supabase
    .from('mi_tabla')
    .insert(payload)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  return data;
}

// UPDATE
async updateRegistro(id: number, payload: Record<string, any>) {
  const { data, error } = await this.supabase
    .from('mi_tabla')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  return data;
}

// UPSERT
const { data, error } = await this.supabase
  .from('mi_tabla')
  .upsert({ id: 1, nombre: 'valor' }, { onConflict: 'id' });
```

### `/supabase rpc <funcion>`

```typescript
// Llamar función PostgreSQL
const { data, error } = await this.supabase
  .rpc('nombre_funcion', {
    param1: valor1,
    param2: valor2,
  });
```

---

## Realtime

### `/supabase realtime <tabla>`

```typescript
// Suscribirse a cambios en una tabla
const channel = this.supabase
  .channel('cambios-pedidos')
  .on(
    'postgres_changes',
    {
      event: '*',          // INSERT | UPDATE | DELETE | *
      schema: 'public',
      table: 'pedidos',
      filter: 'estado=eq.pendiente',  // opcional
    },
    (payload) => {
      console.log('Cambio detectado:', payload);
      // payload.new → nuevo registro
      // payload.old → registro anterior
      // payload.eventType → INSERT | UPDATE | DELETE
    },
  )
  .subscribe();

// Desuscribirse
await this.supabase.removeChannel(channel);
```

---

## Manejo de errores Supabase

```typescript
// Helper para manejar errores consistentemente
private handleSupabaseError(error: any, mensaje: string): never {
  if (error.code === '23505') throw new ConflictException('Registro duplicado');
  if (error.code === '23503') throw new BadRequestException('Referencia inválida');
  if (error.message?.includes('row-level security'))
    throw new ForbiddenException('Sin permisos para esta operación');
  throw new BadRequestException(`${mensaje}: ${error.message}`);
}
```
