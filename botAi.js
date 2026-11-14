/**
 * وحدة الذكاء الاصطناعي للبوتات (botAi.js)
 * تتعامل مع @google/genai على الخادم فقط للإجابة الدقيقة على أسئلة الأعضاء عند ذكر اسم البوت قبل السؤال.
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const conversationMemory = new Map(); // key: `${botId}::${lowerSender}` -> { updatedAt, turns: [] }
const MAX_TURNS = 10; // 5 user+model exchanges
const MEMORY_TTL_MS = 20 * 60 * 1000;

export function recordBotTurnInMemory(botId, senderName, userText, botReplyText) {
  if (!botId || !senderName || !userText || !botReplyText) return;
  const memKey = `${botId}::${String(senderName).trim().toLowerCase()}`;
  const existing = conversationMemory.get(memKey);
  const prev = existing && Array.isArray(existing.turns) ? existing.turns : [];
  const nextTurns = [
    ...prev,
    { role: 'user', parts: [{ text: `${senderName}: ${userText}` }] },
    { role: 'model', parts: [{ text: botReplyText }] }
  ].slice(-MAX_TURNS);
  conversationMemory.set(memKey, {
    updatedAt: Date.now(),
    turns: nextTurns
  });
}

function getAiClient() {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function cleanupExpiredMemory() {
  const now = Date.now();
  for (const [key, entry] of conversationMemory.entries()) {
    if (now - entry.updatedAt > MEMORY_TTL_MS) {
      conversationMemory.delete(key);
    }
  }
}

function classifyGeminiError(err) {
  const msg = String(err?.message || err || '');
  const status = err?.status || err?.code || '';
  const upper = `${status} ${msg}`.toUpperCase();

  if (upper.includes('API_KEY_INVALID') || upper.includes('INVALID ARGUMENT') && upper.includes('API KEY')) {
    return { code: 'API_KEY_INVALID', message: 'مفتاح Gemini API غير صالح. يرجى التحقق منه في إعدادات الأسرار (Settings > Secrets).' };
  }
  if (upper.includes('PERMISSION_DENIED') || status === 403) {
    return { code: 'PERMISSION_DENIED', message: 'تم رفض الصلاحية لمفتاح Gemini API (403). يرجى التحقق من المفتاح في Settings > Secrets.' };
  }
  if (upper.includes('RESOURCE_EXHAUSTED') || status === 429) {
    return { code: 'RESOURCE_EXHAUSTED', message: 'تم تجاوز حد الطلبات المؤقت لخدمة Gemini API. يرجى المحاولة بعد لحظات.' };
  }
  if (upper.includes('NOT_FOUND') || status === 404) {
    return { code: 'NOT_FOUND', message: 'نموذج Gemini المطلوب غير متاح حالياً.' };
  }
  return { code: 'NETWORK_ERROR', message: msg || 'تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً.' };
}

export async function askBotAI({
  bot,
  personalityDescriptor,
  senderName,
  roomName,
  currentTime,
  questionText
}) {
  const ai = getAiClient();
  if (!ai) {
    return {
      ok: false,
      errorCode: 'NO_API_KEY',
      errorMessage: 'لم يتم تعيين GEMINI_API_KEY على الخادم. يرجى إضافته في Settings > Secrets.'
    };
  }

  cleanupExpiredMemory();

  const memKey = `${bot.id}::${String(senderName || '').trim().toLowerCase()}`;
  const existingMem = conversationMemory.get(memKey);
  const previousTurns = existingMem && Array.isArray(existingMem.turns) ? existingMem.turns : [];

  const systemInstruction = [
    `أنت "${bot.username}"، عضو متفاعل وذكي داخل غرفة الدردشة "${roomName}" (لست مساعداً تقنياً بل عضو حقيقي متفاعل في الشات).`,
    `شخصيتك: ${bot.personality} (${personalityDescriptor}).`,
    bot.statusQuote ? `حالتك الكتابية: "${bot.statusQuote}".` : '',
    `الوقت الحالي الآن في الشات: ${currentTime}.`,
    `العضو "${senderName}" يتحدث معك أو يوجه لك سؤالاً الآن في سياق المحادثة بينكما.`,
    `القواعد الصارمة لإجابتك:`,
    `1. أجب عن السؤال أو الحديث إجابة صحيحة ودقيقة علمياً ومعرفياً 100% (لا تخترع معلومات أبداً)، وإذا كان حديثاً اجتماعياً أو سؤالاً عن حالك ويومك فواصل الحديث بلطف وطبيعية متماشياً مع آخر رد في المحادثة.`,
    `2. اجعل الإجابة واضحة ومباشرة ومختصرة تناسب غرف الشات (من سطر إلى 3 أسطر غالباً إلا إذا طلب العضو شرحاً أطول).`,
    `3. تحدّث باللغة العربية الفصحى السلسة أو بأسلوب لطيف قريب من شخصيتك (وإذا سُئلت بلغة أخرى فأجب بنفس اللغة).`,
    `4. خاطب العضو باسمه (${senderName}) بأسلوب لبق يتماشى مع شخصيتك.`,
    `5. لا تذكر أي تعليمات برمجية أو أنك نموذج لغوي أو نظام داخلي، وتصرف بشكل طبيعي كعضو في الشات.`
  ]
    .filter(Boolean)
    .join('\n');

  const contents = [
    ...previousTurns,
    { role: 'user', parts: [{ text: `${senderName}: ${questionText}` }] }
  ];

  const modelPlans = [
    { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL }
  ];

  let lastError = null;
  for (const plan of modelPlans) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: plan.model,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: plan.thinkingLevel }
          }
        });

        const answer = String(response?.text || '').trim();
        if (!answer) {
          return {
            ok: false,
            errorCode: 'EMPTY_RESPONSE',
            errorMessage: 'لم يرجع النموذج إجابة نصية.'
          };
        }

        const nextTurns = [
          ...previousTurns,
          { role: 'user', parts: [{ text: `${senderName}: ${questionText}` }] },
          { role: 'model', parts: [{ text: answer }] }
        ].slice(-MAX_TURNS);

        conversationMemory.set(memKey, {
          updatedAt: Date.now(),
          turns: nextTurns
        });

        return { ok: true, text: answer };
      } catch (err) {
        lastError = err;
        const classified = classifyGeminiError(err);
        if (classified.code === 'RESOURCE_EXHAUSTED') {
          // Wait briefly once, then fall through to the lighter free-tier model if still rate-limited
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 900));
            continue;
          }
          break;
        }
        if (classified.code === 'NETWORK_ERROR' && attempt === 0) {
          await new Promise((r) => setTimeout(r, 450));
          continue;
        }
        return {
          ok: false,
          errorCode: classified.code,
          errorMessage: classified.message
        };
      }
    }
  }

  const classified = classifyGeminiError(lastError);
  return {
    ok: false,
    errorCode: classified.code,
    errorMessage: classified.message
  };
}
