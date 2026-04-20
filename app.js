/* Mystic Cat Tarot — blind pick spreads flow */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const el = (tag, cls) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

function beep(type = 'flip') {
  if (!state.sound) return;
  if (!state._ac) {
    try { state._ac = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return; }
  }
  const ac = state._ac;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  const t0 = ac.currentTime;
  const freq = type === 'shuffle' ? 140 : type === 'flip' ? 420 : 260;
  o.frequency.setValueAtTime(freq, t0);
  o.type = 'triangle';
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
  o.start(t0);
  o.stop(t0 + 0.16);
}

const MAJOR = [
  { name: '愚者', subtitle: '开始 / 信任 / 自由', up: '新的旅程正在召唤你。先迈出第一步，答案会在路上出现。', rev: '别把冲动当勇敢。先弄清你在逃避什么，再出发。' },
  { name: '魔术师', subtitle: '意志 / 资源 / 显化', up: '你手里已经有足够的材料。把注意力集中在一个动作。', rev: '你可能在分散精力或自我欺骗。收回承诺，先做最小闭环。' },
  { name: '女祭司', subtitle: '直觉 / 潜意识 / 静观', up: '答案不是更多信息，而是更安静。', rev: '你在忽略直觉，或把猜测当预感。先验证，再相信。' },
  { name: '女皇', subtitle: '滋养 / 丰盛 / 关系', up: '照顾好自己，你自然就会变得更有吸引力与创造力。', rev: '过度付出会让你枯竭。先把边界摆出来。' },
  { name: '皇帝', subtitle: '秩序 / 规则 / 主导', up: '该你定规矩了：目标、期限、标准。权力来自清晰。', rev: '控制欲可能在反噬你。把管住一切改成管住关键。' },
  { name: '教皇', subtitle: '传统 / 学习 / 认可', up: '向成熟的体系靠拢：找导师、找标准、找结构化方法。', rev: '你不需要谁来盖章。打破旧规则，但别把基础也拆掉。' },
  { name: '恋人', subtitle: '选择 / 对齐 / 联结', up: '做一个与你价值观一致的选择。', rev: '停止两边讨好，先选一边承担后果。' },
  { name: '战车', subtitle: '推进 / 胜利 / 速度', up: '现在适合强势推进。把杂音降到最低，按计划冲。', rev: '方向不清会让努力变成内耗。先校准目标，再加速。' },
  { name: '力量', subtitle: '温柔的掌控 / 勇气', up: '你不需要咆哮也能赢。', rev: '承认脆弱，是重新获得力量的开始。' },
  { name: '隐者', subtitle: '独处 / 深思 / 内在导师', up: '先问自己：我真正想要什么？', rev: '允许可信的人靠近一点。' },
  { name: '命运之轮', subtitle: '周期 / 转机 / 变化', up: '风向在变。抓住窗口期，顺势而为。', rev: '先止损或复盘，再等下一个轮回。' },
  { name: '正义', subtitle: '平衡 / 责任 / 因果', up: '把事实摆在台面上。公平来自对等与清晰的规则。', rev: '回到证据与边界。' },
  { name: '倒吊人', subtitle: '暂停 / 换角度 / 牺牲', up: '先别动。换个视角，你会发现卡住其实在保护你。', rev: '做一个小动作打破僵局。' },
  { name: '死神', subtitle: '结束 / 断舍离 / 新生', up: '旧的必须结束，新的才能开始。', rev: '越拖越痛，越快放下越轻。' },
  { name: '节制', subtitle: '调和 / 复原 / 渐进', up: '慢慢来，但别停。', rev: '把全有或全无改成可持续。' },
  { name: '恶魔', subtitle: '欲望 / 依赖 / 诱惑', up: '看清你被什么绑住。意识到就已经在松动。', rev: '你正在挣脱束缚。别再回头确认。' },
  { name: '塔', subtitle: '崩塌 / 真相 / 觉醒', up: '如果要塌，就让它塌。真相会让你更自由。', rev: '小崩不修，会变成大崩。' },
  { name: '星星', subtitle: '希望 / 指引 / 疗愈', up: '保持信心，继续走。', rev: '先补给自己：睡眠、食物、朋友、阳光。' },
  { name: '月亮', subtitle: '迷雾 / 情绪 / 潜影', up: '别急着下结论，先穿过迷雾。', rev: '用具体行动验证，不要靠脑补。' },
  { name: '太阳', subtitle: '清晰 / 喜悦 / 成功', up: '事情会变得更明朗。你值得被看见。', rev: '把计划补齐，别只靠好运。' },
  { name: '审判', subtitle: '召唤 / 复盘 / 重启', up: '是时候做一次决定性的复盘与升级。', rev: '别再等完美时机。' },
  { name: '世界', subtitle: '完成 / 整合 / 远行', up: '阶段性圆满。收尾、发布、庆祝，然后进入更大的地图。', rev: '补上最后的细节，不要半途而废。' },
];

