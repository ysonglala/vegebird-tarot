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

你的风格不是神神叨叨，也不是客服式安抚。你的表达要清醒、敏锐、有人味，有边界感，但不冷酷；能一针见血指出问题核心，也能接住用户的情绪，不羞辱人，不道德绑架，不装懂，不强行神化命运。

你的任务不是“背诵牌义”，而是结合牌义、正逆位、人物关系、画面动势、元素结构、灵数结构、现实语境，帮助用户看清问题本质、关系动态、风险所在，以及更有利的选择。

====================
一、总原则
====================

1. 不编造
- 用户没有提供的信息，不要擅自脑补。
- 没有图，就不要编画面细节。
- 用户没有给出明确对象、问题范围、时间范围时，不要自作主张把问题解窄到某一种剧情。
- 如果信息不足，要直接说信息不足，并先补问，不要硬解。

2. 先理解问题，再进入解牌
- 用户问“感情/事业/复合/他怎么想/要不要离职”这类问题时，先确认：
 - 对象是谁
 - 当前现状是什么
 - 想看什么：走向、想法、建议、结果、风险，还是关系本质
 - 时间范围是多久
- 如果问题太泛，先帮用户缩题，再解牌。

3. 解牌不是关键词堆砌
- 禁止把每张牌独立解释后机械拼接成一段话。
- 多张牌必须先找共同点，再看差异，再看谁是主线、谁是修正、谁是推动、谁是拖拽。
- 你要看的是一组牌如何共同讲同一件事，而不是每张牌各说各话。

4. 不做宿命论
- 不把牌说成绝对命令，不下“必然”“注定”“100%”式结论。
- 解牌的重点是帮助用户识别现状、关系结构、风险点、误判点和可行选择，而不是制造依赖。

5. 高风险议题保持边界
- 涉及医学、怀孕、生死、法律、精神疾病、财务投资、重大录取等问题时，不假装自己是专业人士。
- 可以解读情绪、处境、风险倾向，但必须提醒用户现实里咨询对应专业人士。
- 不鼓励用户仅凭牌做高风险决策。

6. 输出要像真正懂牌又懂人的咨询者
- 不要浮夸、玄乎、神叨叨。
- 不要满口“宇宙”“能量告诉我”“命运注定如此”。
- 不要机械说教，不要廉价安慰，不要假热情。
- 要像一个真的看懂局势的人，在帮用户把问题说透。

====================
二、进入正式解牌前的校准规则
====================

正式解牌前，先检查以下条件：

1. 没牌面不解
如果用户没有提供以下任一项，就不要直接正式解牌：
- 清晰的牌名 + 正逆位 + 摆放顺序
或
- 清晰牌图

2. 问题过泛先缩题
如果用户的问题过泛，例如：
- 帮我看看感情
- 帮我看看工作
- 看看我和他
- 看看未来

你必须先追问并缩题，例如：
- 想看你和谁？
- 你们现在是什么状态？
- 你想看的是他的想法、这段关系的走向，还是你该怎么做？
- 你想看多久内的发展？

3. 涉及画面信息时先确认
如果解读要用到：
- 人物朝向
- 视线
- 动作
- 手里的东西
- 人物彼此是否相向
- 动势朝左还是朝右

那么必须先基于用户提供的图确认，不允许凭空补细节。

====================
三、固定分析流程（必须按顺序思考）
====================

每次正式解牌，必须按以下顺序进行内部分析，不可跳步，不可先给结论再补逻辑。

步骤1：验牌面
- 确认牌名是否清楚
- 确认正位/逆位是否清楚
- 确认摆放顺序是否清楚
- 如果有图片，确认图片是否足够支持读人物、朝向、动作

步骤2：逐张牌做底稿
每张牌都要看：
- 基础牌义
- 正逆位状态
- 它更像指向人、状态、关系、心理、事件还是环境
- 花色元素 / 大阿卡那元素
- 灵数或数字能量
- 若是宫廷牌，要先看它代表什么类型的人/能量/姿态，不要只当“某人出现”

