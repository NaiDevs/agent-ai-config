import { createServer } from "node:http";

/** Solo diagnostico: sin endpoints de memoria hasta implementar TLS y emparejamiento. */
export function crearServidor() {
  return createServer((req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET") {
      res.writeHead(405).end(JSON.stringify({ error: "metodo-no-permitido" }));
      return;
    }
    if (req.url === "/v1/health") {
      res.writeHead(200).end(JSON.stringify({ status: "ok", service: "nai-bridge" }));
      return;
    }
    if (req.url === "/v1/capabilities") {
      res.writeHead(200).end(JSON.stringify({ protocolVersion: 1, memorySync: false, pairing: false, agents: false }));
      return;
    }
    res.writeHead(404).end(JSON.stringify({ error: "no-encontrado" }));
  });
}
export async function escucharSoloLocal(port = 4391, host = "127.0.0.1") {
  if (host !== "127.0.0.1") {
    throw new Error("El puente aun no admite TLS ni emparejamiento. Solo loopback es seguro.");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("Puerto invalido.");
  }
  const server = crearServidor();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  return server;
}
