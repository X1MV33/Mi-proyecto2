/* =========================================================
   CONFIGURACIÓN — cambien aquí los datos de su boda
   ========================================================= */
const CONFIG = {
  // Fecha y hora de la ceremonia (hora local)
  fecha: "2027-05-15T17:00:00",

  // Para el botón "Agregar a mi calendario" (Google Calendar)
  calendario: {
    titulo: "Boda de Valeria y Andrés",
    inicioUTC: "20270515T230000Z", // 5:00 pm en hora del centro de México
    finUTC: "20270516T080000Z",
    lugar: "Parroquia de Santa María de la Asunción, Tequisquiapan, Qro.",
    detalles: "Ceremonia 5:00 pm · Recepción 7:00 pm en Hacienda Los Olivos",
  },

  // WhatsApp de los novios, con código de país y sin "+" (ej. "5214421234567").
  // Si lo dejan vacío, la confirmación solo se muestra en pantalla.
  whatsapp: "",

  // Canción propia (ej. "musica/cancion.mp3"). Vacío = vals suave generado por la página.
  musica: "",

};
/* ========================================================= */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const azar = (a, b) => a + Math.random() * (b - a);
const pocoMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js-reveal");

/* ---------- Invitación personalizada: agrega #Familia-Lopez al final del enlace ---------- */
(function personalizar() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h || !/^[\p{L}0-9-]+$/u.test(h) || ["cuenta", "confirmar"].includes(h)) return;
  $("#invitado").textContent = h.replace(/-/g, " ");
  $("#para-quien").hidden = false;
})();

/* ---------- Música: vals suave ---------- */
const Musica = (() => {
  let ctx, salida, timer, siguiente = 0, paso = 0, audio = null, sonando = false;
  const BPM = 168, DUR = 60 / BPM / 2; // corcheas en 3/4
  // Fa - Rem - Sib - Do
  const ACORDES = [[53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55]];
  const MELODIA = [72, null, 69, null, 72, 74, 74, null, 72, null, 69, null, 70, null, 74, null, 72, 70, 67, null, 69, 70, 72, null];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function piano(freq, t, dur, vol) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(salida);
    [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]].forEach(([mult, tipo, v]) => {
      const o = ctx.createOscillator(), gv = ctx.createGain();
      o.type = tipo; o.frequency.value = freq * mult; gv.gain.value = v;
      o.connect(gv).connect(g); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  function reverb() {
    const len = ctx.sampleRate * 2.5, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const r = ctx.createConvolver(); r.buffer = buf; return r;
  }
  function programar() {
    while (siguiente < ctx.currentTime + 0.2) {
      const compas = Math.floor(paso / 6) % 4, s = paso % 6, a = ACORDES[compas];
      if (s === 0) piano(mtof(a[0] - 12), siguiente, DUR * 6, 0.22);
      if (s === 2 || s === 4) a.forEach((m) => piano(mtof(m), siguiente, DUR * 2, 0.06));
      const mel = MELODIA[paso % MELODIA.length];
      if (mel && Math.floor(paso / 24) % 2 === 1) piano(mtof(mel), siguiente, DUR * 3, 0.1);
      if (Math.floor(paso / 24) % 2 === 0 && (s === 1 || s === 3 || s === 5)) piano(mtof(a[s % 3] + 12), siguiente, DUR * 2, 0.05);
      siguiente += DUR; paso++;
    }
  }
  function iniciar() {
    if (CONFIG.musica) {
      audio = audio || Object.assign(new Audio(CONFIG.musica), { loop: true, volume: 0.6 });
      audio.play().catch(() => {});
    } else {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
        const seco = ctx.createGain(); seco.gain.value = 0.7; seco.connect(master);
        const rev = reverb(), humedo = ctx.createGain(); humedo.gain.value = 0.45;
        rev.connect(humedo).connect(master);
        salida = ctx.createGain(); salida.connect(seco); salida.connect(rev);
      }
      ctx.resume();
      siguiente = ctx.currentTime + 0.1;
      clearInterval(timer); timer = setInterval(programar, 40);
    }
    sonando = true; $("#musica").classList.add("sonando");
  }
  function pausar() {
    if (audio) audio.pause();
    if (ctx) { clearInterval(timer); ctx.suspend(); }
    sonando = false; $("#musica").classList.remove("sonando");
  }
  return { iniciar, alternar: () => (sonando ? pausar() : iniciar()) };
})();
$("#musica").addEventListener("click", Musica.alternar);

