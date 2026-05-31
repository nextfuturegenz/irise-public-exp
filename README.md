# 🤖 AI Meeting Notes → Action Items

Paste any meeting transcript and an AI extracts the **action items, owners, deadlines and priorities** — then exports them as JSON or a ready-to-send email draft.

Built live at the **iRise Buildathon** using the **Vercel AI SDK**. Works with **Gemini (free)** or **Claude** — switch with one click in the UI.

---

## 🚀 Get it running in 5 minutes

### 1. Get a FREE Gemini API key
Go to **https://aistudio.google.com/app/apikey** → "Create API key" → copy it. No credit card needed.

### 2. Set up your environment
Copy the example env file and paste your key in:

```bash
cp .env.example .env
```

Open `.env` and set:

```
GOOGLE_GENERATIVE_AI_API_KEY=paste_your_key_here
DEFAULT_MODEL=gemini
```

> Want to use Claude instead? Add `ANTHROPIC_API_KEY=...` and set `DEFAULT_MODEL=claude`.

### 3. Install & run

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — paste notes, hit "Extract", done. 🎉

---

## ☁️ Deploy to Vercel (free, ~60 seconds)

1. Push this folder to a **GitHub** repo.
2. Go to **https://vercel.com** → "Add New… → Project" → import your repo.
3. Under **Environment Variables**, add:
   - `GOOGLE_GENERATIVE_AI_API_KEY` = your key
   - `DEFAULT_MODEL` = `gemini`
4. Click **Deploy**. You'll get a live URL like `your-app.vercel.app`.

Share that link — you just shipped a product. ✅

> Other hosts work too: Netlify, Render, Railway — anywhere that runs Next.js.

---

## 🧠 How it works (the important part)

The entire "AI brain" lives in `app/api/extract/route.js` and is about 15 lines:

```js
const { object } = await generateObject({
  model: google("gemini-1.5-flash"),   // or anthropic(...) for Claude
  schema: actionItemsSchema,           // task, owner, deadline, priority
  system: SYSTEM_PROMPT,
  prompt: `Extract the action items from these meeting notes:\n\n${notes}`,
});
```

`generateObject` forces the AI to return **clean structured data** that matches your
schema (defined in `lib/schema.js`) — no messy text parsing. This is the trick
behind reliable AI apps.

**This same pattern builds almost any AI product** — just change the schema, the
prompt, and the UI. Try: email summarizer, resume analyzer, study-notes maker,
review analyzer, support bot.

---

## 📁 Project structure

```
app/
  page.js              → the UI (paste box, results, export tabs)
  layout.js            → root layout
  globals.css          → styling
  api/extract/route.js → the AI brain (Gemini / Claude switchable)
lib/
  schema.js            → output structure + system prompt
.env.example           → copy to .env and add your key
```

---

## 🛠️ Switching models

- **In the UI:** toggle "Gemini (free)" / "Claude" above the text box.
- **As default:** set `DEFAULT_MODEL` in `.env`.
- **In code:** edit the `pickModel()` function in `app/api/extract/route.js`.

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| "Could not extract action items" | Check your API key is set in `.env` (local) or Vercel env vars (deployed). |
| Build fails on deploy | Make sure the env variable name matches exactly. |
| Claude not working | Add `ANTHROPIC_API_KEY` and ensure you have credits. |

---

Made with ⚡ at the iRise Buildathon. Now go build something.
# irise-event-ai-meeting-analyser
