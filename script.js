/* =========================================================
   CONFIGURACIÓN — cambia aquí los datos de tu invitación
   ========================================================= */
const CONFIG = {
  // Fecha y hora del evento (año-mes-díaThora:min)
  fecha: "2027-03-20T19:00:00",

  // Tu número de WhatsApp con código de país, sin "+" ni espacios (ej. "5215512345678").
  // Si lo dejas vacío, la confirmación solo se muestra en pantalla.
  whatsapp: "",

  // Canción propia: pon tu archivo en la carpeta "musica" y escribe su ruta, ej. "musica/cancion.mp3".
  // Si lo dejas vacío, suena una melodía alegre generada por la página.
  musica: "",

  // Fotos del carril: cambia los archivos de la carpeta "fotos" por los tuyos (jpg, png, etc.)
  fotos: [
    { src: "fotos/foto1.svg", texto: "¡Qué noche!" },
    { src: "fotos/foto2.svg", texto: "Los mejores" },
    { src: "fotos/foto3.svg", texto: "A bailar" },
    { src: "fotos/foto4.svg", texto: "Sonrían :)" },
    { src: "fotos/foto5.svg", texto: "Recuerdos" },
    { src: "fotos/foto6.svg", texto: "¡Salud!" },
    { src: "fotos/foto7.svg", texto: "Amigos" },
    { src: "fotos/foto8.svg", texto: "Inolvidable" },
  ],
};

/* ========================================================= */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const azar = (a, b) => a + Math.random() * (b - a);
const COLORES = ["#ff2e88", "#ff9f1c", "#ffe14d", "#00f5d4", "#3a86ff", "#8b2cff"];
const poco_movimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Letras que hacen "ola" ---------- */
$$("[data-ola]").forEach((el) => {
  const texto = el.textContent;
  el.setAttribute("aria-label", texto);
  el.innerHTML = [...texto]
    .map((c, i) => `<span class="letra" style="--i:${i}" aria-hidden="true">${c === " " ? "&nbsp;" : c}</span>`)
    .join("");
});

