const http = require('http');
const tls = require('tls');
const net = require('net');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 8787;
const LLM_MODE = process.env.VEGE_TAROT_LLM_MODE || 'mock'; // mock | openai-compatible
const LLM_BASE_URL = process.env.VEGE_TAROT_LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_API_KEY = process.env.VEGE_TAROT_LLM_API_KEY || '';
const LLM_MODEL = process.env.VEGE_TAROT_LLM_MODEL || 'gpt-4.1-mini';
const LLM_TIMEOUT_MS = Number(process.env.VEGE_TAROT_LLM_TIMEOUT_MS || 60000);
const OPENCLAW_URL_RAW = process.env.VEGE_TAROT_OPENCLAW_URL || '';
const OPENCLAW_TOKEN = process.env.VEGE_TAROT_OPENCLAW_TOKEN || '';
const OPENCLAW_HOOK_URL_RAW = process.env.VEGE_TAROT_OPENCLAW_HOOK_URL || '';
const OPENCLAW_HOOK_TOKEN = process.env.VEGE_TAROT_OPENCLAW_HOOK_TOKEN || '';
const OPENCLAW_TIMEOUT_MS = Number(process.env.VEGE_TAROT_OPENCLAW_TIMEOUT_MS || 180000);
const OPENCLAW_CALLBACK_SECRET = process.env.VEGE_TAROT_OPENCLAW_CALLBACK_SECRET || '';
const PUBLIC_API_BASE = process.env.VEGE_TAROT_PUBLIC_API_BASE || '';

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text || '');
}

function validateInterpretPayload(body) {
  if (!body || typeof body !== 'object') return 'Request body is required';
  if (!['zh', 'en'].includes(body.lang)) return 'lang must be zh or en';
  if (!Array.isArray(body.cards) || body.cards.length === 0) return 'cards must be a non-empty array';

  for (const [i, card] of body.cards.entries()) {
    if (!normalizeText(card?.name)) return `Card ${i + 1} is missing name`;
    if (!normalizeText(card?.position)) return `Card ${i + 1} is missing position`;
    if (!normalizeText(card?.orientation)) return `Card ${i + 1} is missing orientation`;
    if (!['upright', 'reversed'].includes(card.orientation)) return `Card ${i + 1} orientation must be upright or reversed`;
  }
  return '';
}

const deepReadingJobs = new Map();

