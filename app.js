/* Mystic Cat Tarot — blind pick spreads flow */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const el = (tag, cls) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

const APP_VERSION = '20260507-ios-pass1';
const DEBUG_ENABLED = false;

const I18N = {
  zh: {
    htmlLang: 'zh-CN',
    pageTitle: '菜鸟塔罗抽牌系统 · Vegebird Tarot',
    pageDescription: '菜鸟塔罗抽牌系统（Vegebird Tarot），仅限传统伟特塔罗 78 张牌，支持提问、选牌阵、洗牌、数字抽牌与结果翻牌全流程。',
    brandSub: '菜鸟塔罗抽牌系统 · 仅限传统伟特塔罗 78 张牌',
    progress: ['提问', '牌阵', '洗牌', '盲选', '结果'],
    heroTitle: '先问问题，<br>再决定你想用哪种牌阵。',
    heroText: '把你的问题交给牌，再按自己的方式完成这场抽取仪式。',
    questionTitle: '写下你此刻最想问的问题',
    questionPlaceholder: '例如：这段关系接下来会怎么发展？',
    questionTips: '如果需要使用 AI 解读功能，就要描述清楚问题哦。',
    nextToSpreadTop: '下一步：选择牌阵',
    nextToSpreadSub: '默认会预选“无牌阵三张”',
    openGallery: '打开塔罗牌图库',
    spreadTitle: '先选牌阵，再进入抽牌流程',
    spreadText: '默认牌阵是“无牌阵三张”。你也可以选带语义的三张牌阵，或者自定义牌阵。',
    customPanelTitle: '自定义牌阵设置',
    customName: '牌阵名称',
    customNamePlaceholder: '例如：关系修复牌阵',
    customCount: '牌数',
    spreadHintDefault: '当前默认牌阵：无牌阵三张。',
    backQuestion: '返回提问',
    confirmSpreadTop: '确认牌阵，进入洗牌',
    confirmSpreadSub: '下一步开始仪式洗牌',
    shuffleTitle: '洗牌模块',
    shuffleIntro: '点击下方按钮，系统会在后台随机打乱 78 张牌，并固定每张牌的正逆位。',
    backSpread: '返回牌阵',
    startShuffle: '开始洗牌',
    reshuffle: '重新洗牌',
    goPick: '去选牌',
    pickTitlePlain: '请为每个牌位输入 1-78 的随机数字',
    luckyFill: '帮我随机填满',
    reshuffleSmall: '重新打乱',
    hintDefault: '提示：先完成洗牌，再为每一个牌位输入 1-78 的随机数字。',
    backShuffle: '返回洗牌',
    matchTop: '匹配结果',
    matchSub: '用你填写的数字生成牌面',
    resultTitle: '你的牌已经出现',
    panelMetaIdle: '尚未匹配结果',
    questionEmpty: '未填写',
    questionEchoPrefix: '你的问题：',
    spreadEchoPrefix: '当前牌阵：',
    revealAll: '一键翻开',
    copyResult: '复制结果',
    readingTitle: '解读',
    sequenceIdle: '尚未洗牌',
    readingPlaceholder: '这里会展示每张牌的解读内容。',
    aiTitle: 'AI 综合解牌',
    aiIdle: '未开始',
    aiPlaceholder: '这里将显示 OpenClaw 返回的整体结论、建议与推荐追问。',
    retryAi: '重试 AI 解牌',
    aiGenerate: '生成 AI 解读',
    saveImage: '保存为图片',
    saveImagePreparing: '正在生成图片…',
    saveImageDone: '图片已生成，请在浏览器下载、系统分享面板，或长按预览图保存。',
    saveImageFailed: '生成图片失败了，请稍后重试。',
    saveImagePreviewHint: '如果你在微信里打开，请长按下方图片保存到手机。',
    saveImageDownload: '下载图片',
    saveImageClose: '关闭',
    donateCta: '🐦 投喂一下菜鸟塔罗',
    donateTitle: '感谢投喂',
    donateSub: '如果这次解读刚好帮你理清了一点思路，可以随缘投喂一下这只菜鸟。每一份支持，都会变成网站继续维持的能量。（Token好贵TT）',
    donateHint: '微信内可长按识别赞赏码。',
    shareImageTitle: '菜鸟塔罗 AI 解读',
    aiRefine: '补充问题后再解读',
    backPick: '返回盲选',
    resetTop: '重新开始',
    resetSub: '清空问题、牌阵与本次抽牌结果',
    settingsTitle: '设置',
    settingsSub: '保留动效与音效控制；打乱顺序不会展示给用户',
    motionLabel: '动效强度',
    motionHelp: '如果你容易晕动或手机卡顿，把它调低。',
    soundLabel: '启用轻微音效（浏览器允许时）',
    cancel: '取消',
    save: '保存',
    detailTitle: '单牌详情',
    detailSub: '查看更完整的牌义内容',
    detailPosterNote: '当前显示真实牌图',
    zoom: '放大查看',
    openOriginal: '打开原图',
    detailKeywords: '关键词',
    detailUpKeywords: '正位关键词',
    detailUpMeaning: '正位含义',
    detailRevKeywords: '逆位关键词',
    detailRevMeaning: '逆位含义',
    lightboxTitle: '牌图预览',
    lightboxSub: '查看更大的真实牌图',
    lightboxDetail: '查看牌义详情',
    lightboxOpenOriginal: '打开原图',
    customMeaningLabel: (i) => `第 ${i} 张牌代表什么`,
    customMeaningPlaceholder: '例如：核心问题 / 对方状态 / 结果',
    pickTitleForSpread: (name) => `请为「${name}」的每个牌位输入 1-78 的随机数字`,
    cardWaiting: '等待匹配',
    cardMatchedHint: '已匹配完成，点击上方卡牌翻开。',
    readingMore: '点击牌面查看完整牌义',
    unrevealed: '未匹配',
    waitingResult: '等待结果',
    upright: '正位',
    reversed: '逆位',
    keywordsLabel: '关键词：',
    aiStatusMap: { idle: '未开始', loading: '生成中', success: '已生成', error: '失败' },
    aiLoading: '正在整理牌面关系与整体结论…',
    aiError: 'AI 解牌暂时失败了。你可以稍后重试，当前仍可先查看基础牌义。',
    aiErrorFallback: 'AI 这次没顺利返回完整结果。我先给你一版基于当前牌面的轻量综合解读，方便你先往下看。',
    aiErrorColdStart: 'AI 服务可能正在冷启动。请等待 20~40 秒后再点一次「生成 AI 解读」。',
    aiEmpty: 'AI 已返回，但当前没有可展示的结构化内容。',
    aiTitleReading: 'AI 综合解牌',
    aiTitleClarify: '先补充问题，再正式解牌',
    aiClarifyTitle: '补充一点信息，我再继续解',
    aiClarifySub: '可以补充对象、现状、你最想看什么，以及时间范围。',
    aiClarifySubjectLabel: '你想看谁 / 哪件事',
    aiClarifySituationLabel: '当前状态',
    aiClarifyFocusLabel: '你最想看什么',
    aiClarifyTimeframeLabel: '时间范围',
    aiClarifySubjectPlaceholder: '例如：我和前任 / 这次面试 / 要不要离职',
    aiClarifySituationPlaceholder: '例如：断联两周 / 正在暧昧 / 已进入终面',
    aiClarifyFocusPlaceholder: '例如：对方想法 / 走向 / 建议 / 风险 / 结果',
    aiClarifyTimeframePlaceholder: '例如：未来三个月 / 这个月内 / 半年内',
    aiClarifyPlaceholder: '其他你觉得重要但上面没写到的信息，也可以补在这里。',
    aiSummary: '整体结论',
    aiSynthesis: '联动分析',
    aiAdvice: '行动建议',
    aiRisk: '风险提醒',
    aiFollowups: '推荐追问',
    mockSummary: (names) => `你这次抽到的核心牌面是：${names.join('、')}。整体更像一个“先看清状态，再决定推进节奏”的局面。`,
    mockSynthesis: '从当前牌阵结构看，问题并不只是单点吉凶，而是节奏、判断和情绪状态共同作用的结果。',
    mockAdvice: '建议先把真正的问题收窄，再结合现实信息做决定，不要只凭一时情绪下结论。',
    mockRisk: '当前最大的风险通常来自过度脑补、信息不足或节奏过急。',
    mockFollowups: ['我现在最该看清的盲点是什么？', '如果我主动推进，短期会发生什么？'],
    notMatched: '尚未匹配结果',
    allRevealed: '全部牌已翻开',
    waitingFlip: '已匹配结果，等待翻牌',
    validateCountMismatch: '选号数量与当前牌阵不一致。',
    validateRange: '请输入 1-78 之间的整数。',
    validateUnique: '每个牌位的数字必须互不重复。',
    shuffling: '洗牌中…',
    shuffled: '洗牌完毕',
    shuffledMeta: '已完成后台洗牌',
    shuffledHint: '已完成后台洗牌。现在请为每个牌位输入 1-78 的随机数字。',
    luckyDone: '已帮你随机填满所有牌位数字。',
    notShuffled: '你还没洗牌。先完成洗牌仪式。',
    matchedHint: '匹配完成。现在轻触卡牌翻开，查看结果。',
    noReveal: '还没有可翻开的结果。',
    resetHint: '提示：先输入问题，再选择牌阵。',
    noCopy: '还没有结果可复制。',
    copied: '已复制到剪贴板。',
    copyFailed: '复制失败：浏览器可能禁止剪贴板。',
    customSelectHint: '你选择了自定义牌阵。请填写牌阵名称、牌数和每张牌的含义。',
    currentSpread: (name, desc) => `当前牌阵：${name} · ${desc}`,
    customNeedName: '请先填写自定义牌阵名称。',
    customNeedCount: '自定义牌阵张数请输入 1-20。',
    customNeedLabels: '请把每一张牌的含义都填完整。',
    needShuffleFirst: '先完成洗牌仪式。',
    detailMeta: (spread, label, ori) => `${spread} · ${label} · ${ori}`,
    posterNoteWithOri: (ori) => `当前显示真实牌图 · ${ori}`,
    lightboxMeta: (name, ori) => `${name} · ${ori} · 点击外部可关闭`,
    pickPositionSummary: (label, meaning) => `在「${label}」这个牌位上，它更强调：${meaning}`,
    loadedDict: (count) => `已加载本地牌意库（${count} 张）。`,
    loadDictFailed: '本地牌意库加载失败，当前使用内置简版牌意。'
  },
  en: {
    htmlLang: 'en',
    pageTitle: 'Vegebird Tarot · Interactive Tarot Draw',
    pageDescription: 'Vegebird Tarot is an interactive Rider-Waite tarot draw experience with question input, spread selection, shuffle ritual, blind pick, and reveal flow.',
    brandSub: 'Interactive draw · Rider-Waite 78-card deck',
    progress: ['Question', 'Spread', 'Shuffle', 'Pick', 'Result'],
    heroTitle: 'Ask your question first,<br>then choose the spread you want.',
    heroText: 'Hand your question to the cards, then complete the ritual in your own way.',
    questionTitle: 'Write down the question you want to ask most right now',
    questionPlaceholder: 'For example: How will this relationship develop next?',
    questionTips: 'For AI readings, please describe your question clearly.',
    nextToSpreadTop: 'Next: choose a spread',
    nextToSpreadSub: '“Three cards, no spread” is preselected by default',
    openGallery: 'Open tarot gallery',
    spreadTitle: 'Choose the spread before entering the draw flow',
    spreadText: 'The default is “Three cards, no spread.” You can also choose a structured three-card spread or create your own.',
    customPanelTitle: 'Custom spread setup',
    customName: 'Spread name',
    customNamePlaceholder: 'For example: Relationship Repair Spread',
    customCount: 'Card count',
    spreadHintDefault: 'Current default spread: Three cards, no spread.',
    backQuestion: 'Back to question',
    confirmSpreadTop: 'Confirm spread and enter shuffle',
    confirmSpreadSub: 'Begin the ritual shuffle next',
    shuffleTitle: 'Shuffle ritual',
    shuffleIntro: 'Tap the button below. The system will randomly shuffle all 78 cards in the background and lock each card upright or reversed.',
    backSpread: 'Back to spread',
    startShuffle: 'Start shuffle',
    reshuffle: 'Shuffle again',
    goPick: 'Go pick cards',
    pickTitlePlain: 'Enter a random number from 1 to 78 for each card position',
    luckyFill: 'Fill randomly for me',
    reshuffleSmall: 'Shuffle again',
    hintDefault: 'Tip: finish shuffling first, then enter a random number from 1 to 78 for each position.',
    backShuffle: 'Back to shuffle',
    matchTop: 'Match result',
    matchSub: 'Generate the cards from your numbers',
    resultTitle: 'Your cards have appeared',
    panelMetaIdle: 'No result matched yet',
    questionEmpty: 'Not filled in',
    questionEchoPrefix: 'Your question: ',
    spreadEchoPrefix: 'Current spread: ',
    revealAll: 'Reveal all',
    copyResult: 'Copy result',
    readingTitle: 'Reading',
    sequenceIdle: 'Not shuffled yet',
    readingPlaceholder: 'The interpretation for each card will appear here.',
    aiTitle: 'AI full reading',
    aiIdle: 'Not started',
    aiPlaceholder: 'OpenClaw’s overall reading, advice, and suggested follow-up questions will appear here.',
    retryAi: 'Retry AI reading',
    aiGenerate: 'Generate AI reading',
    saveImage: 'Save as image',
    saveImagePreparing: 'Generating image…',
    saveImageDone: 'Image generated. Save it from your browser download, system share sheet, or by long-pressing the preview image.',
    saveImageFailed: 'Failed to generate the image. Please try again later.',
    saveImagePreviewHint: 'If you are viewing this in WeChat, long-press the image below to save it.',
    saveImageDownload: 'Download image',
    saveImageClose: 'Close',
    donateCta: '🐦 Feed Vegebird Tarot',
    donateTitle: 'Thank you for feeding the little bird',
    donateSub: 'If this reading helped you untangle your thoughts, you can leave a small appreciation tip. Every bit of support becomes energy for future updates.',
    donateHint: 'In WeChat, long-press the appreciation QR code to scan it.',
    shareImageTitle: 'Vegebird Tarot AI Reading',
    aiRefine: 'Refine the question first',
    backPick: 'Back to pick',
    resetTop: 'Start over',
    resetSub: 'Clear the question, spread, and this draw result',
    settingsTitle: 'Settings',
    settingsSub: 'Keep motion and sound controls; shuffle order is never shown to the user.',
    motionLabel: 'Motion intensity',
    motionHelp: 'If motion makes you dizzy or your phone feels laggy, turn it down.',
    soundLabel: 'Enable subtle sound effects (when the browser allows it)',
    cancel: 'Cancel',
    save: 'Save',
    detailTitle: 'Card details',
    detailSub: 'View the full card meaning',
    detailPosterNote: 'Showing the real card image',
    zoom: 'Zoom in',
    openOriginal: 'Open original image',
    detailKeywords: 'Keywords',
    detailUpKeywords: 'Upright keywords',
    detailUpMeaning: 'Upright meaning',
    detailRevKeywords: 'Reversed keywords',
    detailRevMeaning: 'Reversed meaning',
    lightboxTitle: 'Card preview',
    lightboxSub: 'View a larger version of the card image',
    lightboxDetail: 'View card meaning',
    lightboxOpenOriginal: 'Open original image',
    customMeaningLabel: (i) => `What does card ${i} represent?`,
    customMeaningPlaceholder: 'For example: core issue / their state / result',
    pickTitleForSpread: (name) => `Enter a random number from 1 to 78 for each position in “${name}”`,
    cardWaiting: 'Waiting to match',
    cardMatchedHint: 'Matched successfully. Tap the card above to reveal it.',
    readingMore: 'Tap the card to view the full meaning',
    unrevealed: 'Not matched',
    waitingResult: 'Waiting for result',
    upright: 'Upright',
    reversed: 'Reversed',
    keywordsLabel: 'Keywords: ',
    aiStatusMap: { idle: 'Not started', loading: 'Generating', success: 'Ready', error: 'Failed' },
    aiLoading: 'Connecting the cards and composing the overall reading…',
    aiError: 'AI reading failed for now. You can retry later, and the base card meanings are still available.',
    aiErrorFallback: 'AI did not return a full answer this time. I am showing you a lighter combined reading from the current cards so you can still continue.',
    aiErrorColdStart: 'The AI service may still be cold-starting. Wait 20–40 seconds, then tap “Generate AI reading” again.',
    aiEmpty: 'AI returned successfully, but there is no structured content to show yet.',
    aiTitleReading: 'AI full reading',
    aiTitleClarify: 'Add context before the full reading',
    aiClarifyTitle: 'Add a bit more context and I’ll continue',
    aiClarifySub: 'You can add the person or topic, the current situation, what you most want to know, and the time frame.',
    aiClarifySubjectLabel: 'Who or what is this about?',
    aiClarifySituationLabel: 'Current situation',
    aiClarifyFocusLabel: 'What do you most want to know?',
    aiClarifyTimeframeLabel: 'Time frame',
    aiClarifySubjectPlaceholder: 'For example: my ex / this interview / whether I should quit',
    aiClarifySituationPlaceholder: 'For example: no contact for two weeks / currently flirting / already in the final round',
    aiClarifyFocusPlaceholder: 'For example: their thoughts / direction / advice / risk / outcome',
    aiClarifyTimeframePlaceholder: 'For example: the next three months / within this month / within half a year',
    aiClarifyPlaceholder: 'Any other detail that matters but does not fit the fields above can go here.',
    aiSummary: 'Overall reading',
    aiSynthesis: 'Pattern synthesis',
    aiAdvice: 'Advice',
    aiRisk: 'Risk notes',
    aiFollowups: 'Suggested follow-ups',
    mockSummary: (names) => `The core cards in this draw are: ${names.join(', ')}. Overall, the message feels like “see the situation clearly first, then decide the pace of action.”`,
    mockSynthesis: 'This spread suggests the issue is not just about simple good or bad luck; timing, judgment, and emotional state are all interacting together.',
    mockAdvice: 'Narrow the real question first, then make your decision with real-world information instead of acting on temporary emotion alone.',
    mockRisk: 'The biggest risk right now usually comes from overthinking, incomplete information, or moving too fast.',
    mockFollowups: ['What blind spot do I most need to see right now?', 'What happens in the short term if I take initiative?'],
    notMatched: 'No result matched yet',
    allRevealed: 'All cards revealed',
    waitingFlip: 'Matched successfully. Waiting for reveal',
    validateCountMismatch: 'The number of picks does not match the current spread.',
    validateRange: 'Please enter whole numbers between 1 and 78.',
    validateUnique: 'Each position must use a different number.',
    shuffling: 'Shuffling…',
    shuffled: 'Shuffle complete',
    shuffledMeta: 'Background shuffle completed',
    shuffledHint: 'The shuffle is complete. Now enter a random number from 1 to 78 for each position.',
    luckyDone: 'Filled every position with random numbers for you.',
    notShuffled: 'You have not shuffled yet. Finish the ritual shuffle first.',
    matchedHint: 'Matching complete. Tap the cards to reveal your result.',
    noReveal: 'There is no result to reveal yet.',
    resetHint: 'Tip: enter your question first, then choose a spread.',
    noCopy: 'There is no result to copy yet.',
    copied: 'Copied to clipboard.',
    copyFailed: 'Copy failed: your browser may be blocking clipboard access.',
    customSelectHint: 'You selected a custom spread. Please enter the spread name, card count, and the meaning of each position.',
    currentSpread: (name, desc) => `Current spread: ${name} · ${desc}`,
    customNeedName: 'Please enter a name for the custom spread first.',
    customNeedCount: 'For a custom spread, please enter a card count from 1 to 20.',
    customNeedLabels: 'Please fill in the meaning of every card position.',
    needShuffleFirst: 'Finish the shuffle ritual first.',
    detailMeta: (spread, label, ori) => `${spread} · ${label} · ${ori}`,
    posterNoteWithOri: (ori) => `Showing the real card image · ${ori}`,
    lightboxMeta: (name, ori) => `${name} · ${ori} · tap outside to close`,
    pickPositionSummary: (label, meaning) => `In the position “${label}”, this card especially emphasizes: ${meaning}`,
    loadedDict: (count) => `Local card meaning library loaded (${count} cards).`,
    loadDictFailed: 'Failed to load the local card meaning library. Using the built-in simplified meanings instead.'
  }
};