/* ---------- Música ---------- */
const Musica = (() => {
  let ctx, master, timer, siguiente = 0, paso = 0, audio = null, sonando = false;
  const BPM = 118, DUR = 60 / BPM / 4; // semicorcheas
  // Do - Sol - Lam - Fa
  const ACORDES = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  const BAJO = [36, 31, 33, 29];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function nota(freq, t, dur, tipo, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function bombo(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.32);
  }
  let ruido;
  function platillo(t, vol = 0.12, dur = 0.05) {
    if (!ruido) {
      ruido = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const d = ruido.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = "highpass"; f.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  function aplauso(t) {
    platillo(t, 0.25, 0.15);
  }
  function programar() {
    while (siguiente < ctx.currentTime + 0.15) {
      const compas = Math.floor(paso / 16) % 4, s = paso % 16, acorde = ACORDES[compas];
      if (s % 4 === 0) bombo(siguiente);
      if (s % 4 === 2) platillo(siguiente);
      if (s === 4 || s === 12) aplauso(siguiente);
      if ([0, 3, 6, 8, 11, 14].includes(s)) nota(mtof(BAJO[compas]), siguiente, DUR * 2.5, "triangle", 0.35);
      // arpegio brillante
      const arp = [0, 1, 2, 1][s % 4], octava = s >= 8 ? 12 : 0;
      nota(mtof(acorde[arp] + octava), siguiente, DUR * 0.9, "square", 0.045);
      // acorde de fondo al inicio de cada compás
      if (s === 0) acorde.forEach((m) => nota(mtof(m - 12), siguiente, DUR * 15, "sawtooth", 0.025));
      siguiente += DUR; paso++;
    }
  }
  function iniciar() {
    if (CONFIG.musica) {
      audio = audio || Object.assign(new Audio(CONFIG.musica), { loop: true, volume: 0.7 });
      audio.play().catch(() => {});
    } else {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
      }
      ctx.resume();
      siguiente = ctx.currentTime + 0.05;
      clearInterval(timer); timer = setInterval(programar, 25);
    }
    sonando = true; $("#musica").classList.add("sonando");
  }
  function pausar() {
    if (audio) audio.pause();
    if (ctx) { clearInterval(timer); ctx.suspend(); }
    sonando = false; $("#musica").classList.remove("sonando");
  }
  return { iniciar, pausar, alternar: () => (sonando ? pausar() : iniciar()) };
})();
$("#musica").addEventListener("click", Musica.alternar);

/* ---------- Abrir el sobre ---------- */
let abierta = false;
function abrirInvitacion() {
  if (abierta) return;
  abierta = true;
  $("#sobre").classList.add("abierto");
  Musica.iniciar();
  setTimeout(() => {
    $("#intro").classList.add("fuera");
    document.body.classList.remove("bloqueado");
    confeti(160);
  }, 1400);
  setTimeout(() => $("#intro").remove(), 2300);
}
$("#sobre").addEventListener("click", abrirInvitacion);
$("#abrir").addEventListener("click", abrirInvitacion);
$("#sobre").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") abrirInvitacion(); });

/* ---------- Cuenta regresiva ---------- */
const FECHA = new Date(CONFIG.fecha);
const previos = {};
function cuenta() {
  const diff = FECHA - new Date();
  if (diff <= 0) {
    $("#cuenta-reg").innerHTML = "<p class='titulo3d chico'>¡ES HOY!</p>";
    return clearInterval(relojCuenta);
  }
  const valores = {
    dias: Math.floor(diff / 86400000),
    horas: Math.floor(diff / 3600000) % 24,
    minutos: Math.floor(diff / 60000) % 60,
    segundos: Math.floor(diff / 1000) % 60,
  };
  for (const [id, v] of Object.entries(valores)) {
    const el = document.getElementById(id);
    const txt = String(v).padStart(2, "0");
    if (previos[id] !== txt) {
      el.textContent = txt;
      const cubo = el.parentElement;
      if (previos[id] !== undefined) {
        cubo.classList.remove("giro"); void cubo.offsetWidth; cubo.classList.add("giro");
      }
      previos[id] = txt;
    }
  }
}
const relojCuenta = setInterval(cuenta, 1000);
cuenta();

/* ---------- Carril de fotos ---------- */
function llenarCarril(id, fotos) {
  const track = document.getElementById(id);
  const html = fotos
    .map((f) => `<button class="polaroid" type="button" data-src="${f.src}" data-texto="${f.texto}">
        <img src="${f.src}" alt="${f.texto}" loading="lazy" /><span>${f.texto}</span></button>`)
    .join("");
  track.innerHTML = html + html; // duplicado para que el movimiento sea infinito
}
const mitad = Math.ceil(CONFIG.fotos.length / 2);
llenarCarril("carril1", CONFIG.fotos);
llenarCarril("carril2", [...CONFIG.fotos.slice(mitad), ...CONFIG.fotos.slice(0, mitad)]);

const visor = $("#visor");
document.addEventListener("click", (e) => {
  const p = e.target.closest(".polaroid");
  if (!p) return;
  visor.querySelector("img").src = p.dataset.src;
  visor.querySelector("img").alt = p.dataset.texto;
  visor.querySelector("p").textContent = p.dataset.texto;
  visor.hidden = false;
});
visor.addEventListener("click", () => (visor.hidden = true));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") visor.hidden = true; });

/* ---------- Tarjetas que se inclinan en 3D ---------- */
$$(".tilt").forEach((t) => {
  t.addEventListener("pointermove", (e) => {
    const r = t.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    t.style.transform = `rotateY(${x * 25}deg) rotateX(${-y * 25}deg) scale(1.04)`;
  });
  t.addEventListener("pointerleave", () => (t.style.transform = ""));
});

/* ---------- Aparecer al hacer scroll ---------- */
const obs = new IntersectionObserver(
  (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
  { threshold: 0.2 }
);
$$(".reveal").forEach((r) => obs.observe(r));

/* ---------- Confeti ---------- */
function confeti(n = 120) {
  if (poco_movimiento) return;
  for (let i = 0; i < n; i++) {
    const c = document.createElement("span");
    c.className = "confeti";
    c.style.left = azar(0, 100) + "vw";
    c.style.background = COLORES[i % COLORES.length];
    c.style.setProperty("--dx", azar(-120, 120) + "px");
    c.style.animationDuration = azar(2.2, 4.5) + "s";
    c.style.animationDelay = azar(0, 0.8) + "s";
    if (Math.random() > 0.5) c.style.borderRadius = "50%";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 6000);
  }
}

/* ---------- Globos y emojis que suben ---------- */
const EMOJIS = ["🎈", "🎉", "✨", "🎊", "💖", "⭐", "🪩", "🎶"];
function globo() {
  if (document.hidden || document.body.classList.contains("bloqueado")) return;
  const g = document.createElement("span");
  g.className = "globo";
  g.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  g.style.left = azar(0, 95) + "vw";
  g.style.fontSize = azar(1.4, 3) + "rem";
  g.style.setProperty("--x", azar(-60, 60) + "px");
  g.style.animationDuration = azar(9, 15) + "s";
  $("#flotantes").appendChild(g);
  setTimeout(() => g.remove(), 16000);
}
if (!poco_movimiento) setInterval(globo, 1300);

/* ---------- Chispas al mover el dedo o el mouse ---------- */
let ultima = 0;
window.addEventListener("pointermove", (e) => {
  const ahora = performance.now();
  if (poco_movimiento || ahora - ultima < 45) return;
  ultima = ahora;
  const s = document.createElement("span");
  s.className = "chispa";
  s.textContent = Math.random() > 0.5 ? "✦" : "★";
  s.style.color = COLORES[Math.floor(Math.random() * COLORES.length)];
  s.style.left = e.clientX + "px";
  s.style.top = e.clientY + "px";
  s.style.setProperty("--dx", azar(-30, 30) + "px");
  s.style.setProperty("--dy", azar(10, 50) + "px");
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 900);
});

