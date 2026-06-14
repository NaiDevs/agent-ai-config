---
description: Asistente para Zustand — crea y mantiene stores con los patrones reales de La Bodega (persist, immer, devtools, slices)
---

# zustand

Asistente para Zustand 4.x. Genera stores siguiendo los patrones reales de los proyectos (La Bodega Ecommerce y La Bodega Mobile): persistencia en localStorage/AsyncStorage, immer para inmutabilidad, devtools, y slices para stores grandes.

## Uso

```
/zustand store <nombre>              → store nuevo desde cero
/zustand store <nombre> --persist    → store con persistencia (localStorage / AsyncStorage)
/zustand store <nombre> --slice      → agrega un slice a un store existente grande
/zustand add-action <store> <acción> → agrega una acción a un store existente
/zustand selector <store>            → genera selectores optimizados con useShallow
/zustand reset <store>               → agrega acción de reset al store
/zustand debug                       → agrega devtools a un store existente
```

## Instrucciones de comportamiento

### Contexto de los proyectos

**La Bodega Ecommerce** (Next.js) — stores en `stores/`:
- `useCartStore` — carrito de compras (con persist)
- `useAuthStore` — usuario autenticado (con persist)
- `useUserStore` — perfil del usuario
- Zustand 4.4.7, `persist` en `localStorage`

**La Bodega Mobile** (React Native / Expo) — stores en `stores/`:
- Zustand 4.5.7, `persist` en `AsyncStorage`
- `immer` para mutaciones complejas en el carrito

### Generadores

#### `/zustand store <nombre>`

Store básico sin persistencia:

```typescript
// stores/<nombre>.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// --- Tipos ---
interface <Nombre>Item {
  id: string;
  // campos del item
}

interface <Nombre>State {
  // Estado
  items: <Nombre>Item[];
  selectedItem: <Nombre>Item | null;
  loading: boolean;
  error: string | null;

  // Acciones
  setItems: (items: <Nombre>Item[]) => void;
  selectItem: (item: <Nombre>Item | null) => void;
  addItem: (item: <Nombre>Item) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Estado inicial extraído para reusar en reset()
const initialState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

// --- Store ---
export const use<Nombre>Store = create<<Nombre>State>()(
  devtools(
    (set) => ({
      ...initialState,

      setItems: (items) => set({ items }, false, '<nombre>/setItems'),
      selectItem: (item) => set({ selectedItem: item }, false, '<nombre>/selectItem'),
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] }), false, '<nombre>/addItem'),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }), false, '<nombre>/removeItem'),
      setLoading: (loading) => set({ loading }, false, '<nombre>/setLoading'),
      setError: (error) => set({ error }, false, '<nombre>/setError'),
      reset: () => set(initialState, false, '<nombre>/reset'),
    }),
    { name: '<Nombre>Store' }
  )
);
```

---

#### `/zustand store <nombre> --persist`

**Web (localStorage):**
```typescript
// stores/<nombre>.store.ts
import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';

interface <Nombre>State {
  // estado + acciones
  items: <Nombre>Item[];
  addItem: (item: <Nombre>Item) => void;
  clear: () => void;
}

export const use<Nombre>Store = create<<Nombre>State>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        addItem: (item) =>
          set((state) => ({ items: [...state.items, item] }), false, '<nombre>/addItem'),
        clear: () => set({ items: [] }, false, '<nombre>/clear'),
      }),
      {
        name: '<nombre>-storage',           // key en localStorage
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({           // solo persistir lo necesario
          items: state.items,
        }),
      }
    ),
    { name: '<Nombre>Store' }
  )
);
```

**Mobile (AsyncStorage) — React Native:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

// en persist:
storage: createJSONStorage(() => AsyncStorage),
```

---

#### `/zustand store <nombre> --slice`

Para stores grandes que agrupan lógica relacionada. Patrón de slice:

```typescript
// stores/slices/<nombre>.slice.ts
import { StateCreator } from 'zustand';
import type { RootState } from '../root.store';  // el store raíz

export interface <Nombre>Slice {
  <nombre>Items: <Nombre>Item[];
  add<Nombre>: (item: <Nombre>Item) => void;
  remove<Nombre>: (id: string) => void;
}

export const create<Nombre>Slice: StateCreator<
  RootState,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  <Nombre>Slice
> = (set) => ({
  <nombre>Items: [],
  add<Nombre>: (item) =>
    set((state) => ({ <nombre>Items: [...state.<nombre>Items, item] }), false, '<nombre>/add'),
  remove<Nombre>: (id) =>
    set((state) => ({ <nombre>Items: state.<nombre>Items.filter(i => i.id !== id) }), false, '<nombre>/remove'),
});

// stores/root.store.ts
export type RootState = <Nombre>Slice & OtroSlice;

export const useRootStore = create<RootState>()(
  devtools(
    persist(
      (...args) => ({
        ...create<Nombre>Slice(...args),
        ...createOtroSlice(...args),
      }),
      { name: 'root-storage' }
    )
  )
);
```

---

#### `/zustand selector <store>`

Genera selectores optimizados para evitar re-renders innecesarios:

```typescript
// Mal: re-renderiza si CUALQUIER cosa del store cambia
const { items, loading } = use<Nombre>Store();

// Bien: re-renderiza solo si items o loading cambian
import { useShallow } from 'zustand/react/shallow';

const { items, loading } = use<Nombre>Store(
  useShallow((state) => ({
    items: state.items,
    loading: state.loading,
  }))
);

// Para un solo valor — sin useShallow (ya es referencia primitiva)
const loading = use<Nombre>Store((state) => state.loading);
const itemCount = use<Nombre>Store((state) => state.items.length);

// Selector derivado (se recalcula solo cuando cambia la dependencia)
const activeItems = use<Nombre>Store(
  (state) => state.items.filter((i) => i.active)
);
```

---

#### `/zustand add-action <store> <acción>`

Agrega una acción nueva al store existente. Leer el store actual, entender el estado, y agregar la acción manteniendo el patrón existente.

Ejemplo — agregar `updateItem` a un store que ya tiene `addItem`:
```typescript
updateItem: (id, changes) =>
  set(
    (state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      ),
    }),
    false,
    '<nombre>/updateItem'
  ),
```

---

#### `/zustand reset <store>`

Agrega reset al store existente. Patrón estándar:
```typescript
// 1. Extraer el estado inicial a una constante fuera del create()
const initialState: Pick<<Nombre>State, 'items' | 'selectedItem' | 'loading'> = {
  items: [],
  selectedItem: null,
  loading: false,
};

// 2. Agregar la acción reset
reset: () => set(initialState, false, '<nombre>/reset'),
```

### Patrones del stack real

**Carrito (La Bodega Ecommerce):**
```typescript
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  // Selectores derivados (usar como funciones, no estado)
  totalItems: () => number;
  totalPrice: () => number;
}
```

**Auth (La Bodega):**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
}
```

### Reglas de uso

- **Devtools siempre** en desarrollo — facilita debugging en Redux DevTools
- **Nombres de acciones** descriptivos: `'cart/addItem'`, no `'set'`
- **`partialize`** en persist para no guardar estado de UI (loading, error, etc.)
- **`useShallow`** cuando se extraen múltiples valores del store
- **Reset** siempre como acción explícita para limpiar en logout o unmount
- **No** hacer fetch HTTP dentro del store — usar React Query y actualizar el store desde los `onSuccess`