function createJobId() {
  return `deep_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function publicCallbackUrl(jobId) {
  if (!PUBLIC_API_BASE) return '';
  return `${PUBLIC_API_BASE.replace(/\/$/, '')}/api/tarot/deep-interpret/callback?jobId=${encodeURIComponent(jobId)}`;
}

function normalizeOpenClawEndpoint(raw = OPENCLAW_URL_RAW) {
  const value = normalizeText(raw);
  if (!value) return { url: '', token: OPENCLAW_TOKEN };
  try {
    const parsed = new URL(value);
    let token = OPENCLAW_TOKEN;
    const hash = parsed.hash || '';
    const m = hash.match(/token=([^&]+)/);
    if (!token && m?.[1]) token = decodeURIComponent(m[1]);
    parsed.hash = '';
    return { url: parsed.toString(), token };
  } catch {
    return { url: value, token: OPENCLAW_TOKEN };
  }
}

function resolveOpenClawHookEndpoint() {
  const explicit = normalizeText(OPENCLAW_HOOK_URL_RAW);
  if (explicit) return { url: explicit, token: OPENCLAW_HOOK_TOKEN };
  const { url, token } = normalizeOpenClawEndpoint();
  if (!url) return { url: '', token: OPENCLAW_HOOK_TOKEN || token };
  try {
    const parsed = new URL(url);
    parsed.pathname = '/hooks/agent';
    parsed.search = '';
    parsed.hash = '';
    return { url: parsed.toString(), token: OPENCLAW_HOOK_TOKEN || token };
  } catch {
    return { url: '', token: OPENCLAW_HOOK_TOKEN || token };
  }
}

function resolveOpenClawWsUrls(url) {
  const urls = [];
  try {
    const parsed = new URL(url);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : parsed.protocol === 'http:' ? 'ws:' : parsed.protocol;
    const add = pathname => {
      const candidate = new URL(parsed.toString());
      candidate.protocol = wsProtocol;
      candidate.pathname = pathname;
      candidate.search = '';
      candidate.hash = '';
      const value = candidate.toString();
      if (!urls.includes(value)) urls.push(value);
    };
    if (parsed.pathname.endsWith('/__openclaw__/ws')) {
      add(parsed.pathname);
    } else {
      add('/__openclaw__/ws');
      const base = parsed.pathname.replace(/\/$/, '');
      if (base && base !== '/') add(`${base}/__openclaw__/ws`);
    }
  } catch {}
  return urls;
}

function buildMockDeepResult(body) {
  const isZh = body.lang === 'zh';
  const names = (body.cards || []).map(c => `${c.position}：${c.name}${c.orientation === 'upright' ? (isZh ? '正位' : ' upright') : (isZh ? '逆位' : ' reversed')}`);
  if (!isZh) {
    return {
      summary: `Deep reading: the spread is centered on ${names.join(', ')}. The deeper pattern is less about a single yes/no and more about what is being avoided, delayed, or over-controlled.`,
      synthesis: 'At a deeper layer, the cards should be read as an interaction system: current pressure, hidden mechanism, and likely direction if the pattern continues.',
      advice: 'Use this reading as a mirror, not a verdict. Name the real issue, choose one concrete next action, and leave room to revise your view when new facts appear.',
      riskNotes: 'Do not treat the reading as fate or as professional advice for medical, legal, financial, or safety-critical decisions.',
      followUps: ['What is the hidden pattern I keep repeating?', 'What should I stop doing first?']
    };
  }
  return {
    summary: `深度解读：这组牌的核心不是简单吉凶，而是你在“${normalizeText(body.question) || '这个问题'}”里真正卡住的模式。当前牌面包括：${names.join('、')}。`,
    synthesis: '从深层结构看，这组牌需要先看整体互动：哪张牌代表当前压力，哪张牌代表隐藏机制，哪张牌代表如果继续这样下去的走向。深度解读会更关注动机、阻碍、反复出现的模式，以及你真正能改变的那一环。',
    advice: '建议把这次解读当成一面镜子，而不是判决书。先确认你最想改变的一个具体行为，再决定下一步，不要被情绪推着一次性做过大决定。',
    riskNotes: '不要把塔罗当成宿命或现实专业判断。涉及医疗、法律、投资、安全等问题时，必须回到现实证据和专业意见。',
    followUps: ['我一直重复的隐藏模式是什么？', '我现在最该先停止做什么？']
  };
}

function normalizeDeepResultPayload(payload) {
  const data = payload?.result || payload?.data || payload || {};
  return {
    summary: normalizeText(data.summary || data.overall || data.overallSummary || ''),
    synthesis: normalizeText(data.synthesis || data.analysis || data.deepAnalysis || data.linkage || ''),
    advice: normalizeText(data.advice || data.suggestion || data.recommendation || ''),
    riskNotes: normalizeText(data.riskNotes || data.risks || data.cautions || ''),
    followUps: Array.isArray(data.followUps) ? data.followUps.map(item => normalizeText(item)).filter(Boolean) : [],
  };
}

function isQuestionTooVague(question, lang) {
  const q = normalizeText(question).toLowerCase();
  if (!q) return true;
  const zhVague = [
    '看看感情', '看看工作', '看看未来', '看看我和他', '帮我看看感情', '帮我看看工作',
    '帮我看看未来', '看感情', '看工作', '看未来', '感情', '工作', '未来', '我和他', '我和她'
  ];
  const enVague = [
    'love', 'career', 'work', 'future', 'me and him', 'me and her', 'relationship', 'my relationship',
    'check my love life', 'check my career', 'what about my future'
  ];
  const list = lang === 'zh' ? zhVague : enVague;
  return list.some(item => q === item || q.includes(item));
}

function buildMockInterpretResult(body) {
  const isZh = body.lang === 'zh';
  const cards = Array.isArray(body.cards) ? body.cards : [];
  const names = cards.map(c => `${c.name}${c.orientation === 'upright' ? (isZh ? '正位' : ' (Upright)') : (isZh ? '逆位' : ' (Reversed)')}`);
  const spreadName = body.spreadName || body.spreadType || (isZh ? '当前牌阵' : 'Current spread');
  const question = normalizeText(body?.question) || (isZh ? '未提供具体问题' : 'No specific question was provided');

  return {
    ok: true,
    sessionId: body.sessionId || `sess_${Date.now()}`,
    drawId: body.drawId || `draw_${Date.now()}`,
    source: 'mock',
    result: isZh ? {
      summary: `围绕“${question}”这个问题，${spreadName}显示出的核心牌面是：${names.join('、')}。当前整体更像一个需要先厘清局势、再决定推进节奏的阶段。`,
      synthesis: '这组牌更强调局势判断、内在状态和行动时机之间的关系，而不是简单的立刻可以或绝对不行。真正关键的是你能否把问题收窄，并面对当前不确定性。',
      advice: '建议先保留行动空间，继续补充现实信息，再做下一步判断。如果你已经明显情绪上头，先慢一点通常比硬冲更好。',
      riskNotes: '当前阶段最大的风险通常来自信息不完整、预设立场过强，或把短期情绪误当成长期答案。',
      followUps: [
        '我现在最该看清的盲点是什么？',
        '如果我主动推进，短期会发生什么？'
      ]
    } : {
      summary: `Around the question “${question},” the core cards in ${spreadName} are ${names.join(', ')}. Overall, this looks like a stage where clarity matters more than speed.`,
      synthesis: 'This spread points more to the relationship between judgment, emotional state, and timing than to a simple yes-or-no answer. The real key is whether you can narrow the issue and face the uncertainty directly.',
      advice: 'Keep some room to move, gather more real-world information, and then decide. If emotions are running high, slowing down is usually wiser than forcing momentum.',
      riskNotes: 'The biggest risk at this stage usually comes from incomplete information, fixed assumptions, or mistaking a short-term emotional reaction for a long-term answer.',
      followUps: [
        'What blind spot do I most need to see right now?',
        'What happens in the short term if I take initiative?'
      ]
    }
  };
}

function buildLLMMessages(body) {
  const isZh = body.lang === 'zh';
  const question = normalizeText(body?.question) || (isZh ? '未填写' : 'Not filled in');
  const spreadName = normalizeText(body.spreadName) || normalizeText(body.spreadType) || (isZh ? '当前牌阵' : 'Current spread');
  const cards = body.cards.map((card, idx) => {
    const block = isZh
      ? [
          `${idx + 1}. 牌位：${card.position}`,
          `牌名：${card.name}`,
          `朝向：${card.orientation === 'upright' ? '正位' : '逆位'}`,
          `摘要：${normalizeText(card.summary) || '（无）'}`,
          `关键词：${normalizeText(card.keywords) || '（无）'}`,
          `牌义：${normalizeText(card.meaning) || '（无）'}`,
        ]
      : [
          `${idx + 1}. Position: ${card.position}`,
          `Name: ${card.name}`,
          `Orientation: ${card.orientation}`,
          `Summary: ${normalizeText(card.summary) || '(none)'}`,
          `Keywords: ${normalizeText(card.keywords) || '(none)'}`,
          `Meaning: ${normalizeText(card.meaning) || '(none)'}`,
        ];
    return block.join('\n');
  }).join('\n\n');

  const system = isZh
    ? `你是一个专业的塔罗解读助手。

风格要求：清醒、敏锐、有人味，有边界感但不冷酷；能指出问题核心，也能接住情绪。不神神叨叨，不客服腔，不装懂，不强行神化命运。

你的任务不是背诵牌义，而是严格依据给定的牌名、位置、正逆位、关键词、牌义，以及用户给出的现实语境，整合出有判断力的解读。

核心规则：
- 不编造用户没提供的信息；没有图就不要编画面细节。
- 直接根据用户当前给出的问题解牌；如果信息不足，可以指出边界或不确定性，但不要要求用户先补充信息再继续。
- 多张牌要先看整组共同点，再看差异、推动项、拖拽项、风险项，不要逐张机械拼接。
- 不做宿命论，不说必然、注定、100%。
- 关系题优先看互动结构：谁更主动、谁更退缩、哪里在拉扯、真正矛盾在哪里。
- 逆位优先理解为过度、不足、卡住、失衡、未展开，不要简单等于坏。
- 对医学、怀孕、生死、法律、精神疾病、财务投资、重大录取等高风险议题，保持边界，只能解读情绪、处境和风险倾向，必要时提醒咨询现实专业人士。

输出要求：
- 先给人话结论，再给建议，再给风险提醒。
- 默认不要铺满术语，不要长篇教学。
- 语气稳，不羞辱，不道德绑架。
- 只返回 JSON。
- JSON 字段固定为：summary, synthesis, advice, riskNotes, followUps。
- followUps 必须是字符串数组。`
    : `You are a professional tarot reading assistant.

Style: clear, sharp, humane, bounded but not cold. You can point to the core issue directly while still holding the user's emotions with respect. Do not be mystical fluff, customer-service soothing, fake certainty, or fate theater.

Your task is not to recite card meanings. Build the reading strictly from the provided card names, positions, orientations, keywords, meanings, and the user's real-world context.

Core rules:
- Do not invent information the user did not provide.
- If there is no image, do not invent visual details.
- Read directly from the user's current question. If context is limited, state the uncertainty or boundary clearly, but do not ask the user to provide extra clarification before continuing.
- Read the spread as one system: shared pattern first, then differences, drivers, draggers, opportunities, and risks.
- Avoid fatalistic language or absolute certainty.
- In relationship questions, focus on interaction structure, initiative vs retreat, avoidance vs pursuit, and where the real tension sits.
- Read reversals with nuance: excess, deficiency, blockage, distortion, instability, or unexpressed potential — not simply bad.
- For medical, pregnancy, death, legal, psychiatric, financial-investment, or other high-risk topics, keep clear boundaries and remind the user to consult the relevant real-world professional when needed.

Output requirements:
- Start with a plain-language conclusion, then advice, then risk notes.
- Do not over-explain tarot theory unless necessary.
- Return JSON only.
- Use exactly these fields: summary, synthesis, advice, riskNotes, followUps.
- followUps must be an array of strings.`;


  const user = isZh
    ? `问题：${question}\n牌阵：${spreadName}\n\n抽到的牌：\n${cards}\n\n请只返回 JSON，对象字段固定为：\nsummary\nsynthesis\nadvice\nriskNotes\nfollowUps\n\n其中 followUps 必须是字符串数组。`
    : `Question: ${question}\nSpread: ${spreadName}\n\nCards:\n${cards}\n\nReturn JSON only with these exact fields:\nsummary\nsynthesis\nadvice\nriskNotes\nfollowUps\n\nfollowUps must be an array of strings.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

function extractJsonCandidate(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1).trim();

  return text;
}