/* ---------- Confirmación ---------- */
const form = $("#rsvp");
const personas = $("#personas");
form.querySelectorAll("[data-paso]").forEach((b) =>
  b.addEventListener("click", () => {
    personas.value = Math.min(10, Math.max(1, Number(personas.value) + Number(b.dataset.paso)));
  })
);
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = form.nombre.value.trim();
  const msg = $("#msg");
  form.nombre.classList.remove("invalido");
  if (!nombre) {
    void form.nombre.offsetWidth;
    form.nombre.classList.add("invalido");
    msg.className = "msg error";
    msg.textContent = "Escribe tu nombre para confirmar 😊";
    return;
  }
  const n = Number(personas.value);
  msg.className = "msg ok";
  msg.textContent = `¡Gracias, ${nombre.split(" ")[0]}! Te esperamos ${n > 1 ? `(${n} personas)` : ""} 🎉`;
  confeti(200);
  if (CONFIG.whatsapp) {
    const texto = `¡Hola! Soy ${nombre} y confirmo mi asistencia al Festival Vibra 🎉 Seremos ${n} persona${n > 1 ? "s" : ""}.`;
    const a = document.createElement("a");
    a.className = "btn btn-mini";
    a.target = "_blank"; a.rel = "noopener";
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
    a.textContent = "Enviar confirmación por WhatsApp";
    msg.append(document.createElement("br"), a);
  }
});

/* ---------- Fondo 3D con Three.js ---------- */
(function fondo3D() {
  if (!window.THREE) return; // si no carga la librería, queda el fondo de colores
  const canvas = $("#fondo3d");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camara.position.z = 14;

  escena.add(new THREE.AmbientLight(0xffffff, 0.55));
  const luz1 = new THREE.PointLight(0xff2e88, 2.2, 60); luz1.position.set(10, 10, 10); escena.add(luz1);
  const luz2 = new THREE.PointLight(0x00f5d4, 2, 60); luz2.position.set(-10, -8, 8); escena.add(luz2);
  const luz3 = new THREE.DirectionalLight(0xffe14d, 0.8); luz3.position.set(0, 5, 5); escena.add(luz3);

  const geos = [
    new THREE.TorusGeometry(0.8, 0.32, 20, 48),
    new THREE.IcosahedronGeometry(0.9, 0),
    new THREE.OctahedronGeometry(0.9, 0),
    new THREE.TorusKnotGeometry(0.6, 0.2, 80, 12),
    new THREE.SphereGeometry(0.7, 32, 32),
    new THREE.ConeGeometry(0.7, 1.3, 5),
    new THREE.BoxGeometry(1, 1, 1),
  ];
  const ancho = window.innerWidth < 700;
  const total = ancho ? 18 : 30;
  const figuras = [];
  for (let i = 0; i < total; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: COLORES[i % COLORES.length],
      metalness: 0.35, roughness: 0.25, flatShading: i % 3 !== 0,
    });
    const m = new THREE.Mesh(geos[i % geos.length], mat);
    m.position.set(azar(-12, 12), azar(-14, 14), azar(-10, 2));
    const esc = azar(0.5, 1.3); m.scale.setScalar(esc);
    m.userData = { vr: [azar(-0.01, 0.01), azar(-0.015, 0.015)], fase: azar(0, Math.PI * 2), y0: m.position.y };
    escena.add(m); figuras.push(m);
  }
  // estrellitas
  const puntos = new THREE.BufferGeometry();
  const pos = new Float32Array(600 * 3);
  for (let i = 0; i < pos.length; i++) pos[i] = azar(-25, 25);
  puntos.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const estrellas = new THREE.Points(puntos, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.8 }));
  escena.add(estrellas);

  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  });
  function ajustar() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
  }
  window.addEventListener("resize", ajustar);
  ajustar();

  const reloj = new THREE.Clock();
  function animar() {
    requestAnimationFrame(animar);
    if (document.hidden) return;
    const t = reloj.getElapsedTime();
    const scroll = window.scrollY / window.innerHeight;
    figuras.forEach((m) => {
      const d = m.userData;
      m.rotation.x += poco_movimiento ? 0 : d.vr[0];
      m.rotation.y += poco_movimiento ? 0 : d.vr[1];
      m.position.y = d.y0 + Math.sin(t * 0.8 + d.fase) * 0.6;
    });
    estrellas.rotation.y = t * 0.02;
    camara.position.x += (mouse.x * 3 - camara.position.x) * 0.05;
    camara.position.y += (-mouse.y * 3 - scroll * 2.5 - camara.position.y) * 0.05;
    camara.lookAt(0, -scroll * 2.5, 0);
    camara.rotation.z += Math.sin(t * 0.2) * 0.05 + scroll * 0.08;
    renderer.render(escena, camara);
  }
  animar();
})();
