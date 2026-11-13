// ===== Configuración: cambia la fecha de tu evento aquí =====
const FECHA_EVENTO = new Date("2027-03-20T12:00:00");

// ===== Cuenta regresiva =====
const el = (id) => document.getElementById(id);
const dos = (n) => String(n).padStart(2, "0");

function actualizarCuenta() {
  const diff = FECHA_EVENTO - new Date();
  if (diff <= 0) {
    el("countdown").innerHTML = "<p style='font-size:1.6rem;font-weight:800'>¡El festival ya comenzó! 🎉</p>";
    clearInterval(intervalo);
    return;
  }
  el("dias").textContent = dos(Math.floor(diff / 86400000));
  el("horas").textContent = dos(Math.floor((diff / 3600000) % 24));
  el("minutos").textContent = dos(Math.floor((diff / 60000) % 60));
  el("segundos").textContent = dos(Math.floor((diff / 1000) % 60));
}
const intervalo = setInterval(actualizarCuenta, 1000);
actualizarCuenta();

// ===== Menú en celular =====
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
toggle.addEventListener("click", () => {
  const abierto = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", abierto);
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => links.classList.remove("open"))
);

// ===== Fondo de la barra al hacer scroll =====
const nav = document.querySelector(".nav");
window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 40));

// ===== Aparecer elementos al hacer scroll =====
const observer = new IntersectionObserver(
  (entradas) => entradas.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
  }),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((r) => observer.observe(r));

// ===== Confeti =====
function lanzarConfeti(cantidad = 120) {
  const colores = ["#ff3d7f", "#ff9f1c", "#ffd23f", "#06d6a0", "#7b2ff7", "#3a86ff"];
  for (let i = 0; i < cantidad; i++) {
    const c = document.createElement("span");
    c.className = "confeti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colores[i % colores.length];
    c.style.animationDuration = 2 + Math.random() * 2.5 + "s";
    c.style.animationDelay = Math.random() * 0.6 + "s";
    c.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5500);
  }
}

// ===== Formulario de confirmación =====
// Nota: no hay servidor, así que la confirmación solo se muestra en pantalla.
// Para recibir las respuestas puedes conectar el formulario a Formspree o Google Forms.
const form = el("rsvp-form");
const msg = el("form-msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = form.nombre;
  const correo = form.correo;
  let valido = true;

  [nombre, correo].forEach((campo) => {
    const ok = campo.value.trim() !== "" && campo.checkValidity();
    campo.classList.toggle("invalid", !ok);
    if (!ok) valido = false;
  });

  if (!valido) {
    msg.className = "form-msg error";
    msg.textContent = "Por favor escribe tu nombre y un correo válido.";
    return;
  }

  msg.className = "form-msg ok";
  msg.textContent = `¡Gracias, ${nombre.value.trim().split(" ")[0]}! Tu lugar está confirmado. 🎉`;
  form.reset();
  lanzarConfeti();
});