function logDebug(event, payload = {}) {
  if (!DEBUG_ENABLED) return;
  try {
    console.info(`[vegebird-debug][${APP_VERSION}] ${event}`, payload);
  } catch {}
}

function t(key, ...args) {
  const dict = I18N[state.lang] || I18N.zh;
  const value = dict[key];
  return typeof value === 'function' ? value(...args) : (value ?? key);
}

function getCurrentLangPack() {
  return I18N[state.lang] || I18N.zh;
}

async function setLanguage(lang) {
  state.lang = I18N[lang] ? lang : 'zh';
  localStorage.setItem('vege_tarot_lang', state.lang);
  buildBase78();
  buildEncoded156();
  if (state.drawn?.length) {
    state.drawn = state.drawn.map(draw => {
      const refreshed = state.base78.find(card => card.name === draw.name);
      return refreshed ? { ...refreshed, ori: draw.ori, revealed: draw.revealed, pick: draw.pick } : draw;
    });
  }
  await loadTarotDict();
  applyTranslations();
}

function toggleLanguageMenu(force) {
  const menu = $('#langMenu');
  const panel = $('#langMenuPanel');
  const btn = $('#btnLang');
  if (!menu || !panel || !btn) return;
  const isOpen = menu.classList.contains('is-open');
  const shouldOpen = typeof force === 'boolean' ? force : !isOpen;
  menu.classList.toggle('is-open', shouldOpen);
  panel.hidden = !shouldOpen;
  btn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
}

