# Transporte Nai Mobile v2

Android no negocia el certificado TLS Ed25519 usado por el transporte entre procesos Node (`ERR_SSL_NO_SUITABLE_SIGNATURE_ALGORITHM`). El transporte móvil usa TLS 1.3 con un certificado ECDSA P-256 efímero. La confianza sigue anclada a las claves Ed25519 verificadas durante el emparejamiento.

En cada conexión, antes de enviar operaciones o memorias:

1. Android abre TLS con raíces del sistema deshabilitadas. Acepta provisionalmente el certificado recibido y calcula SHA-256 de su DER.
2. Android envía `hello` con un nonce aleatorio de 128 bits. Bridge devuelve `server-proof` con otro nonce, el hash del certificado TLS, su ID y una firma Ed25519 sobre todos esos campos. Android verifica la firma usando la clave emparejada y compara el hash con el certificado de esta conexión.
3. Android envía una única solicitud firmada Ed25519 que incluye ambos nonces, hash TLS, IDs de ambos dispositivos, operación y parámetros. Bridge verifica la firma con el peer activo y vuelve a comprobar permiso por proyecto antes de responder.
4. La respuesta viaja en el mismo canal TLS y refleja el nonce del cliente y el ID del servidor. Las solicitudes no autenticadas se cierran sin respuesta. El intercambio está limitado a una solicitud por conexión y a tramas de tamaño acotado.

El dominio de firmas es `nai-transport-v2`; los campos firmados se codifican como arreglos JSON UTF-8 en orden fijo. `ping` no da acceso a memorias. `manifest` y `page` requieren `--memory` y permiso `memory.read` para el proyecto. El transporte Node anterior en el puerto 4392 conserva su contrato; el móvil usa `transport serve --mobile` en el puerto 4393.