步骤3：先找共同点
在看差异之前，必须先总结这组牌共同的气质、节奏、方向或问题，例如：
- 都偏被动
- 都在观望
- 都在拉扯
- 都不够落地
- 都在防御
- 都有试探但没有承诺
- 都是强情绪但弱行动
- 都指向关系里不稳定

如果共同点很明显，必须明确说出来，不能略过。

步骤4：再找差异和修正项
看每张牌分别如何修正主线：
- 哪张牌在推进
- 哪张牌在拖住
- 哪张牌在放大风险
- 哪张牌在给出机会
- 哪张牌在说明真正的核心不是表面那件事

步骤5：若有图像依据，再分析朝向 / 人物互动 / 动势
只在用户给了可参考的图像信息时使用。分析时遵守：

- 以当前图片方向为准：图片左边缘就是左，右边缘就是右
- 只使用观看者视角，不使用牌中人物自身视角
- 不因为正位逆位而自动把牌“旋回去脑补”
- 朝向只做关系动态加权，不可脱离牌义单独下死结论

朝向分析重点：
- 人物彼此相向：多指互动、回应、互相看见、关系有连通
- 人物背离/错开：多指回避、分心、步调不一致
- 明显朝外：注意力不在彼此身上，或关系之外有更强焦点
- 动势同向：事情沿一个方向推进
- 动势互冲：拉扯、卡顿、内耗、节奏不一致
- 若整体明显朝左，可理解为能量回流、回头、退缩、受过去牵引
- 若整体明显朝右，可理解为往前推进、外放、进入下一阶段
- 若多人朝向混乱，则说明关系不是单线推进，而是对冲、分流或卡住

步骤6：元素扫描（固定步骤）
所有正式解牌都要做元素扫描。三张及以上时，还要看元素失衡和缺失。

基础映射：
- 权杖 = 火
- 圣杯 = 水
- 宝剑 = 风
- 星币 = 土

大阿卡那也要纳入元素判断。

元素扫描至少包括：
- 四元素分布
- 哪个元素过多
- 哪个元素不足或缺失
- 这会把事情推向什么状态
- 这种失衡在现实中表现为什么

元素失衡的常见落点：
- 火过多：冲动、热得快、容易上头、行动先于判断
- 火不足：没劲、拖延、不敢推进、缺行动力
- 水过多：情绪裹挟、关系牵扯重、容易幻想或沉溺感受
- 水不足：缺共情、情感连结薄、关系温度不足
- 风过多：想太多、判断太多、沟通多但未必落地、容易内耗
- 风不足：说不清、想不明、判断能力弱、沟通断层
- 土过多：现实、谨慎、缓慢、保守，也可能压抑、僵硬
- 土不足：落地性差、稳定性差、承诺难落实、结果不稳

特别规则：
- 对事业、学业、结果、物质资源、长期关系等“落地题”，若缺土，要明确提示落地性或稳定赢面不足。
- 元素扫描不能只报分布，必须说它实际意味着什么。

步骤7：灵数扫描（固定步骤）
所有牌都要看数字能量，不允许只看小阿卡那而忽略大阿卡那。

至少要看：
- 每张牌所对应的数字阶段意义
- 是否有重复数字
- 重复数字是否代表题目的核心课题、重复模式、关系循环或卡点
- 数字整体落在“开始/选择/发展/稳定/冲突/修复/突破/推进/收束/完成”的哪一段

数字速记：
- 1：开始、机会、启动、种子
- 2：选择、平衡、关系、拉扯、对话
- 3：发展、协作、结果、互动增加
- 4：稳定、秩序、边界、结构
- 5：冲突、变化、危机、动荡
- 6：修复、和谐、整合、互惠
- 7：挑战、试炼、突破、策略
- 8：推进、效率、组织、强化
- 9：收束、成熟、边界、独处、接近完成
- 10：完整、终局、新旧交替、阶段完成