function selectLanguage(lang) {
  if (!I18N[lang]) return;
  const nextLang = I18N[lang] ? lang : 'zh';
  toggleLanguageMenu(false);
  if (nextLang === state.lang) {
    applyTranslations();
    return;
  }
  setLanguage(nextLang);
}

function getOriLabel(ori) {
  return ori === 'up' ? t('upright') : t('reversed');
}

const EN_CARD_NAMES = {
  '愚者': 'The Fool', '魔术师': 'The Magician', '女祭司': 'The High Priestess', '女皇': 'The Empress', '皇帝': 'The Emperor', '教皇': 'The Hierophant', '恋人': 'The Lovers', '战车': 'The Chariot', '力量': 'Strength', '隐者': 'The Hermit',
  '命运之轮': 'Wheel of Fortune', '正义': 'Justice', '倒吊人': 'The Hanged Man', '死神': 'Death', '节制': 'Temperance', '恶魔': 'The Devil', '塔': 'The Tower', '高塔': 'The Tower', '星星': 'The Star', '月亮': 'The Moon', '太阳': 'The Sun', '审判': 'Judgement', '世界': 'The World',
};
const EN_SUITS = { '权杖': 'Wands', '圣杯': 'Cups', '宝剑': 'Swords', '星币': 'Pentacles', '大阿卡纳': 'Major Arcana', '小阿卡纳': 'Minor Arcana' };
const EN_RANKS = { '王牌': 'Ace', '二': 'Two', '三': 'Three', '四': 'Four', '五': 'Five', '六': 'Six', '七': 'Seven', '八': 'Eight', '九': 'Nine', '十': 'Ten', '侍从': 'Page', '骑士': 'Knight', '皇后': 'Queen', '王后': 'Queen', '国王': 'King' };
const EN_ELEMENTS = { '风': 'Air', '水': 'Water', '火': 'Fire', '土': 'Earth' };
const EN_MAJOR = {
  '愚者': { subtitle: 'Beginnings / Trust / Freedom', up: 'A new journey is calling you. Take the first step and let the answer appear on the road.', rev: 'Do not mistake impulse for courage. Understand what you are avoiding before you leap.' },
  '魔术师': { subtitle: 'Will / Resources / Manifestation', up: 'You already have enough tools in hand. Focus your attention on one real move.', rev: 'Your energy may be scattered or self-deceiving. Pull back the promises and close one small loop first.' },
  '女祭司': { subtitle: 'Intuition / Subconscious / Stillness', up: 'The answer is not more information. It is more quiet.', rev: 'You may be ignoring your intuition or treating guesses as prophecy. Verify first, then trust.' },
  '女皇': { subtitle: 'Nurture / Abundance / Relationship', up: 'Care for yourself well and your magnetism and creativity will rise naturally.', rev: 'Over-giving will drain you. Put your boundaries on the table first.' },
  '皇帝': { subtitle: 'Order / Structure / Leadership', up: 'It is your turn to set the rules: goal, deadline, standard. Power comes from clarity.', rev: 'Control may be backfiring on you. Stop trying to hold everything; hold the essentials.' },
  '教皇': { subtitle: 'Tradition / Learning / Guidance', up: 'Move closer to a mature system: find a mentor, a standard, a method.', rev: 'You do not need someone else to stamp approval on you. Break stale rules without destroying the foundation.' },
  '恋人': { subtitle: 'Choice / Alignment / Connection', up: 'Make the choice that aligns with your real values.', rev: 'Stop pleasing both sides. Choose one path and own its consequences.' },
  '战车': { subtitle: 'Momentum / Victory / Speed', up: 'This is the moment for a strong push. Lower the noise and move with intent.', rev: 'An unclear direction will turn effort into friction. Recalibrate the target, then accelerate.' },
  '力量': { subtitle: 'Gentle mastery / Courage', up: 'You do not need to roar to win.', rev: 'Admitting vulnerability is the beginning of getting your strength back.' },
  '隐者': { subtitle: 'Solitude / Reflection / Inner guide', up: 'Ask yourself first: what do I actually want?', rev: 'Let someone trustworthy come a little closer.' },
  '命运之轮': { subtitle: 'Cycle / Turning point / Change', up: 'The wind is shifting. Catch the window and move with it.', rev: 'Pause to cut losses or review, then wait for the next turn.' },
  '正义': { subtitle: 'Balance / Responsibility / Cause and effect', up: 'Put the facts on the table. Fairness grows from clarity and equal rules.', rev: 'Return to evidence and boundaries.' },
  '倒吊人': { subtitle: 'Pause / Perspective / Surrender', up: 'Do not move yet. A new angle may show that the delay is protecting you.', rev: 'Make one small move to break the stalemate.' },
  '死神': { subtitle: 'Ending / Release / Rebirth', up: 'The old must end before the new can begin.', rev: 'The longer you drag it, the more it hurts. Let go sooner.' },
  '节制': { subtitle: 'Balance / Recovery / Gradual progress', up: 'Go slowly, but do not stop.', rev: 'Replace all-or-nothing with something sustainable.' },
  '恶魔': { subtitle: 'Desire / Attachment / Temptation', up: 'See what is binding you. The moment you notice it, it already starts to loosen.', rev: 'You are breaking free. Do not turn back just to check again.' },
  '塔': { subtitle: 'Collapse / Truth / Awakening', up: 'If it must fall, let it fall. The truth will make you freer.', rev: 'A small crack left alone can become a total collapse.' },
  '星星': { subtitle: 'Hope / Guidance / Healing', up: 'Keep the faith and keep walking.', rev: 'Refill yourself first: sleep, food, friends, sunlight.' },
  '月亮': { subtitle: 'Fog / Emotion / Shadow', up: 'Do not rush to conclusions. Walk through the fog first.', rev: 'Use concrete action to test reality instead of feeding imagination.' },
  '太阳': { subtitle: 'Clarity / Joy / Success', up: 'Things are becoming brighter. You deserve to be seen.', rev: 'Complete the plan. Do not rely on luck alone.' },
  '审判': { subtitle: 'Calling / Review / Renewal', up: 'It is time for a decisive review and upgrade.', rev: 'Stop waiting for the perfect moment.' },
  '世界': { subtitle: 'Completion / Integration / Expansion', up: 'A chapter is closing well. Finish, publish, celebrate, then move into a larger map.', rev: 'Finish the final details. Do not quit halfway.' },
};

function getDisplayCardName(drawOrName) {
  const name = typeof drawOrName === 'string' ? drawOrName : drawOrName?.name;
  if (!name) return '';
  if (state.lang === 'zh') return name;
  if (EN_CARD_NAMES[name]) return EN_CARD_NAMES[name];
  const suit = Object.keys(EN_SUITS).find(s => name.startsWith(s) && s !== '大阿卡纳' && s !== '小阿卡纳');
  if (!suit) return name;
  const rank = name.slice(suit.length);
  return `${EN_RANKS[rank] || rank} of ${EN_SUITS[suit] || suit}`;
}

function getDisplayArcana(draw) {
  return state.lang === 'zh' ? (draw.arcana === '大阿卡纳' ? '大阿卡纳' : (draw.suit || '小阿卡纳')) : (draw.arcana === '大阿卡纳' ? 'Major Arcana' : (EN_SUITS[draw.suit] || 'Minor Arcana'));
}

function getDisplayElement(value) {
  return state.lang === 'zh' ? value : (EN_ELEMENTS[value] || value);
}

function translateSpreadName(name) {
  if (state.lang === 'zh') return name;
  const map = {
    '无牌阵三张': 'Three cards, no spread',
    '过去 / 现在 / 未来': 'Past / Present / Future',
    '时间流': 'Time Flow',
    '起因 / 过程 / 结果': 'Cause / Process / Result',
    '二选一牌阵': 'Choice Spread',
  };
  return map[name] || name;
}

function translateSpreadDesc(desc) {
  if (state.lang === 'zh') return desc;
  const map = {
    '默认 · 三张无固定解释位置': 'Default · three cards without fixed positions',
    '经典三张时间线牌阵': 'Classic three-card timeline spread',
    '更强调后续发展': 'Focuses more on what comes next',
    '适合看事件发展': 'Good for understanding how an event unfolds',
    '用于比较两个选择的短期走向与最终结果': 'Compare the short-term path and final outcome of two choices',
    '选项A / 选项B / 建议': 'Choice A / Choice B / Advice',
    '自己命名、定义张数和每张牌含义': 'Name it yourself, choose the card count, and define each position',
  };
  return map[desc] || desc;
}

function translateLabel(label) {
  const map = {
    slot1: { zh: '第一张', en: 'First card' },
    slot2: { zh: '第二张', en: 'Second card' },
    slot3: { zh: '第三张', en: 'Third card' },
    '第一张': { zh: '第一张', en: 'First card' },
    '第二张': { zh: '第二张', en: 'Second card' },
    '第三张': { zh: '第三张', en: 'Third card' },
    '过去': { zh: '过去', en: 'Past' },
    '现在': { zh: '现在', en: 'Present' },
    '未来': { zh: '未来', en: 'Future' },
    '更远的未来': { zh: '更远的未来', en: 'Further future' },
    '起因': { zh: '起因', en: 'Cause' },
    '过程': { zh: '过程', en: 'Process' },
    '结果': { zh: '结果', en: 'Result' },
    '现况': { zh: '现况', en: 'Current situation' },
    '选择A的近未来': { zh: '选择A的近未来', en: 'Choice A · near future' },
    '选择B的近未来': { zh: '选择B的近未来', en: 'Choice B · near future' },
    '选择A的结果': { zh: '选择A的结果', en: 'Choice A · outcome' },
    '选择B的结果': { zh: '选择B的结果', en: 'Choice B · outcome' },
  };
  const hit = map[label];
  if (hit) return state.lang === 'zh' ? hit.zh : hit.en;
  return label;
}

