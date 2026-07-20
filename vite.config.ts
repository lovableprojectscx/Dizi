import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Carga todas las variables de entorno (incluyendo las que no tienen el prefijo VITE_)
  // y las asigna a process.env para que estén disponibles en el backend local (como WHAPI_TOKEN)
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [
      TanStackRouterVite(),
      react(),
      tailwindcss(),
      tsconfigPaths(),
      {
        name: "api-routes-dev-server",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = new URL(req.url || "", `http://${req.headers.host}`);

            if (url.pathname.startsWith("/api/")) {
              const endpoint = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");

              // Evitar ataques de directory traversal en local
              if (endpoint.includes("..") || endpoint.includes("/") || endpoint.includes("\\")) {
                return next();
              }

              try {
                const fs = await import("fs");
                const path = await import("path");
                const filePath = path.resolve(process.cwd(), `api/${endpoint}.ts`);

                if (!fs.existsSync(filePath)) {
                  return next();
                }

                // Cargar y compilar el módulo serverless local de forma dinámica
                const module = await server.ssrLoadModule(`./api/${endpoint}.ts`);

                // Extender res con polyfills de Express (status y json)
                const resExtended = res as any;
                if (!resExtended.status) {
                  resExtended.status = function (statusCode: number) {
                    this.statusCode = statusCode;
                    return this;
                  };
                }
                if (!resExtended.json) {
                  resExtended.json = function (data: any) {
                    this.setHeader("Content-Type", "application/json");
                    this.end(JSON.stringify(data));
                    return this;
                  };
                }

                // Extender req con parámetros de consulta parsed
                const reqExtended = req as any;
                reqExtended.query = Object.fromEntries(url.searchParams.entries());

                // Parsear cuerpo de la petición si es un método de escritura
                if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
                  let body = "";
                  req.on("data", (chunk) => {
                    body += chunk.toString();
                  });
                  req.on("end", async () => {
                    try {
                      reqExtended.body = body ? JSON.parse(body) : {};
                    } catch {
                      reqExtended.body = {};
                    }
                    try {
                      await module.default(reqExtended, resExtended);
                    } catch (handlerErr) {
                      next(handlerErr);
                    }
                  });
                } else {
                  await module.default(reqExtended, resExtended);
                }
              } catch (err) {
                next(err);
              }
            } else {
              next();
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