/* ---------- Abrir el sobre ---------- */
let abierta = false;
function abrir() {
  if (abierta) return;
  abierta = true;
  $("#sobre").classList.add("abierto");
  Musica.iniciar();
  setTimeout(() => {
    $("#intro").classList.add("fuera");
    document.body.classList.remove("bloqueado");
    document.body.classList.add("lista");
    Petalos.rafaga(60);
  }, 2100);
  setTimeout(() => $("#intro").remove(), 3200);
}
$("#sello").addEventListener("click", abrir);
$("#sobre").addEventListener("click", abrir);

/* ---------- Cuenta regresiva ---------- */
const FECHA = new Date(CONFIG.fecha);
const previos = {};
function cuenta() {
  const diff = FECHA - new Date();
  if (diff <= 0) {
    $("#cuenta-reg").innerHTML = "<p class='titulo claro'>¡Hoy es el gran día!</p>";
    return clearInterval(reloj);
  }
  const v = {
    dias: String(Math.floor(diff / 86400000)),
    horas: String(Math.floor(diff / 3600000) % 24).padStart(2, "0"),
    minutos: String(Math.floor(diff / 60000) % 60).padStart(2, "0"),
    segundos: String(Math.floor(diff / 1000) % 60).padStart(2, "0"),
  };
  for (const [id, txt] of Object.entries(v)) {
    if (previos[id] === txt) continue;
    const el = document.getElementById(id);
    el.textContent = txt;
    if (previos[id] !== undefined) { el.classList.remove("cambia"); void el.offsetWidth; el.classList.add("cambia"); }
    previos[id] = txt;
  }
}
const reloj = setInterval(cuenta, 1000);
cuenta();

/* ---------- Calendario ---------- */
(function () {
  const c = CONFIG.calendario;
  const p = new URLSearchParams({ action: "TEMPLATE", text: c.titulo, dates: `${c.inicioUTC}/${c.finUTC}`, details: c.detalles, location: c.lugar });
  $("#calendario").href = `https://calendar.google.com/calendar/render?${p}`;
})();

