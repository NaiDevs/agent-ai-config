---
description: Generador y asistente para proyectos Next.js — páginas, componentes, API routes, stores Zustand, hooks React Query y más
---

# nextjs

Asistente para el proyecto Next.js 16 (La Bodega Ecommerce). Genera código siguiendo los patrones reales: App Router, Tailwind CSS 4, Zustand, TanStack Query, Formik/Zod, MUI + Radix UI, Framer Motion.

## Uso

```
/nextjs gen page <ruta>              → genera página con App Router
/nextjs gen component <nombre>       → genera componente client o server
/nextjs gen api <ruta>               → genera route handler (API route)
/nextjs gen store <nombre>           → genera store Zustand
/nextjs gen hook <nombre>            → genera custom hook (con React Query si hace fetch)
/nextjs gen form <nombre>            → genera formulario con Formik + Yup/Zod
/nextjs gen layout <nombre>          → genera layout de sección
/nextjs fix                          → detecta errores comunes (hydration, imports, etc.)
/nextjs test <nombre>                → genera test Vitest para un componente o hook
```

## Instrucciones de comportamiento

### Contexto del proyecto

**Proyecto**: `bodega ecommerce` → `C:\Users\naide\OneDrive\Documentos\Proyectos\LA BODEGA\LaBodegaEcommerce`

**Stack activo:**
- Next.js 16.2.1 con **App Router** (`app/`)
- TypeScript 5.3.3
- Tailwind CSS 4.1.18 (nueva sintaxis: `@theme`, sin `tailwind.config.js`)
- Zustand 4.4.7 (estado global)
- TanStack React Query 5.x (server state / fetching)
- Axios 1.15.0 (HTTP client)
- Formik 2.4.5 + Yup 1.3.3 y/o Zod 4.0.8
- MUI 6.x + Headless UI + Radix UI
- Framer Motion 12.x (animaciones)
- Swiper 12.x (carouseles)
- Sonner (toast notifications)
- Vitest 1.2.1 + jsdom (testing)
- ESLint 9.x + Prettier 3.x

### Generadores

#### `/nextjs gen page <ruta>`

Preguntar: ¿Server Component o Client Component? ¿Necesita data fetching?

**Server Component** (default para páginas):
```tsx
// app/<ruta>/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '<Nombre> | La Bodega',
  description: '...',
};

export default async function <Nombre>Page() {
  // fetch directo en server component
  const data = await getData();

  return (
    <main className="container mx-auto px-4 py-8">
      {/* contenido */}
    </main>
  );
}
```

**Client Component** (cuando necesita estado/interactividad):
```tsx
'use client';

import { useState } from 'react';

export default function <Nombre>Page() {
  const [state, setState] = useState('');

  return (
    <div className="...">
      {/* contenido */}
    </div>
  );
}
```

#### `/nextjs gen component <nombre>`

Preguntar: ¿Server o Client? ¿Qué props recibe?

```tsx
// components/<nombre>/<Nombre>.tsx
interface <Nombre>Props {
  // props tipadas
}

export function <Nombre>({ }: <Nombre>Props) {
  return (
    <div className="...">
      {/* contenido */}
    </div>
  );
}
```

- Usar Tailwind para estilos (sin CSS modules, sin styled-components)
- Si necesita animación: usar `motion.div` de Framer Motion
- Si es un card/modal/dropdown: evaluar si usar componente de MUI o Radix UI

#### `/nextjs gen api <ruta>`

```typescript
// app/api/<ruta>/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await getData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // lógica
  return NextResponse.json({ success: true }, { status: 201 });
}
```

#### `/nextjs gen store <nombre>`

```typescript
// stores/<nombre>.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface <Nombre>State {
  // estado
  items: any[];
  // acciones
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const use<Nombre>Store = create<<Nombre>State>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: '<nombre>-storage' }  // persiste en localStorage
  )
);
```

Preguntar si necesita persistencia (localStorage) o no antes de agregar `persist`.

#### `/nextjs gen hook <nombre>`

**Hook con React Query** (para datos del servidor):
```typescript
// hooks/use<Nombre>.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

export function use<Nombre>(id?: number) {
  return useQuery({
    queryKey: ['<nombre>', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/<nombre>${id ? `/${id}` : ''}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreate<Nombre>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Create<Nombre>Dto) => {
      const { data } = await axios.post('/api/<nombre>', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['<nombre>'] });
    },
  });
}
```

**Hook de utilidad** (sin fetching):
```typescript
// hooks/use<Nombre>.ts
export function use<Nombre>() {
  // lógica del hook
  return { /* valores y funciones */ };
}
```

#### `/nextjs gen form <nombre>`

```tsx
'use client';

import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  nombre: Yup.string().required('El nombre es requerido'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
});

interface <Nombre>FormProps {
  onSubmit: (values: typeof initialValues) => void;
  loading?: boolean;
}

const initialValues = {
  nombre: '',
  email: '',
};

export function <Nombre>Form({ onSubmit, loading }: <Nombre>FormProps) {
  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <Field name="nombre" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            <ErrorMessage name="nombre" component="p" className="mt-1 text-sm text-red-600" />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

Si el proyecto usa Zod en lugar de Yup, usar `zodResolver` de `@hookform/resolvers`.

#### `/nextjs fix`

Problemas comunes en Next.js 16:
- **Hydration mismatch**: componente usa `window`/`localStorage` sin `useEffect` o sin `'use client'`
- **Server Component importa componente cliente**: verificar que los imports no crucen el boundary
- **`useRouter` en Server Component**: solo funciona en Client Components
- **Metadata en Client Component**: `export const metadata` solo funciona en Server Components
- **Missing `'use client'`**: cuando usa hooks de React en un componente
- **Tailwind 4 sintaxis nueva**: no usa `tailwind.config.js`, usa `@theme` en CSS

#### `/nextjs test <nombre>`

```typescript
// __tests__/<nombre>.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { <Nombre> } from '@/components/<nombre>';

describe('<Nombre>', () => {
  it('renders correctly', () => {
    render(<<Nombre> />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });
});
```

Para hooks con React Query, usar `renderHook` con `QueryClientProvider` wrapper.

### Estructura del proyecto

```
app/
  (auth)/           → rutas protegidas
  (public)/         → rutas públicas
  api/              → Route Handlers
components/
  ui/               → componentes base reutilizables
  features/         → componentes por feature
hooks/              → custom hooks
stores/             → Zustand stores
lib/
  axios.ts          → instancia de Axios configurada
  utils.ts          → utilidades
types/              → interfaces TypeScript globales
```

### Convenciones del proyecto

- Archivos de componentes: `PascalCase.tsx`
- Hooks: `use<Nombre>.ts` en `camelCase`
- Stores: `use<Nombre>Store.ts`
- API routes: siempre en `app/api/`
- Imports con `@/` (path alias configurado)
- Toast con `sonner`: `import { toast } from 'sonner'`
- Iconos: `@mui/icons-material` o Heroicons
