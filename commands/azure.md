---
description: Asistente para Azure — MSAL Angular (Azure AD auth), Azure Pipelines CI/CD — usado en La Bodega Backoffice, YaloConsole y Ultimate Labs
---

# azure

Asistente para servicios Azure en los proyectos. Principalmente Azure AD con MSAL para autenticación en Angular (La Bodega Backoffice, YaloConsole) y Azure Pipelines para CI/CD (Ultimate Labs).

## Uso

```
/azure msal config                    → configura MSAL en Angular
/azure msal guard                     → protege rutas con MsalGuard
/azure msal interceptor               → agrega tokens automáticamente a las requests
/azure msal login                     → componente de login con Azure AD
/azure msal user                      → obtiene usuario/claims del token
/azure msal silent                    → adquiere token silenciosamente
/azure pipeline <tipo>                → genera pipeline de CI/CD
/azure pipeline deploy                → stage de deploy a cluster Kubernetes
```

## Proyectos que lo usan

| Alias | MSAL Version | Uso |
|---|---|---|
| bodega bo (LaBodegaBackoffice) | msal-angular 4.x | Login con Azure AD |
| yalo console (YaloConsole) | msal-angular 4.x | Login con Azure AD |
| ult bo / ult ecom (Ultimate Labs) | — | Azure Pipelines CI/CD |

---

## MSAL — Autenticación Azure AD en Angular

### `/azure msal config` — Configuración en Angular 15+ (standalone)

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService, MsalGuard, MsalInterceptor, MsalService
} from '@azure/msal-angular';
import {
  PublicClientApplication, InteractionType,
  BrowserCacheLocation, LogLevel
} from '@azure/msal-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from './environments/environment';

// Instancia MSAL
function msalInstanceFactory(): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId:    environment.msalClientId,     // Application (client) ID de Azure Portal
      authority:   `https://login.microsoftonline.com/${environment.msalTenantId}`,
      redirectUri: environment.msalRedirectUri,  // ej: 'http://localhost:4200'
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        logLevel: environment.production ? LogLevel.Error : LogLevel.Warning,
      },
    },
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // MSAL providers
    { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },
    {
      provide: MSAL_GUARD_CONFIG,
      useValue: {
        interactionType: InteractionType.Redirect,
        authRequest: { scopes: ['user.read', 'openid', 'profile'] },
        loginFailedRoute: '/login-failed',
      },
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
          ['https://graph.microsoft.com/v1.0/me', ['user.read']],
          [environment.apiUrl, [environment.msalApiScope]],  // scope de tu API
        ]),
      },
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
  ],
};
```

```typescript
// environment.ts
export const environment = {
  production: false,
  msalClientId:   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  // Azure Portal
  msalTenantId:   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  // Azure Portal
  msalRedirectUri: 'http://localhost:4200',
  msalApiScope:   'api://xxxxxxxx/access_as_user',          // scope de tu API backend
  apiUrl:         'https://api.miapp.com',
};
```

### `/azure msal guard` — Proteger rutas

```typescript
// app.routes.ts
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component'),
    canActivate: [MsalGuard],  // requiere login con Azure AD
  },
  { path: 'login-failed', component: LoginFailedComponent },
];
```

### `/azure msal interceptor`

El `MsalInterceptor` ya configurado en `appConfig` agrega automáticamente el Bearer token a todas las requests hacia las URLs en `protectedResourceMap`. No se necesita código adicional.

```typescript
// El interceptor agrega automáticamente:
// Authorization: Bearer <token_de_azure>
// a todas las requests hacia environment.apiUrl
```

### `/azure msal login` — Componente de login

```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="flex h-screen items-center justify-center bg-gray-50">
      <div class="text-center space-y-6 p-8 bg-white rounded-xl shadow-lg">
        <img src="assets/logo.png" alt="Logo" class="h-16 mx-auto">
        <h1 class="text-2xl font-semibold text-gray-900">Bienvenido</h1>
        <p class="text-gray-500">Inicia sesión con tu cuenta corporativa</p>
        <button mat-raised-button color="primary" (click)="login()" class="w-full">
          <mat-icon>login</mat-icon>
          Iniciar sesión con Microsoft
        </button>
      </div>
    </div>
  `
})
export class LoginComponent {
  private msal = inject(MsalService);

  async login(): Promise<void> {
    await this.msal.instance.handleRedirectPromise();
    this.msal.loginRedirect({
      scopes: ['user.read', 'openid', 'profile'],
    });
  }
}
```