/* ---------- Aparecer al hacer scroll ---------- */
const obs = new IntersectionObserver(
  (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
  { threshold: 0.15 }
);
$$(".reveal").forEach((r) => obs.observe(r));

/* ---------- Copiar datos ---------- */
function avisar(txt) {
  const a = $("#aviso-copia");
  a.textContent = txt; a.hidden = false;
  clearTimeout(avisar.t); avisar.t = setTimeout(() => (a.hidden = true), 1800);
}
$$(".copiar").forEach((b) =>
  b.addEventListener("click", () => {
    const el = document.getElementById(b.dataset.copiar);
    const texto = el.textContent.trim().replace(/\s(?=\d)/g, b.dataset.copiar === "dato-clabe" ? "" : " ");
    const seleccionar = () => {
      const r = document.createRange(); r.selectNodeContents(el);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      avisar("Seleccionado, ya puedes copiarlo");
    };
    if (navigator.clipboard) navigator.clipboard.writeText(texto).then(() => avisar("Copiado: " + texto), seleccionar);
    else seleccionar();
  })
);

/* ---------- Confirmación ---------- */
const form = $("#rsvp");
form.addEventListener("change", () => ($("#bloque-si").hidden = form.asiste.value === "no"));
form.nombre.addEventListener("input", () => {
  if (!form.nombre.value.trim()) return;
  form.nombre.classList.remove("invalido");
  form.nombre.removeAttribute("aria-invalid");
  $("#error-nombre").hidden = true;
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = $("#msg");
  const nombre = form.nombre.value.trim();
  form.nombre.classList.toggle("invalido", !nombre);
  form.nombre.setAttribute("aria-invalid", String(!nombre));
  $("#error-nombre").hidden = !!nombre;
  if (!nombre) {
    msg.className = "msg"; msg.textContent = "";
    form.nombre.focus();
    return;
  }
  const asiste = form.asiste.value === "si";
  const pases = Number(form.pases.value);
  const nota = form.mensaje.value.trim();
  const bebidas = [...form.querySelectorAll('input[name="bebida"]:checked')].map((b) => b.value);
  msg.className = "msg ok";
  msg.textContent = asiste
    ? `¡Gracias, ${nombre.split(" ")[0]}! Nos hace muy felices que nos acompañes.`
    : `Gracias por avisarnos, ${nombre.split(" ")[0]}. Te vamos a extrañar.`;
  msg.tabIndex = -1; msg.focus({ preventScroll: true });
  if (asiste) Petalos.rafaga(80);
  if (CONFIG.whatsapp) {
    const texto = asiste
      ? `¡Hola! Soy ${nombre} y confirmo mi asistencia a la boda de Valeria y Andrés. Seremos ${pases} persona${pases > 1 ? "s" : ""}.${bebidas.length ? "\nBebidas: " + bebidas.join(", ") + "." : ""}${nota ? "\n" + nota : ""}`
      : `Hola, soy ${nombre}. Lamentablemente no podré asistir a la boda de Valeria y Andrés.${nota ? "\n" + nota : ""}`;
    const a = document.createElement("a");
    a.className = "boton"; a.target = "_blank"; a.rel = "noopener";
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
    a.textContent = "Enviar por WhatsApp";
    msg.append(document.createElement("br"), a);
  }
});

form.addEventListener("change", (e) => {
  if (e.target.name !== "bebida" || !e.target.checked) return;
  const nada = $("#beb-nada");
  if (e.target === nada) form.querySelectorAll('input[name="bebida"]').forEach((b) => { if (b !== nada) b.checked = false; });
  else nada.checked = false;
});

/* ---------- Pétalos que caen ---------- */
const Petalos = (() => {
  const cv = $("#petalos"), cx = cv.getContext("2d");
  const COLORES = ["#7a1d2e", "#9c2e42", "#f4ebdd", "#e9dcc6", "#d7b0a6", "#5e1422"];
  let lista = [], w, h, dpr;
  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
  }
  function nuevo(arriba = true) {
    return {
      x: azar(0, w), y: arriba ? azar(-h * 0.3, -20) : azar(0, h),
      r: azar(5, 11) * dpr, vy: azar(0.4, 1.1) * dpr, vx: azar(-0.3, 0.3) * dpr,
      giro: azar(0, Math.PI * 2), vg: azar(-0.02, 0.02), fase: azar(0, 6), c: COLORES[Math.floor(Math.random() * COLORES.length)],
    };
  }
  function dibujar(p) {
    cx.save();
    cx.translate(p.x, p.y); cx.rotate(p.giro);
    cx.scale(1, Math.abs(Math.sin(p.fase)) * 0.6 + 0.4);
    cx.fillStyle = p.c; cx.globalAlpha = 0.85;
    cx.beginPath();
    cx.moveTo(0, -p.r);
    cx.bezierCurveTo(p.r, -p.r, p.r, p.r * 0.6, 0, p.r);
    cx.bezierCurveTo(-p.r, p.r * 0.6, -p.r, -p.r, 0, -p.r);
    cx.fill();
    cx.restore();
  }
  function cuadro() {
    requestAnimationFrame(cuadro);
    if (document.hidden) return;
    cx.clearRect(0, 0, w, h);
    lista.forEach((p) => {
      p.fase += 0.02; p.giro += p.vg;
      p.y += p.vy; p.x += p.vx + Math.sin(p.fase) * 0.5 * dpr;
      dibujar(p);
    });
    lista = lista.filter((p) => p.y < h + 30 || p.fijo);
    lista.forEach((p) => { if (p.fijo && p.y > h + 30) Object.assign(p, nuevo(), { fijo: true }); });
  }
  ajustar();
  addEventListener("resize", ajustar);
  if (!pocoMovimiento) {
    cuadro();
  }
  return { rafaga: (n) => { if (!pocoMovimiento) for (let i = 0; i < n; i++) lista.push(Object.assign(nuevo(), { vy: azar(1.2, 2.6) * dpr })); } };
})();