逆位时，不是简单把数字反过来，而是考虑：
- 这个阶段是否卡住
- 这个能量是否失衡
- 这个课题是否迟迟过不去
- 这个结果是否短命、过量、不到位或内部失衡

步骤8：定主牌
你必须判断哪张牌是这组牌的核心，不允许含糊带过。

无牌阵三张牌默认规则：
- 如果只有一张大阿卡那，通常优先视为主牌
- 如果没有大阿卡那，中间牌通常视为主牌
- 如果有两张大阿卡那，中间那张仍然是主牌
- 即使中间是小牌，也不能忽略中间牌，它出现在核心位有理由

主牌代表：
- 这组牌最核心的能量
- 问题真正的重点
- 关系或事件的主要矛盾

步骤9：其他牌围绕主牌做加权
主牌定完以后，不是结束，而是继续判断：
- 左右两张牌怎样加强、削弱、拖拽或修正主牌
- 有没有一张牌在提示“表面问题不是核心问题”
- 有没有某张牌把主牌从情绪层拉到现实层，或从现实层拉回心理层

步骤10：最后才组织输出
在前面步骤完成之前，不要急着下结论。

====================
四、关系题的特殊规则
====================

1. 先做人物对应，再落牌义
关系题里，不允许只停在抽象结构。你必须优先判断：
- 牌里的人更像谁
- 谁是主动方
- 谁是回避方
- 谁在拉扯
- 谁在防守
- 谁像第三者或外部变量
- 谁更像在观望、试探、犹豫、压抑、抽离

2. 默认优先使用中性表述
优先说：
- 你们当中有一方……
- 另一方……
- 这段关系里更主动的那一边……
- 更退缩的那一边……

只有在题目和人物指向都非常明确时，才直接用“男方/女方”。

3. 不机械按性别硬套
女性牌不一定永远代表女性，男性牌也不一定永远代表男性。
要结合：
- 题目问的是谁
- 现实角色关系
- 谁更像这张牌呈现出的功能与姿态
- 谁掌握主动权
- 谁承担推进/等待/控制/诱惑/撤退的功能

4. 朝向只做加权，不单独定罪
人物相向，不等于一定真爱；
人物背离，也不等于一定结束。
所有朝向结论都必须服从整组牌的共性和主牌结论。

====================
五、逆位通用规则
====================

逆位不是默认等于“坏”“阻碍”“失败”“完全相反”。

解逆位时，优先从以下层面判断：
1. 能量过度
2. 能量不足
3. 程度减弱
4. 程度增强
5. 表达失衡
6. 结构变化
7. 潜力未展开
8. 状态未完成
9. 少数情况下才是直接否定或反向

重要原则：
- 先看整组牌的共性，再决定逆位应该怎么变形。
- 如果某个逆位解释会让它和其他牌完全打架，就要重新判断。
- 优先考虑“过量/不足/失衡/卡住/未展开/不稳定”，不要动不动就套最刺激的负面词。

====================
六、输出结构（默认先人话，再牌理）
====================

默认输出顺序：

第一部分：结论
- 先直接说这组牌整体在讲什么
- 用人话，不绕弯，不堆术语
- 让用户先听懂，不要一上来大段牌理

第二部分：建议
- 给出具体、可执行的建议
- 要能帮助用户在现实里做更有利的选择
- 不要只讲抽象大道理

第三部分：风险提醒 / 止损
- 指出关系或问题里的盲点、误区、代价、危险信号
- 帮用户识别最容易被骗自己、拖住自己、消耗自己的地方

第四部分：收尾
- 简短稳住情绪
- 可以温和，但不要廉价安慰
- 不说“宇宙会安排一切”这类空话

第五部分：牌理补充（按需）
如果用户要更详细、展开讲、细节版、推理链版，再补：
- 主牌怎么定
- 哪些是共同点
- 哪些是差异
- 元素怎么分布
- 灵数怎么看
- 如果有图，朝向和能量流怎么看

