# Agent Rules
- Read node_modules/next/dist/docs/ before editing any Next.js files
- Never use gemini-1.5-flash-8b — it is deprecated
- API keys rotate via GEMINI_API_KEY_1 through _4, never hardcode one
- All Gemini calls must go through src/lib/gemini.ts — never call the SDK directly
- Severity/routing/classification logic lives in src/lib/localAgents.ts — don't move it to AI
- Run npm run lint before declaring any task done