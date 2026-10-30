---
name: projects-yalo-pos
description: Contexto técnico y relación entre YALO-FE-POS y YALO-API-POS
metadata:
  type: project
---

# YALO POS: frontend y API

| Alias | Repositorio local | Stack |
|---|---|---|
| `yalo fe pos` | `C:\Users\naide\OneDrive\Documentos\Proyectos\YALO\YALO-FE-POS` | Angular 15, Ionic 6, Capacitor 4, TypeScript |
| `yalo api pos` | `C:\Users\naide\OneDrive\Documentos\Proyectos\YALO\YALO-API-POS` | ASP.NET Core .NET 8, EF Core, PostgreSQL |

Workspace conjunto: `yalo pos app`. Estos repos son distintos de `YaloCobroApiNew` (`yalo pos api`) y `YALO-APP-CAP` (`yalo pos fe`), que ya tienen aliases propios.

## Frontend (`YALO-FE-POS`)

- Aplicación POS web y móvil con Angular/Ionic/Capacitor. La configuración y dependencias están en `package.json` y `angular.json`.
- Entrada y rutas en `src/app/app.module.ts` y `src/app/app-routing.module.ts`; funcionalidades en `src/app/pages/`, lógica compartida en `src/app/core/`, clientes HTTP en `src/api/` y persistencia local en `src/database/`.
- Usa Dexie/IndexedDB para datos locales y sincronización. Revisar el flujo online/offline antes de cambiar pedidos, caja o catálogos. Hay análisis en `docs/README-ANALISIS-SYNC.md`.
- Áreas visibles en `src/app/pages/`: `quickservice`, carrito, pagos, historial, clientes, cajas, cierre de caja, tareas de apertura, mapa de mesas, cotizaciones, administración y configuración.
- Servicios HTTP agrupados por dominio en `src/api/` (pedidos, facturas, productos, pagos, clientes, caja y otros); tablas y controladores Dexie en `src/database/db.ts` y `src/database/controllers/`. Conectividad en `src/app/core/network/`.
- Los guards de rutas incluyen autenticación, permisos, empleado, caja y tareas de apertura. La ruta principal redirige a `quickservice`.
- Comandos de `package.json`: `npm run start`, `npm run build-prod`, `npm run build-qa`, `npm test`.

## API (`YALO-API-POS`)

- Solución `YaloCobroApi.sln`; aplicación en `YaloCobro.Api/`, pruebas en `YaloCobro.Tests/`.
- Arquitectura real: controller HTTP → clase de servicio → `DbContext` EF Core. No imponer Repository Pattern: la guía del proyecto lo indica en `CLAUDE.md`.
- Contextos principales: `YaloCobroEntities` y `YaloAUTHEntities`. Contrato de respuesta: `ApiResponse` / `ApiResponse<T>` en `YaloCobro.Api/Models/ApiResponse.cs`; errores mediante `IErrorLoggerService`.
- Controladores agrupados por funcionalidad en `YaloCobro.Api/Controllers/`: pedidos, productos, clientes, pagos, caja, configuraciones, monitoreo y otras áreas. Autenticación JWT en `Security/`.
- Otras áreas en `Controllers/`: facturas, inventario, sincronización, tareas de caja, mapa/atención de mesas, empleados, impresoras, vouchers, reportes e integraciones. `Services/` contiene servicios compartidos y de integración.
- Configuración y DI en `YaloCobro.Api/Program.cs`. Tiene Swagger, Serilog, AWS SDK y despliegue Docker/Terraform/Azure Pipelines según archivos del repo.
- `Program.cs` configura JWT, autorización, validación/sanitización, middleware global de errores, métricas Prometheus y logging de requests. Swagger se habilita en desarrollo.
- Antes de implementar cambios no triviales, leer `YALO-API-POS/CLAUDE.md`: pide aclarar comportamiento, ubicación y casos borde y preservar comportamiento legacy.

## Trabajo conjunto

1. Identificar el flujo concreto en la pantalla/servicio del frontend y el controller/servicio de la API.
2. Revisar el contrato real de request y response en ambos lados, incluyendo errores y autenticación.
3. Verificar si el frontend debe funcionar offline y cómo sincroniza el cambio.
4. Compilar y probar cada repositorio afectado antes de integrar.

Esta memoria es una guía de navegación. Consultar el código y la documentación actual de cada repositorio para detalles que cambien con el tiempo.