function tryParseJsonLoose(value) {
  if (value && typeof value === 'object') return value;

  const candidate = extractJsonCandidate(value);
  if (!candidate) return null;

  try {
    return JSON.parse(candidate);
  } catch {}

  try {
    return JSON.parse(candidate.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'"));
  } catch {}

  return null;
}

function buildInterpretFallbackFromText(text = '', lang = 'zh') {
  const clean = normalizeText(text);
  return {
    summary: clean || (lang === 'en' ? 'The model returned an empty response.' : '模型这次没有返回可用内容。'),
    synthesis: '',
    advice: '',
    riskNotes: '',
    followUps: [],
  };
}

async function callOpenAICompatible(body) {
  if (!LLM_API_KEY) {
    throw new Error('VEGE_TAROT_LLM_API_KEY is missing');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: buildLLMMessages(body),
      }),
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`LLM returned non-JSON response: ${text.slice(0, 300)}`);
    }

    if (!response.ok) {
      throw new Error(data?.error?.message || data?.message || `LLM HTTP ${response.status}`);
    }

    const content = data?.choices?.[0]?.message?.content || '{}';
    const parsed = tryParseJsonLoose(content);

    if (!parsed) {
      console.warn('[interpret] model content not strict JSON, using text fallback');
    }

    const fallback = buildInterpretFallbackFromText(content, body.lang);
    const result = {
      summary: normalizeText(parsed?.summary) || fallback.summary,
      synthesis: normalizeText(parsed?.synthesis) || fallback.synthesis,
      advice: normalizeText(parsed?.advice) || fallback.advice,
      riskNotes: normalizeText(parsed?.riskNotes) || fallback.riskNotes,
      followUps: Array.isArray(parsed?.followUps)
        ? parsed.followUps.map(item => normalizeText(item)).filter(Boolean)
        : fallback.followUps,
    };

    if (body.lang === 'en') {
      const joined = JSON.stringify(result);
      if (containsChinese(joined)) {
        throw new Error('English mode received Chinese content from the model');
      }
    }

    return {
      ok: true,
      sessionId: body.sessionId || `sess_${Date.now()}`,
      drawId: body.drawId || `draw_${Date.now()}`,
      source: parsed ? 'llm' : 'llm-fallback',
      model: LLM_MODEL,
      result,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function interpret(body) {
  if (LLM_MODE === 'openai-compatible') {
    const result = await callOpenAICompatible(body);
    return { ...result, mode: 'reading' };
  }
  return { ...buildMockInterpretResult(body), mode: 'reading' };
}

function createHeaderWebSocket(url, headers = {}) {
  const parsed = new URL(url);
  const secure = parsed.protocol === 'wss:';
  const port = Number(parsed.port || (secure ? 443 : 80));
  const host = parsed.hostname;
  const path = `${parsed.pathname || '/'}${parsed.search || ''}`;
  const key = crypto.randomBytes(16).toString('base64');
  const listeners = { open: [], message: [], close: [], error: [] };
  let handshakeDone = false;
  let handshakeBuffer = Buffer.alloc(0);
  let frameBuffer = Buffer.alloc(0);
  let closed = false;

  const socket = secure
    ? tls.connect({ host, port, servername: host })
    : net.connect({ host, port });

  const emit = (type, value) => {
    for (const fn of listeners[type] || []) {
      try { fn(value); } catch {}
    }
  };

  const writeFrame = (opcode, payload = '') => {
    if (closed || !socket.writable) return;
    const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), 'utf8');
    const mask = crypto.randomBytes(4);
    let header;
    if (data.length < 126) {
      header = Buffer.alloc(2);
      header[1] = 0x80 | data.length;
    } else if (data.length < 65536) {
      header = Buffer.alloc(4);
      header[1] = 0x80 | 126;
      header.writeUInt16BE(data.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(data.length), 2);
    }
    header[0] = 0x80 | opcode;
    const masked = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) masked[i] = data[i] ^ mask[i % 4];
    socket.write(Buffer.concat([header, mask, masked]));
  };

  const parseFrames = () => {
    while (frameBuffer.length >= 2) {
      const first = frameBuffer[0];
      const second = frameBuffer[1];
      const opcode = first & 0x0f;
      const masked = Boolean(second & 0x80);
      let offset = 2;
      let len = second & 0x7f;
      if (len === 126) {
        if (frameBuffer.length < offset + 2) return;
        len = frameBuffer.readUInt16BE(offset);
        offset += 2;
      } else if (len === 127) {
        if (frameBuffer.length < offset + 8) return;
        const bigLen = frameBuffer.readBigUInt64BE(offset);
        if (bigLen > BigInt(Number.MAX_SAFE_INTEGER)) {
          emit('error', new Error('WebSocket frame too large'));
          return;
        }
        len = Number(bigLen);
        offset += 8;
      }
      let mask;
      if (masked) {
        if (frameBuffer.length < offset + 4) return;
        mask = frameBuffer.subarray(offset, offset + 4);
        offset += 4;
      }
      if (frameBuffer.length < offset + len) return;
      let payload = frameBuffer.subarray(offset, offset + len);
      frameBuffer = frameBuffer.subarray(offset + len);
      if (masked && mask) {
        const unmasked = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) unmasked[i] = payload[i] ^ mask[i % 4];
        payload = unmasked;
      }
      if (opcode === 1) emit('message', payload.toString('utf8'));
      else if (opcode === 8) {
        closed = true;
        emit('close', { code: payload.length >= 2 ? payload.readUInt16BE(0) : 1000 });
        try { socket.end(); } catch {}
        return;
      } else if (opcode === 9) {
        writeFrame(0xA, payload);
      }
    }
  };

  socket.on('connect', () => {
    const reqHeaders = [
      `GET ${path} HTTP/1.1`,
      `Host: ${parsed.host}`,
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Key: ${key}`,
      'Sec-WebSocket-Version: 13',
      ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`),
      '',
      '',
    ].join('\r\n');
    socket.write(reqHeaders);
  });
  socket.on('data', chunk => {
    if (!handshakeDone) {
      handshakeBuffer = Buffer.concat([handshakeBuffer, chunk]);
      const idx = handshakeBuffer.indexOf('\r\n\r\n');
      if (idx === -1) return;
      const head = handshakeBuffer.subarray(0, idx).toString('utf8');
      const rest = handshakeBuffer.subarray(idx + 4);
      if (!/^HTTP\/1\.1 101\b/i.test(head)) {
        closed = true;
        emit('error', new Error(`WebSocket upgrade failed: ${head.split('\r\n')[0] || 'unknown response'}`));
        try { socket.destroy(); } catch {}
        return;
      }
      handshakeDone = true;
      emit('open');
      if (rest.length) {
        frameBuffer = Buffer.concat([frameBuffer, rest]);
        parseFrames();
      }
      return;
    }
    frameBuffer = Buffer.concat([frameBuffer, chunk]);
    parseFrames();
  });
  socket.on('error', err => emit('error', err));
  socket.on('close', () => {
    if (!closed) {
      closed = true;
      emit('close', { code: 1006 });
    }
  });

  return {
    addEventListener(type, fn) { if (listeners[type]) listeners[type].push(fn); },
    send(text) { writeFrame(1, text); },
    close() { if (!closed) { closed = true; writeFrame(8); socket.end(); } },
  };
}

