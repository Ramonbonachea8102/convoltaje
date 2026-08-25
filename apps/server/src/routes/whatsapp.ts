import { Router, Request, Response } from "express";
import crypto from "crypto";
import { env } from "../config/env.js";
import { agentKit } from "../services/agentKit.js";

const router = Router();

// --- GET: handshake de verificación inicial de Meta / WhatsApp Cloud API ---
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ [WhatsApp] Handshake de webhook verificado exitosamente.");
    return res.status(200).send(challenge);
  }
  
  console.warn("⛔ [WhatsApp] Intento de verificación de webhook fallido (token inválido).");
  return res.sendStatus(403);
});

// --- POST: recepción real de mensajes/eventos con validación HMAC SHA-256 ---
router.post("/webhook", async (req: any, res: Response) => {
  const signatureHeader = req.get("x-hub-signature-256"); // ej: "sha256=abc123..."

  if (!signatureHeader || !env.WHATSAPP_APP_SECRET) {
    console.warn("⛔ [Security] Petición a webhook sin cabecera de firma x-hub-signature-256.");
    return res.sendStatus(401);
  }

  // Recalcular HMAC sobre los bytes CRUDOS (req.rawBody)
  const rawBytes = req.rawBody ? req.rawBody : Buffer.from("");
  const expectedHash = crypto
    .createHmac("sha256", env.WHATSAPP_APP_SECRET)
    .update(rawBytes)
    .digest("hex");

  const expectedSignature = `sha256=${expectedHash}`;

  // Comparación timing-safe: crypto.timingSafeEqual en vez de ===
  const signatureValid =
    signatureHeader.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );

  if (!signatureValid) {
    console.warn("⛔ [Security] Firma HMAC SHA-256 inválida en webhook de WhatsApp. Petición rechazada.");
    return res.sendStatus(401); // firma inválida -> se rechaza
  }

  // Parsear JSON manualmente sobre el rawBody verificado
  let payload: any;
  try {
    payload = JSON.parse(rawBytes.toString("utf-8"));
  } catch (parseErr) {
    console.error("❌ Error parseando payload crudo de WhatsApp:", parseErr);
    return res.sendStatus(400);
  }

  // Delegar a agentKit de forma controlada
  try {
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || message.button?.text;
      const messageId = message.id;
      const type = message.type || 'text';

      await agentKit.processIncomingMessage({
        from,
        messageId,
        type,
        text,
        timestamp: new Date().toISOString(),
        rawPayload: message
      });
    }
  } catch (agentErr) {
    console.error("❌ Error procesando evento con AgentKit:", agentErr);
  }

  // WhatsApp espera 200 rápido para no reintentar
  res.sendStatus(200);
});

export default router;
