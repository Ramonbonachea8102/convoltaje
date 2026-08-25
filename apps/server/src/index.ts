import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import whatsappRouter from "./routes/whatsapp.js";

const app = express();

// Cabeceras de seguridad estrictas (Helmet)
app.use(helmet());

// CORS restringido por orígenes permitidos
const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (ej. curl, webhooks del servidor) o dentro de la whitelist
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Protección contra fuerza bruta / DoS
app.use(
  rateLimit({
    windowMs: 60_000, // 1 minuto
    max: 100, // Máximo 100 peticiones por ventana
    message: { error: "Demasiadas peticiones. Intente nuevamente en un minuto." },
  })
);

// ============================================================
// PASO 1: El raw body middleware va ANTES que cualquier otro
// parser JSON global, y SOLO se aplica a la ruta del webhook.
// verify() guarda los bytes crudos en req.rawBody para poder
// validarlos después con HMAC sin que Express los toque.
// ============================================================
app.use(
  "/api/whatsapp/webhook",
  express.raw({
    type: "application/json",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf; // Buffer crudo, exactamente lo que mandó WhatsApp
    },
  })
);

// TODO EL RESTO de rutas usa json() parseado normal
app.use(express.json());

// Endpoint de salud
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "convoltaje-apps-server",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rutas del AgentKit / WhatsApp
app.use("/api/whatsapp", whatsappRouter);

const PORT = env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 [Apps Server] Convoltaje Server escuchando en puerto ${PORT} (Entorno: ${env.NODE_ENV})`);
});