async function callOpenClawHookAgent(requestBody) {
  const { url, token } = resolveOpenClawHookEndpoint();
  if (!url) throw new Error('OpenClaw hook URL is not configured');
  if (!token) throw new Error('OpenClaw hook token is not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(OPENCLAW_TIMEOUT_MS, 60000));
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: buildOpenClawDeepReadingPrompt(requestBody),
        agentId: 'main',
        sessionKey: `hook:vegebird-tarot:${requestBody.jobId}`,
        wakeMode: 'now',
        deliver: false,
        idempotencyKey: requestBody.jobId,
      }),
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!response.ok) throw new Error(data?.error || data?.message || `OpenClaw hook HTTP ${response.status}`);
    return data || { ok: true };
  } finally {
    clearTimeout(timeout);
  }
}

function scheduleDeepFallback(jobId, delayMs = OPENCLAW_TIMEOUT_MS) {
  const safeDelay = Math.max(5000, Math.min(delayMs, 10 * 60 * 1000));
  setTimeout(() => {
    const current = deepReadingJobs.get(jobId);
    if (!current || current.status !== 'running') return;
    current.status = 'success';
    current.source = current.source ? `${current.source}+mock-timeout-fallback` : 'mock-deep-timeout-fallback';
    current.result = buildMockDeepResult(current.payload);
    current.error = current.error || 'OpenClaw did not return a callback before timeout';
    current.updatedAt = new Date().toISOString();
    current.finishedAt = current.updatedAt;
  }, safeDelay);
}