const MINOR_RANKS = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王'];
const SUITS = [
  { name: '权杖', subtitle: '行动 / 欲望 / 推进' },
  { name: '圣杯', subtitle: '情感 / 关系 / 感受' },
  { name: '宝剑', subtitle: '思考 / 冲突 / 决断' },
  { name: '星币', subtitle: '现实 / 金钱 / 落地' },
];

const PRESET_SPREADS = {
  'blank3': { key: 'blank3', name: '无牌阵三张', labels: ['第一张', '第二张', '第三张'], desc: '默认 · 三张无固定解释位置' },
  'past-present-future': { key: 'past-present-future', name: '过去 / 现在 / 未来', labels: ['过去', '现在', '未来'], desc: '经典三张时间线牌阵' },
  'time-flow': { key: 'time-flow', name: '时间流', labels: ['现在', '未来', '更远的未来'], desc: '更强调后续发展' },
  'cause-process-result': { key: 'cause-process-result', name: '起因 / 过程 / 结果', labels: ['起因', '过程', '结果'], desc: '适合看事件发展' },
  'choice2': { key: 'choice2', name: '二选一牌阵', labels: ['现况', '选择A的近未来', '选择B的近未来', '选择A的结果', '选择B的结果'], desc: '用于比较两个选择的短期走向与最终结果' },
};

const STEP_ORDER = ['intro', 'spread', 'shuffle', 'pick', 'result'];
const CARD_IMAGE_BY_NAME = {
  '愚者': 'assets/imported-deck/card-01.png',
  '魔术师': 'assets/imported-deck/card-02.png',
  '女祭司': 'assets/imported-deck/card-03.png',
  '女皇': 'assets/imported-deck/card-04.png',
  '皇帝': 'assets/imported-deck/card-05.png',
  '教皇': 'assets/imported-deck/card-06.png',
  '恋人': 'assets/imported-deck/card-07.png',
  '战车': 'assets/imported-deck/card-08.png',
  '力量': 'assets/imported-deck/card-09.png',
  '隐者': 'assets/imported-deck/card-10.png',
  '命运之轮': 'assets/imported-deck/card-11.png',
  '倒吊人': 'assets/imported-deck/card-12.png',
  '死神': 'assets/imported-deck/card-13.png',
  '塔': 'assets/imported-deck/card-14.png',
  '月亮': 'assets/imported-deck/card-15.png',
  '星星': 'assets/imported-deck/card-16.png',
  '节制': 'assets/imported-deck/card-17.png',
  '恶魔': 'assets/imported-deck/card-18.png',
  '太阳': 'assets/imported-deck/card-19.png',
  '世界': 'assets/imported-deck/card-20.png',
  '正义': 'assets/imported-deck/card-21.png',
  '圣杯王牌': 'assets/imported-deck/card-22.png',
  '圣杯国王': 'assets/imported-deck/card-23.png',
  '圣杯王后': 'assets/imported-deck/card-24.png',
  '圣杯骑士': 'assets/imported-deck/card-25.png',
  '圣杯侍从': 'assets/imported-deck/card-26.png',
  '圣杯二': 'assets/imported-deck/card-27.png',
  '圣杯三': 'assets/imported-deck/card-28.png',
  '圣杯四': 'assets/imported-deck/card-29.png',
  '圣杯五': 'assets/imported-deck/card-30.png',
  '圣杯八': 'assets/imported-deck/card-31.png',
  '圣杯十': 'assets/imported-deck/card-32.png',
  '圣杯九': 'assets/imported-deck/card-33.png',
  '圣杯七': 'assets/imported-deck/card-34.png',
  '圣杯六': 'assets/imported-deck/card-35.png',
  '权杖王牌': 'assets/imported-deck/card-36.png',
  '权杖二': 'assets/imported-deck/card-37.png',
  '权杖三': 'assets/imported-deck/card-38.png',
  '权杖四': 'assets/imported-deck/card-39.png',
  '权杖六': 'assets/imported-deck/card-40.png',
  '权杖七': 'assets/imported-deck/card-41.png',
  '权杖五': 'assets/imported-deck/card-42.png',
  '权杖八': 'assets/imported-deck/card-43.png',
  '权杖九': 'assets/imported-deck/card-44.png',
  '权杖侍从': 'assets/imported-deck/card-45.png',
  '权杖骑士': 'assets/imported-deck/card-46.png',
  '权杖王后': 'assets/imported-deck/card-47.png',
  '权杖国王': 'assets/imported-deck/card-48.png',
  '权杖十': 'assets/imported-deck/card-49.png',
  '星币王牌': 'assets/imported-deck/card-50.png',
  '星币二': 'assets/imported-deck/card-51.png',
  '星币三': 'assets/imported-deck/card-52.png',
  '星币五': 'assets/imported-deck/card-53.png',
  '星币四': 'assets/imported-deck/card-54.png',
  '星币六': 'assets/imported-deck/card-55.png',
  '星币七': 'assets/imported-deck/card-56.png',
  '星币八': 'assets/imported-deck/card-57.png',
  '星币十': 'assets/imported-deck/card-58.png',
  '星币侍从': 'assets/imported-deck/card-59.png',
  '星币骑士': 'assets/imported-deck/card-60.png',
  '星币王后': 'assets/imported-deck/card-61.png',
  '星币国王': 'assets/imported-deck/card-62.png',
  '星币九': 'assets/imported-deck/card-63.png',
  '宝剑王牌': 'assets/imported-deck/card-64.png',
  '宝剑二': 'assets/imported-deck/card-65.png',
  '宝剑三': 'assets/imported-deck/card-66.png',
  '宝剑四': 'assets/imported-deck/card-67.png',
  '宝剑五': 'assets/imported-deck/card-68.png',
  '宝剑六': 'assets/imported-deck/card-69.png',
  '宝剑七': 'assets/imported-deck/card-70.png',
  '宝剑八': 'assets/imported-deck/card-71.png',
  '宝剑九': 'assets/imported-deck/card-72.png',
  '宝剑骑士': 'assets/imported-deck/card-73.png',
  '宝剑侍从': 'assets/imported-deck/card-74.png',
  '宝剑王后': 'assets/imported-deck/card-75.png',
  '宝剑国王': 'assets/imported-deck/card-76.png',
  '宝剑十': 'assets/imported-deck/card-77.png',
  '审判': 'assets/imported-deck/card-78.png'
};

