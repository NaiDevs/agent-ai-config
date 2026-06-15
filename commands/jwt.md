---
description: Asistente para JWT Auth — configuración, guards, interceptors, refresh tokens — para NestJS (passport-jwt) y .NET (JwtBearer), más API Key auth
---

# jwt

Asistente para autenticación JWT en los proyectos. Cubre NestJS con `passport-jwt` (La Bodega, NAI) y .NET con `Microsoft.AspNetCore.Authentication.JwtBearer` (YALO APIs), además de API Key auth y refresh tokens.

## Uso

```
/jwt config nestjs                    → configura JWT en NestJS con passport
/jwt config dotnet                    → configura JWT en .NET ASP.NET Core
/jwt guard nestjs                     → genera guards JWT y API Key para NestJS
/jwt guard dotnet                     → genera middleware/attribute de auth en .NET
/jwt interceptor angular              → interceptor HTTP para Angular (agrega token)
/jwt refresh nestjs                   → implementa refresh token flow en NestJS
/jwt refresh dotnet                   → implementa refresh token en .NET
/jwt decode                           → decodifica y verifica un token
/jwt apikey                           → implementa API Key authentication
/jwt currentuser                      → decorator para obtener usuario del token
```

## Proyectos y su estrategia de auth

| Alias | Auth Strategy | Framework |
|---|---|---|
| bodega bo api | JWT + API Key | NestJS 11 |
| bodega services | JWT + API Key | NestJS 11 |
| nai restaurant api | JWT (bcryptjs) | NestJS 11 |
| yalo bo api | JWT Bearer | .NET 9 |
| yalo external api | JWT Bearer | .NET 8 |
| yalo reporteria | JWT Bearer | .NET 8 |
| yalo agendo api | JWT Bearer | .NET 9 |
| ult api | JWT Bearer | .NET 7 |

---

## JWT en NestJS

### `/jwt config nestjs` — Configuración completa

```typescript
// auth/auth.module.ts
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '1h'),
          issuer:    config.get('JWT_ISSUER', 'mi-app'),
        },
      }),
    }),
    TypeOrmModule.forFeature([Usuario]),
  ],
  providers: [AuthService, JwtStrategy, ApiKeyStrategy],
  exports:   [AuthService, JwtModule],
})
export class AuthModule {}

// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private userService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:  config.getOrThrow('JWT_SECRET'),
      issuer:       config.get('JWT_ISSUER', 'mi-app'),
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.activo) throw new UnauthorizedException();
    return user;
  }
}

// auth/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub:   number;    // user ID
  email: string;
  role:  string;
  iat?:  number;
  exp?:  number;
}
```

### Generar tokens

```typescript
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  generateTokens(user: Usuario): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub:   user.id,
      email: user.email,
      role:  user.rol,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret:    this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    };
  }

  async login(email: string, password: string) {
    const user = await this.usuariosService.findByEmail(email);
    if (!user || !await bcrypt.compare(password, user.passwordHash))
      throw new UnauthorizedException('Credenciales inválidas');

    return this.generateTokens(user);
  }
}
```

### `/jwt guard nestjs` — Guards

```typescript
// auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: any, user: T): T {
    if (err || !user) throw new UnauthorizedException('Token inválido o expirado');
    return user;
  }
}

// auth/guards/api-key.guard.ts  (patrón de La Bodega)
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const key = req.headers['x-api-key'] as string;
    const validKey = this.config.getOrThrow('API_KEY');

    if (!key || key !== validKey)
      throw new UnauthorizedException('API Key inválida');
    return true;
  }
}

// Usar en controller
@Controller('productos')
@UseGuards(JwtAuthGuard)          // requiere JWT
export class ProductosController { }

@Controller('webhooks')
@UseGuards(ApiKeyGuard)           // requiere API Key
export class WebhooksController { }
```

### `/jwt currentuser` — Decorator personalizado

