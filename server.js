const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 8787;
const LLM_MODE = process.env.VEGE_TAROT_LLM_MODE || 'mock'; // mock | openai-compatible
const LLM_BASE_URL = process.env.VEGE_TAROT_LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_API_KEY = process.env.VEGE_TAROT_LLM_API_KEY || '';
const LLM_MODEL = process.env.VEGE_TAROT_LLM_MODEL || 'gpt-4.1-mini';
const LLM_TIMEOUT_MS = Number(process.env.VEGE_TAROT_LLM_TIMEOUT_MS || 25000);

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

function buildMockInterpretResult(body) {
  const isZh = body.lang === 'zh';
  const cards = Array.isArray(body.cards) ? body.cards : [];
  const names = cards.map(c => `${c.name}${c.orientation === 'upright' ? (isZh ? '正位' : ' (Upright)') : (isZh ? '逆位' : ' (Reversed)')}`);
  const spreadName = body.spreadName || body.spreadType || (isZh ? '当前牌阵' : 'Current spread');
  const question = normalizeText(body.question) || (isZh ? '未提供具体问题' : 'No specific question was provided');

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
  const question = normalizeText(body.question) || (isZh ? '未填写' : 'Not filled in');
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
    ? '你是一名克制、清晰、 grounded 的塔罗解牌助手。必须严格依据给定的牌名、位置、正逆位、关键词和牌义来整合解读。不要编造未抽到的牌，不要输出宿命论，不要脱离给定牌义自由发挥。请只返回 JSON。'
    : 'You are a grounded, clear tarot reading assistant. Build the reading strictly from the provided card names, positions, orientations, keywords, and meanings. Do not invent extra cards. Avoid fatalistic prediction. Do not drift away from the provided meanings. Return JSON only.';

  const user = isZh
    ? `问题：${question}\n牌阵：${spreadName}\n\n抽到的牌：\n${cards}\n\n请只返回 JSON，对象字段固定为：\nsummary\nsynthesis\nadvice\nriskNotes\nfollowUps\n\n其中 followUps 必须是字符串数组。`
    : `Question: ${question}\nSpread: ${spreadName}\n\nCards:\n${cards}\n\nReturn JSON only with these exact fields:\nsummary\nsynthesis\nadvice\nriskNotes\nfollowUps\n\nfollowUps must be an array of strings.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
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
    let parsed;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      throw new Error(`Model content is not valid JSON: ${String(content).slice(0, 300)}`);
    }

    const result = {
      summary: normalizeText(parsed?.summary),
      synthesis: normalizeText(parsed?.synthesis),
      advice: normalizeText(parsed?.advice),
      riskNotes: normalizeText(parsed?.riskNotes),
      followUps: Array.isArray(parsed?.followUps)
        ? parsed.followUps.map(item => normalizeText(item)).filter(Boolean)
        : [],
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
      source: 'llm',
      model: LLM_MODEL,
      result,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function interpret(body) {
  if (LLM_MODE === 'openai-compatible') {
    return callOpenAICompatible(body);
  }
  return buildMockInterpretResult(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

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
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 500, {
        ok: false,
        message: err.message || 'Internal server error',
        code: 'INTERPRET_FAILED',
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
