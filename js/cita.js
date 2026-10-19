/* ------------------------------------------------------------------
   Pedir cita · motor de DEMOSTRACIÓN
   Motivo → día → hora → datos → confirmación. No envía, guarda ni
   cobra nada. Los huecos son de ejemplo (ocupación inventada, fija
   por día para que no cambie al volver), sobre su horario real
   (js/horario.js). Duraciones y quién atiende: supuestos sacados de
   lo que cada una cuenta de sí misma en Instagram.
   ------------------------------------------------------------------ */
(function () {
  'use strict';
  const H = window.HORARIO;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  if (!H || !$('#motor')) return;

  const MOTIVOS = [
    { k: 'primera', t: 'Primera visita', s: 'Revisión completa y presupuesto', min: 45, q: 'Ana' },
    { k: 'limpieza', t: 'Revisión y limpieza', s: 'También con bicarbonato', min: 45, q: 'Patri' },
    { k: 'dolor', t: 'Me duele', s: 'Te buscamos el primer hueco', min: 30, q: 'Ana', urgente: true },
    { k: 'estetica', t: 'Blanqueamiento o carillas', s: 'Valoración', min: 30, q: 'Jenny' },
    { k: 'implantes', t: 'Implantes', s: 'Valoración con escáner 3D', min: 45, q: 'Jenny' },
    { k: 'orto', t: 'Ortodoncia', s: 'Estudio', min: 45, q: 'Bea' },
    { k: 'ninos', t: 'Niños', s: 'Primera visita de los peques', min: 30, q: 'Ana' },
    { k: 'facial', t: 'Estética facial', s: 'Valoración', min: 30, q: 'Jenny' },
  ];

  const fmtMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
  const fmtDia = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const tope = new Date(hoy.getFullYear(), hoy.getMonth() + 3, 0);
  const estado = { paso: 1, motivo: null, dia: null, hora: null, vista: new Date(hoy.getFullYear(), hoy.getMonth(), 1) };

  // ocupación de ejemplo: fija por fecha y hora; los días cercanos, más llenos
  const azar = (n) => { let h = n | 0; h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^ (h >>> 16)) >>> 0) % 100; };
  const semilla = (d) => d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  function huecos(d) {
    const tr = H.tramos(d);
    if (!tr || d < hoy || d > tope || !estado.motivo) return [];
    const dur = estado.motivo.min;
    const lejos = Math.round((d - hoy) / 864e5);
    const lleno = 64 - Math.min(lejos, 21) * 1.6;   // % de huecos ocupados
    const ahora = new Date(), mAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const r = [];
    tr.forEach(([a, b]) => {
      for (let m = a; m + dur <= b; m += 30) {
        if (H.iso(d) === H.iso(ahora) && m < mAhora + 60) continue;
        if (azar(semilla(d) * 1440 + m) < lleno) continue;
        r.push(m);
      }
    });
    return r;
  }

  /* ---------- paso 1: motivo ---------- */
  const lista = $('#motivo-lista');
  MOTIVOS.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'motivo'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
    b.tabIndex = i === 0 ? 0 : -1; b.dataset.k = m.k;
    const t = document.createElement('b'); t.textContent = m.t;
    const s = document.createElement('span'); s.textContent = m.s + ' · ' + m.min + ' min';
    b.append(t, s);
    b.addEventListener('click', () => elegirMotivo(m, true));
    b.addEventListener('keydown', (e) => {
      const mover = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!mover) return;
      e.preventDefault();
      const bs = $$('.motivo', lista), n = (bs.indexOf(b) + mover + bs.length) % bs.length;
      bs[n].focus(); elegirMotivo(MOTIVOS[n], false);
    });
    lista.appendChild(b);
  });
  function elegirMotivo(m, avanzar) {
    estado.motivo = m; estado.hora = null;
    if (estado.dia && !huecos(estado.dia).length) estado.dia = null;
    $$('.motivo', lista).forEach((b) => { const si = b.dataset.k === m.k; b.setAttribute('aria-checked', String(si)); b.tabIndex = si ? 0 : -1; });
    // «me duele»: el calendario se abre en el primer día con hueco
    if (m.urgente) { const d = new Date(hoy); for (let n = 0; n < 20 && !huecos(d).length; n++) d.setDate(d.getDate() + 1); estado.vista = new Date(d.getFullYear(), d.getMonth(), 1); }
    resumir();
    if (avanzar) ir(2);
  }

  /* ---------- paso 2: día ---------- */
  function pintarCal() {
    const v = estado.vista;
    $('#cal-mes').textContent = mayus(fmtMes.format(v));
    $('#cal-ant').disabled = v <= new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    $('#cal-sig').disabled = new Date(v.getFullYear(), v.getMonth() + 1, 1) > tope;
    const cal = $('#cal'); cal.textContent = '';
    ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'].forEach((d) => { const s = document.createElement('span'); s.className = 'dia-sem'; s.setAttribute('aria-hidden', 'true'); s.textContent = d; cal.appendChild(s); });
    const desfase = (v.getDay() + 6) % 7, dias = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
    for (let i = 0; i < desfase; i++) { const b = document.createElement('button'); b.className = 'vacio'; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); b.disabled = true; cal.appendChild(b); }
    for (let x = 1; x <= dias; x++) {
      const d = new Date(v.getFullYear(), v.getMonth(), x), b = document.createElement('button'), h = huecos(d);
      const cerrado = !H.tramos(d);
      b.type = 'button'; b.textContent = x; b.dataset.iso = H.iso(d);
      b.setAttribute('aria-label', mayus(fmtDia.format(d)) + (cerrado ? ', cerrado' : h.length ? ', ' + h.length + (h.length === 1 ? ' hueco' : ' huecos') : ', sin huecos'));
      b.disabled = !h.length;
      if (h.length && h.length <= 3) b.classList.add('pocos');
      if (H.iso(d) === H.iso(hoy)) b.classList.add('es-hoy-cal');
      if (estado.dia && H.iso(d) === H.iso(estado.dia)) { b.classList.add('es-elegido'); b.setAttribute('aria-pressed', 'true'); }
      b.addEventListener('click', () => { estado.dia = d; estado.hora = null; pintarCal(); resumir(); ir(3); });
      cal.appendChild(b);
    }
  }
  $('#cal-ant').addEventListener('click', () => { estado.vista = new Date(estado.vista.getFullYear(), estado.vista.getMonth() - 1, 1); pintarCal(); });
  $('#cal-sig').addEventListener('click', () => { estado.vista = new Date(estado.vista.getFullYear(), estado.vista.getMonth() + 1, 1); pintarCal(); });

  /* ---------- paso 3: hora ---------- */
  function pintarHoras() {
    const cont = $('#horas'); cont.textContent = '';
    if (!estado.dia) return;
    $('#horas-tit').textContent = 'Elige una hora · ' + fmtDia.format(estado.dia);
    let tramoAnt = null;
    huecos(estado.dia).forEach((m) => {
      const tramo = m < 900 ? 'Mañana' : 'Tarde';
      if (tramo !== tramoAnt) { const s = document.createElement('span'); s.className = 'tramo'; s.textContent = tramo; cont.appendChild(s); tramoAnt = tramo; }
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = H.hhmm(m); b.setAttribute('aria-pressed', String(m === estado.hora));
      b.addEventListener('click', () => { estado.hora = m; pintarHoras(); resumir(); ir(4); });
      cont.appendChild(b);
    });
  }

  /* ---------- paso 4: datos ---------- */
  const form = $('#datos');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim(), tel = form.tel.value.replace(/[\s.-]/g, '');
    const err = [];
    form.nombre.setAttribute('aria-invalid', String(nombre.length < 2));
    form.tel.setAttribute('aria-invalid', String(!/^(\+34)?[6789]\d{8}$/.test(tel)));
    if (nombre.length < 2) err.push('tu nombre');
    if (!/^(\+34)?[6789]\d{8}$/.test(tel)) err.push('un teléfono de 9 cifras');
    if (!form.priv.checked) err.push('aceptar la política de privacidad');
    $('#datos-error').textContent = err.length ? 'Falta ' + err.join(', ') + '.' : '';
    if (err.length) { (nombre.length < 2 ? form.nombre : !/^(\+34)?[6789]\d{8}$/.test(tel) ? form.tel : form.priv).focus(); return; }
    const codigo = 'MA-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const telBonito = tel.replace(/^\+34/, '').replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    $('#hecho-texto').textContent = `${nombre.split(' ')[0]}, Irene te llamará al ${telBonito} para confirmar tu cita: ${estado.motivo.t.toLowerCase()}, el ${fmtDia.format(estado.dia)} a las ${H.hhmm(estado.hora)}.` + (form.miedo.checked ? ' Hemos apuntado que te pone nervioso o nerviosa venir: lo tendremos en cuenta desde que llegues.' : '') + ' Es una demostración: no se ha enviado nada.';
    $('#hecho-codigo').textContent = codigo;
    ir(5);
  });
  $('#motor-otra').addEventListener('click', () => {
    form.reset(); $('#datos-error').textContent = '';
    estado.dia = null; estado.hora = null; estado.motivo = null;
    $$('.motivo', lista).forEach((b, i) => { b.setAttribute('aria-checked', 'false'); b.tabIndex = i === 0 ? 0 : -1; });
    resumir(); ir(1);
  });

  /* ---------- pasos y resumen ---------- */
  const listo = (p) => (p === 1 ? !!estado.motivo : p === 2 ? !!estado.dia : p === 3 ? estado.hora != null : false);
  function ir(p) {
    estado.paso = p;
    $$('.motor__vista').forEach((v) => { v.hidden = +v.dataset.vista !== p; });
    $$('.motor__pasos li').forEach((li) => {
      const n = +li.dataset.paso;
      if (n === Math.min(p, 4)) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.classList.toggle('hecho', n < p);
    });
    if (p === 2) pintarCal();
    if (p === 3) pintarHoras();
    resumir();
    const vista = $(`.motor__vista[data-vista="${p}"]`);
    const foco = p === 5 ? vista : $('.motor__tit', vista);
    if (foco && document.activeElement && $('#motor').contains(document.activeElement)) { foco.setAttribute('tabindex', '-1'); foco.focus({ preventScroll: true }); }
  }
  function resumir() {
    const m = estado.motivo;
    $('#r-motivo').textContent = m ? m.t : '—';
    $('#r-dura').textContent = m ? 'unos ' + m.min + ' min' : '—';
    $('#r-quien').textContent = m ? m.q : '—';
    $('#r-dia').textContent = estado.dia ? mayus(fmtDia.format(estado.dia)) : '—';
    $('#r-hora').textContent = estado.hora != null ? H.hhmm(estado.hora) : '—';
    $('#motor-atras').disabled = estado.paso === 1 || estado.paso === 5;
    $('#motor-sigue').disabled = estado.paso >= 4 || !listo(estado.paso);
  }
  $('#motor-atras').addEventListener('click', () => ir(Math.max(1, estado.paso - 1)));
  $('#motor-sigue').addEventListener('click', () => { if (listo(estado.paso)) ir(estado.paso + 1); });

  ir(1);
  window.__cita = { estado, huecos, ir, MOTIVOS };
})();