### `/azure msal user` — Obtener usuario del token

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private msal = inject(MsalService);
  private broadcast = inject(MsalBroadcastService);

  // Usuario activo (cuenta seleccionada)
  get currentUser() {
    return this.msal.instance.getActiveAccount();
  }

  // Claims del token
  get userClaims() {
    const account = this.currentUser;
    return {
      name:  account?.name,
      email: account?.username,  // email en Azure AD
      oid:   account?.localAccountId,  // Object ID único del usuario
      roles: (account?.idTokenClaims as any)?.roles ?? [],
    };
  }

  // Observable que emite true cuando el usuario está autenticado
  isAuthenticated$ = this.broadcast.inProgress$.pipe(
    filter(status => status === InteractionStatus.None),
    map(() => this.msal.instance.getAllAccounts().length > 0),
  );

  logout(): void {
    this.msal.logoutRedirect({ postLogoutRedirectUri: '/' });
  }
}
```

### `/azure msal silent` — Token silencioso

```typescript
// Adquirir token sin interacción (renovación automática)
async getAccessToken(scopes: string[]): Promise<string> {
  const account = this.msal.instance.getActiveAccount();
  if (!account) throw new Error('No hay usuario autenticado');

  try {
    const result = await this.msal.instance.acquireTokenSilent({
      scopes,
      account,
    });
    return result.accessToken;
  } catch (error) {
    // Si el token expiró, forzar login interactivo
    if (error instanceof InteractionRequiredAuthError) {
      this.msal.loginRedirect({ scopes });
    }
    throw error;
  }
}
```

### App principal — manejar redirects

```typescript
// app.component.ts — OBLIGATORIO para que MSAL procese el redirect de vuelta
@Component({ selector: 'app-root', template: '<router-outlet />' })
export class AppComponent implements OnInit {
  private msal = inject(MsalService);
  private broadcast = inject(MsalBroadcastService);

  async ngOnInit() {
    await this.msal.instance.initialize();
    await this.msal.instance.handleRedirectPromise();

    // Seleccionar la primera cuenta activa si no hay ninguna
    const accounts = this.msal.instance.getAllAccounts();
    if (accounts.length > 0 && !this.msal.instance.getActiveAccount()) {
      this.msal.instance.setActiveAccount(accounts[0]);
    }
  }
}
```

---

## Azure Pipelines — CI/CD (Ultimate Labs)

### `/azure pipeline <tipo>` — Pipeline básico Angular + .NET

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include: [main, develop]

pool:
  vmImage: 'ubuntu-latest'

variables:
  NODE_VERSION: '20.x'
  DOTNET_VERSION: '8.0.x'

stages:
  - stage: Build
    jobs:
      - job: BuildFrontend
        steps:
          - task: NodeTool@0
            inputs: { versionSpec: '$(NODE_VERSION)' }
          - script: npm ci && npm run build:prod
            displayName: 'Build Angular'
          - publish: dist/
            artifact: frontend

      - job: BuildBackend
        steps:
          - task: UseDotNet@2
            inputs: { version: '$(DOTNET_VERSION)' }
          - script: dotnet publish -c Release -o $(Build.ArtifactStagingDirectory)
            displayName: 'Publish .NET'
          - publish: $(Build.ArtifactStagingDirectory)
            artifact: backend

  - stage: Deploy
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployToAKS
        environment: 'produccion'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  inputs:
                    action: deploy
                    manifests: 'k8s/deployment.yml'
```

### `/azure pipeline deploy` — Deploy a Kubernetes (patrón Ultimate Labs)

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mi-app-deployment
spec:
  replicas: 2
  selector:
    matchLabels: { app: mi-app }
  template:
    metadata:
      labels: { app: mi-app }
    spec:
      containers:
        - name: mi-app
          image: $(ACR_NAME).azurecr.io/mi-app:$(Build.BuildId)
          ports: [{ containerPort: 80 }]
          env:
            - name: DB_CONNECTION
              valueFrom:
                secretKeyRef: { name: mi-app-secrets, key: db-connection }
```
