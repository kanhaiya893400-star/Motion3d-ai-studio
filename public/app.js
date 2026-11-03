const TOOLS = [
  { id: "titles", icon: "🎬", name: "Title Generator", desc: "10 SEO-friendly titles that earn the click.", ph: "e.g. Budget travel tips for Goa" },
  { id: "description", icon: "📝", name: "Description Generator", desc: "A complete description with hook, summary and call to action.", ph: "e.g. Unboxing a new gaming laptop" },
  { id: "hashtags", icon: "#️⃣", name: "Hashtag Generator", desc: "20 relevant hashtags, ready to paste.", ph: "e.g. Morning workout routine" },
  { id: "story", icon: "📖", name: "Story Writer", desc: "Long cinematic stories with dialogue, romance, drama and suspense.", ph: "e.g. Two strangers stranded in a hill-station storm", long: true },
  { id: "imageprompts", icon: "🧊", name: "Image Prompts", desc: "Detailed 3D cinematic prompts for AI image tools.", ph: "e.g. A lone astronaut in a neon market" },
  { id: "thumbnails", icon: "🖼️", name: "Thumbnail Ideas", desc: "Thumbnail concepts with the exact text to put on them.", ph: "e.g. I survived 24 hours in a haunted fort" },
];
const $ = (s, r = document) => r.querySelector(s);
let lang = "en", current = "home";

const nav = $("#nav");
[{ id: "home", icon: "🏠", name: "Dashboard" }, ...TOOLS].forEach((t) => {
  const b = document.createElement("button");
  b.dataset.id = t.id; b.textContent = `${t.icon}  ${t.name}`;
  b.onclick = () => { go(t.id); $("#side").classList.remove("open"); };
  nav.append(b);
});
$("#menu").onclick = () => $("#side").classList.toggle("open");
document.querySelectorAll(".lang button").forEach((b) => (b.onclick = () => {
  lang = b.dataset.l;
  document.querySelectorAll(".lang button").forEach((x) => x.classList.toggle("on", x === b));
}));

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1600);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { const a = document.createElement("textarea"); a.value = text; document.body.append(a); a.select(); document.execCommand("copy"); a.remove(); }
  toast("Copied");
}
function tilt(el) {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
  });
  el.addEventListener("pointerleave", () => (el.style.transform = ""));
}

function go(id) {
  current = id;
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", b.dataset.id === id));
  const view = $("#view");
  if (id === "home") {
    $("#title").textContent = "Dashboard";
    view.innerHTML = `<p class="lead">Pick a tool to start creating. Every result can be copied in one tap, in English or Hindi.</p><div class="grid stage"></div>`;
    TOOLS.forEach((t) => {
      const c = document.createElement("button");
      c.className = "card tile";
      c.innerHTML = `<span class="ic">${t.icon}</span><h3>${t.name}</h3><p>${t.desc}</p>`;
      c.onclick = () => go(t.id); tilt(c); $(".grid", view).append(c);
    });
    return;
  }
  const t = TOOLS.find((x) => x.id === id);
  $("#title").textContent = t.name;
  view.innerHTML = `<div class="stage"><form class="card">
    <p class="lead">${t.desc}</p>
    <label for="topic">Topic or idea</label><input id="topic" maxlength="500" placeholder="${t.ph}" required>
    <label for="extra">${t.long ? "Characters, setting or mood (optional)" : "Extra direction (optional)"}</label>
    <textarea id="extra" maxlength="300" placeholder="Tone, audience, keywords…"></textarea>
    <button class="go" type="submit">Generate</button></form></div><div class="out" id="out" aria-live="polite"></div>`;
  $("form", view).onsubmit = (e) => { e.preventDefault(); run(t); };
}

function item(text) {
  const d = document.createElement("div");
  d.className = "item";
  d.innerHTML = `<p></p><button class="cp" type="button">Copy</button>`;
  $("p", d).textContent = text; $(".cp", d).onclick = () => copy(text);
  return d;
}

async function run(t) {
  const out = $("#out"), btn = $(".go");
  btn.disabled = true; btn.textContent = "Generating…"; out.innerHTML = "";
  try {
    const r = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: t.id, topic: $("#topic").value, extra: $("#extra").value, language: lang }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Something went wrong.");
    if (data.items) {
      out.append(...data.items.map(item));
      if (data.items.length > 1) { const all = item(data.items.join("\n")); $("p", all).textContent = `All ${data.items.length} results`; $(".cp", all).textContent = "Copy all"; out.prepend(all); }
    } else out.append(item(data.text));
  } catch (e) {
    const d = item(e.message); d.classList.add("err"); $(".cp", d).remove(); out.append(d);
  } finally { btn.disabled = false; btn.textContent = "Generate"; }
}
go("home");
