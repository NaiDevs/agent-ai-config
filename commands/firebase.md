---
description: Asistente para Firebase — push notifications (FCM), Firestore, Firebase Admin en NestJS, y Firebase SDK en Angular/React Native
---

# firebase

Asistente para Firebase en los proyectos. Cubre Firebase Admin (NestJS backend — YALO Admin), FCM para push notifications, Firebase SDK en Angular (YaloConsole, YaloPOSBackoffice) y React Native (La Bodega Mobile).

## Uso

```
/firebase push send                   → envía push notification con FCM
/firebase push topic                  → envía a un topic (grupo de dispositivos)
/firebase push token <save>           → guarda/gestiona device tokens
/firebase admin config                → configura firebase-admin en NestJS
/firebase sdk config                  → configura Firebase SDK en Angular/Next.js
/firebase rn config                   → configura react-native-firebase en Expo
/firebase auth verify                 → verifica token de Firebase Auth
/firebase firestore query             → query básica a Firestore (si se usa)
```

## Proyectos que lo usan

| Alias | Firebase SDK | Uso |
|---|---|---|
| yalo admin api | firebase-admin 13.x | Push notifications server-side |
| yalo console | firebase 11.x | Push notifications, realtime |
| yalo bo (YaloPOSBackoffice) | firebase 10.x | Push notifications |
| bodega ecom mb | react-native-firebase 23.x | Push notifications móvil |
| bodega mobile | react-native-firebase | Push notifications móvil |

---

## Firebase Admin — NestJS Backend

### `/firebase admin config`

```typescript
// firebase/firebase.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const FIREBASE_APP = 'FIREBASE_APP';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_APP,
      inject: [ConfigService],
      useFactory: (config: ConfigService): admin.app.App => {
        // Opción A: desde variable de entorno (JSON del service account)
        const serviceAccount = JSON.parse(
          config.getOrThrow('FIREBASE_SERVICE_ACCOUNT_JSON')
        );

        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      },
    },
  ],
  exports: [FIREBASE_APP],
})
export class FirebaseModule {}
```

```env
# Variable con el JSON completo del service account (desde Firebase Console > Project Settings > Service Accounts)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

### `/firebase push send` — Notificación individual

```typescript
@Injectable()
export class PushNotificationService {
  constructor(
    @Inject(FIREBASE_APP)
    private readonly firebaseApp: admin.app.App,
  ) {}

  async sendToDevice(params: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
  }): Promise<string> {
    const message: admin.messaging.Message = {
      token: params.token,
      notification: {
        title: params.title,
        body: params.body,
        ...(params.imageUrl && { imageUrl: params.imageUrl }),
      },
      data: params.data,
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };

    const response = await this.firebaseApp.messaging().send(message);
    return response; // message ID
  }

  // Envío a múltiples tokens (máx 500 por llamada)
  async sendToMultiple(params: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<admin.messaging.BatchResponse> {
    const message: admin.messaging.MulticastMessage = {
      tokens: params.tokens,
      notification: { title: params.title, body: params.body },
      data: params.data,
      android: { priority: 'high' },
    };

    return this.firebaseApp.messaging().sendEachForMulticast(message);
  }
}
```

### `/firebase push topic`

```typescript
// Enviar a un topic (todos los dispositivos suscritos)
async sendToTopic(params: {
  topic: string;   // ej: 'pedidos-nuevos', 'alertas-bodega'
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  await this.firebaseApp.messaging().send({
    topic: params.topic,
    notification: { title: params.title, body: params.body },
    data: params.data,
  });
}

// Suscribir/desuscribir tokens a un topic
async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
  await this.firebaseApp.messaging().subscribeToTopic(tokens, topic);
}

async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
  await this.firebaseApp.messaging().unsubscribeFromTopic(tokens, topic);
}
```

### `/firebase push token <save>` — Guardar device token en BD

```typescript
// Guardar el FCM token al hacer login desde la app
@Post('device-token')
@UseGuards(JwtAuthGuard)
async saveDeviceToken(
  @CurrentUser() user: Usuario,
  @Body() dto: { token: string; platform: 'ios' | 'android' | 'web' },
): Promise<void> {
  await this.usuariosService.upsertDeviceToken(user.id, dto.token, dto.platform);
}

// En el servicio — upsert del token
async upsertDeviceToken(userId: number, token: string, platform: string) {
  await this.deviceTokenRepo.upsert(
    { userId, token, platform, updatedAt: new Date() },
    { conflictPaths: ['token'] }  // TypeORM — evitar duplicados del mismo token
  );
}
```

### `/firebase auth verify` — Verificar token de Firebase Auth

```typescript
// Guard para validar tokens de Firebase Auth (si se usa Firebase Auth)
async verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const decoded = await this.firebaseApp.auth().verifyIdToken(idToken);
  return decoded;
  // decoded.uid, decoded.email, decoded.name disponibles
}
```

---

## Firebase SDK — Angular (Frontend)

### `/firebase sdk config` — Angular 15+

```typescript
// app.config.ts (standalone)
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';

const firebaseConfig = {
  apiKey:            environment.firebaseApiKey,
  authDomain:        environment.firebaseAuthDomain,
  projectId:         environment.firebaseProjectId,
  storageBucket:     environment.firebaseStorageBucket,
  messagingSenderId: environment.firebaseMessagingSenderId,
  appId:             environment.firebaseAppId,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideMessaging(() => getMessaging()),
  ],
};

// Servicio para FCM en Angular
@Injectable({ providedIn: 'root' })
export class FcmService {
  private messaging = inject(Messaging);

  async requestPermissionAndGetToken(): Promise<string | null> {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    return getToken(this.messaging, {
      vapidKey: environment.firebaseVapidKey,
    });
  }

  listenToMessages() {
    return onMessage(this.messaging, (payload) => {
      console.log('Mensaje recibido:', payload);
      // mostrar notificación en UI
    });
  }
}
```

---

## React Native Firebase (La Bodega Mobile)

### `/firebase rn config`

```typescript
// Ya configurado con react-native-firebase — uso directo
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';

// Hook para gestionar push notifications
export function usePushNotifications() {
  useEffect(() => {
    // Solicitar permiso
    messaging().requestPermission();

    // Obtener token FCM
    messaging().getToken().then(token => {
      // enviar token al backend para guardarlo
      api.saveDeviceToken(token);
    });

    // Listener para mensajes en foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Notificación recibida en primer plano:', remoteMessage);
      // mostrar toast/alert
    });

    // Listener para notificaciones que abren la app
    messaging().onNotificationOpenedApp(remoteMessage => {
      // navegar a la pantalla correspondiente
      if (remoteMessage.data?.screen) {
        navigation.navigate(remoteMessage.data.screen);
      }
    });

    return unsubscribe;
  }, []);
}
```

---

## Tópicos recomendados por proyecto

```
// YALO
'pos-alertas'          → alertas del POS para todos los dispositivos
'pedidos-nuevos'       → monitor de pedidos en cocina/despacho
'actualizaciones-app'  → notificar nuevas versiones

// La Bodega
'ofertas-flash'        → notificaciones de ofertas a todos los usuarios
'pedido-{id}'          → actualizaciones de un pedido específico
'bodega-drivers'       → alertas para repartidores
```
