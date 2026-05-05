# Tarot LLM API Skeleton

This project already exposes frontend requests through `api.js` to:
- `POST /api/tarot/interpret`
- `POST /api/tarot/follow-up`
- `GET /api/tarot/history`

## What was added
- `server.js`: a drop-in backend skeleton that supports:
  - `mock` mode for local development
  - `openai-compatible` mode for real LLM calls
- `.env.example`: minimal environment variable template

## Quick start

### 1) Mock mode
This does not require any API key.

```bash
node server.js
```

Health check:

```bash
curl http://127.0.0.1:8787/api/health
```

### 2) Real LLM mode
Copy `.env.example` to your own env setup and set:

```env
VEGE_TAROT_LLM_MODE=openai-compatible
VEGE_TAROT_LLM_API_KEY=YOUR_REAL_KEY
VEGE_TAROT_LLM_MODEL=gpt-4.1-mini
VEGE_TAROT_LLM_BASE_URL=https://api.openai.com/v1
PORT=8787
```

Then start the server with those env vars loaded.

## Request shape
The backend expects:

```json
{
  "lang": "zh",
  "question": "这段关系接下来会怎么发展？",
  "spreadType": "blank3",
  "spreadName": "无牌阵三张",
  "cards": [
    {
      "position": "第一张",
      "name": "战车",
      "orientation": "upright",
      "summary": "推进 / 胜利 / 速度",
      "keywords": "推进、速度、掌控",
      "meaning": "现在适合强势推进。把杂音降到最低，按计划冲。"
    }
  ]
}
```

## Frontend integration notes
The current frontend already calls `window.VEGE_TAROT_API.interpretReading(payload)` from `api.js`.
You only need to make sure the payload you send includes:
- `lang`
- `question`
- `spreadType`
- `spreadName`
- `cards[]` with `position`, `name`, `orientation`, `summary`, `keywords`, `meaning`

## Response shape
The backend returns:

```json
{
  "ok": true,
  "source": "llm",
  "model": "gpt-4.1-mini",
  "result": {
    "summary": "...",
    "synthesis": "...",
    "advice": "...",
    "riskNotes": "...",
    "followUps": ["...", "..."]
  }
}
```

## Important implementation rule
Chinese mode and English mode should stay fully separate:
- Chinese request in → Chinese card meanings in → Chinese output out
- English request in → English card meanings in → English output out

Do not mix Chinese meaning fields into English prompts.
