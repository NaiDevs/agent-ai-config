---
description: Asistente para Tailwind CSS — layouts, componentes, responsive, tema personalizado — compatible con Tailwind 2, 3 y 4 según el proyecto activo
---

# tailwind

Asistente para Tailwind CSS. Detecta la versión del proyecto activo (Tailwind 2/3 vs Tailwind 4 que tiene sintaxis diferente) y genera clases, componentes y configuración correcta.

## Uso

```
/tailwind layout <tipo>           → genera layout (grid, flex, sidebar, dashboard)
/tailwind card <nombre>           → genera card component con variantes
/tailwind nav <tipo>              → genera navbar (top / sidebar / mobile)
/tailwind modal <nombre>          → genera modal/overlay sin dependencias
/tailwind badge <nombre>          → genera badge/chip con colores semánticos
/tailwind table <nombre>          → genera tabla HTML con clases Tailwind
/tailwind form <nombre>           → genera campos de formulario con Tailwind puro
/tailwind responsive <componente> → agrega breakpoints a un componente existente
/tailwind dark <componente>       → agrega soporte dark mode a un componente
/tailwind theme                   → configura o actualiza el tema del proyecto
/tailwind animate <tipo>          → agrega animaciones (fade, slide, pulse, etc.)
```

## Instrucciones de comportamiento

### Paso 1 — Detectar versión de Tailwind

Leer `package.json` del proyecto activo:

| Proyecto | Tailwind | Sintaxis |
|---|---|---|
| bodega ecommerce (Next.js) | v4.x | Sin `tailwind.config.js`, usa `@theme` en CSS |
| nai inhands bo (Angular 21) | v4.x | Sin config, CSS-first |
| bodega bo (Angular 20) | v3.x | `tailwind.config.js` + `content` paths |
| yalo console (Angular 19) | v3.x | `tailwind.config.js` |
| yalo agendo (Angular 21) | v4.x | Sin config |
| doctor fe (Angular 13) | v2.x | `tailwind.config.js` con plugins legacy |

### Diferencias clave Tailwind 3 vs 4

| Feature | Tailwind 3 | Tailwind 4 |
|---|---|---|
| Config | `tailwind.config.js` | No existe — todo en CSS |
| Tema | `theme.extend` en config | `@theme` block en `globals.css` |
| Colores custom | `theme.extend.colors` | `--color-*` CSS variables |
| Dark mode | `darkMode: 'class'` en config | `@variant dark` en CSS |
| Plugins | `plugins: []` en config | `@plugin` en CSS |
| Fuentes custom | `fontFamily` en config | `--font-*` variables |

### Generadores

#### `/tailwind layout <tipo>`

**Dashboard con sidebar:**
```html
<div class="flex h-screen bg-gray-50">
  <!-- Sidebar -->
  <aside class="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
    <div class="h-16 flex items-center px-6 border-b border-gray-200">
      <span class="text-lg font-semibold text-gray-900">Logo</span>
    </div>
    <nav class="flex-1 overflow-y-auto py-4 px-3">
      <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700
                         hover:bg-gray-100 hover:text-gray-900 transition-colors">
        <!-- item de menú -->
      </a>
    </nav>
  </aside>

  <!-- Contenido principal -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Header -->
    <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
    </header>
    <!-- Página -->
    <main class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <!-- contenido -->
      </div>
    </main>
  </div>
</div>
```

**Grid de cards responsive:**
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <!-- cards -->
</div>
```

---

#### `/tailwind card <nombre>`

```html
<!-- Card base -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
            hover:shadow-md transition-shadow duration-200">
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold text-gray-900">Título</h3>
      <span class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
        Activo
      </span>
    </div>
    <p class="text-sm text-gray-500">Descripción del contenido</p>
  </div>
  <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
    <button class="text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</button>
    <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700">Ver más</button>
  </div>
</div>
```

---

#### `/tailwind badge <nombre>`

Colores semánticos listos para usar:
```html
<!-- Verde — éxito / activo -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
             bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">Activo</span>

<!-- Rojo — error / inactivo -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
             bg-red-50 text-red-700 ring-1 ring-red-600/20">Inactivo</span>

<!-- Amarillo — advertencia / pendiente -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
             bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20">Pendiente</span>

<!-- Azul — info -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
             bg-blue-50 text-blue-700 ring-1 ring-blue-600/20">Info</span>

<!-- Gris — neutral -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
             bg-gray-100 text-gray-600 ring-1 ring-gray-500/20">Draft</span>
```

---

#### `/tailwind table <nombre>`

```html
<div class="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Nombre
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Estado
        </th>
        <th scope="col" class="relative px-6 py-3"><span class="sr-only">Acciones</span></th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-100">
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          Nombre
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <!-- badge de estado aquí -->
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="text-indigo-600 hover:text-indigo-900">Editar</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

#### `/tailwind form <nombre>`

```html
<form class="space-y-5">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Nombre <span class="text-red-500">*</span>
    </label>
    <input type="text"
           class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  placeholder-gray-400 shadow-sm
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none
                  disabled:bg-gray-50 disabled:text-gray-500">
    <!-- Error -->
    <p class="mt-1 text-sm text-red-600 flex items-center gap-1">
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      El nombre es requerido
    </p>
  </div>

  <button type="submit"
          class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
                 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
    Guardar
  </button>
</form>
```

---

#### `/tailwind theme`

**Tailwind 3** — agregar a `tailwind.config.js`:
```javascript
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
}
```

**Tailwind 4** — agregar en `globals.css` o `styles.css`:
```css
@import "tailwindcss";

@theme {
  --color-primary-50:  #eef2ff;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;

  --font-sans: 'Inter', system-ui, sans-serif;

  --radius-xl:  0.75rem;
  --radius-2xl: 1rem;
}
```

---

#### `/tailwind animate <tipo>`

**Fade in:**
```html
<!-- Tailwind 3 — con clase animate-* custom en config -->
<div class="animate-fade-in">contenido</div>

<!-- Alternativa sin config extra: -->
<div class="transition-opacity duration-300 opacity-0"
     [class.opacity-100]="visible">contenido</div>
```

**Skeleton loader:**
```html
<div class="animate-pulse space-y-3">
  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
  <div class="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

**Spinner:**
```html
<div class="h-8 w-8 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin"></div>
```

### Breakpoints de referencia

| Prefijo | Min-width | Uso típico |
|---|---|---|
| (sin prefijo) | 0px | Mobile first |
| `sm:` | 640px | Tablet pequeño |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop grande |
| `2xl:` | 1536px | Pantalla ancha |

### Convenciones en los proyectos

- Siempre **mobile-first**: base sin prefijo, luego `sm:`, `md:`, `lg:`
- Espaciado: usar escala de Tailwind (`p-4` = 1rem, `p-6` = 1.5rem, `gap-4`)
- **No** usar valores arbitrarios como `w-[324px]` salvo que sea inevitable
- Colores: preferir semánticos (`text-gray-900`, `bg-white`) sobre colores directos
- Combinar con Angular Material: Tailwind para layout/espaciado, Material para componentes interactivos
