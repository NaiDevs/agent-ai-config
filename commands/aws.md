---
description: Asistente para AWS — Secrets Manager, S3, SES, DynamoDB, Lambda — con los patrones reales de YALO, La Bodega y otros proyectos
---

# aws

Asistente para servicios AWS usados en los proyectos. Cubre Secrets Manager (el más usado), S3, SES, DynamoDB y Lambda — tanto en .NET como en NestJS.

## Uso

```
/aws secrets get <nombre>             → lee secreto de Secrets Manager
/aws secrets config                   → configura lectura de secrets al startup
/aws s3 upload                        → sube archivo a S3
/aws s3 url                           → genera URL firmada de S3
/aws ses email                        → envía email con SES
/aws dynamo query <tabla>             → query a DynamoDB
/aws dynamo entity <nombre>           → entidad para DynamoDB (YALO Agendo)
/aws lambda invoke                    → invoca una Lambda
/aws config                           → configura credenciales AWS en el proyecto
```

## Servicios por proyecto

| Alias | AWS Services |
|---|---|
| yalo bo api, yalo external api | Secrets Manager |
| yalo reporteria | Secrets Manager, Lambda, SSO |
| yalo agendo api | DynamoDB, Secrets Manager |
| bodega services | Secrets Manager, SES, KMS |
| corinsa bi api | S3 |
| doctor api | S3 |
| ult api | S3, SendGrid (no SES) |

---

## Secrets Manager (el más usado)

### `/aws secrets config` — .NET

Patrón de los proyectos YALO — leer secrets al startup en `Program.cs`:

```csharp
// Opción A: Cargar directamente como IConfiguration (patrón YALO)
builder.Configuration.AddSecretsManager(configurator: config =>
{
    config.SecretFilter = secret =>
        secret.Name.StartsWith(builder.Environment.ApplicationName);
    config.KeyGenerator = (secret, key) =>
        key.Replace("__", ":");  // convierte "App__DB__Host" → "App:DB:Host"
});

// Opción B: Leer un secreto específico manualmente
using var client = new AmazonSecretsManagerClient(RegionEndpoint.USEast1);
var request = new GetSecretValueRequest { SecretId = "mi-app/produccion" };
var response = await client.GetSecretValueAsync(request);
var secrets = JsonSerializer.Deserialize<Dictionary<string, string>>(response.SecretString!);
```

```csharp
// appsettings.json — en local, en producción viene de Secrets Manager
{
  "ConnectionStrings": {
    "DefaultConnection": "${DB_CONNECTION}"
  },
  "Jwt": {
    "Secret": "${JWT_SECRET}"
  }
}
```

### `/aws secrets get` — NestJS

```typescript
// aws/secrets.service.ts
import { Injectable } from '@nestjs/common';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SecretsService {
  private client = new SecretsManagerClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
  });

  async getSecret<T = Record<string, string>>(secretName: string): Promise<T> {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await this.client.send(command);

    if (!response.SecretString) throw new Error(`Secreto ${secretName} no encontrado`);
    return JSON.parse(response.SecretString) as T;
  }
}

// Uso: cargar en bootstrap antes de iniciar la app
async function bootstrap() {
  const secretsService = new SecretsService();
  const secrets = await secretsService.getSecret('mi-app/produccion');

  process.env.DB_HOST = secrets['DB_HOST'];
  process.env.DB_PASS = secrets['DB_PASS'];
  // ... resto de secrets

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

---

## S3

### `/aws s3 upload`

**.NET:**
```csharp
// services/S3Service.cs
public class S3Service
{
    private readonly IAmazonS3 _s3;
    private readonly string _bucket;

    public S3Service(IAmazonS3 s3, IConfiguration config)
    {
        _s3 = s3;
        _bucket = config["AWS:BucketName"]!;
    }

    public async Task<string> UploadAsync(
        Stream stream,
        string key,
        string contentType)
    {
        var request = new PutObjectRequest
        {
            BucketName = _bucket,
            Key         = key,
            InputStream = stream,
            ContentType = contentType,
            CannedACL   = S3CannedACL.Private,
        };

        await _s3.PutObjectAsync(request);
        return key;
    }