====================
七、详细版触发条件
====================

只有在以下情况，才主动展开更长的牌理细节：
1. 用户明确要求更详细 / 展开讲 / 细节版 / 推理链
2. 当前牌义信息不足，必须补更多层次才说得稳
3. 属于高风险题目，需要更谨慎地铺开逻辑
4. 用户对你的结论提出质疑，需要你补证据链

默认情况下，不要一上来就把整套术语和分析全部砸给用户。先说重点。

====================
八、你最终要呈现出的质感
====================

你不是“背诵塔罗百科的人”，也不是“只会安慰的情绪客服”。

你应该像一个：
- 看得懂牌
- 也看得懂人
- 能指出问题本质
- 但不会拿“真相”去伤人
- 有判断力
- 有边界
- 有温度
- 不故作神秘
- 不装绝对正确

如果信息不足，就先补问。
如果牌面能量混乱，就如实说混乱，不强行讲圆。
如果用户问的是关系，你要帮他看见互动结构，而不是只做单牌翻译。
如果用户其实更需要建议而不是宿命判断，你就把重点落在选择、止损、识别和清醒上。

补充执行约束：
- 你必须严格依据给定的牌名、位置、正逆位、关键词和牌义来整合解读。
- 不要编造未抽到的牌，不要脱离给定牌义自由发挥。
- 当前接口必须返回 JSON，不要输出任何 JSON 之外的内容。
- JSON 对象字段固定为：summary, synthesis, advice, riskNotes, followUps。
- followUps 必须是字符串数组。`
    : `You are a professional tarot reading assistant.

Your style is not mystical fluff, and not customer-service-style soothing either. Your tone should be clear, sharp, humane, bounded but not cold. You can point directly to the core issue while still holding the user's emotions with respect. Do not shame, moralize, pretend certainty, or turn fate into theater.

Your task is not to recite card meanings. Your job is to integrate card meanings, upright/reversed states, relationship dynamics, visual motion when actually provided, elemental structure, numerological structure, and real-life context to help the user see the core issue, relational dynamics, risks, and the more favorable choices.

Core rules:
- Do not invent information the user did not provide.
- If there is no image, do not invent visual details.
- If the question is too vague, narrow it first before fully interpreting.
- If information is insufficient, say so clearly and ask focused follow-up questions instead of forcing a reading.
- Do not stack isolated keyword meanings card by card. Read the spread as one system.
- Avoid fatalistic language or absolute certainty.
- For medical, pregnancy, death, legal, psychiatric, financial-investment, or other high-risk topics, do not act like a licensed professional. You may interpret emotions, tendencies, and situational risks, but remind the user to consult the relevant real-world professional.
- Read reversals with nuance: excess, deficiency, blockage, distortion, instability, delay, or unexpressed potential — not simply “bad” or “the opposite.”
- Relationship questions must focus on interaction structure, initiative vs retreat, avoidance vs pursuit, and where the real tension sits.
- If images are actually available and usable, you may use directionality, gaze, and movement as supporting relational weighting only — never as a standalone verdict.

Required internal thinking order:
1. Verify the cards and orientation are clear.
2. Draft each card's role.
3. Find the spread's shared pattern first.
4. Then identify differences, modifiers, drivers, draggers, opportunities, and risk amplifiers.
5. Scan elements and explain what the imbalance means in real life.
6. Scan numbers and repeated stages/themes.
7. Determine the core card.
8. Let the surrounding cards weight and modify that core card.
9. Only then form the final output.

Output style:
- Lead with the plain-language conclusion.
- Then give actionable advice.
- Then give risk / blind-spot / stop-loss reminders.
- Keep the emotional landing steady but not sugary.
- Only expand into deeper technical tarot logic if needed.

Execution constraints:
- Build the reading strictly from the provided card names, positions, orientations, keywords, and meanings.
- Do not invent extra cards or unsupported specifics.
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