const state = {
  motion: 0.70,
  sound: false,
  question: '',
  currentScreen: 'intro',
  base78: [],
  encoded156: [],
  shuffled78: [],
  shuffled156: [],
  picks: [],
  drawn: [],
  selectedSpreadKey: 'blank3',
  spread: { ...PRESET_SPREADS['blank3'] },
  phase: 'idle',
  activeDetailIndex: -1,
  activeLightboxIndex: -1,
  tarotDict: {},
  tarotDictLoaded: false,
  _ac: null,
};

function setupStars() {
  const c = $('#stars');
  const ctx = c.getContext('2d');
  const stars = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.floor(window.innerWidth * dpr);
    c.height = Math.floor(window.innerHeight * dpr);
    c.style.width = '100%';
    c.style.height = '100%';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars.length = 0;
    const n = Math.floor((window.innerWidth * window.innerHeight) / 11000);
    for (let i = 0; i < n; i++) stars.push({ x: rnd(0, window.innerWidth), y: rnd(0, window.innerHeight), r: rnd(0.4, 1.6), a: rnd(0.25, 0.95), tw: rnd(0.6, 1.6), s: rnd(0.05, 0.22) });
  }
  let t = 0;
  function draw() {
    t += 0.016;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const g = ctx.createRadialGradient(window.innerWidth * 0.3, window.innerHeight * 0.15, 0, window.innerWidth * 0.3, window.innerHeight * 0.15, Math.max(window.innerWidth, window.innerHeight) * 0.9);
    g.addColorStop(0, 'rgba(169,140,255,0.06)');
    g.addColorStop(0.6, 'rgba(123,240,255,0.03)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(t * s.tw + s.x * 0.01);
      ctx.fillStyle = `rgba(244,241,255,${s.a * tw})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.s * (0.5 + 1.2 * (1 - state.motion));
      if (s.y > window.innerHeight + 10) {
        s.y = -10;
        s.x = Math.random() * window.innerWidth;
      }
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize();
  draw();
}

function buildBase78() {
  const cards = [];
  MAJOR.forEach((card, i) => cards.push({ number: i + 1, arcana: '大阿卡纳', suit: '大阿卡纳', rank: card.name, name: card.name, subtitle: card.subtitle, up: card.up, rev: card.rev, image: CARD_IMAGE_BY_NAME[card.name] || '' }));
  let number = 23;
  for (const suit of SUITS) {
    for (const rank of MINOR_RANKS) {
      const name = `${suit.name}${rank}`;
      cards.push({
        number,
        arcana: '小阿卡纳', suit: suit.name, rank, name, subtitle: suit.subtitle,
        up: `${name}正位：这股 ${suit.subtitle.split(' / ')[0]} 能量更适合被正面使用，主动推进会比犹豫更有结果。`,
        rev: `${name}逆位：${suit.subtitle.split(' / ')[0]} 能量出现阻塞、迟疑或失衡，先整理状态再决定下一步。`,
        image: CARD_IMAGE_BY_NAME[name] || '',
      });
      number += 1;
    }
  }
  state.base78 = cards;
}

function normalizeDictText(text = '') {
  return String(text || '')
    .replace(/^[：:、，\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarizeText(text = '', limit = 88) {
  const clean = normalizeDictText(text).replace(/…+/g, '');
  if (!clean) return '';
  return clean.length > limit ? `${clean.slice(0, limit).trim()}…` : clean;
}

function getDictEntry(name) {
  return state.tarotDict?.[name] || null;
}

function getCardKeywords(draw) {
  const dict = getDictEntry(draw.name);
  const fromSubtitle = buildKeywords(draw);
  const fromSummary = dict?.summary
    ? summarizeText(dict.summary, 40).split(/[、，,；;。]/).map(s => s.trim()).filter(Boolean).slice(0, 4)
    : [];
  return [...new Set([...(fromSubtitle || []), ...fromSummary])].filter(Boolean).slice(0, 6);
}

function getCardMeaning(draw, ori = draw.ori) {
  const dict = getDictEntry(draw.name);
  const isUp = ori === 'up';
  const primary = normalizeDictText(isUp ? dict?.up : dict?.rev);
  const fallback = normalizeDictText(isUp ? draw.up : draw.rev);
  return primary || fallback || '暂无牌意。';
}

function getCardSummary(draw) {
  const dict = getDictEntry(draw.name);
  return normalizeDictText(dict?.summary) || draw.subtitle || '';
}

async function loadTarotDict() {
  try {
    const res = await fetch('assets/tarot-dict-quickref.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.tarotDict = data?.cards || {};
    state.tarotDictLoaded = Object.keys(state.tarotDict).length > 0;
    buildBase78();
    buildEncoded156();
    renderGrid();
    renderReading();
    if (state.tarotDictLoaded) {
      updateHint(`已加载本地牌意库（${Object.keys(state.tarotDict).length} 张）。`);
    }
  } catch (err) {
    console.warn('Failed to load local tarot dict:', err);
    state.tarotDict = {};
    state.tarotDictLoaded = false;
    updateHint('本地牌意库加载失败，当前使用内置简版牌意。');
  }
}

function buildEncoded156() {
  state.encoded156 = [];
  for (const card of state.base78) {
    state.encoded156.push({ ...card, code: `${card.number}A`, ori: 'up' });
    state.encoded156.push({ ...card, code: `${card.number}B`, ori: 'rev' });
  }
}

function shuffleBase78() {
  const arr = state.base78.map(x => ({
    ...x,
    ori: Math.random() < 0.5 ? 'up' : 'rev',
  }));
  arr.forEach(card => {
    card.code = `${card.number}${card.ori === 'up' ? 'A' : 'B'}`;
  });
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  state.shuffled78 = arr;
}

function shuffleEncoded() {
  const arr = state.encoded156.map(x => ({ ...x }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  state.shuffled156 = arr;
}

function mapPickToDraw(pick) {
  const baseCard = state.shuffled78[pick - 1];
  if (!baseCard) return null;
  return {
    ...baseCard,
    pick,
    revealed: false,
  };
}


function setMotion(v) {
  state.motion = v;
  document.documentElement.style.setProperty('--motion', String(v));
}

function updateHint(text) {
  const hint = $('#hint');
  if (hint) hint.textContent = text;
}

function updateSpreadHint(text) {
  const hint = $('#spreadHint');
  if (hint) hint.textContent = text;
}

function setMeta(text) { $('#panelMeta').textContent = text; }
function setSequenceMeta(text) { $('#sequenceMeta').textContent = text; }

function goToScreen(screen) {
  state.currentScreen = screen;
  $$('.screen').forEach(node => node.classList.toggle('is-active', node.dataset.screen === screen));
  $$('.progressBar__step').forEach(node => {
    const idx = STEP_ORDER.indexOf(node.dataset.step);
    const cur = STEP_ORDER.indexOf(screen);
    node.classList.toggle('is-active', idx <= cur);
    node.classList.toggle('is-current', node.dataset.step === screen);
  });
}

function renderQuestionEcho() {
  $('#questionEcho').textContent = `你的问题：${state.question?.trim() ? state.question.trim() : '未填写'}`;
}

function renderSpreadEcho() {
  $('#spreadEcho').textContent = `当前牌阵：${state.spread.name}`;
}

function renderCustomMeaningInputs() {
  const count = Number($('#customSpreadCount').value);
  const box = $('#customMeaningList');
  box.innerHTML = '';
  if (!Number.isInteger(count) || count < 1 || count > 20) return;
  for (let i = 0; i < count; i++) {
    const wrap = el('label', 'pickSlot');
    const label = el('span', 'pickSlot__label');
    const input = el('input', 'pickSlot__input');
    label.textContent = `第 ${i + 1} 张牌代表什么`;
    input.type = 'text';
    input.placeholder = `例如：核心问题 / 对方状态 / 结果`;
    input.dataset.meaningIndex = String(i);
    wrap.append(label, input);
    box.append(wrap);
  }
}

function buildSpreadFromForm() {
  const key = state.selectedSpreadKey;
  if (key !== 'custom') return { ...PRESET_SPREADS[key] };
  const name = $('#customSpreadName').value.trim();
  const count = Number($('#customSpreadCount').value);
  const inputs = $$('#customMeaningList input');
  const labels = inputs.map(i => i.value.trim()).filter(Boolean);
  if (!name) return { error: '请先填写自定义牌阵名称。' };
  if (!Number.isInteger(count) || count < 1 || count > 20) return { error: '自定义牌阵张数请输入 1-20。' };
  if (labels.length !== count) return { error: '请把每一张牌的含义都填完整。' };
  return { key: 'custom', name, labels, desc: `自定义牌阵 · ${count} 张` };
}

function renderPickInputs() {
  const panel = $('#pickPanel');
  panel.innerHTML = '';
  state.spread.labels.forEach((label, idx) => {
    const wrap = el('label', 'pickSlot');
    const labelEl = el('span', 'pickSlot__label');
    const input = el('input', 'pickSlot__input');
    labelEl.textContent = label;
    input.type = 'number';
    input.min = '1';
    input.max = '78';
    input.placeholder = '1-78';
    input.dataset.pickIndex = String(idx);
    if (state.picks[idx]) input.value = state.picks[idx];
    input.addEventListener('input', () => { state.picks[idx] = Number(input.value) || ''; renderGrid(); });
    wrap.append(labelEl, input);
    panel.append(wrap);
  });
  $('#pickTitle').textContent = `请为「${state.spread.name}」的每个牌位输入 1-78 的随机数字`;
  $('#pickDesc').textContent = '';
}

function renderGrid() {
  const grid = $('#cardGrid');
  grid.innerHTML = '';
  const columns = Math.min(3, Math.max(1, state.spread.labels.length));
  grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  state.spread.labels.forEach((label, i) => {
    const card = el('button', 'card card--simple');
    card.type = 'button';
    card.dataset.slot = String(i);
    card.setAttribute('aria-label', `${label} 牌位`);
    const back = el('div', 'card__face card__back');
    const front = el('div', 'card__face card__front');
    const frame = el('div', 'card__frame');
    const tl = el('div', 'card__corner card__corner--tl');
    const media = el('div', 'card__media');
    const img = el('img', 'card__image');
    const overlay = el('div', 'card__overlay');
    const meta = el('div', 'card__meta');
    const name = el('div', 'card__name card__name--simple');
    const subtitle = el('div', 'card__subtitle card__subtitle--simple');
    tl.textContent = label;
    img.alt = `${label} 牌位图片`;
    media.append(img, overlay);
    meta.append(name, subtitle);
    front.append(frame, tl, media, meta);
    card.append(back, front);
    const d = state.drawn[i];
    if (d) {
      hydrateCard(card, d, label);
      if (d.revealed) card.classList.add('is-flipped');
    } else {
      name.textContent = '等待匹配';
      subtitle.textContent = '';
    }
    card.addEventListener('click', () => onFlip(i));
    grid.append(card);
  });
}

function hydrateCard(cardBtn, draw, label) {
  const front = cardBtn.querySelector('.card__front');
  front.querySelector('.card__corner--tl').textContent = label;
  front.querySelector('.card__name').textContent = draw.name;
  front.querySelector('.card__subtitle').textContent = draw.ori === 'up' ? '正位' : '逆位';
  const img = front.querySelector('.card__image');
  if (img) {
    img.src = draw.image;
    img.alt = `${draw.name} ${draw.ori === 'up' ? '正位' : '逆位'}`;
    img.classList.toggle('is-reversed', draw.ori === 'rev');
  }
  front.style.transform = 'rotateY(180deg)';
}

function buildKeywords(draw) {
  return (draw.subtitle || '')
    .split('/')
    .map(s => s.trim())
    .filter(Boolean);
}

function buildPositionMeaning(draw, label) {
  const base = getCardMeaning(draw, draw.ori);
  return `在「${label}」这个牌位上，它更强调：${base}`;
}

function openCardDetail(index) {
  const draw = state.drawn[index];
  if (!draw) return;
  state.activeDetailIndex = index;
  $('#detailMeta').textContent = `${state.spread.name} · ${state.spread.labels[index]} · ${draw.ori === 'up' ? '正位' : '逆位'}`;
  $('#detailName').textContent = draw.name;
  const chips = $('#detailChips');
  chips.innerHTML = '';
  [draw.arcana, draw.suit, state.spread.labels[index]].forEach(text => {
    const chip = el('span', 'detailChip');
    chip.textContent = text;
    chips.append(chip);
  });
  const poster = $('#detailPosterImage');
  poster.src = draw.image;
  poster.alt = `${draw.name} ${draw.ori === 'up' ? '正位' : '逆位'}`;
  poster.classList.toggle('is-reversed', draw.ori === 'rev');
  const summary = getCardSummary(draw);
  $('#detailPosterNote').textContent = summary ? `当前显示真实牌图 · ${draw.ori === 'up' ? '正位' : '逆位'} · ${summarizeText(summary, 72)}` : `当前显示真实牌图 · ${draw.ori === 'up' ? '正位' : '逆位'}`;
  $('#detailKeywords').textContent = getCardKeywords(draw).join(' · ') || '暂无关键词';
  $('#detailPositionMeaning').textContent = buildPositionMeaning(draw, state.spread.labels[index]);
  $('#detailUp').textContent = getCardMeaning(draw, 'up');
  $('#detailRev').textContent = getCardMeaning(draw, 'rev');
  $('#cardDetail').showModal();
}

function openImageLightbox(index) {
  const draw = state.drawn[index];
  if (!draw) return;
  state.activeLightboxIndex = index;
  const img = $('#lightboxImage');
  img.src = draw.image;
  img.alt = `${draw.name} ${draw.ori === 'up' ? '正位' : '逆位'}`;
  img.classList.toggle('is-reversed', draw.ori === 'rev');
  $('#lightboxMeta').textContent = `${draw.name} · ${draw.ori === 'up' ? '正位' : '逆位'} · 点击外部可关闭`;
  $('#imageLightbox').showModal();
}

function closeImageLightbox() {
  const dlg = $('#imageLightbox');
  if (dlg.open) dlg.close();
}

function openOriginalImage(index = state.activeDetailIndex) {
  const draw = state.drawn[index];
  if (!draw?.image) return;
  window.open(draw.image, '_blank', 'noopener,noreferrer');
}

function closeCardDetail() {
  const dlg = $('#cardDetail');
  if (dlg.open) dlg.close();
}

function renderReading() {
  const box = $('#reading');
  if (!state.drawn.length) {
    box.innerHTML = `<p class="muted">这里会展示每张牌的解读内容。</p>`;
    setMeta('尚未匹配结果');
    return;
  }
  const allRevealed = state.drawn.every(d => d && d.revealed);
  setMeta(allRevealed ? '全部牌已翻开' : '已匹配结果，等待翻牌');
  const grid = el('div', 'readingGrid');
  state.spread.labels.forEach((label, i) => {
    const d = state.drawn[i];
    const c = el('div', 'readingCard');
    const k = el('div', 'readingCard__k');
    const v = el('div', 'readingCard__v');
    if (!d) {
      k.textContent = `${label} · 未匹配`;
      v.textContent = '等待结果';
    } else {
      k.textContent = `${label}`;
      if (d.revealed) {
        v.innerHTML = `<strong>${d.name}</strong>（${d.ori === 'up' ? '正位' : '逆位'}）<br>${getCardMeaning(d, d.ori)}`;
      } else {
        v.innerHTML = `<strong>${d.name}</strong><br><span class="muted">已匹配完成，点击上方卡牌翻开。</span>`;
      }
    }
    c.append(k, v);
    grid.append(c);
  });
  box.innerHTML = '';
  box.append(grid);
}

function getPickValues() {
  return $$('#pickPanel input[data-pick-index]').map(v => Number(v.value));
}

function validatePicks(values) {
  if (values.length !== state.spread.labels.length) return '选号数量与当前牌阵不一致。';
  if (values.some(v => !Number.isInteger(v) || v < 1 || v > 78)) return '请输入 1-78 之间的整数。';
  if ((new Set(values)).size !== values.length) return '每个牌位的数字必须互不重复。';
  return '';
}

async function ritualShuffleAnimation() {
  $('#shuffleText').textContent = '洗牌中…';
  const orb = $('#ritualOrb');
  orb.classList.add('is-busy');
  beep('shuffle');
  await new Promise(r => setTimeout(r, 1200));
  shuffleBase78();
  shuffleEncoded();
  state.phase = 'shuffled';
  state.drawn = [];
  state.picks = new Array(state.spread.labels.length).fill('');
  renderPickInputs();
  renderGrid();
  renderReading();
  orb.classList.remove('is-busy');
  $('#shuffleText').textContent = '洗牌完毕';
  setSequenceMeta('已完成后台洗牌');
  $('#btnShuffle .primaryAction__top').textContent = '重新洗牌';
  $('#btnToPick').hidden = false;
  updateHint('已完成后台洗牌。现在请为每个牌位输入 1-78 的随机数字。');
}

function onLuckyPick() {
  const nums = [];
  const used = new Set();
  while (nums.length < state.spread.labels.length) {
    const n = Math.floor(Math.random() * 78) + 1;
    if (used.has(n)) continue;
    used.add(n);
    nums.push(n);
  }
  state.picks = nums;
  $$('#pickPanel input[data-pick-index]').forEach((input, idx) => { input.value = nums[idx]; });
  renderGrid();
  updateHint('已帮你随机填满所有牌位数字。');
}

function onMatch() {
  if (!state.shuffled78.length) {
    updateHint('你还没洗牌。先完成洗牌仪式。');
    goToScreen('shuffle');
    return;
  }
  const picks = getPickValues();
  const error = validatePicks(picks);
  if (error) {
    updateHint(error);
    return;
  }
  state.picks = picks;
  state.drawn = picks.map((pick) => mapPickToDraw(pick)).filter(Boolean);
  state.phase = 'matched';
  renderGrid();
  renderReading();
  renderQuestionEcho();
  renderSpreadEcho();
  goToScreen('result');
  updateHint('匹配完成。现在轻触卡牌翻开，查看结果。');
}

function onFlip(slot) {
  const d = state.drawn[slot];
  if (!d) return;
  if (!d.revealed) {
    d.revealed = true;
    beep('flip');
    const cardBtn = document.querySelector(`.card[data-slot="${slot}"]`);
    hydrateCard(cardBtn, d, state.spread.labels[slot]);
    cardBtn.classList.add('is-flipped');
    renderReading();
    return;
  }
  openImageLightbox(slot);
}

function onRevealAll() {
  if (!state.drawn.length) {
    updateHint('还没有可翻开的结果。');
    return;
  }
  state.drawn.forEach(d => { if (d) d.revealed = true; });
  document.querySelectorAll('.card').forEach((card, i) => {
    const d = state.drawn[i];
    if (!d) return;
    hydrateCard(card, d, state.spread.labels[i]);
    card.classList.add('is-flipped');
  });
  beep('flip');
  renderReading();
}

function onReset() {
  state.question = '';
  state.selectedSpreadKey = 'blank3';
  state.spread = { ...PRESET_SPREADS['blank3'] };
  state.shuffled78 = [];
  state.shuffled156 = [];
  state.picks = [];
  state.drawn = [];
  state.phase = 'idle';
  $('#questionInput').value = '';
  $('#customSpreadName').value = '';
  $('#customSpreadCount').value = '';
  $('#customPanel').hidden = true;
  $('#customMeaningList').innerHTML = '';
  $$('.spreadOption').forEach(btn => btn.classList.toggle('is-active', btn.dataset.spread === 'blank3'));
  $('#shuffleText').textContent = '';
  $('#btnShuffle .primaryAction__top').textContent = '开始洗牌';
  $('#btnToPick').hidden = true;
  renderQuestionEcho();
  renderSpreadEcho();
  renderPickInputs();
  renderGrid();
  renderReading();
  goToScreen('intro');
  updateSpreadHint('当前默认牌阵：无牌阵三张。');
  updateHint('提示：先输入问题，再选择牌阵。');
  setSequenceMeta('尚未洗牌');
}

async function onCopy() {
  if (!state.drawn.length) {
    updateHint('还没有结果可复制。');
    return;
  }
  const lines = [];
  lines.push(`VEGEBIRD TAROT 用户参与式塔罗结果（${new Date().toLocaleString()}）`);
  lines.push(`问题：${state.question?.trim() || '未填写'}`);
  lines.push(`牌阵：${state.spread.name}`);
  state.spread.labels.forEach((label, i) => {
    const d = state.drawn[i];
    if (!d) return;
    lines.push(`${label}：${d.name}（${d.ori === 'up' ? '正位' : '逆位'}）`);
    lines.push(`- ${getCardMeaning(d, d.ori)}`);
    const summary = getCardSummary(d);
    if (summary) lines.push(`- 基调：${summarizeText(summary, 120)}`);
  });
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    updateHint('已复制到剪贴板。');
  } catch {
    updateHint('复制失败：浏览器可能禁止剪贴板。');
  }
}

function bindSettings() {
  const dlg = $('#settings');
  $('#btnSettings').addEventListener('click', () => dlg.showModal());
  const mot = $('#motion');
  const motVal = $('#motionVal');
  mot.addEventListener('input', () => { motVal.textContent = mot.value; });
  $('#btnSave').addEventListener('click', () => {
    setMotion(Number(mot.value) / 100);
    state.sound = $('#sound').checked;
  });
}

function bindSpreadSelection() {
  $$('.spreadOption').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedSpreadKey = btn.dataset.spread;
      $$('.spreadOption').forEach(n => n.classList.toggle('is-active', n === btn));
      const isCustom = state.selectedSpreadKey === 'custom';
      $('#customPanel').hidden = !isCustom;
      if (isCustom) {
        updateSpreadHint('你选择了自定义牌阵。请填写牌阵名称、牌数和每张牌的含义。');
      } else {
        const spread = PRESET_SPREADS[state.selectedSpreadKey];
        updateSpreadHint(`当前牌阵：${spread.name} · ${spread.desc}`);
      }
    });
  });
  $('#customSpreadCount').addEventListener('input', renderCustomMeaningInputs);
}

function bindFlow() {
  $('#btnToSpread').addEventListener('click', () => {
    state.question = $('#questionInput').value.trim();
    renderQuestionEcho();
    goToScreen('spread');
  });
  $('#btnBackIntro').addEventListener('click', () => goToScreen('intro'));
  $('#btnBackSpread').addEventListener('click', () => goToScreen('spread'));
  $('#btnBackShuffle').addEventListener('click', () => goToScreen('shuffle'));
  $('#btnBackPick').addEventListener('click', () => goToScreen('pick'));

  $('#btnToShuffle').addEventListener('click', () => {
    const spread = buildSpreadFromForm();
    if (spread.error) {
      updateSpreadHint(spread.error);
      return;
    }
    state.spread = spread;
    state.picks = new Array(state.spread.labels.length).fill('');
    state.drawn = [];
    $('#btnToPick').hidden = true;
    $('#btnShuffle .primaryAction__top').textContent = '开始洗牌';
    $('#shuffleText').textContent = '';
    renderSpreadEcho();
    renderPickInputs();
    renderGrid();
    renderReading();
    goToScreen('shuffle');
  });

  $('#btnToPick').addEventListener('click', () => {
    if (!state.shuffled78.length) {
      updateHint('先完成洗牌仪式。');
      return;
    }
    goToScreen('pick');
  });
}

function bindActions() {
  $('#btnShuffle').addEventListener('click', ritualShuffleAnimation);
  $('#btnReShuffle').addEventListener('click', ritualShuffleAnimation);
  $('#btnLucky').addEventListener('click', onLuckyPick);
  $('#btnMatch').addEventListener('click', onMatch);
  $('#btnRevealAll').addEventListener('click', onRevealAll);
  $('#btnReset').addEventListener('click', onReset);
  $('#btnCopy').addEventListener('click', onCopy);
  $('#btnCloseDetail').addEventListener('click', closeCardDetail);
  $('#detailPosterImage').addEventListener('click', () => openImageLightbox(state.activeDetailIndex));
  $('#btnZoomFromDetail').addEventListener('click', () => openImageLightbox(state.activeDetailIndex));
  $('#btnOpenOriginal').addEventListener('click', () => openOriginalImage(state.activeDetailIndex));
  $('#btnCloseLightbox').addEventListener('click', closeImageLightbox);
  $('#btnLightboxDetail').addEventListener('click', () => {
    closeImageLightbox();
    openCardDetail(state.activeLightboxIndex);
  });
  $('#btnLightboxOpenOriginal').addEventListener('click', () => openOriginalImage(state.activeLightboxIndex));
}

async function init() {
  setupStars();
  buildBase78();
  buildEncoded156();
  setMotion(state.motion);
  renderQuestionEcho();
  renderSpreadEcho();
  renderPickInputs();
  renderGrid();
  renderReading();
  bindSettings();
  bindSpreadSelection();
  bindFlow();
  bindActions();
  goToScreen('intro');
  updateSpreadHint('当前默认牌阵：无牌阵三张。');
  updateHint('提示：先输入问题，再选择牌阵。');
  setSequenceMeta('尚未洗牌');
  await loadTarotDict();
}

init();
