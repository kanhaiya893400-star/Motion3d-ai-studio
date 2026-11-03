require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const { GEMINI_API_KEY, GEMINI_MODEL = "gemini-2.5-flash", PORT = 3000 } = process.env;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Tool definitions: how each feature builds its prompt and what shape it returns.
const TOOLS = {
  titles: {
    list: true, tokens: 1500,
    prompt: (t, x) => `Write 10 click-worthy, SEO-friendly YouTube video titles (under 70 characters each) for: "${t}". ${x}`,
  },
  description: {
    list: false, tokens: 2000,
    prompt: (t, x) => `Write a professional YouTube description for: "${t}". Include a strong hook in the first two lines, a summary, timestamps placeholders, a call to action, and 3 relevant keywords woven in naturally. ${x}`,
  },
  hashtags: {
    list: true, tokens: 1000,
    prompt: (t, x) => `Generate 20 relevant, currently popular YouTube hashtags for: "${t}". Each item starts with #, no spaces inside. ${x}`,
  },
  story: {
    list: false, tokens: 8000,
    prompt: (t, x) => `Write a long, cinematic story (at least 1200 words) based on: "${t}". Use vivid scenes, natural dialogue, and weave in romance, drama, suspense and deep emotion. Give it a title and a satisfying ending. ${x}`,
  },
  imageprompts: {
    list: true, tokens: 2500,
    prompt: (t, x) => `Write 5 detailed 3D cinematic image-generation prompts for: "${t}". Each prompt covers subject, environment, camera angle, lens, lighting, color palette, render style and mood, in one paragraph. ${x}`,
  },
  thumbnails: {
    list: true, tokens: 1800,
    prompt: (t, x) => `Suggest 6 YouTube thumbnail concepts for a video about: "${t}". Each item is one string in the form "Text on image: <max 4 words> | Visual: <composition, colors, expression, focal point>". ${x}`,
  },
};

app.post("/api/generate", async (req, res) => {
  const { tool, topic, language = "en", extra = "" } = req.body || {};
  const def = TOOLS[tool];
  if (!def) return res.status(400).json({ error: "Unknown tool." });
  if (typeof topic !== "string" || topic.trim().length < 2 || topic.length > 500)
    return res.status(400).json({ error: "Enter a topic (2 to 500 characters)." });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });

  const lang = language === "hi" ? "Hindi (Devanagari script)" : "English";
  const extraLine = typeof extra === "string" && extra.trim() ? `Extra direction: ${extra.trim().slice(0, 300)}.` : "";
  const shape = def.list ? 'Respond ONLY with a JSON array of strings.' : "Respond with plain text only, no markdown symbols.";
  const prompt = `${def.prompt(topic.trim(), extraLine)}\nWrite everything in ${lang}. ${shape}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: def.tokens,
            ...(def.list && { responseMimeType: "application/json" }),
          },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || "Gemini request failed." });
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    if (!text) return res.status(502).json({ error: "Gemini returned no content. Try rewording the topic." });
    if (def.list) {
      let items;
      try { items = JSON.parse(text); } catch { items = text.split("\n").filter(Boolean); }
      return res.json({ items: items.map(String) });
    }
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not reach Gemini. Check your connection." });
  }
});

app.listen(PORT, () => console.log(`Motion3D AI Studio running at http://localhost:${PORT}`));