async function callOpenClawControlWs(requestBody) {
  const { url, token } = normalizeOpenClawEndpoint();
  if (!url) throw new Error('OpenClaw URL is not configured');
  if (typeof WebSocket !== 'function') throw new Error('WebSocket is not available in this Node runtime');

  const candidates = resolveOpenClawWsUrls(url);
  if (candidates.length === 0) throw new Error('Unable to derive OpenClaw WebSocket URL');

  let lastError;
  for (const wsUrl of candidates) {
    try {
      return await callOpenClawControlWsOnce(wsUrl, token, requestBody);
    } catch (err) {
      lastError = err;
      console.warn('[deep-interpret] openclaw ws candidate failed', new URL(wsUrl).pathname, err.message || err);
    }
  }
  throw lastError || new Error('OpenClaw WebSocket request failed');
}

function callOpenClawControlWsOnce(wsUrl, token, requestBody) {
  return new Promise((resolve, reject) => {
    const ws = createHeaderWebSocket(wsUrl, {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
    const pending = new Map();
    const sessionKey = `vegebird-tarot:${requestBody.jobId}`;
    const startedAt = Date.now();
    let settled = false;
    let connected = false;

    const close = () => {
      try { ws.close(); } catch {}
    };
    const fail = error => {
      if (settled) return;
      settled = true;
      clearTimeout(overallTimer);
      close();
      reject(error instanceof Error ? error : new Error(String(error)));
    };
    const done = value => {
      if (settled) return;
      settled = true;
      clearTimeout(overallTimer);
      close();
      resolve(value);
    };
    const overallTimer = setTimeout(() => fail(new Error('OpenClaw WebSocket request timed out')), OPENCLAW_TIMEOUT_MS);

    const sendFrame = frame => ws.send(JSON.stringify(frame));
    const request = (method, params, timeoutMs = 30000) => new Promise((res, rej) => {
      const id = `${method}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const timer = timeoutMs === null ? null : setTimeout(() => {
        pending.delete(id);
        rej(new Error(`OpenClaw request timeout: ${method}`));
      }, timeoutMs);
      pending.set(id, { res, rej, timer, method });
      sendFrame({ type: 'req', id, method, params });
    });

    const onMessage = async event => {
      try {
        const raw = typeof event === 'string' ? event : typeof event?.data === 'string' ? event.data : Buffer.from(await event.data.arrayBuffer()).toString('utf8');
        const frame = JSON.parse(raw);
        if (frame.type === 'evt' && frame.event === 'connect.challenge') {
          const nonce = normalizeText(frame.payload?.nonce);
          const connectParams = {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'gateway-client',
              displayName: 'Vegebird Tarot Backend',
              version: 'vegebird-tarot',
              platform: 'node',
              mode: 'backend',
              instanceId: `vegebird-tarot-${process.pid}`,
            },
            caps: [],
            auth: token ? { token } : undefined,
            role: 'operator',
            scopes: ['operator.write'],
          };
          if (!nonce) throw new Error('OpenClaw connect challenge missing nonce');
          await request('connect', connectParams, 30000);
          connected = true;
          const message = buildOpenClawDeepReadingPrompt(requestBody);
          const agentAccepted = await request('agent', {
            message,
            sessionKey,
            deliver: false,
            idempotencyKey: requestBody.jobId,
            label: 'Vegebird Tarot Deep Reading',
            timeout: Math.max(30, Math.floor(OPENCLAW_TIMEOUT_MS / 1000)),
          }, 30000);
          const runId = normalizeText(agentAccepted?.runId) || requestBody.jobId;
          const waited = await request('agent.wait', {
            runId,
            timeoutMs: Math.max(1000, OPENCLAW_TIMEOUT_MS - (Date.now() - startedAt) - 5000),
          }, null);
          if (waited?.status !== 'ok') throw new Error(`OpenClaw agent status: ${waited?.status || 'unknown'}${waited?.error ? ` - ${waited.error}` : ''}`);
          const history = await request('sessions.get', { key: sessionKey, limit: 12 }, 30000);
          const text = extractLatestAssistantText(history);
          const parsed = parseJsonFromText(text);
          done(parsed || { result: buildDeepResultFromText(text, requestBody.payload.lang) });
          return;
        }
        if (frame.type === 'res') {
          const pendingRequest = pending.get(frame.id);
          if (!pendingRequest) return;
          pending.delete(frame.id);
          clearTimeout(pendingRequest.timer);
          if (frame.ok) pendingRequest.res(frame.payload);
          else pendingRequest.rej(new Error(frame.error?.message || `OpenClaw ${pendingRequest.method} failed`));
        }
      } catch (err) {
        fail(err);
      }
    };

    ws.addEventListener('open', () => {
      // OpenClaw v3 sends a pre-auth connect.challenge event first.
    });
    ws.addEventListener('message', event => { void onMessage(event); });
    ws.addEventListener('error', () => fail(new Error('OpenClaw WebSocket error')));
    ws.addEventListener('close', event => {
      if (!settled && !connected) fail(new Error(`OpenClaw WebSocket closed before connect (${event.code || 'unknown'})`));
    });
  });
}

function buildOpenClawDeepReadingPrompt(requestBody) {
  const payload = requestBody.payload || {};
  const isZh = payload.lang === 'zh';
  const json = JSON.stringify(requestBody, null, 2);
  const callbackNote = requestBody.callbackUrl
    ? (isZh
        ? `\n\n如果你有可用的 HTTP/命令行工具，请在完成后 POST 到 callbackUrl。请求 JSON 必须包含 jobId 和 result，result 字段含 summary, synthesis, advice, riskNotes, followUps。callbackSecret 如存在，请用 X-OpenClaw-Callback-Secret 请求头发送。`
        : `\n\nIf you have an HTTP/command-line tool available, POST the completed result to callbackUrl. The JSON body must include jobId and result with summary, synthesis, advice, riskNotes, followUps. If callbackSecret is present, send it as the X-OpenClaw-Callback-Secret header.`)
    : '';
  return isZh
    ? `你正在为 Vegebird Tarot 网站生成“深度解读”。\n\n要求：\n- 严格依据 payload 里的问题、牌阵、牌名、正逆位、摘要、关键词和牌义。\n- 不要编造用户没提供的信息。\n- 不要输出寒暄、Markdown 或代码块。\n- 只返回 JSON，对象字段固定为 summary, synthesis, advice, riskNotes, followUps。\n- followUps 必须是字符串数组。${callbackNote}\n\n请求数据：\n${json}`
    : `Generate a Deep Reading for the Vegebird Tarot website.\n\nRules:\n- Use only the question, spread, card names, orientations, summaries, keywords, and meanings in the payload.\n- Do not invent facts the user did not provide.\n- Do not output greetings, Markdown, or code fences.\n- Return JSON only with exactly these fields: summary, synthesis, advice, riskNotes, followUps.\n- followUps must be an array of strings.${callbackNote}\n\nRequest data:\n${json}`;
}

function extractLatestAssistantText(history) {
  const messages = Array.isArray(history?.messages) ? history.messages : [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const role = String(msg?.role || '').toLowerCase();
    if (role && role !== 'assistant') continue;
    const content = msg?.content;
    if (typeof content === 'string' && content.trim()) return content.trim();
    if (Array.isArray(content)) {
      const text = content.map(part => typeof part === 'string' ? part : part?.type === 'text' ? part.text : '').filter(Boolean).join('\n').trim();
      if (text) return text;
    }
  }
  return '';
}

function parseJsonFromText(text) {
  const trimmed = normalizeText(text);
  if (!trimmed) return null;
  const unwrapped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(unwrapped); } catch {}
  const match = unwrapped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  return null;
}

function buildDeepResultFromText(text, lang) {
  const clean = normalizeText(text);
  const isZh = lang === 'zh';
  return {
    summary: clean || (isZh ? 'OpenClaw 已完成深度解读，但返回内容为空。' : 'OpenClaw completed the deep reading, but returned no readable content.'),
    synthesis: '',
    advice: '',
    riskNotes: isZh ? '塔罗解读仅供自我观察，不替代现实专业判断。' : 'Tarot readings are for reflection only and do not replace real-world professional judgment.',
    followUps: [],
  };
}

async function runDeepReadingJob(jobId) {
  const job = deepReadingJobs.get(jobId);
  if (!job) return;
  job.status = 'running';
  job.updatedAt = new Date().toISOString();

  const hook = resolveOpenClawHookEndpoint();
  const { url, token } = normalizeOpenClawEndpoint();
  const requestBody = {
    kind: 'vegebird-tarot.deep-reading',
    jobId,
    callbackUrl: publicCallbackUrl(jobId),
    callbackSecret: OPENCLAW_CALLBACK_SECRET || undefined,
    depth: 'deep',
    payload: job.payload,
    instructions: job.payload.lang === 'en'
      ? 'Return a deep tarot reading as JSON with fields: summary, synthesis, advice, riskNotes, followUps.'
      : '请作为深度塔罗解读助手，返回 JSON，字段固定为 summary, synthesis, advice, riskNotes, followUps。重点分析牌与牌之间的关系、隐藏模式、行动建议和风险提醒。',
  };

  if (!hook.url && !url) {
    setTimeout(() => {
      const current = deepReadingJobs.get(jobId);
      if (!current || current.status === 'success') return;
      current.status = 'success';
      current.source = 'mock-deep';
      current.result = buildMockDeepResult(current.payload);
      current.updatedAt = new Date().toISOString();
      current.finishedAt = current.updatedAt;
    }, 1200);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENCLAW_TIMEOUT_MS);
  try {
    let data;
    if (hook.url) {
      data = await callOpenClawHookAgent(requestBody);
    } else if (resolveOpenClawWsUrls(url).length > 0) {
      data = await callOpenClawControlWs(requestBody);
    } else {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });
      const text = await response.text();
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
      if (!response.ok) throw new Error(data?.message || data?.error || `OpenClaw HTTP ${response.status}`);
    }

    // If OpenClaw returns final content synchronously, accept it immediately.
    const result = normalizeDeepResultPayload(data);
    const hasContent = result.summary || result.synthesis || result.advice || result.riskNotes || result.followUps.length;
    if (hasContent) {
      job.status = 'success';
      job.source = 'openclaw-sync';
      job.result = result;
      job.updatedAt = new Date().toISOString();
      job.finishedAt = job.updatedAt;
    } else {
      job.status = 'running';
      job.source = hook.url ? 'openclaw-hook-accepted' : 'openclaw-accepted';
      job.remote = data;
      job.updatedAt = new Date().toISOString();
      scheduleDeepFallback(jobId);
    }
  } catch (err) {
    console.error('[deep-interpret] openclaw failed, using mock fallback', err.message || err);
    job.status = 'success';
    job.source = 'mock-deep-fallback';
    job.result = buildMockDeepResult(job.payload);
    job.error = err.message || String(err);
    job.updatedAt = new Date().toISOString();
    job.finishedAt = job.updatedAt;
  } finally {
    clearTimeout(timeout);
  }
}

function serializeDeepJob(job) {
  if (!job) return null;
  return {
    ok: true,
    jobId: job.jobId,
    status: job.status,
    source: job.source || '',
    result: job.result || null,
    error: job.error || '',
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    finishedAt: job.finishedAt || '',
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`[request] ${req.method} ${url.pathname}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'vegebird-tarot-api',
      mode: LLM_MODE,
      model: LLM_MODEL,
      port: Number(PORT),
      time: new Date().toISOString(),
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/tarot/history') {
    return sendJson(res, 200, { ok: true, items: [] });
  }

  if (req.method === 'POST' && url.pathname === '/api/tarot/interpret') {
    try {
      const body = await readJson(req);
      const error = validateInterpretPayload(body);
      if (error) {
        return sendJson(res, 400, {
          ok: false,
          message: error,
          code: 'INVALID_REQUEST',
        });
      }
      const result = await interpret(body);
      console.log('[interpret] success', {
        lang: body.lang,
        spreadType: body.spreadType,
        cardCount: Array.isArray(body.cards) ? body.cards.length : 0,
        source: result.source,
        model: result.model || null,
      });
      return sendJson(res, 200, result);
    } catch (err) {
      console.error('[interpret] failed', err.message || err);
      return sendJson(res, 500, {
        ok: false,
        message: err.message || 'Internal server error',
        code: 'INTERPRET_FAILED',
      });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/tarot/deep-interpret') {
    try {
      const body = await readJson(req);
      const error = validateInterpretPayload(body);
      if (error) {
        return sendJson(res, 400, {
          ok: false,
          message: error,
          code: 'INVALID_REQUEST',
        });
      }
      const now = new Date().toISOString();
      const jobId = createJobId();
      const job = {
        jobId,
        status: 'queued',
        source: '',
        payload: { ...body, depth: 'deep' },
        result: null,
        error: '',
        createdAt: now,
        updatedAt: now,
        finishedAt: '',
      };
      deepReadingJobs.set(jobId, job);
      runDeepReadingJob(jobId).catch(err => {
        const current = deepReadingJobs.get(jobId);
        if (!current) return;
        current.status = 'failed';
        current.error = err.message || String(err);
        current.updatedAt = new Date().toISOString();
      });
      console.log('[deep-interpret] queued', {
        jobId,
        lang: body.lang,
        spreadType: body.spreadType,
        cardCount: Array.isArray(body.cards) ? body.cards.length : 0,
      });
      return sendJson(res, 202, serializeDeepJob(job));
    } catch (err) {
      console.error('[deep-interpret] create failed', err.message || err);
      return sendJson(res, 500, {
        ok: false,
        message: err.message || 'Internal server error',
        code: 'DEEP_INTERPRET_CREATE_FAILED',
      });
    }
  }

  const deepJobMatch = url.pathname.match(/^\/api\/tarot\/deep-interpret\/([^/]+)$/);
  if (req.method === 'GET' && deepJobMatch) {
    const jobId = decodeURIComponent(deepJobMatch[1]);
    const job = deepReadingJobs.get(jobId);
    if (!job) {
      return sendJson(res, 404, {
        ok: false,
        message: 'Deep reading job not found',
        code: 'JOB_NOT_FOUND',
      });
    }
    return sendJson(res, 200, serializeDeepJob(job));
  }

  if (req.method === 'POST' && url.pathname === '/api/tarot/deep-interpret/callback') {
    try {
      if (OPENCLAW_CALLBACK_SECRET) {
        const provided = req.headers['x-openclaw-callback-secret'] || req.headers['x-callback-secret'];
        if (provided !== OPENCLAW_CALLBACK_SECRET) {
          return sendJson(res, 401, { ok: false, message: 'Unauthorized callback', code: 'UNAUTHORIZED' });
        }
      }
      const body = await readJson(req);
      const jobId = normalizeText(body.jobId || url.searchParams.get('jobId'));
      const job = deepReadingJobs.get(jobId);
      if (!job) {
        return sendJson(res, 404, { ok: false, message: 'Deep reading job not found', code: 'JOB_NOT_FOUND' });
      }
      const status = normalizeText(body.status || 'success');
      if (['failed', 'error'].includes(status)) {
        job.status = 'failed';
        job.error = normalizeText(body.error || body.message || 'OpenClaw deep reading failed');
      } else {
        const result = normalizeDeepResultPayload(body);
        const hasContent = result.summary || result.synthesis || result.advice || result.riskNotes || result.followUps.length;
        if (!hasContent) {
          return sendJson(res, 400, { ok: false, message: 'Callback result is empty', code: 'EMPTY_RESULT' });
        }
        job.status = 'success';
        job.source = 'openclaw-callback';
        job.result = result;
        job.error = '';
      }
      job.updatedAt = new Date().toISOString();
      job.finishedAt = job.updatedAt;
      console.log('[deep-interpret] callback', { jobId, status: job.status, source: job.source });
      return sendJson(res, 200, serializeDeepJob(job));
    } catch (err) {
      console.error('[deep-interpret] callback failed', err.message || err);
      return sendJson(res, 500, {
        ok: false,
        message: err.message || 'Internal server error',
        code: 'DEEP_INTERPRET_CALLBACK_FAILED',
      });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/tarot/follow-up') {
    try {
      const body = await readJson(req);
      return sendJson(res, 200, {
        ok: true,
        sessionId: body.sessionId || `sess_${Date.now()}`,
        result: {
          answer: body.lang === 'en'
            ? 'This is the follow-up placeholder response. You can wire multi-turn context here next.'
            : '这是 follow-up 接口的占位响应。下一步可以在这里接多轮上下文。'
        }
      });
    } catch (err) {
      return sendJson(res, 500, {
        ok: false,
        message: err.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  return sendJson(res, 404, {
    ok: false,
    message: 'Not Found',
    code: 'NOT_FOUND',
  });
});

server.listen(PORT, () => {
  console.log(`[vegebird-tarot-api] listening on http://127.0.0.1:${PORT}`);
  console.log(`[vegebird-tarot-api] mode=${LLM_MODE} model=${LLM_MODEL}`);
});