```typescript
// auth/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Uso en controller
@Get('perfil')
@UseGuards(JwtAuthGuard)
getPerfil(@CurrentUser() user: Usuario) {
  return user;
}
```

### `/jwt refresh nestjs` — Refresh token flow

```typescript
@Post('refresh')
async refresh(@Body() dto: { refreshToken: string }) {
  try {
    const payload = this.jwtService.verify<JwtPayload>(
      dto.refreshToken,
      { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') }
    );

    const user = await this.usuariosService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    return this.authService.generateTokens(user);
  } catch {
    throw new UnauthorizedException('Refresh token inválido');
  }
}
```

---

## JWT en .NET ASP.NET Core

### `/jwt config dotnet` — Program.cs

```csharp
// Program.cs — configuración JWT Bearer
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var jwtConfig = builder.Configuration.GetSection("Jwt");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtConfig["Issuer"],
            ValidAudience            = jwtConfig["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtConfig["Secret"]!)),
            ClockSkew = TimeSpan.Zero,  // sin margen de tiempo extra
        };

        // Para SignalR — leer token desde query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    context.Token = token;
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

// ...
app.UseAuthentication();
app.UseAuthorization();
```

```json
// appsettings.json
{
  "Jwt": {
    "Secret":   "mi-secreto-super-seguro-de-al-menos-256-bits",
    "Issuer":   "mi-api",
    "Audience": "mi-frontend",
    "ExpiresInMinutes": 60
  }
}
```

### Generar token en .NET

```csharp
public class JwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config) => _config = config;

    public string GenerateToken(Usuario user)
    {
        var jwtConfig = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtConfig["Secret"]!));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, user.Rol),
        };

        var token = new JwtSecurityToken(
            issuer:             jwtConfig["Issuer"],
            audience:           jwtConfig["Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddMinutes(
                                  int.Parse(jwtConfig["ExpiresInMinutes"]!)),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### `/jwt guard dotnet` — Proteger endpoints

```csharp
// [Authorize] básico — requiere token válido
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ProductosController : ControllerBase { }

// Autorización por rol
[Authorize(Roles = "Admin,SuperAdmin")]
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(int id) { }

// Obtener claims del token en el controller
var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
var email  = User.FindFirstValue(ClaimTypes.Email)!;
var role   = User.FindFirstValue(ClaimTypes.Role)!;

// Policy personalizada
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SoloAdmin", policy =>
        policy.RequireRole("Admin")
              .RequireClaim("tenant_id"));
});

[Authorize(Policy = "SoloAdmin")]
```

---

## JWT en Angular — Interceptor HTTP

### `/jwt interceptor angular`

```typescript
// auth/jwt.interceptor.ts
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();  // token expirado → cerrar sesión
      }
      return throwError(() => error);
    }),
  );
};

// Registrar en app.config.ts
provideHttpClient(withInterceptors([jwtInterceptor])),
```

---

## Variables de entorno JWT

```env
# NestJS
JWT_SECRET=mi-secreto-min-256-bits-aleatorio
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=otro-secreto-diferente-para-refresh
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=mi-app

# .NET (en appsettings.json o Secrets Manager)
JWT_SECRET=mi-secreto
JWT_ISSUER=mi-api
JWT_AUDIENCE=mi-frontend
JWT_EXPIRES_MINUTES=60

# API Key
API_KEY=clave-api-segura-para-webhooks
```

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `401 Unauthorized` en endpoints válidos | Falta `app.UseAuthentication()` antes de `UseAuthorization()` | Verificar orden en `Program.cs` |
| Token expirado al instante | `ClockSkew` por defecto es 5min y el token tiene expiración corta | `ClockSkew = TimeSpan.Zero` |
| `JwtStrategy` no encuentra el usuario | `payload.sub` es string, no número | `parseInt(payload.sub)` en la estrategia |
| Roles no funcionan en .NET | Claims con nombre diferente | Usar `ClaimTypes.Role` no `"role"` |
| Token en SignalR no funciona | No se lee desde query string | Agregar `OnMessageReceived` event |
