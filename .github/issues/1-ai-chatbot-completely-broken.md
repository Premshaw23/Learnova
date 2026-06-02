# Issue #1 — AI Assistant Completely Broken: ChatBot-to-Groq API Contract Mismatch

**Severity:** Critical  
**Subsystem:** ChatBot frontend + Groq AI backend  
**Tags:** bug, AI, chat, data-loss

---

## Description

The AI chatbot "Nova" runs on every page of the application but **never successfully calls the Groq AI API**. Every single user message silently falls through to hardcoded fallback responses in the client component. The entire AI assistant feature is non-functional — users only ever receive canned responses from a keyword-matching switch statement, regardless of what they type.

---

## Affected Files

| File | Lines | Role |
|------|-------|------|
| `components/ChatBot.js` | 288–312 | Sends malformed request body to `/api/groq` |
| `lib/ai/groq.js` | 9–30, 42–58 | Schema expects `message`/`userMessage`; `buildGroqRequest` ignores conversation history |
| `app/api/groq/route.js` | 22, 35 | Validates body, calls `callGroq(sanitizedMessage)` with no context |

---

## Root Cause

Two distinct bugs compound to make the AI completely non-functional:

### Bug A — API Contract Mismatch (blocking)

`components/ChatBot.js:292–301` sends the request body as:

```js
body: JSON.stringify({ 
  messages: updatedMessages.map(msg => ({
    role: msg.isBot ? "assistant" : "user",
    content: msg.text
  })), 
  category: currentCategory 
})
```

But `lib/ai/groq.js:9–12` defines the schema as:

```js
const groqBodySchema = z.object({
  message: z.string().optional(),
  userMessage: z.string().optional(),
})
```

Neither `messages` nor `category` match the expected fields. The transform `data.message ?? data.userMessage ?? ""` evaluates to `undefined ?? undefined ?? ""` = `""`. The superRefine (`groq.js:15–22`) rejects empty strings with `"Message is required"`.

Flow of failure:
1. ChatBot sends `{ messages: [...], category: "general" }`
2. `validateGroqBody(body)` returns `{ trimmedMessage: "" }`
3. Schema superRefine rejects → throws `ValidationError("Message is required")`
4. `app/api/groq/route.js:22` throws → error handler returns 400
5. `response.ok` is `false` at `ChatBot.js:304`
6. Falls through to `fallbackResponses[currentCategory]` (line 312)

### Bug B — No Conversation Memory (architectural)

Even if Bug A were fixed, `app/api/groq/route.js:35` calls:

```js
const content = await callGroq(sanitizedMessage);
```

`sanitizedMessage` is a single string. `lib/ai/groq.js:42–58` (`buildGroqRequest`) constructs:

```js
messages: [
  { role: "system", content: GROQ_SYSTEM_PROMPT },
  { role: "user", content: trimmedMessage },
]
```

The entire conversation history (`messages` array sent by ChatBot) is thrown away. The AI has **zero conversational memory** — it cannot reference previous exchanges, follow up on earlier topics, or maintain context.

---

## Impact

- **100% of AI chatbot interactions fail** to reach Groq. Users only ever see canned keyword-matched responses.
- The application markets an AI-powered personal assistant ("Nova"), but this feature is entirely non-functional.
- Any downstream features depending on Groq responses (conversation history, personalized recommendations, etc.) cannot work.
- Hardcoded fallback responses contain stale/incorrect information (e.g., `CONTACT_INFO` uses placeholder email `support@learnova.edu`, backend described as "Node.js/NestJS with Firebase/PostgreSQL" which contradicts the actual MongoDB stack).

---

## Reproduction Steps

1. Navigate to any page that loads the ChatBot widget (any dashboard).
2. Open browser DevTools → Network tab.
3. Type any message not matching the hardcoded keywords (e.g., *"What is the weather today?"* or *"Tell me about my recent attendance"*).
4. Observe the network request to `POST /api/groq` returns `400` with body `{ error: "Message is required" }`.
5. Observe the chatbot responds with a canned fallback from `fallbackResponses` instead of an AI-generated response.

---

## Suggested Fix

Two-phase fix:

### Phase 1 — Unblock AI calls (immediate)
- Modify `lib/ai/groq.js` schema to accept `messages: z.array(z.object({ role: z.string(), content: z.string() })).optional()` as an alternative to `message`/`userMessage`.
- The last message in the `messages` array should be extracted as the current user query for injection/safety checks.
- Modify `app/api/groq/route.js` to pass the full `messages` array to `buildGroqRequest` and `callGroq`.

### Phase 2 — Add conversation memory
- Modify `buildGroqRequest` in `lib/ai/groq.js:42–58` to accept and include the full conversation history `messages` array in the Groq API request body.
- Add token-count gating to stay within the 8192-token context window of `llama-3.1-8b-instant`:
  - Reserve 400 tokens for the response (`max_tokens: 400`).
  - Reserve ~200 tokens for the system prompt.
  - Truncate oldest conversation turns when remaining context is exceeded.
- Change `callGroq` signature from `callGroq(trimmedMessage)` to `callGroq(messages)`.

---

## Files Requiring Changes

1. `lib/ai/groq.js` — Extend schema, add conversation memory to `buildGroqRequest`, update `callGroq` signature.
2. `app/api/groq/route.js` — Pass full `messages` array, remove `sanitizedMessage` single-string usage.
3. `components/ChatBot.js` — Optionally update to send the format the backend accepts (or keep sending `messages` if backend is updated).
4. New or updated tests for the Groq route with conversation history payloads.