function renderSpreadOptionTexts() {
  $$('.spreadOption').forEach(btn => {
    const key = btn.dataset.spread;
    const titleEl = btn.querySelector('.spreadOption__title');
    const subEl = btn.querySelector('.spreadOption__sub');
    if (!titleEl || !subEl) return;
    if (key === 'custom') {
      titleEl.textContent = state.lang === 'zh' ? '自定义牌阵' : 'Custom spread';
      subEl.textContent = state.lang === 'zh' ? '自己命名、定义张数和每张牌含义' : 'Name it yourself, choose the card count, and define each position';
      return;
    }
    const spread = PRESET_SPREADS[key];
    if (!spread) return;
    titleEl.textContent = translateSpreadName(spread.name);
    subEl.textContent = translateSpreadDesc(spread.desc);
  });
}

function applyTranslations() {
  const langPack = getCurrentLangPack();
  document.documentElement.lang = langPack.htmlLang;
  document.title = langPack.pageTitle;
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', langPack.pageDescription);
  const btnLang = $('#btnLang');
  if (btnLang) {
    const label = state.lang === 'zh' ? '选择语言 / Choose language' : 'Choose language / 选择语言';
    btnLang.setAttribute('aria-label', label);
    btnLang.setAttribute('title', label);
  }
  const langCode = $('#langCode');
  if (langCode) langCode.textContent = state.lang === 'zh' ? '中' : 'EN';
  $$('.langMenu__item').forEach((node) => {
    const isActive = node.dataset.lang === state.lang;
    node.classList.toggle('is-active', isActive);
    node.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    node.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  const set = (sel, value, html = false) => {
    const node = $(sel);
    if (!node) return;
    if (html) node.innerHTML = value;
    else node.textContent = value;
  };

  set('.brand__sub', t('brandSub'));
  $$('.progressBar__step span:last-child').forEach((node, idx) => node.textContent = langPack.progress[idx] || node.textContent);
  set('.heroCard__title', t('heroTitle'), true);
  set('.heroCard__text', t('heroText'));
  set('.questionCard__title', t('questionTitle'));
  const questionInput = $('#questionInput');
  if (questionInput) questionInput.placeholder = t('questionPlaceholder');
  set('.questionTips', t('questionTips'));
  set('#btnToSpread .primaryAction__top', t('nextToSpreadTop'));
  set('#btnToSpread .primaryAction__sub', t('nextToSpreadSub'));
  set('.screen--intro .secondaryAction', t('openGallery'));
  set('[data-screen="spread"] .sectionCard__title', t('spreadTitle'));
  set('[data-screen="spread"] .sectionCard__text', t('spreadText'));
  renderSpreadOptionTexts();
  set('.customPanel__title', t('customPanelTitle'));
  set('label[for="customSpreadName"] .pickSlot__label', t('customName'));
  const customNameLabel = $('#customSpreadName')?.closest('label')?.querySelector('.pickSlot__label');
  if (customNameLabel) customNameLabel.textContent = t('customName');
  const customCountLabel = $('#customSpreadCount')?.closest('label')?.querySelector('.pickSlot__label');
  if (customCountLabel) customCountLabel.textContent = t('customCount');
  if ($('#customSpreadName')) $('#customSpreadName').placeholder = t('customNamePlaceholder');
  set('#btnBackIntro', t('backQuestion'));
  set('#btnToShuffle .primaryAction__top', t('confirmSpreadTop'));
  set('#btnToShuffle .primaryAction__sub', t('confirmSpreadSub'));
  set('.ritualCard__title', t('shuffleTitle'));
  if (!state.shuffled78.length) set('#shuffleText', t('shuffleIntro'));
  set('#btnBackSpread', t('backSpread'));
  set('#btnBackShuffle', t('backShuffle'));
  set('#btnBackPick', t('backPick'));
  set('#btnLucky', t('luckyFill'));
  set('#btnReShuffle', t('reshuffleSmall'));
  set('#btnMatch .primaryAction__top', t('matchTop'));
  set('#btnMatch .primaryAction__sub', t('matchSub'));
  set('.resultHeader__title', t('resultTitle'));
  const panelMeta = $('#panelMeta');
  if (panelMeta && !state.drawn.length) panelMeta.textContent = t('panelMetaIdle');
  set('#btnRevealAll', t('revealAll'));
  set('#btnCopy', t('copyResult'));
  set('.readingPanel__head span:first-child', t('readingTitle'));
  set('#llmPanelTitle', t('aiTitle'));
  set('#btnInterpret', state.lang === 'zh' ? '生成 AI 解读' : 'Generate AI reading');
  set('#btnReset .primaryAction__top', t('resetTop'));
  set('#btnReset .primaryAction__sub', t('resetSub'));
  set('#settings .modal__title', t('settingsTitle'));
  set('#settings .modal__sub', t('settingsSub'));
  set('#settings .field__label', t('motionLabel'));
  set('#settings .field__help', t('motionHelp'));
  const soundLabel = $('#sound')?.parentElement?.querySelector('span');
  if (soundLabel) soundLabel.textContent = t('soundLabel');
  set('#settings .btn[value="cancel"]', t('cancel'));
  set('#btnSave', t('save'));
  set('#cardDetail .modal__title', t('detailTitle'));
  if (state.activeDetailIndex < 0) set('#detailMeta', t('detailSub'));
  if (state.activeDetailIndex < 0) set('#detailPosterNote', t('detailPosterNote'));
  set('#btnZoomFromDetail', t('zoom'));
  set('#btnOpenOriginal', t('openOriginal'));
  const detailKs = $$('#cardDetail .detailSection__k, #cardDetail .detailPanel__title');
  if (detailKs[0]) detailKs[0].textContent = t('detailKeywords');
  const detailTitles = $$('#detailFullMeaning .detailPanel__title');
  if (detailTitles[0]) detailTitles[0].textContent = t('detailUpKeywords');
  if (detailTitles[1]) detailTitles[1].textContent = t('detailUpMeaning');
  if (detailTitles[2]) detailTitles[2].textContent = t('detailRevKeywords');
  if (detailTitles[3]) detailTitles[3].textContent = t('detailRevMeaning');
  set('#imageLightbox .modal__title', t('lightboxTitle'));
  if (state.activeLightboxIndex < 0) set('#lightboxMeta', t('lightboxSub'));
  set('#btnLightboxDetail', t('lightboxDetail'));
  set('#btnLightboxOpenOriginal', t('lightboxOpenOriginal'));
  const interpretBtn = $('#btnInterpret');
  if (interpretBtn) {
    interpretBtn.textContent = t('aiGenerate');
  }

  renderQuestionEcho();
  renderSpreadEcho();
  renderPickInputs();
  renderGrid();
  renderReading();
  renderAiReading();
  renderDebugFingerprint();
  if (!state.shuffled78.length) {
    updateSpreadHint(t('spreadHintDefault'));
    updateHint(t('hintDefault'));
    setSequenceMeta(t('sequenceIdle'));
  }
}

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
  'blank3': { key: 'blank3', name: '无牌阵三张', labels: ['slot1', 'slot2', 'slot3'], desc: '默认 · 三张无固定解释位置' },
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
  lang: localStorage.getItem('vege_tarot_lang') || 'zh',
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
  detailExpanded: false,
  tarotDict: {},
  tarotDictLoaded: false,
  readingStatus: 'idle',
  readingMode: 'reading',
  readingResult: null,
  readingErrorCode: '',
  sessionId: '',
  drawId: '',
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
  MAJOR.forEach((card, i) => {
    const en = EN_MAJOR[card.name] || {};
    cards.push({
      number: i + 1,
      arcana: '大阿卡纳',
      suit: '大阿卡纳',
      rank: card.name,
      name: card.name,
      subtitle: state.lang === 'zh' ? card.subtitle : (en.subtitle || card.subtitle),
      up: state.lang === 'zh' ? card.up : (en.up || card.up),
      rev: state.lang === 'zh' ? card.rev : (en.rev || card.rev),
      image: CARD_IMAGE_BY_NAME[card.name] || ''
    });
  });
  let number = 23;
  for (const suit of SUITS) {
    for (const rank of MINOR_RANKS) {
      const name = `${suit.name}${rank}`;
      const suitLeadZh = suit.subtitle.split(' / ')[0];
      const suitLeadEn = (EN_SUITS[suit.name] || suit.name).slice(0);
      cards.push({
        number,
        arcana: '小阿卡纳', suit: suit.name, rank, name,
        subtitle: state.lang === 'zh' ? suit.subtitle : ({ '权杖': 'Action / Desire / Momentum', '圣杯': 'Emotion / Relationship / Feeling', '宝剑': 'Thought / Conflict / Decision', '星币': 'Reality / Money / Grounding' }[suit.name] || suit.subtitle),
        up: state.lang === 'zh'
          ? `${name}正位：这股 ${suitLeadZh} 能量更适合被正面使用，主动推进会比犹豫更有结果。`
          : `${getDisplayCardName(name)} upright: this ${suitLeadEn.toLowerCase()} energy works best when used directly and constructively. Taking action is likely to work better than hesitating.`,
        rev: state.lang === 'zh'
          ? `${name}逆位：${suitLeadZh} 能量出现阻塞、迟疑或失衡，先整理状态再决定下一步。`
          : `${getDisplayCardName(name)} reversed: this ${suitLeadEn.toLowerCase()} energy is blocked, hesitant, or out of balance. Recenter yourself before choosing the next step.`,
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

function hasCJK(text = '') {
  return /[\u3400-\u9FFF]/.test(String(text || ''));
}

function preferVisibleEnglish(text = '') {
  const clean = normalizeDictText(text);
  if (!clean) return '';
  if (state.lang === 'en' && hasCJK(clean)) return '';
  return clean;
}

function summarizeText(text = '', limit = 88) {
  const clean = normalizeDictText(text).replace(/…+/g, '');
  if (!clean) return '';
  return clean;
}

function getDictEntry(name) {
  const aliases = {
    '愚者': '愚人',
    '隐者': '隐士',
    '塔': '高塔',
    '圣杯王牌': '圣杯一',
    '权杖王牌': '权杖一',
    '宝剑王牌': '宝剑一',
    '星币王牌': '星币一',
    '圣杯王后': '圣杯皇后',
    '权杖王后': '权杖皇后',
    '宝剑王后': '宝剑皇后',
    '星币王后': '星币皇后',
  };
  return state.tarotDict?.[name] || state.tarotDict?.[aliases[name]] || null;
}

function getEnglishKeywordText(dict, ori = 'up') {
  if (!dict) return '';
  return normalizeDictText(
    ori === 'up'
      ? (dict?.upright_keywords_en || dict?.upright_keywords || dict?.keywords_en?.join(', '))
      : (dict?.reversed_keywords_en || dict?.reversed_keywords || dict?.keywords_en?.join(', '))
  );
}

function getCardKeywords(draw) {
  const dict = getDictEntry(draw.name);
  if (state.lang === 'en') {
    const source = getEnglishKeywordText(dict, draw.ori === 'rev' ? 'rev' : 'up');
    if (!source) return [];
    return source.split(/[、，,；;。/]/).map(s => s.trim()).filter(Boolean);
  }
  const source = draw.ori === 'up'
    ? preferVisibleEnglish(dict?.upright_keywords || dict?.up_keywords || dict?.keywords)
    : preferVisibleEnglish(dict?.reversed_keywords || dict?.rev_keywords || dict?.keywords);
  if (source) return source.split(/[、，,；;。/]/).map(s => s.trim()).filter(Boolean);
  const fromSubtitle = buildKeywords(draw);
  const fromSummary = dict?.summary
    ? summarizeText(dict.summary, 80).split(/[、，,；;。]/).map(s => s.trim()).filter(Boolean)
    : [];
  return [...new Set([...(fromSubtitle || []), ...fromSummary])].filter(Boolean);
}

function getCardMeaning(draw, ori = draw.ori) {
  const dict = getDictEntry(draw.name);
  const isUp = ori === 'up';
  const primary = state.lang === 'en'
    ? normalizeDictText(isUp ? (dict?.up_en || dict?.upright_en || dict?.up || dict?.upright) : (dict?.rev_en || dict?.reversed_en || dict?.rev || dict?.reversed))
    : preferVisibleEnglish(isUp ? (dict?.upright || dict?.up || dict?.upright_text) : (dict?.reversed || dict?.rev || dict?.reversed_text));
  const fallback = normalizeDictText(isUp ? draw.up : draw.rev);
  const result = primary || fallback || (state.lang === 'zh' ? '暂无牌意。' : 'No card meaning available.');
  if (DEBUG_ENABLED && !primary) {
    logDebug('meaning-fallback', {
      drawName: draw.name,
      ori,
      dictHit: Boolean(dict),
      usedFallback: true,
    });
  }
  return result;
}

function getCardMeaningKeywords(draw, ori = draw.ori) {
  const dict = getDictEntry(draw.name);
  const isUp = ori === 'up';
  if (state.lang === 'en') {
    return getEnglishKeywordText(dict, isUp ? 'up' : 'rev') || 'No keywords yet';
  }
  const raw = preferVisibleEnglish(isUp ? (dict?.upright_keywords || dict?.up_keywords || dict?.keywords) : (dict?.reversed_keywords || dict?.rev_keywords || dict?.keywords));
  if (raw) return raw;
  return getCardKeywords({ ...draw, ori }).join(' · ') || '暂无关键词';
}

function getCardSummary(draw) {
  const dict = getDictEntry(draw.name);
  return (state.lang === 'en' ? normalizeDictText(dict?.summary_en || dict?.summary) : preferVisibleEnglish(dict?.summary)) || getDisplaySummary(draw) || '';
}

function getDisplaySummary(draw) {
  if (state.lang === 'zh') return getCardSummary(draw);
  const major = EN_MAJOR[draw.name];
  if (major?.subtitle) return major.subtitle;
  if (draw.suit && EN_SUITS[draw.suit]) {
    const suitTheme = {
      '权杖': 'Action / Desire / Momentum',
      '圣杯': 'Emotion / Relationship / Feeling',
      '宝剑': 'Thought / Conflict / Decision',
      '星币': 'Reality / Money / Grounding',
    };
    return suitTheme[draw.suit] || draw.subtitle || '';
  }
  return draw.subtitle || '';
}

function getCardArcanaLabel(draw) {
  return getDisplayArcana(draw);
}

function getCardElement(draw) {
  const majorElements = {
    '愚者': '风',
    '魔术师': '水银 / 风',
    '女祭司': '水',
    '女皇': '土',
    '皇帝': '火',
    '教皇': '土',
    '恋人': '风',
    '战车': '水',
    '力量': '火',
    '隐者': '土',
    '命运之轮': '火',
    '正义': '风',
    '倒吊人': '水',
    '死神': '水',
    '节制': '火',
    '恶魔': '土',
    '塔': '火',
    '高塔': '火',
    '星星': '风',
    '月亮': '水',
    '太阳': '火',
    '审判': '火',
    '世界': '土'
  };
  const suitElements = {
    '权杖': '火',
    '圣杯': '水',
    '宝剑': '风',
    '星币': '土'
  };
  return getDisplayElement(majorElements[draw.name] || suitElements[draw.suit] || '');
}

function getCardNumerology(draw) {
  const majorNumbers = {
    '愚者': '0', '魔术师': '1', '女祭司': '2', '女皇': '3', '皇帝': '4', '教皇': '5', '恋人': '6', '战车': '7',
    '力量': '8', '隐者': '9', '命运之轮': '10', '正义': '11', '倒吊人': '12', '死神': '13', '节制': '14', '恶魔': '15',
    '塔': '16', '高塔': '16', '星星': '17', '月亮': '18', '太阳': '19', '审判': '20', '世界': '21'
  };
  const minorNumbers = {
    '王牌': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10'
  };
  if (draw.arcana === '大阿卡纳') return majorNumbers[draw.name] || '';
  return minorNumbers[draw.rank] || '';
}

function getCardDetailChips(draw, positionLabel = '') {
  const chips = [getCardArcanaLabel(draw), getCardElement(draw)];
  const numerology = getCardNumerology(draw);
  if (numerology) chips.push(state.lang === 'zh' ? `灵数 ${numerology}` : `Number ${numerology}`);
  if (positionLabel) chips.push(translateLabel(positionLabel));
  return chips.filter(Boolean);
}

function getGalleryCardByName(name) {
  if (!state.base78?.length) return null;
  return state.base78.find(card => card.name === name) || null;
}

function getGalleryCardDetailData(name) {
  const base = getGalleryCardByName(name);
  if (!base) return null;
  return { ...base, ori: 'up', revealed: true };
}

function getReadingSummary(draw) {
  const summary = getCardSummary(draw);
  const meaning = getCardMeaning(draw, draw.ori);
  return summarizeText(summary || meaning, 100) || (state.lang === 'zh' ? '暂无摘要。' : 'No summary available.');
}

function getPositionSummary(draw, label) {
  const text = t('pickPositionSummary', translateLabel(label), getCardMeaning(draw, draw.ori));
  return summarizeText(text, 100) || (state.lang === 'zh' ? '暂无牌位摘要。' : 'No position summary available.');
}

function setDetailExpanded(expanded) {
  state.detailExpanded = Boolean(expanded);
  const box = $('#detailFullMeaning');
  const btn = $('#btnToggleFullMeaning');
  if (box) box.hidden = !state.detailExpanded;
  if (btn) {
    btn.setAttribute('aria-expanded', String(state.detailExpanded));
    btn.textContent = state.detailExpanded
      ? (state.lang === 'zh' ? '收起完整长文牌意' : 'Hide full card meaning')
      : (state.lang === 'zh' ? '展开完整长文牌意' : 'Show full card meaning');
  }
}

async function loadTarotDict() {
  const candidates = state.lang === 'en'
    ? [
        `assets/tarot-dict-display-en.json?v=${APP_VERSION}`,
      ]
    : [
        `assets/tarot-dict-display-normalized.json?v=${APP_VERSION}`,
        `assets/tarot-dict-quickref.json?v=${APP_VERSION}`,
      ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.tarotDict = data?.cards || {};
      state.tarotDictLoaded = Object.keys(state.tarotDict).length > 0;
      updateDictBadge();
      buildBase78();
      logDebug('dict-loaded', {
        url,
        cardCount: Object.keys(state.tarotDict).length,
        sampleKeys: Object.keys(state.tarotDict).slice(0, 8),
      });
      buildEncoded156();
      renderGrid();
      renderReading();
      if (state.tarotDictLoaded) {
        const cardCount = Object.keys(state.tarotDict).length;
        console.info(`[tarot] loaded dict from ${url} with ${cardCount} cards`);
        updateHint(t('loadedDict', cardCount));
        return;
      }
    } catch (err) {
      console.warn(`Failed to load tarot dict from ${url}:`, err);
    }
  }
  state.tarotDict = {};
  state.tarotDictLoaded = false;
  updateDictBadge();
  updateHint(t('loadDictFailed'));
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

function updateDictBadge() {}

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
  $('#questionEcho').textContent = `${t('questionEchoPrefix')}${state.question?.trim() ? state.question.trim() : t('questionEmpty')}`;
}

function renderSpreadEcho() {
  $('#spreadEcho').textContent = `${t('spreadEchoPrefix')}${translateSpreadName(state.spread.name)}`;
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
    label.textContent = t('customMeaningLabel', i + 1);
    input.type = 'text';
    input.placeholder = t('customMeaningPlaceholder');
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
  if (!name) return { error: t('customNeedName') };
  if (!Number.isInteger(count) || count < 1 || count > 20) return { error: t('customNeedCount') };
  if (labels.length !== count) return { error: t('customNeedLabels') };
  return { key: 'custom', name, labels, desc: state.lang === 'zh' ? `自定义牌阵 · ${count} 张` : `Custom spread · ${count} cards` };
}

function renderPickInputs() {
  const panel = $('#pickPanel');
  panel.innerHTML = '';
  state.spread.labels.forEach((label, idx) => {
    const wrap = el('label', 'pickSlot');
    const labelEl = el('span', 'pickSlot__label');
    const input = el('input', 'pickSlot__input');
    labelEl.textContent = translateLabel(label);
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
  $('#pickTitle').textContent = t('pickTitleForSpread', translateSpreadName(state.spread.name));
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
    card.setAttribute('aria-label', state.lang === 'zh' ? `${label} 牌位` : `${translateLabel(label)} position`);
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
    tl.textContent = translateLabel(label);
    img.alt = state.lang === 'zh' ? `${label} 牌位图片` : `${translateLabel(label)} card image`;
    media.append(img, overlay);
    meta.append(name, subtitle);
    front.append(frame, tl, media, meta);
    card.append(back, front);
    const d = state.drawn[i];
    if (d) {
      hydrateCard(card, d, label);
      if (d.revealed) card.classList.add('is-flipped');
    } else {
      name.textContent = t('cardWaiting');
      subtitle.textContent = '';
    }
    card.addEventListener('click', () => onFlip(i));
    grid.append(card);
  });
}

function hydrateCard(cardBtn, draw, label) {
  const front = cardBtn.querySelector('.card__front');
  front.querySelector('.card__corner--tl').textContent = translateLabel(label);
  front.querySelector('.card__name').textContent = getDisplayCardName(draw);
  front.querySelector('.card__subtitle').textContent = getOriLabel(draw.ori);
  const img = front.querySelector('.card__image');
  if (img) {
    img.src = draw.image;
    img.alt = `${getDisplayCardName(draw)} ${getOriLabel(draw.ori)}`;
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
  return getPositionSummary(draw, label);
}

function openCardDetail(index) {
  const draw = state.drawn[index];
  if (!draw) return;
  state.activeDetailIndex = index;
  logDebug('open-card-detail', {
    index,
    drawName: draw.name,
    drawOri: draw.ori,
    drawImage: draw.image,
    dictHit: Boolean(getDictEntry(draw.name)),
  });
  $('#detailMeta').textContent = t('detailMeta', translateSpreadName(state.spread.name), translateLabel(state.spread.labels[index]), getOriLabel(draw.ori));
  $('#detailName').textContent = getDisplayCardName(draw);
  const chips = $('#detailChips');
  chips.innerHTML = '';
  getCardDetailChips(draw, state.spread.labels[index]).forEach(text => {
    const chip = el('span', 'detailChip');
    chip.textContent = text;
    chips.append(chip);
  });
  const poster = $('#detailPosterImage');
  poster.src = draw.image;
  poster.alt = `${getDisplayCardName(draw)} ${getOriLabel(draw.ori)}`;
  poster.classList.toggle('is-reversed', draw.ori === 'rev');
  $('#detailPosterNote').textContent = t('posterNoteWithOri', getOriLabel(draw.ori));
  $('#detailKeywords').textContent = getCardKeywords(draw).join(' · ') || (state.lang === 'zh' ? '暂无关键词' : 'No keywords yet');
  $('#detailUpKeywords').textContent = getCardMeaningKeywords(draw, 'up');
  $('#detailUp').textContent = getCardMeaning(draw, 'up');
  $('#detailRevKeywords').textContent = getCardMeaningKeywords(draw, 'rev');
  $('#detailRev').textContent = getCardMeaning(draw, 'rev');
  safeShowDialog('#cardDetail');
}

function safeShowDialog(selector) {
  const dlg = typeof selector === 'string' ? $(selector) : selector;
  if (!dlg) return;
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', 'open');
}

function safeCloseDialog(selector) {
  const dlg = typeof selector === 'string' ? $(selector) : selector;
  if (!dlg) return;
  if (typeof dlg.close === 'function' && dlg.open) dlg.close();
  else dlg.removeAttribute('open');
}

function revealIntoView(node) {
  if (!node) return;
  requestAnimationFrame(() => {
    try {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } catch (_) {
      node.scrollIntoView();
    }
  });
}

function openImageLightbox(index) {
  const draw = state.drawn[index];
  if (!draw) return;
  state.activeLightboxIndex = index;
  const img = $('#lightboxImage');
  img.src = draw.image;
  img.alt = `${getDisplayCardName(draw)} ${getOriLabel(draw.ori)}`;
  img.classList.toggle('is-reversed', draw.ori === 'rev');
  $('#lightboxMeta').textContent = t('lightboxMeta', getDisplayCardName(draw), getOriLabel(draw.ori));
  safeShowDialog('#imageLightbox');
}

function closeImageLightbox() {
  safeCloseDialog('#imageLightbox');
}

function openOriginalImage(index = state.activeDetailIndex) {
  const draw = state.drawn[index];
  if (!draw?.image) return;
  window.open(draw.image, '_blank', 'noopener,noreferrer');
}

function closeCardDetail() {
  safeCloseDialog('#cardDetail');
}

function openDonateModal() {
  const title = $('#donateTitle');
  const sub = $('#donateSub');
  const hint = $('#donateHint');
  if (title) title.textContent = t('donateTitle');
  if (sub) sub.textContent = t('donateSub');
  if (hint) hint.textContent = t('donateHint');
  safeShowDialog('#donateModal');
}

function closeDonateModal() {
  safeCloseDialog('#donateModal');
}

function buildFallbackReadingFromCurrentDraw() {
  const names = state.drawn.map(d => `${getDisplayCardName(d)} ${getOriLabel(d.ori)}`);
  return {
    mode: 'reading',
    summary: t('mockSummary', names),
    synthesis: t('mockSynthesis'),
    advice: `${t('aiErrorFallback')} ${t('mockAdvice')}`,
    riskNotes: t('mockRisk'),
    followUps: t('mockFollowups'),
  };
}

function getAiReadingExportSections() {
  const result = state.readingResult || {};
  const sections = [];
  if (result.summary) sections.push({ label: t('aiSummary'), text: normalizeDictText(result.summary) });
  if (result.synthesis) sections.push({ label: t('aiSynthesis'), text: normalizeDictText(result.synthesis) });
  if (result.advice) sections.push({ label: t('aiAdvice'), text: normalizeDictText(result.advice) });
  if (result.riskNotes) sections.push({ label: t('aiRisk'), text: normalizeDictText(result.riskNotes) });
  if (Array.isArray(result.followUps) && result.followUps.length) {
    sections.push({
      label: t('aiFollowups'),
      text: result.followUps.map(x => `• ${normalizeDictText(x)}`).filter(Boolean).join('\n'),
    });
  }
  return sections.filter(section => section.text);
}

function wrapCanvasText(ctx, text, maxWidth) {
  const raw = String(text || '').replace(/\r/g, '').split('\n');
  const lines = [];
  const pushToken = (token, joinWithSpace) => {
    if (!token) return;
    const tokenText = String(token);
    const tokenFits = ctx.measureText(tokenText).width <= maxWidth;
    if (!tokenFits) {
      Array.from(tokenText).forEach((char) => pushToken(char, false));
      return;
    }
    const last = lines.length ? lines[lines.length - 1] : '';
    const next = last ? `${last}${joinWithSpace ? ' ' : ''}${tokenText}` : tokenText;
    if (!last || ctx.measureText(next).width <= maxWidth) {
      if (lines.length) lines[lines.length - 1] = next;
      else lines.push(next);
    } else {
      lines.push(tokenText);
    }
  };

  raw.forEach((paragraph, pIndex) => {
    const source = paragraph.trim();
    if (!source) {
      lines.push('');
      return;
    }
    const hasSpaces = /\s/.test(source);
    if (hasSpaces) {
      source.split(/\s+/).forEach((token) => pushToken(token, true));
    } else {
      Array.from(source).forEach((char) => pushToken(char, false));
    }
    if (pIndex < raw.length - 1) lines.push('');
  });
  return lines;
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = wrapCanvasText(ctx, text, maxWidth);
  lines.forEach((line, index) => {
    if (line) ctx.fillText(line, x, y + index * lineHeight);
  });
  return lines.length * lineHeight;
}

function buildAiReadingImageCanvas() {
  const sections = getAiReadingExportSections();
  if (!sections.length) throw new Error('No AI reading content to export');

  const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
  const width = 1200;
  const pad = 78;
  const contentWidth = width - pad * 2;
  const blockPad = 34;
  const bodyLineHeight = 38;
  const measureCanvas = document.createElement('canvas');
  const m = measureCanvas.getContext('2d');
  m.font = '26px serif';

  const question = state.question?.trim() || t('questionEmpty');
  const spreadName = translateSpreadName(state.spread?.name || '');
  const cards = state.drawn.map((draw, i) => `${translateLabel(state.spread.labels[i] || String(i + 1))}：${getDisplayCardName(draw)} · ${getOriLabel(draw.ori)}`);

  let height = 126;
  height += 34;
  height += wrapCanvasText(m, `${t('questionEchoPrefix')}${question}`, contentWidth).length * 38 + 18;
  height += wrapCanvasText(m, `${t('spreadEchoPrefix')}${spreadName}`, contentWidth).length * 38 + 14;
  height += cards.reduce((sum, line) => sum + wrapCanvasText(m, line, contentWidth).length * 34, 0) + 40;
  sections.forEach((section) => {
    height += wrapCanvasText(m, section.text, contentWidth - blockPad * 2).length * bodyLineHeight + 122;
  });
  const footerGap = 118;
  const footerHeight = 110;
  height += footerGap + footerHeight;
  height = Math.max(1500, Math.ceil(height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#090814');
  bg.addColorStop(0.48, '#141126');
  bg.addColorStop(1, '#070611');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(247,208,122,0.10)';
  ctx.beginPath();
  ctx.arc(170, 120, 210, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(169,140,255,0.12)';
  ctx.beginPath();
  ctx.arc(width - 120, 310, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffefb5';
  ctx.font = '700 44px serif';
  ctx.fillText('Vegebird Tarot', pad, 98);

  let y = 168;
  ctx.fillStyle = 'rgba(244,241,255,0.90)';
  ctx.font = '28px serif';
  y += drawWrappedText(ctx, `${t('questionEchoPrefix')}${question}`, pad, y, contentWidth, 38) + 18;
  ctx.fillStyle = 'rgba(255,239,181,0.92)';
  y += drawWrappedText(ctx, `${t('spreadEchoPrefix')}${spreadName}`, pad, y, contentWidth, 38) + 22;

  ctx.fillStyle = 'rgba(244,241,255,0.76)';
  ctx.font = '25px serif';
  cards.forEach((line) => {
    y += drawWrappedText(ctx, line, pad, y, contentWidth, 34);
  });
  y += 22;

  sections.forEach((section) => {
    ctx.font = '26px serif';
    const lines = wrapCanvasText(ctx, section.text, contentWidth - blockPad * 2);
    const blockHeight = 70 + Math.max(1, lines.length) * bodyLineHeight + 30;
    drawRoundRect(ctx, pad, y, contentWidth, blockHeight, 28);
    ctx.fillStyle = 'rgba(21,17,58,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(247,208,122,0.20)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffefb5';
    ctx.font = '700 25px serif';
    ctx.fillText(section.label, pad + blockPad, y + 44);
    ctx.fillStyle = 'rgba(244,241,255,0.88)';
    ctx.font = '26px serif';
    lines.forEach((line, index) => {
      if (line) ctx.fillText(line, pad + blockPad, y + 88 + index * bodyLineHeight);
    });
    y += blockHeight + 22;
  });

  const footerY = Math.max(y + footerGap, height - 74);
  ctx.fillStyle = 'rgba(247,208,122,0.16)';
  ctx.fillRect(pad, footerY - 34, contentWidth, 1);
  ctx.fillStyle = 'rgba(244,241,255,0.58)';
  ctx.font = '22px serif';
  ctx.fillText('vegebird-tarot', pad, footerY);
  ctx.textAlign = 'right';
  ctx.fillText(new Date().toLocaleDateString(state.lang === 'zh' ? 'zh-CN' : 'en-US'), width - pad, footerY);
  ctx.textAlign = 'left';

  return canvas;
}

function showImageSavePreview(dataUrl, filename) {
  const bodyEl = $('#llmReading');
  if (!bodyEl || !dataUrl) return;
  const old = $('#saveImagePreview');
  if (old) old.remove();
  const wrap = el('div', 'sharePreview');
  wrap.id = 'saveImagePreview';
  const hint = el('p', 'sharePreview__hint');
  hint.textContent = t('saveImagePreviewHint');
  const img = el('img', 'sharePreview__image');
  img.src = dataUrl;
  img.alt = t('shareImageTitle');
  const actions = el('div', 'sharePreview__actions');
  const download = el('a', 'ghost ghost--small');
  download.href = dataUrl;
  download.download = filename;
  download.textContent = t('saveImageDownload');
  const close = el('button', 'ghost ghost--small');
  close.type = 'button';
  close.textContent = t('saveImageClose');
  close.addEventListener('click', () => wrap.remove());
  actions.append(download, close);
  wrap.append(hint, img, actions);
  bodyEl.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function saveAiReadingAsImage() {
  if (state.readingStatus !== 'success' || !state.readingResult) return;
  const btn = $('#btnSaveImage');
  const original = btn?.textContent || t('saveImage');
  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('saveImagePreparing');
    }
    const canvas = buildAiReadingImageCanvas();
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Canvas export failed')), 'image/png', 0.96);
    });
    const filename = `vegebird-tarot-ai-reading-${new Date().toISOString().slice(0, 10)}.png`;
    const dataUrl = canvas.toDataURL('image/png', 0.96);
    showImageSavePreview(dataUrl, filename);
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ title: t('shareImageTitle'), files: [file] });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
    updateHint(t('saveImageDone'));
  } catch (err) {
    if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
      updateHint(t('saveImageDone'));
      return;
    }
    console.error('[ui] save image failed', err);
    updateHint(t('saveImageFailed'));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = original;
    }
  }
}

function renderAiReading() {
  const panelEl = $('#llmPanel');
  const statusEl = $('#llmStatusText');
  const bodyEl = $('#llmReading');
  const titleEl = $('#llmPanelTitle');
  if (!panelEl || !statusEl || !bodyEl) return;

  panelEl.hidden = !state.drawn.length;
  const statusMap = t('aiStatusMap');
  statusEl.textContent = statusMap[state.readingStatus] || state.readingStatus;
  if (titleEl) titleEl.textContent = t('aiTitleReading');
  const interpretBtn = $('#btnInterpret');
  if (interpretBtn) interpretBtn.textContent = t('aiGenerate');
  const donateBtn = $('#btnDonate');
  if (donateBtn) donateBtn.textContent = t('donateCta');
  const saveImageBtn = $('#btnSaveImage');
  if (saveImageBtn) {
    saveImageBtn.textContent = t('saveImage');
    saveImageBtn.hidden = state.readingStatus !== 'success' || !state.readingResult;
  }

  if (state.readingStatus === 'idle') {
    bodyEl.innerHTML = `<p class="muted">${t('aiPlaceholder')}</p>`;
    return;
  }
  if (state.readingStatus === 'loading') {
    bodyEl.innerHTML = `<p class="muted">${t('aiLoading')}</p>`;
    return;
  }
  if (state.readingStatus === 'error') {
    const errorText = state.readingErrorCode === 'cold-start' ? t('aiErrorColdStart') : t('aiError');
    bodyEl.innerHTML = `<p class="muted">${errorText}</p>`;
    return;
  }

  const result = state.readingResult || {};
  const blocks = [];
  if (result.summary) blocks.push(`<div class="aiPanel__block"><div class="aiPanel__label">${t('aiSummary')}</div><div>${result.summary}</div></div>`);
  if (result.synthesis) blocks.push(`<div class="aiPanel__block"><div class="aiPanel__label">${t('aiSynthesis')}</div><div>${result.synthesis}</div></div>`);
  if (result.advice) blocks.push(`<div class="aiPanel__block"><div class="aiPanel__label">${t('aiAdvice')}</div><div>${result.advice}</div></div>`);
  if (result.riskNotes) blocks.push(`<div class="aiPanel__block"><div class="aiPanel__label">${t('aiRisk')}</div><div>${result.riskNotes}</div></div>`);
  if (Array.isArray(result.followUps) && result.followUps.length) {
    blocks.push(`<div class="aiPanel__block"><div class="aiPanel__label">${t('aiFollowups')}</div><div>${result.followUps.map(x => `• ${x}`).join('<br>')}</div></div>`);
  }
  bodyEl.innerHTML = blocks.join('') || `<p class="muted">${t('aiEmpty')}</p>`;
}

function setMockAiReadingFromCurrentDraw() {
  if (!state.drawn.length) {
    state.readingStatus = 'idle';
    state.readingResult = null;
    renderAiReading();
    return;
  }
  const names = state.drawn.map(d => `${getDisplayCardName(d)} ${getOriLabel(d.ori)}`);
  state.readingStatus = 'success';
  state.readingResult = {
    summary: t('mockSummary', names),
    synthesis: t('mockSynthesis'),
    advice: t('mockAdvice'),
    riskNotes: t('mockRisk'),
    followUps: t('mockFollowups'),
  };
  renderAiReading();
}

function buildInterpretPayload() {
  const questionBase = state.question?.trim() || '';
  return {
    sessionId: state.sessionId || '',
    drawId: state.drawId || '',
    lang: state.lang,
    question: questionBase,
    spreadType: state.spread?.key || state.selectedSpreadKey || 'blank3',
    spreadName: translateSpreadName(state.spread?.name || ''),
    cards: state.drawn.map((draw, i) => {
      const orientation = draw.ori === 'up' ? 'upright' : 'reversed';
      return {
        position: translateLabel(state.spread.labels[i]),
        name: getDisplayCardName(draw),
        orientation,
        summary: getCardSummary(draw),
        keywords: getCardMeaningKeywords(draw, draw.ori),
        meaning: getCardMeaning(draw, draw.ori),
        image: draw.image,
        pick: draw.pick,
      };
    }),
  };
}

function normalizeInterpretResponse(data) {
  const result = data?.result || data?.data || data || {};
  return {
    mode: data?.mode || 'reading',
    summary: normalizeDictText(result.summary || result.overall || result.overallSummary || ''),
    synthesis: normalizeDictText(result.synthesis || result.analysis || result.linkage || ''),
    advice: normalizeDictText(result.advice || result.suggestion || result.recommendation || ''),
    riskNotes: normalizeDictText(result.riskNotes || result.risks || result.cautions || ''),
    followUps: Array.isArray(result.followUps)
      ? result.followUps.map(x => normalizeDictText(x)).filter(Boolean)
      : Array.isArray(result.followUpSuggestions)
        ? result.followUpSuggestions.map(x => normalizeDictText(x)).filter(Boolean)
        : [],
  };
}

function isEnglishReadingResultClean(result) {
  if (!result) return false;
  const texts = [result.summary, result.synthesis, result.advice, result.riskNotes, ...(result.followUps || [])]
    .map(x => normalizeDictText(x))
    .filter(Boolean);
  if (!texts.length) return false;
  return texts.every(text => !hasCJK(text));
}

async function requestAiReading({ allowMockFallback = true } = {}) {
  console.log('[ui] requestAiReading:start', {
    allowMockFallback,
    drawCount: state.drawn?.length || 0,
    lang: state.lang,
  });
  if (!state.drawn.length) {
    state.readingStatus = 'idle';
    state.readingResult = null;
    state.readingErrorCode = '';
    renderAiReading();
    return;
  }
  state.readingStatus = 'loading';
  state.readingMode = 'reading';
  state.readingResult = null;
  state.readingErrorCode = '';
  renderAiReading();

  const api = window.VEGE_TAROT_API;
  const payload = buildInterpretPayload();
  console.log('[ui] interpret payload', payload);
  logDebug('interpret-request', payload);

  if (!api?.interpretReading) {
    logDebug('interpret-missing-api', { allowMockFallback });
    if (allowMockFallback) {
      const fallback = buildFallbackReadingFromCurrentDraw();
      state.readingStatus = 'success';
      state.readingMode = 'reading';
      state.readingResult = fallback;
      state.readingErrorCode = 'fallback';
      renderAiReading();
      renderResolvedQuestionEcho();
      return;
    }
    state.readingStatus = 'error';
    state.readingErrorCode = 'api-missing';
    renderAiReading();
    return;
  }

  try {
    const response = await api.interpretReading(payload);
    console.log('[ui] interpret response raw', response);
    const normalized = normalizeInterpretResponse(response);
    const hasUsefulContent = normalized.summary || normalized.synthesis || normalized.advice || normalized.riskNotes || (normalized.followUps && normalized.followUps.length);
    if (!hasUsefulContent) throw new Error('AI 返回成功，但没有可展示内容');
    if (state.lang === 'en' && !isEnglishReadingResultClean(normalized)) {
      throw new Error('AI returned Chinese content while page is in English mode');
    }
    state.readingStatus = 'success';
    state.readingMode = normalized.mode || 'reading';
    state.readingResult = normalized;
    state.readingErrorCode = '';
    logDebug('interpret-success', normalized);
    renderAiReading();
  } catch (error) {
    console.error('[ui] interpret request failed', {
      message: error?.message || String(error),
      status: error?.status,
      payload: error?.payload || null,
    });
    logDebug('interpret-error', {
      message: error?.message || String(error),
      status: error?.status,
      payload: error?.payload || null,
      allowMockFallback,
    });
    if (allowMockFallback) {
      const fallback = buildFallbackReadingFromCurrentDraw();
      state.readingStatus = 'success';
      state.readingMode = 'reading';
      state.readingResult = fallback;
      state.readingErrorCode = 'fallback';
      renderAiReading();
      renderResolvedQuestionEcho();
      return;
    }
    state.readingStatus = 'error';
    state.readingResult = null;
    state.readingErrorCode = error?.status === 503 || /timeout|timed out|cold|upstream/i.test(error?.message || '') ? 'cold-start' : 'request-failed';
    renderAiReading();
  }
}

function renderDebugFingerprint() {
  return;
}

function renderReading() {
  const box = $('#reading');
  if (!state.drawn.length) {
    box.innerHTML = `<p class="muted">${t('readingPlaceholder')}</p>`;
    setMeta(t('notMatched'));
    return;
  }
  const allRevealed = state.drawn.every(d => d && d.revealed);
  setMeta(allRevealed ? t('allRevealed') : t('waitingFlip'));
  const grid = el('div', 'readingGrid');
  state.spread.labels.forEach((label, i) => {
    const d = state.drawn[i];
    const c = el('div', 'readingCard');
    const k = el('div', 'readingCard__k');
    const v = el('div', 'readingCard__v');
    if (!d) {
      k.textContent = `${translateLabel(label)} · ${t('unrevealed')}`;
      v.textContent = t('waitingResult');
    } else {
      k.textContent = `${translateLabel(label)}`;
      if (d.revealed) {
        const keywords = getCardKeywords(d).join(' · ') || (state.lang === 'zh' ? '暂无关键词' : 'No keywords yet');
        v.innerHTML = `<strong>${getDisplayCardName(d)}</strong> (${getOriLabel(d.ori)})<div class="readingCard__summary">${t('keywordsLabel')}${keywords}</div><span class="readingCard__more">${t('readingMore')}</span>`;
      } else {
        v.innerHTML = `<strong>${getDisplayCardName(d)}</strong><br><span class="muted">${t('cardMatchedHint')}</span>`;
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
  if (values.length !== state.spread.labels.length) return t('validateCountMismatch');
  if (values.some(v => !Number.isInteger(v) || v < 1 || v > 78)) return t('validateRange');
  if ((new Set(values)).size !== values.length) return t('validateUnique');
  return '';
}

async function ritualShuffleAnimation() {
  $('#shuffleText').textContent = t('shuffling');
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
  $('#shuffleText').textContent = t('shuffled');
  setSequenceMeta(t('shuffledMeta'));
  $('#btnShuffle .primaryAction__top').textContent = t('reshuffle');
  $('#btnToPick').hidden = false;
  $('#btnToPick').textContent = t('goPick');
  updateHint(t('shuffledHint'));
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
  updateHint(t('luckyDone'));
}

function onMatch() {
  if (!state.shuffled78.length) {
    updateHint(t('notShuffled'));
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
  state.readingStatus = 'idle';
  state.readingMode = 'reading';
  state.readingResult = null;
  state.readingErrorCode = '';
  state.sessionId = `sess_${Date.now()}`;
  state.drawId = `draw_${Date.now()}`;
  renderGrid();
  renderReading();
  renderAiReading();
  renderQuestionEcho();
  renderSpreadEcho();
  goToScreen('result');
  updateHint(t('matchedHint'));
}

function onFlip(slot) {
  const d = state.drawn[slot];
  if (!d) return;
  logDebug('flip-card', {
    slot,
    drawName: d.name,
    drawOri: d.ori,
    drawImage: d.image,
    revealed: d.revealed,
    dictHit: Boolean(getDictEntry(d.name)),
  });
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
    updateHint(t('noReveal'));
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
  state.readingStatus = 'idle';
  state.readingMode = 'reading';
  state.readingResult = null;
  state.readingErrorCode = '';
  state.sessionId = '';
  state.drawId = '';
  $('#questionInput').value = '';
  if ($('#aiClarifySubject')) $('#aiClarifySubject').value = '';
  if ($('#aiClarifySituation')) $('#aiClarifySituation').value = '';
  if ($('#aiClarifyFocus')) $('#aiClarifyFocus').value = '';
  if ($('#aiClarifyTimeframe')) $('#aiClarifyTimeframe').value = '';
  if ($('#aiClarifyInput')) $('#aiClarifyInput').value = '';
  $('#customSpreadName').value = '';
  $('#customSpreadCount').value = '';
  $('#customPanel').hidden = true;
  $('#customMeaningList').innerHTML = '';
  $$('.spreadOption').forEach(btn => btn.classList.toggle('is-active', btn.dataset.spread === 'blank3'));
  $('#shuffleText').textContent = '';
  $('#btnShuffle .primaryAction__top').textContent = t('startShuffle');
  $('#btnToPick').hidden = true;
  renderQuestionEcho();
  renderSpreadEcho();
  renderPickInputs();
  renderGrid();
  renderReading();
  renderAiReading();
  goToScreen('intro');
  updateSpreadHint(t('spreadHintDefault'));
  updateHint(t('resetHint'));
  setSequenceMeta(t('sequenceIdle'));
}

function getCardCopyTheme(draw) {
  const dict = getDictEntry(draw.name);
  if (!dict) return '';
  if (state.lang === 'en') {
    return normalizeDictText(dict?.summary_en || dict?.summary || '');
  }
  return normalizeDictText(dict?.summary || '');
}

async function onCopy() {
  if (!state.drawn.length) {
    updateHint(t('noCopy'));
    return;
  }
  const lines = [];
  lines.push(`VEGEBIRD TAROT ${state.lang === 'zh' ? '用户参与式塔罗结果' : 'Interactive tarot result'} (${new Date().toLocaleString(state.lang === 'en' ? 'en-US' : 'zh-CN')})`);
  lines.push(`${t('questionEchoPrefix')}${state.question?.trim() || t('questionEmpty')}`);
  lines.push(`${t('spreadEchoPrefix')}${translateSpreadName(state.spread.name)}`);
  state.spread.labels.forEach((label, i) => {
    const d = state.drawn[i];
    if (!d) return;
    if (i > 0) lines.push('');
    lines.push(`${translateLabel(label)}: ${getDisplayCardName(d)} (${getOriLabel(d.ori)})`);
    lines.push(`- ${getCardMeaning(d, d.ori)}`);
    const theme = getCardCopyTheme(d);
    if (theme) lines.push(`- ${state.lang === 'zh' ? '基调' : 'Theme'}: ${theme}`);
  });
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    updateHint(t('copied'));
  } catch {
    updateHint(t('copyFailed'));
  }
}

function bindSettings() {
  const mot = $('#motion');
  const btnLang = $('#btnLang');
  if (btnLang) {
    let lastLangButtonPointerAt = 0;
    const handleLangButtonPress = (e) => {
      e.preventDefault();
      e.stopPropagation();
      lastLangButtonPointerAt = Date.now();
      toggleLanguageMenu();
    };
    btnLang.addEventListener('pointerdown', handleLangButtonPress);
    btnLang.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (Date.now() - lastLangButtonPointerAt > 450) toggleLanguageMenu();
    });
  }
  $$('.langMenu__item').forEach((item) => {
    let lastLangItemPointerAt = 0;
    const handleLangItemPress = (e) => {
      e.preventDefault();
      e.stopPropagation();
      lastLangItemPointerAt = Date.now();
      selectLanguage(item.dataset.lang);
    };
    item.addEventListener('pointerdown', handleLangItemPress);
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (Date.now() - lastLangItemPointerAt > 450) selectLanguage(item.dataset.lang);
    });
  });
  document.addEventListener('click', (e) => {
    const menu = $('#langMenu');
    if (!menu) return;
    if (!menu.contains(e.target)) toggleLanguageMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleLanguageMenu(false);
  });
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
        updateSpreadHint(t('customSelectHint'));
      } else {
        const spread = PRESET_SPREADS[state.selectedSpreadKey];
        updateSpreadHint(t('currentSpread', translateSpreadName(spread.name), translateSpreadDesc(spread.desc)));
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
    $('#btnShuffle .primaryAction__top').textContent = t('startShuffle');
    $('#shuffleText').textContent = '';
    renderSpreadEcho();
    renderPickInputs();
    renderGrid();
    renderReading();
    goToScreen('shuffle');
  });

  $('#btnToPick').addEventListener('click', () => {
    if (!state.shuffled78.length) {
      updateHint(t('needShuffleFirst'));
      return;
    }
    goToScreen('pick');
  });
}

function retryAiReading() {
  console.log('[ui] btnInterpret clicked', {
    drawCount: state.drawn?.length || 0,
    lang: state.lang,
    apiBase: window.VEGE_TAROT_API_BASE || 'http://127.0.0.1:8787',
  });
  if (!state.drawn.length) return;
  requestAiReading({ allowMockFallback: false });
}

function bindActions() {
  const questionInput = $('#questionInput');
  if (questionInput) {
    questionInput.addEventListener('focus', () => revealIntoView(questionInput));
    questionInput.addEventListener('click', () => revealIntoView(questionInput));
  }
  $$('.pickSlot__input').forEach((input) => {
    input.addEventListener('focus', () => revealIntoView(input));
  });
  $('#btnShuffle').addEventListener('click', ritualShuffleAnimation);
  $('#btnReShuffle').addEventListener('click', ritualShuffleAnimation);
  $('#btnLucky').addEventListener('click', onLuckyPick);
  $('#btnMatch').addEventListener('click', onMatch);
  $('#btnRevealAll').addEventListener('click', onRevealAll);
  $('#btnReset').addEventListener('click', onReset);
  $('#btnCopy').addEventListener('click', onCopy);
  $('#btnInterpret').addEventListener('click', retryAiReading);
  const saveImageBtn = $('#btnSaveImage');
  if (saveImageBtn) saveImageBtn.addEventListener('click', saveAiReadingAsImage);
  const donateBtn = $('#btnDonate');
  if (donateBtn) donateBtn.addEventListener('click', openDonateModal);
  const closeDonateBtn = $('#btnCloseDonate');
  if (closeDonateBtn) closeDonateBtn.addEventListener('click', closeDonateModal);
  const donateModal = $('#donateModal');
  if (donateModal) donateModal.addEventListener('click', (e) => { if (e.target === donateModal) closeDonateModal(); });
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
  updateDictBadge();
  renderPickInputs();
  renderGrid();
  renderReading();
  renderAiReading();
  bindSettings();
  bindSpreadSelection();
  bindFlow();
  bindActions();
  goToScreen('intro');
  applyTranslations();
  updateSpreadHint(t('spreadHintDefault'));
  updateHint(t('resetHint'));
  setSequenceMeta(t('sequenceIdle'));
  await loadTarotDict();
  logDebug('init-complete', {
    version: APP_VERSION,
    dictLoaded: state.tarotDictLoaded,
    dictCount: Object.keys(state.tarotDict || {}).length,
  });
}

init();

