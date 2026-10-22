document.documentElement.classList.add("js");

// ===== Loader =====
(function () {
  var loader = document.getElementById("loader");
  if (!loader) return;
  document.body.classList.add("loading");
  var start = Date.now(), hidden = false;
  function hide() {
    if (hidden) return;
    hidden = true;
    var wait = Math.max(0, 700 - (Date.now() - start));
    setTimeout(function () {
      loader.classList.add("done");
      document.body.classList.remove("loading");
      setTimeout(function () { loader.remove(); }, 700);
    }, wait);
  }
  if (document.readyState === "complete") hide();
  else window.addEventListener("load", hide);
  setTimeout(hide, 4000);
})();

document.addEventListener("DOMContentLoaded", () => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $("#year").textContent = new Date().getFullYear();

  // ===== Missing images: remove them so the gradient + label shows =====
  $$(".photo img, .about-photo img, .thumb img").forEach((img) => {
    img.addEventListener("error", () => img.remove());
    if (img.complete && img.naturalWidth === 0) img.remove();
  });

  // ===== Mobile menu =====
  const burger = $("#burger");
  const links = $("#navLinks");
  const closeMenu = () => {
    links.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  };
  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  $$("#navLinks a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav")) closeMenu();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMenu(); closeAI(); } });

  // ===== Theme toggle =====
  const root = document.documentElement;
  const meta = $('meta[name="theme-color"]');
  const toggles = $$(".theme-toggle");
  const applyTheme = (t) => {
    if (t === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    toggles.forEach((b) => {
      b.textContent = t === "light" ? "\u263E\uFE0E" : "\u2600\uFE0E";
      b.setAttribute("aria-label", t === "light" ? "Switch to dark mode" : "Switch to light mode");
    });
    if (meta) meta.setAttribute("content", t === "light" ? "#f6f5ff" : "#08080d");
  };
  let theme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
  applyTheme(theme);
  toggles.forEach((b) => b.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    applyTheme(theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }));

  // ===== Typing roles =====
  const roles = ["clean frontends.", "MERN apps.", "REST APIs.", "AI-ready products."];
  const roleEl = $("#typingRole");
  if (reduce) {
    roleEl.textContent = roles[0];
  } else {
    let r = 0, c = 0, del = false;
    const tick = () => {
      const w = roles[r];
      if (!del) {
        roleEl.textContent = w.slice(0, ++c);
        if (c === w.length) { del = true; return setTimeout(tick, 1700); }
        return setTimeout(tick, 85);
      }
      roleEl.textContent = w.slice(0, --c);
      if (c === 0) { del = false; r = (r + 1) % roles.length; return setTimeout(tick, 350); }
      setTimeout(tick, 40);
    };
    tick();
  }

  // ===== Scroll reveal + skill bars =====
  $$(".skill-list em").forEach((em) => em.style.setProperty("--w", em.dataset.lvl + "%"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      const list = en.target.querySelector(".skill-list");
      if (list) list.classList.add("on");
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 80 + "ms";
    io.observe(el);
  });

  // ===== Active nav link =====
  const navLinks = $$("#navLinks a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => spy.observe(s));

  // ===== Contact form (Formspree; mailto fallback until you add your ID) =====
  const form = $("#contact-form");
  const status = $("#form-status");
  const submit = form.querySelector('button[type="submit"]');
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const action = form.getAttribute("action") || "";
    const data = new FormData(form);
    status.className = "";
    if (action.includes("YOUR_FORM_ID")) {
      const subject = encodeURIComponent("Portfolio message from " + data.get("name"));
      const body = encodeURIComponent(data.get("message") + "\n\nFrom: " + data.get("email"));
      window.location.href = "mailto:abdullahrashid8878@gmail.com?subject=" + subject + "&body=" + body;
      return;
    }
    submit.disabled = true;
    status.textContent = "Sending...";
    try {
      const res = await fetch(action, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("fail");
      form.reset();
      status.textContent = "Thanks! Your message has been sent.";
      status.className = "ok";
    } catch (err) {
      status.textContent = "Something went wrong. Please email me directly.";
      status.className = "error";
    }
    submit.disabled = false;
  });

  // ===== "Ask Abdullah's AI": a small built-in assistant (keyword based, no external API) =====
  const btn = $("#aiBtn"), panel = $("#aiPanel"), log = $("#aiLog");
  const input = $("#aiInput"), aiForm = $("#aiForm"), chips = $("#aiChips");

  const add = (text, who) => {
    const d = document.createElement("div");
    d.className = "msg " + who;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  };

  const KB = [
    { k: ["skill", "stack", "tech", "know", "language", "tools"],
      a: "Abdullah works with HTML5, CSS3, JavaScript, React.js and Redux on the frontend, and Node.js, Express.js, MongoDB, REST APIs and JWT authentication on the backend. He uses Git, GitHub and VS Code." },
    { k: ["project", "built", "work", "portfolio", "demo", "app"],
      a: "Projects:\n• Attendance System API (Node, Express, MongoDB, JWT)\n• React Trello Clone (drag and drop boards)\n• Currency Converter (live rates + charts)\n• Todo Applications (React, Node, MongoDB)\nScroll to the Projects section for GitHub and demo links." },
    { k: ["hire", "freelance", "available", "availability", "service", "price", "rate", "cost", "offer"],
      a: "Yes, Abdullah is open for freelance work: websites and landing pages, React web apps, and REST API / backend development. Use the contact form to describe your project and he'll reply." },
    { k: ["contact", "email", "reach", "linkedin", "github", "message", "talk"],
      a: "Email: abdullahrashid8878@gmail.com\nYou can also use the contact form at the bottom of the page, or find him on LinkedIn and GitHub (links in the Contact section)." },
    { k: ["ai", "machine learning", "ml", "llm", "chatgpt", "artificial"],
      a: "Abdullah has an AI background and is exploring how LLMs and machine learning can make web apps smarter: chat assistants, smart search, and personalised UX. He's combining that with the MERN stack." },
    { k: ["educat", "study", "student", "dit", "diploma", "degree", "school", "qualif"],
      a: "Abdullah completed Matriculation in 2026 and is currently a D.I.T student." },
    { k: ["experience", "year", "how long", "senior", "junior"],
      a: "Abdullah builds full-stack apps with the MERN stack. Check the Projects section for what he has built so far." },
    { k: ["cv", "resume"],
      a: "You can download his CV with the 'Download CV' button at the top of the page." },
    { k: ["hello", "hi", "hey", "salam", "assalam"],
      a: "Hey! 👋 Ask me about Abdullah's skills, projects, availability or how to contact him." },
    { k: ["who", "about", "yourself", "abdullah"],
      a: "Abdullah Rashid is a full-stack MERN developer who builds responsive web apps and secure REST APIs, with a growing interest in AI. He is open to freelance projects." },
    { k: ["thank"],
      a: "You're welcome! 🙌" },
  ];

  const answer = (q) => {
    const s = " " + q.toLowerCase() + " ";
    let best = null, score = 0;
    KB.forEach((e) => {
      const n = e.k.filter((k) => s.includes(k)).length;
      if (n > score) { score = n; best = e; }
    });
    return best ? best.a : "I'm a small assistant, so I only know about Abdullah's skills, projects, education, AI interests and availability. Try one of the buttons, or email him at abdullahrashid8878@gmail.com.";
  };

  const ask = (q) => {
    if (!q.trim()) return;
    add(q, "me");
    setTimeout(() => add(answer(q), "bot"), reduce ? 0 : 450);
  };

  function openAI() {
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.textContent = "✕";
    if (!log.children.length) add("Hey! 👋 I'm Abdullah's mini assistant. Ask me about his skills, projects or availability.", "bot");
    setTimeout(() => input.focus(), 50);
  }
  function closeAI() {
    if (panel.hidden) return;
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "💬";
  }
  window.closeAI = closeAI;
  btn.addEventListener("click", () => (panel.hidden ? openAI() : closeAI()));
  $("#aiClose").addEventListener("click", closeAI);
  aiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input.value);
    input.value = "";
  });
  chips.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") ask(e.target.textContent);
  });
});