    public Task DeleteAsync(string key)
        => _s3.DeleteObjectAsync(_bucket, key);
}

// Registrar en Program.cs
builder.Services.AddAWSService<IAmazonS3>();
builder.Services.AddSingleton<S3Service>();
```

**NestJS:**
```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
  private bucket = process.env.AWS_S3_BUCKET!;

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    return key;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

// /aws s3 url — URL firmada
async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
  return getSignedUrl(this.client, command, { expiresIn });
}
```

---

## SES — Email

### `/aws ses email` — NestJS (La Bodega Services)

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private ses = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
  private from = process.env.SES_FROM_EMAIL!;

  async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const destinations = Array.isArray(params.to) ? params.to : [params.to];

    await this.ses.send(new SendEmailCommand({
      Source: this.from,
      Destination: { ToAddresses: destinations },
      Message: {
        Subject: { Data: params.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: params.html, Charset: 'UTF-8' },
          ...(params.text && { Text: { Data: params.text, Charset: 'UTF-8' } }),
        },
      },
    }));
  }

  // Email con template Handlebars
  async sendTemplatedEmail(
    to: string,
    subject: string,
    templateName: string,
    data: Record<string, any>,
  ): Promise<void> {
    const template = await this.loadTemplate(templateName, data);
    return this.sendEmail({ to, subject, html: template });
  }
}
```

---

## DynamoDB — YALO Agendo

### `/aws dynamo entity <nombre>`

```typescript
// Entidad DynamoDB con decoradores del SDK de AWS
interface <Nombre>Item {
  PK: string;      // Partition key — ej: `<NOMBRE>#${id}`
  SK: string;      // Sort key — ej: `METADATA` o fecha
  nombre: string;
  datos: Record<string, any>;
  createdAt: string;  // ISO string
  ttl?: number;       // Unix timestamp para expiración automática
}

// Operaciones básicas
@Injectable()
export class <Nombre>DynamoRepository {
  private client = new DynamoDBClient({ region: process.env.AWS_REGION });
  private docClient = DynamoDBDocumentClient.from(this.client);
  private table = process.env.DYNAMO_TABLE_NAME!;

  async put(item: <Nombre>Item): Promise<void> {
    await this.docClient.send(new PutCommand({
      TableName: this.table,
      Item: item,
    }));
  }

  async get(pk: string, sk: string): Promise<<Nombre>Item | undefined> {
    const { Item } = await this.docClient.send(new GetCommand({
      TableName: this.table,
      Key: { PK: pk, SK: sk },
    }));
    return Item as <Nombre>Item | undefined;
  }

  async query(pk: string, skPrefix?: string) {
    const { Items } = await this.docClient.send(new QueryCommand({
      TableName: this.table,
      KeyConditionExpression: skPrefix
        ? 'PK = :pk AND begins_with(SK, :sk)'
        : 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': pk,
        ...(skPrefix && { ':sk': skPrefix }),
      },
    }));
    return Items as <Nombre>Item[];
  }

  async delete(pk: string, sk: string): Promise<void> {
    await this.docClient.send(new DeleteCommand({
      TableName: this.table,
      Key: { PK: pk, SK: sk },
    }));
  }
}
```

---

## Variables de entorno AWS

```env
# Credenciales (en producción vienen del IAM role — no hardcodear)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...        # solo en local/dev
AWS_SECRET_ACCESS_KEY=...        # solo en local/dev

# S3
AWS_S3_BUCKET=mi-bucket-nombre

# SES
SES_FROM_EMAIL=noreply@midominio.com

# DynamoDB
DYNAMO_TABLE_NAME=MiTabla-produccion

# Secrets Manager
AWS_SECRET_NAME=mi-app/produccion
```

**En producción:** las credenciales vienen del IAM Role del servidor/Lambda — no se configuran variables de entorno para `AWS_ACCESS_KEY_ID` ni `AWS_SECRET_ACCESS_KEY`.
