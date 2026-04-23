import json
import re
from pathlib import Path

SOURCE = Path(r"C:\Users\tangt\Desktop\塔罗牌义速查文档.txt")
OUT = Path(r"C:\Users\tangt\.openclaw\workspace\vegebird-tarot-pages\assets\tarot-dict-display-normalized.json")

MAJOR_MAP = {
    '愚人': '愚者',
    '魔术师': '魔术师',
    '女祭司': '女祭司',
    '女皇': '女皇',
    '皇帝': '皇帝',
    '教皇': '教皇',
    '恋人': '恋人',
    '战车': '战车',
    '力量': '力量',
    '隐士': '隐者',
    '命运之轮': '命运之轮',
    '正义': '正义',
    '倒吊人': '倒吊人',
    '死神': '死神',
    '节制': '节制',
    '恶魔': '恶魔',
    '高塔': '塔',
    '星星': '星星',
    '月亮': '月亮',
    '太阳': '太阳',
    '审判': '审判',
    '世界': '世界',
}

SUIT_MAP = {
    '权杖': '权杖',
    '圣杯': '圣杯',
    '宝剑': '宝剑',
    '星币': '星币',
}

RANK_MAP = {
    'ACE': '王牌',
    '一': '王牌',
    '二': '二',
    '三': '三',
    '四': '四',
    '五': '五',
    '六': '六',
    '七': '七',
    '八': '八',
    '九': '九',
    '十': '十',
    '侍从': '侍从',
    '骑士': '骑士',
    '王后': '王后',
    '皇后': '王后',
    '国王': '国王',
    '国皇': '国王',
    '王': '国王',
}

ENGLISH_ALIASES = {
    '愚者': 'The Fool', '魔术师': 'The Magician', '女祭司': 'The High Priestess', '女皇': 'The Empress',
    '皇帝': 'The Emperor', '教皇': 'The Hierophant', '恋人': 'The Lovers', '战车': 'The Chariot',
    '力量': 'Strength', '隐者': 'The Hermit', '命运之轮': 'Wheel of Fortune', '正义': 'Justice',
    '倒吊人': 'The Hanged Man', '死神': 'Death', '节制': 'Temperance', '恶魔': 'The Devil',
    '塔': 'The Tower', '星星': 'The Star', '月亮': 'The Moon', '太阳': 'The Sun',
    '审判': 'Judgement', '世界': 'The World'
}

SUMMARY_PATTERNS = [
    re.compile(r'^代表([^。！？；]+)'),
    re.compile(r'^象征([^。！？；]+)'),
    re.compile(r'^提示([^。！？；]+)'),
    re.compile(r'^表现为([^。！？；]+)'),
    re.compile(r'^对应([^。！？；]+)'),
]


def clean(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '').replace('\u00a0', ' ')).strip()


def normalize_title(raw_title: str) -> str:
    title = clean(raw_title)
    if title in MAJOR_MAP:
        return MAJOR_MAP[title]
    for suit in SUIT_MAP:
        if title.startswith(suit):
            tail = title[len(suit):].strip()
            rank = RANK_MAP.get(tail, tail)
            return f'{SUIT_MAP[suit]}{rank}'
    return title


def aliases_for(source_title: str, name: str):
    aliases = [source_title, name]
    if source_title == '愚人' and '愚者' not in aliases:
        aliases.append('愚者')
    if source_title.endswith('ACE'):
        aliases.append(source_title.replace('ACE', '一'))
    if source_title.endswith('皇后'):
        aliases.append(source_title.replace('皇后', '王后'))
    if name in ENGLISH_ALIASES:
        aliases.append(ENGLISH_ALIASES[name])
    seen = []
    for a in aliases:
        a = clean(a)
        if a and a not in seen:
            seen.append(a)
    return seen


def build_summary(upright_text: str, reversed_text: str) -> str:
    text = clean(upright_text)
    for pat in SUMMARY_PATTERNS:
        m = pat.search(text)
        if m:
            frag = clean(m.group(1))
            return frag[:72] + ('…' if len(frag) > 72 else '')
    if text:
        parts = re.split(r'[。！？；]', text)
        first = clean(parts[0])
        return first[:72] + ('…' if len(first) > 72 else '')
    text = clean(reversed_text)
    if text:
        parts = re.split(r'[。！？；]', text)
        first = clean(parts[0])
        return first[:72] + ('…' if len(first) > 72 else '')
    return ''


raw = SOURCE.read_text(encoding='utf-8')
lines = [line.rstrip() for line in raw.splitlines()]

cards = []
current = None
current_field = None
card_header_re = re.compile(r'^(?:\d+\.?\s*)?([\u4e00-\u9fffA-Z]+(?:ACE|一|二|三|四|五|六|七|八|九|十|侍从|骑士|王后|皇后|国王)?)\s*$')
for line in lines:
    t = clean(line)
    if not t:
        continue
    if t.startswith('一、大阿尔卡纳') or t.startswith('二、小阿尔卡纳') or t.endswith('牌组') or t.endswith('组（火·行动/创造）') or t.endswith('组（水·情感/人际）') or t.endswith('组（风·思考/冲突）'):
        continue
    m = card_header_re.match(t)
    if m and ('关键词' not in t and '简述' not in t):
        title = clean(m.group(1))
        looks_card = title in MAJOR_MAP or any(title.startswith(s) for s in SUIT_MAP)
        if looks_card:
            if current:
                cards.append(current)
            current = {
                'sourceTitle': title,
                'name': normalize_title(title),
                'upright_keywords': '',
                'upright': '',
                'reversed_keywords': '',
                'reversed': '',
            }
            current_field = None
            continue
    if not current:
        continue
    if t.startswith('正位关键词：'):
        current['upright_keywords'] = clean(t.split('：', 1)[1])
        current_field = 'upright_keywords'
        continue
    if t.startswith('正位简述：'):
        current['upright'] = clean(t.split('：', 1)[1])
        current_field = 'upright'
        continue
    if t.startswith('逆位关键词：'):
        current['reversed_keywords'] = clean(t.split('：', 1)[1])
        current_field = 'reversed_keywords'
        continue
    if t.startswith('逆位简述：'):
        current['reversed'] = clean(t.split('：', 1)[1])
        current_field = 'reversed'
        continue
    if current_field in {'upright', 'reversed'}:
        current[current_field] = clean(current[current_field] + ' ' + t)
    elif current_field in {'upright_keywords', 'reversed_keywords'}:
        current[current_field] = clean(current[current_field] + t)

if current:
    cards.append(current)

result = {'source': str(SOURCE), 'count': len(cards), 'cards': {}}
for card in cards:
    name = card['name']
    source_title = card['sourceTitle']
    result['cards'][name] = {
        'sourceTitle': source_title,
        'name': name,
        'aliases': aliases_for(source_title, name),
        'summary': build_summary(card['upright'], card['reversed']),
        'upright_keywords': card['upright_keywords'],
        'upright': card['upright'],
        'reversed_keywords': card['reversed_keywords'],
        'reversed': card['reversed'],
    }

OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Wrote {OUT} with {len(cards)} cards')
