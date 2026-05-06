const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 8787;
const LLM_MODE = process.env.VEGE_TAROT_LLM_MODE || 'mock'; // mock | openai-compatible
const LLM_BASE_URL = process.env.VEGE_TAROT_LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_API_KEY = process.env.VEGE_TAROT_LLM_API_KEY || '';
const LLM_MODEL = process.env.VEGE_TAROT_LLM_MODEL || 'gpt-4.1-mini';
const LLM_TIMEOUT_MS = Number(process.env.VEGE_TAROT_LLM_TIMEOUT_MS || 60000);

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

function getClarifyFields(body) {
  return {
    subject: normalizeText(body?.clarifySubject),
    situation: normalizeText(body?.clarifySituation),
    focus: normalizeText(body?.clarifyFocus),
    timeframe: normalizeText(body?.clarifyTimeframe),
    extra: normalizeText(body?.clarifyInput),
  };
}

function buildMergedQuestion(body) {
  const base = normalizeText(body?.originalQuestion || body?.question);
  const fields = getClarifyFields(body);
  const lines = [];
  if (base) lines.push(base);
  if (fields.subject) lines.push(`对象/事情：${fields.subject}`);
  if (fields.situation) lines.push(`当前状态：${fields.situation}`);
  if (fields.focus) lines.push(`最想看：${fields.focus}`);
  if (fields.timeframe) lines.push(`时间范围：${fields.timeframe}`);
  if (fields.extra) lines.push(`补充信息：${fields.extra}`);
  return lines.join('\n');
}

function shouldClarify(body) {
  const question = normalizeText(body?.originalQuestion || body?.question);
  const spreadType = normalizeText(body?.spreadType);
  const cardCount = Array.isArray(body?.cards) ? body.cards.length : 0;
  const fields = getClarifyFields(body);
  const structuredCount = [fields.subject, fields.situation, fields.focus, fields.timeframe].filter(Boolean).length;
  if (!cardCount) {
    return { need: true, reason: 'missing-cards' };
  }
  if (!question && structuredCount === 0 && !fields.extra) {
    return { need: true, reason: 'missing-question' };
  }
  if (question && isQuestionTooVague(question, body.lang) && structuredCount < 2 && !fields.extra) {
    return { need: true, reason: 'vague-question' };
  }
  if (spreadType === 'blank3' && !question && structuredCount < 2 && !fields.extra) {
    return { need: true, reason: 'thin-context' };
  }
  if (spreadType === 'blank3' && question && question.length < 8 && structuredCount < 2 && !fields.extra) {
    return { need: true, reason: 'thin-context' };
  }
  return { need: false, reason: '' };
}

function buildClarifyResult(body, reason = 'missing-context') {
  const isZh = body.lang === 'zh';
  return {
    ok: true,
    mode: 'clarify',
    sessionId: body.sessionId || `sess_${Date.now()}`,
    drawId: body.drawId || `draw_${Date.now()}`,
    source: 'rules',
    reason,
    result: isZh ? {
      summary: '这次我不建议直接硬解，因为你给的问题边界还不够清楚。牌可以继续看，但先缩题，结果会准很多。',
      synthesis: '现在缺的不是牌，而是问题的落点：对象是谁、当前是什么状态、你最想看的到底是走向、对方想法、建议还是结果。题目一泛，解读就容易变成看起来都对、实际上不够准。',
      advice: '先把问题补到能落地：1）你想看谁/什么事；2）现在处于什么状态；3）你最想看哪一个维度；4）你想看多久内的发展。你补完这些，我再正式整合整组牌。',
      riskNotes: '现在最容易出的问题，不是牌面不够，而是把模糊问题硬套进具体剧情。这样会让解读听起来很满，但真正可用的信息反而不高。',
      followUps: [
        '你想看的是你和谁，或者哪一件具体的事？',
        '你们现在是什么状态 / 这件事现在推进到哪一步了？',
        '你更想看走向、对方想法、建议、风险，还是最终结果？',
        '你想看多久内的发展？'
      ]
    } : {
      summary: 'I would not force a full reading yet, because the question is still too broad or underdefined.',
      synthesis: 'What is missing right now is not the cards but the target of the question: who or what this is about, the current situation, and whether you want direction, thoughts, advice, risk, or outcome. If the question stays too broad, the reading becomes less useful.',
      advice: 'Narrow the question first: 1) who or what this is about, 2) the current situation, 3) what you most want to know, and 4) the time frame you care about. Once that is clear, the reading can become much sharper.',
      riskNotes: 'The biggest risk right now is not the spread itself, but forcing a vague question into a specific story and mistaking a plausible reading for an accurate one.',
      followUps: [
        'Who or what exactly do you want to read about?',
        'What is the current situation right now?',
        'Do you want direction, their thoughts, advice, risk, or outcome?',
        'What time frame do you want to look at?'
      ]
    }
  };
}

function buildMockInterpretResult(body) {
  const isZh = body.lang === 'zh';
  const cards = Array.isArray(body.cards) ? body.cards : [];
  const names = cards.map(c => `${c.name}${c.orientation === 'upright' ? (isZh ? '正位' : ' (Upright)') : (isZh ? '逆位' : ' (Reversed)')}`);
  const spreadName = body.spreadName || body.spreadType || (isZh ? '当前牌阵' : 'Current spread');
  const question = buildMergedQuestion(body) || (isZh ? '未提供具体问题' : 'No specific question was provided');

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
  const question = buildMergedQuestion(body) || (isZh ? '未填写' : 'Not filled in');
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
- 问题太泛时先缩题；如果信息仍不足，就明确指出不足，而不是硬解。
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
- If the question is too broad, narrow it before forcing a reading.
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
  const clarify = shouldClarify(body);
  if (clarify.need) {
    return buildClarifyResult(body, clarify.reason);
  }
  if (LLM_MODE === 'openai-compatible') {
    const result = await callOpenAICompatible(body);
    return { ...result, mode: 'reading' };
  }
  return { ...buildMockInterpretResult(body), mode: 'reading' };
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
