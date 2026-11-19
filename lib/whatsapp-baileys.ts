import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';

const AUTH_DIR = path.join(process.cwd(), 'data', 'whatsapp-baileys-auth');

let sock: ReturnType<typeof makeWASocket> | null = null;
let latestQr: string | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let startPromise: Promise<void> | null = null;

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  connectionStatus = 'connecting';
  sock = makeWASocket({ auth: state, printQRInTerminal: false });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) latestQr = qr;
    if (connection === 'open') {
      connectionStatus = 'connected';
      latestQr = null;
    }
    if (connection === 'close') {
      connectionStatus = 'disconnected';
      startPromise = null;
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) ensureStarted();
    }
  });

  // Recebimento de mensagens: encaminha pro cerebro unificado da JGNEXT
  // (AssistantEngine, via o mesmo endpoint que o chatbot embutido usa - ver
  // JGNEXT_CHATBOT_TOKEN/JGNEXT_API_BASE_URL injetados no deploy) e responde
  // de volta no mesmo chat. Ignora mensagens enviadas pelo proprio numero
  // (fromMe) e updates que nao sao mensagem nova (ex: historico sincronizado).
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        if (msg.key?.fromMe || !msg.message) continue;
        const from = msg.key?.remoteJid;
        if (!from || from.endsWith('@g.us')) continue; // ignora grupos
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!text) continue;

        const apiBase = process.env.JGNEXT_API_BASE_URL;
        const token = process.env.JGNEXT_CHATBOT_TOKEN;
        if (!apiBase || !token) {
          console.error('[WhatsApp] JGNEXT_API_BASE_URL/JGNEXT_CHATBOT_TOKEN ausentes - nao e possivel responder.');
          continue;
        }

        const response = await fetch(`${apiBase}/api/v1/embedded-chatbot/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: text, channel: 'whatsapp_baileys' })
        });
        const data = await response.json();
        if (data?.reply) {
          await sock?.sendMessage(from, { text: data.reply });
        } else {
          console.error('[WhatsApp] Resposta sem reply do AssistantEngine:', data);
        }
      } catch (err) {
        console.error('[WhatsApp] Erro ao processar mensagem recebida:', err);
      }
    }
  });
}

// Idempotente - chamado a cada request nas rotas abaixo, mas só conecta de
// verdade na primeira vez (ou depois de uma desconexão).
export function ensureStarted(): Promise<void> {
  if (!startPromise) startPromise = connect();
  return startPromise;
}

export async function getQrCodeDataUrl(): Promise<string | null> {
  if (!latestQr) return null;
  return QRCode.toDataURL(latestQr);
}

export function getConnectionStatus() {
  return connectionStatus;
}

export async function sendWhatsAppMessage(to: string, text: string) {
  await ensureStarted();
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp (Baileys) não está conectado - escaneie o QR code em /admin/whatsapp-connect primeiro.');
  }
  const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text });
}
