/* ------------------------------------------------------------------
   Clínica Dental Miguel Ángel · Vilarrodís · «La M que es un diente»
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  const raiz = document.documentElement;
  const hayGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(pointer: fine)').matches;
  // «con-movimiento» SOLO con GSAP y sin movimiento reducido: si no, los titulares partidos se quedarían escondidos
  const motion = hayGSAP && !quieto;
  if (motion) raiz.classList.add('con-movimiento');
  if (hayGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    // el resize lo gestionamos nosotros (la barra del móvil no rehace nada)
    ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load', ignoreMobileResize: true });
  }

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const f = (n) => Math.round(n * 1000) / 1000;
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const anno = $('#anno');
  if (anno) anno.textContent = new Date().getFullYear();

  // el resize de la barra del móvil (mismo ancho, poca altura) no rehace NADA
  let anchoVista = innerWidth, altoVista = innerHeight;
  const esBarra = () => !fino && innerWidth === anchoVista && Math.abs(innerHeight - altoVista) < 160;

  /* ============ 1. titulares partidos y entradas ============ */
  function partir(h) {
    if (h.classList.contains('es-partido')) return;
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    let n = 0;
    const envolver = (nodo) => {
      if (nodo.nodeType === 3) {
        const frag = document.createDocumentFragment();
        nodo.textContent.split(/([ \t\r\n]+)/).forEach((t) => {
          if (!t.trim()) { frag.appendChild(document.createTextNode(t)); return; }
          const pal = document.createElement('span');
          pal.className = 'pal';
          pal.setAttribute('aria-hidden', 'true');
          const i = document.createElement('i');
          i.textContent = t;
          i.style.setProperty('--n', n++);
          pal.appendChild(i);
          frag.appendChild(pal);
        });
        nodo.replaceWith(frag);
      } else if (nodo.nodeType === 1) Array.from(nodo.childNodes).forEach(envolver);
    };
    Array.from(h.childNodes).forEach(envolver);
    h.classList.add('es-partido');
  }
  const vistos = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('es-visto'); vistos.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  if (motion) {
    $$('[data-partir]').forEach((h) => { partir(h); if (!h.closest('.hero')) vistos.observe(h); });
    $$('[data-revela]').forEach((el, i) => { el.style.setProperty('--d', i % 3); vistos.observe(el); });
    $$('.sec-cab').forEach((el) => vistos.observe(el));
    // las fotos se abren desde la silueta del diente
    const abrir = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      abrir.unobserve(el);
      requestAnimationFrame(() => {
        el.classList.add('abriendo');
        setTimeout(() => el.classList.add('abierta'), 1600);
      });
    }), { rootMargin: '0px 0px -12% 0px' });
    $$('.dos__foto, .plano__foto, .mapa').forEach((el) => { el.classList.add('abre'); abrir.observe(el); });
  }

  /* ============ 2. Lenis ============ */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !quieto) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, lerp: 0.12 });
    if (hayGSAP) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); }
    else { const bucle = (t) => { lenis.raf(t); requestAnimationFrame(bucle); }; requestAnimationFrame(bucle); }
  }
  const irA = (sel) => {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - 80;
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else scrollTo({ top: y, behavior: quieto ? 'auto' : 'smooth' });
  };

  /* ============ 3. abierto ahora (dato real: su horario) ============ */
  function pintarAhora() {
    if (!window.HORARIO) return;
    const e = HORARIO.estado(new Date());
    $$('[data-ahora]').forEach((el) => { el.textContent = e.texto; });
    $$('[data-ahora-punto]').forEach((el) => el.classList.toggle('abierto', e.abierto));
    const hoy = new Date().getDay();
    $$('.horario tr').forEach((tr) => tr.classList.toggle('es-hoy', +tr.dataset.dia === hoy || (tr.dataset.dia === '6' && (hoy === 6 || hoy === 0))));
  }
  pintarAhora();
  setInterval(pintarAhora, 60000);

  /* ============ 4. la ventana de la portada: la clínica dentro del diente ============ */
  const ventana = (function () {
    const fig = $('#ventana');
    const marco = $('.ventana__marco', fig), pista = $('#ventana-pista'), vistas = $$('.ventana__vista', fig);
    const nombres = ['El gabinete', 'La sala de espera', 'La recepción'];
    let i = 0;
    const ir = (n, anunciar) => {
      i = (n + vistas.length) % vistas.length;
      pista.style.transform = `translateX(${-i * 100 / vistas.length}%)`;
      $('#ventana-nombre').textContent = nombres[i];
      $('#ventana-num').textContent = `${i + 1} / ${vistas.length}`;
      vistas.forEach((v, k) => v.setAttribute('aria-hidden', String(k !== i)));
      if (anunciar === false) return;
    };
    $$('.ventana__flecha', fig).forEach((b) => b.addEventListener('click', () => ir(i + +b.dataset.dir)));
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(i - 1); }
    });
    // las otras dos fotos esperan a que cargue la página: no le quitan red a la de la portada
    const prepararResto = () => vistas.forEach((v) => v.classList.add('lista'));
    if (document.readyState === 'complete') prepararResto(); else addEventListener('load', prepararResto, { once: true });
    // gesto propio: deslizar dentro del diente (el dedo vertical sigue haciendo scroll)
    let x0 = null, y0 = 0, dx = 0, horizontal = null, idp = null;
    marco.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      x0 = e.clientX; y0 = e.clientY; dx = 0; horizontal = null; idp = e.pointerId;
      prepararResto();
    });
    marco.addEventListener('pointermove', (e) => {
      if (x0 == null || e.pointerId !== idp) return;
      dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (horizontal == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        horizontal = Math.abs(dx) > Math.abs(dy);
        if (horizontal) { marco.classList.add('arrastra'); try { marco.setPointerCapture(e.pointerId); } catch (er) {} }
      }
      if (horizontal) pista.style.transform = `translateX(calc(${-i * 100 / vistas.length}% + ${dx / 3}px))`;
    });
    const soltar = (e) => {
      if (x0 == null || (e && e.pointerId !== idp)) return;
      marco.classList.remove('arrastra');
      if (horizontal && Math.abs(dx) > marco.offsetWidth * 0.12) ir(i + (dx < 0 ? 1 : -1));
      else ir(i);
      x0 = null;
    };
    marco.addEventListener('pointerup', soltar);
    marco.addEventListener('pointercancel', soltar);
    // lostpointercapture sube desde el hijo que tenía la captura implícita del dedo: solo cuenta la del marco
    marco.addEventListener('lostpointercapture', (e) => { if (e.target === marco) soltar(e); });
    // en el ordenador, la foto se asoma con el ratón (paralaje suave dentro del diente)
    if (fino && !quieto) {
      const hero = $('#hero');
      let pend = 0, mx = 0, my = 0;
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
        if (!pend) pend = requestAnimationFrame(() => {
          pend = 0;
          vistas.forEach((v) => { const im = $('img', v); if (im) { im.style.setProperty('--px', f(-mx * 18) + 'px'); im.style.setProperty('--py', f(-my * 14) + 'px'); } });
          $('.ventana__eco').style.translate = `calc(-50% + ${f(14 + mx * 12)}px) ${f(10 + my * 10)}px`;
        });
      });
    }
    ir(0, false);
    return { ir, get i() { return i; } };
  })();

  /* ============ 5. el diente, capa a capa ============ */
  (function capas() {
    const sec = $('#tratamientos');
    const tabs = $$('[role="tab"]', sec), paneles = $$('.capa-panel', sec), capas = $$('.diente .capa', sec);
    // quién se encarga: un retrato pequeño sacado de la ficha del equipo
    $$('.capa-panel__quien', sec).forEach((p) => {
      p.dataset.quien.split(' ').forEach((k) => {
        const per = $('#persona-' + k);
        if (!per) return;
        const a = document.createElement('a');
        a.className = 'quien'; a.href = '#persona-' + k;
        const pic = $('picture', per).cloneNode(true);
        $$('source, img', pic).forEach((s) => s.setAttribute('sizes', '48px'));
        $('img', pic).alt = '';
        const t = document.createElement('span');
        const b = document.createElement('b'); b.textContent = $('h3', per).textContent;
        t.append(b, $('.persona__cargo', per).textContent);
        a.append(pic, t);
        p.appendChild(a);
      });
    });
    const elegir = (k, foco) => {
      sec.classList.add('hay-activa');
      tabs.forEach((t) => { const si = t.dataset.k === k; t.setAttribute('aria-selected', String(si)); t.tabIndex = si ? 0 : -1; if (si && foco) t.focus(); });
      paneles.forEach((p) => p.classList.toggle('on', p.dataset.k === k));
      capas.forEach((c) => c.classList.toggle('activa', c.dataset.k === k));
    };
    tabs.forEach((t, n) => {
      t.addEventListener('click', () => elegir(t.dataset.k));
      t.addEventListener('keydown', (e) => {
        const mover = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (mover) { e.preventDefault(); elegir(tabs[(n + mover + tabs.length) % tabs.length].dataset.k, true); }
        if (e.key === 'Home') { e.preventDefault(); elegir(tabs[0].dataset.k, true); }
        if (e.key === 'End') { e.preventDefault(); elegir(tabs[tabs.length - 1].dataset.k, true); }
      });
    });
    capas.forEach((c) => c.addEventListener('click', () => elegir(c.dataset.k)));
    elegir('esmalte');
  })();

  /* ============ 6. ¿quién te atiende? ============ */
  (function equipo() {
    const lista = $('#equipo-lista'), nota = $('#equipo-nota');
    const botones = $$('#motivos button');
    botones.forEach((b) => b.addEventListener('click', () => {
      const yaEstaba = b.getAttribute('aria-pressed') === 'true';
      botones.forEach((o) => o.setAttribute('aria-pressed', String(o === b && !yaEstaba)));
      if (yaEstaba) { lista.classList.remove('filtra'); $$('.persona', lista).forEach((p) => p.classList.remove('encendida')); nota.textContent = ''; return; }
      const q = b.dataset.q.split(' ');
      lista.classList.add('filtra');
      $$('.persona', lista).forEach((p) => p.classList.toggle('encendida', q.includes(p.dataset.p)));
      nota.textContent = b.dataset.n;
    }));
  })();

  /* ============ 7. la clínica por dentro: el plano ============ */
  (function plano() {
    const S = {
      gabinete: { d: 'Al fondo', n: 'Gabinete', t: 'Sillón azul marino, todo a mano y en orden. Aquí se hace casi todo: revisiones, empastes, endodoncias e implantes.', f: 'portada-gabinete', a: 'Gabinete con el sillón azul marino' },
      gabinete2: { d: 'Al fondo', n: 'Segundo gabinete', t: 'Con un mapa de ciudades en la pared, para mirar algo mientras te atienden. Higiene, ortodoncia y estética.', f: 'gabinete2', a: 'Segundo gabinete con un vinilo de nombres de ciudades' },
      rayos: { d: 'Sala propia', n: 'Rayos X', t: 'El ortopantomógrafo hace la radiografía de toda la boca en unos segundos, sin salir de la clínica.', f: 'rayos', a: 'Ortopantomógrafo en la sala de rayos' },
      esteril: { d: 'Sala propia', n: 'Esterilización', t: 'Todo el material pasa por el autoclave y vuelve en bolsa cerrada, que se abre delante de ti.', f: 'material', a: 'Material esterilizado en bolsas cerradas' },
      aseo: { d: 'Planta baja', n: 'Aseo adaptado', t: 'Entrada y aseo accesibles en silla de ruedas. Sin escalones desde la acera.', f: 'fachada', a: 'Entrada de la clínica a pie de calle' },
      recepcion: { d: 'Nada más entrar', n: 'Recepción', t: 'Irene te recibe, coge el teléfono y lleva la agenda. Si tienes miedo, díselo: es lo primero que queremos saber.', f: 'portada-recepcion', a: 'Mostrador de recepción con flores' },
      sala: { d: 'Junto al escaparate', n: 'Sala de espera', t: 'Blanca, luminosa, con butacas y láminas en la pared, detrás de las franjas esmeriladas del cristal: se ve la calle, pero no te ven desde fuera.', f: 'portada-sala', a: 'Sala de espera con dos butacas' },
      raton: { d: 'En la sala de espera', n: 'El rincón del Ratoncito Pérez', t: 'Una puertecita, una escoba y un ratón de ganchillo. Aquí dejan los niños el diente que se les ha caído.', f: 'raton-rincon', a: 'Rincón del Ratoncito Pérez con su puerta y un ratón' },
    };
    const salas = $$('.plano .sala'), caja = $('.plano__foto'), plantilla = $('#plano-fotos');
    // en el móvil el texto del plano no se lee: debajo, una fila de botones con las mismas salas
    const chips = document.createElement('div');
    chips.className = 'plano__chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Salas');
    salas.forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.k = g.dataset.k; b.textContent = S[g.dataset.k].n; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => elegir(g));
      chips.appendChild(b);
    });
    $('.plano__nota').before(chips);
    const elegir = (g) => {
      salas.forEach((s) => s.classList.toggle('activa', s === g));
      $$('button', chips).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === g.dataset.k)));
      const d = S[g.dataset.k];
      $('#plano-donde').textContent = d.d; $('#plano-nombre').textContent = d.n; $('#plano-texto').textContent = d.t;
      const nueva = plantilla && $(`img[data-k="${g.dataset.k}"]`, plantilla.content);
      if (!nueva) return;
      const pic = nueva.closest('picture').cloneNode(true);
      const img = $('img', pic);
      img.alt = d.a; img.removeAttribute('loading');
      const vieja = $('img', caja);
      if (vieja && vieja.getAttribute('src') === img.getAttribute('src')) return;
      const poner = () => { caja.textContent = ''; caja.appendChild(pic); };
      if (vieja && motion) { vieja.classList.add('cambia'); setTimeout(poner, 260); } else poner();
    };
    salas.forEach((g) => {
      g.addEventListener('click', () => elegir(g));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(g); } });
    });
    const inicial = $('.sala[data-k="sala"]');
    inicial.classList.add('activa');
    $('button[data-k="sala"]', chips).setAttribute('aria-pressed', 'true');
    $('img', caja).alt = S.sala.a;
  })();

  /* ============ 8. casos: antes y después ============ */
  $$('.caso__comp').forEach((c) => {
    const r = $('.caso__rango', c);
    const pintar = () => c.style.setProperty('--x', r.value + '%');
    r.addEventListener('input', pintar);
    pintar();
  });

  /* ============ 9. cortina: el símbolo se traza y la pantalla se abre a través del diente ============ */
  const cortina = $('#cortina');
  const hero = $('#hero');
  function retirarCortina() {
    clearTimeout(window.__redCortina);
    if (cortina) cortina.hidden = true;
    raiz.classList.remove('cortina-activa');
    raiz.classList.add('cortina-fuera');
    if (lenis) lenis.start();
    if (hayGSAP) { gsap.ticker.lagSmoothing(0); ScrollTrigger.refresh(); }
    mostrarCookies();
  }
  function abrirHero() {
    hero.classList.add('abierta');
    const h = $('.hero [data-partir]');
    if (h && motion) h.classList.add('es-visto');
  }
  // el punto del diente más alejado de su borde: el zoom final entra por ahí y no cae en un hueco
  function puntoHondo(paths, vb) {
    let mejor = null, rMax = 0;
    const svg = paths[0].ownerSVGElement, p = svg.createSVGPoint();
    const dentro = (x, y) => { p.x = x; p.y = y; return paths.some((el) => el.isPointInFill(p)); };
    const pasos = 26, dir = [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]];
    for (let a = 1; a < pasos; a++) for (let b = 1; b < pasos * 1.5; b++) {
      const x = vb[0] + vb[2] * a / pasos, y = vb[1] + vb[3] * b / (pasos * 1.5);
      if (!dentro(x, y)) continue;
      let r = 0;
      for (let paso = vb[2] / 120; paso < vb[2]; paso += vb[2] / 120) { if (dir.every(([dx, dy]) => dentro(x + dx * paso, y + dy * paso))) r = paso; else break; }
      if (r > rMax) { rMax = r; mejor = [x, y]; }
    }
    return mejor ? { x: mejor[0], y: mejor[1], r: rMax } : null;
  }
  function lanzarCortina() {
    // sin GSAP, con movimiento reducido o si el CDN tardó (> 2,5 s): fuera sin animar
    if (!cortina || !motion || performance.now() > 2500) { retirarCortina(); abrirHero(); return; }
    raiz.classList.add('cortina-activa');
    if (lenis) lenis.stop();
    const muro = $('#cortina-muro'), hueco = $('#cortina-hueco'), marca = $('#cortina-marca');
    const W = innerWidth, H = innerHeight;
    muro.setAttribute('viewBox', `0 0 ${W} ${H}`);
    $$('rect', muro).forEach((r) => { r.setAttribute('width', W); r.setAttribute('height', H); });
    const vb = (marca.getAttribute('viewBox') || '0 0 100 150').split(/[\s,]+/).map(Number);
    const caminos = $$('path', hueco);
    // el muro azul con su agujero (aún cerrado) sustituye al fondo: a partir de aquí la capa es transparente
    hueco.setAttribute('transform', 'scale(0)');
    cortina.classList.add('muro-listo');
    const trazos = $$('[data-trazo]', marca);
    const nombre = $$('.cortina__nombre b, .cortina__nombre i', cortina);
    const tl = gsap.timeline({ onComplete: retirarCortina });
    if (trazos.length) tl.fromTo(trazos, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.15, ease: 'power2.inOut', stagger: 0.12, autoRound: false });
    else tl.fromTo(marca, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power2.inOut' });
    tl.fromTo(nombre, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, '-=0.35');
    // el agujero ocupa el sitio del símbolo y crece hasta abrir la pantalla
    tl.add(() => {
      const r = marca.getBoundingClientRect();
      const s0 = r.width / vb[2];
      const c = { x: vb[0] + vb[2] / 2, y: vb[1] + vb[3] / 2 };
      // calculado al construir (scripts/hondo.mjs); si faltara, se calcula aquí
      const dato = (hueco.dataset.hondo || '').split(' ').map(Number);
      const hondo = dato.length === 3 && dato.every((n) => n > 0) ? { x: dato[0], y: dato[1], r: dato[2] } : (caminos.length && caminos[0].isPointInFill) ? puntoHondo(caminos, vb) : null;
      const F = hondo || c;
      const s1 = hondo ? Math.hypot(W, H) / hondo.r * 0.75 : s0 * 40;
      const est = { t: 0 };
      const pintar = () => {
        const t = est.t;
        const s = s0 * Math.pow(s1 / s0, t);
        const px = c.x + (F.x - c.x) * Math.min(1, t * 1.6), py = c.y + (F.y - c.y) * Math.min(1, t * 1.6);
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const ox = cx + (W / 2 - cx) * t, oy = cy + (H / 2 - cy) * t;
        hueco.setAttribute('transform', `translate(${f(ox - px * s)} ${f(oy - py * s)}) scale(${f(s)})`);
      };
      pintar();
      gsap.set(marca, { opacity: 0 });
      abrirHero();
      gsap.to(nombre, { yPercent: -110, duration: 0.5, ease: 'expo.in' });
      gsap.to(est, { t: 1, duration: 1.35, ease: 'expo.inOut', autoRound: false, onUpdate: pintar });
    }, '+=0.45');
    tl.to({}, { duration: 1.4 });
  }

  /* ============ 10. cabecera, menú y anclas ============ */
  const cab = $('#cab');
  const lectura = $('.cab__lectura');
  let pendienteCab = 0;
  const alScroll = () => {
    pendienteCab = 0;
    cab.classList.toggle('sc', scrollY > 24);
    // el diente de la cabecera se llena al bajar: es el indicador de lectura
    const total = document.documentElement.scrollHeight - innerHeight;
    lectura.style.setProperty('--p', total > 0 ? f(limitar(scrollY / total, 0, 1)) : 0);
  };
  addEventListener('scroll', () => { if (!pendienteCab) pendienteCab = requestAnimationFrame(alScroll); }, { passive: true });
  alScroll();

  const btnMenu = $('#menu-btn'), menu = $('#menu-movil');
  const cerrarMenu = () => {
    document.body.classList.remove('menu');
    btnMenu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  };
  btnMenu.addEventListener('click', () => {
    const abierto = document.body.classList.toggle('menu');
    btnMenu.setAttribute('aria-expanded', String(abierto));
    menu.setAttribute('aria-hidden', String(!abierto));
    if (lenis) abierto ? lenis.stop() : lenis.start();
  });
  $$('a[href^="#"]').forEach((a) => {
    const destino = a.getAttribute('href');
    if (destino.length < 2) return;
    a.addEventListener('click', (e) => {
      if (!$(destino)) return;
      e.preventDefault();
      cerrarMenu();
      irA(destino);
      if (destino.startsWith('#persona-')) history.replaceState(null, '', destino);
      setTimeout(() => {
        const t = $(destino);
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        t.focus({ preventScroll: true });
      }, 900);
    });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu')) { cerrarMenu(); btnMenu.focus(); } });

  /* ============ 11. cookies (y el mando se aparta mientras están) ============ */
  const ck = $('#cookies');
  const LLAVE = 'ma-cookies';
  const leer = () => { try { return localStorage.getItem(LLAVE); } catch (e) { return null; } };
  const guardar = (v) => { try { localStorage.setItem(LLAVE, v); } catch (e) {} };
  const mando = $('#mando');
  const verMando = () => { if (mando && raiz.classList.contains('revision')) mando.hidden = !ck.hidden; };
  let cookiesPendientes = !leer();
  function mostrarCookies() {
    if (!cookiesPendientes) { verMando(); return; }
    cookiesPendientes = false;
    ck.hidden = false;
    verMando();
  }
  const cerrarCk = (v) => { guardar(v); ck.hidden = true; verMando(); };
  $('#ck-si').addEventListener('click', () => cerrarCk('si'));
  $('#ck-no').addEventListener('click', () => cerrarCk('no'));
  $('#abrir-cookies').addEventListener('click', () => { ck.hidden = false; verMando(); $('#ck-si').focus(); });
  setTimeout(() => { if (raiz.classList.contains('cortina-fuera')) mostrarCookies(); }, 6600);

  /* ============ 12. barra fija en el móvil (solo con observadores) ============ */
  (function barraMovil() {
    const barra = $('#barra');
    if (!barra) return;
    const movil = matchMedia('(max-width: 999px)');
    const dentro = { hero: true, cita: false, pie: false };
    const pintar = () => {
      const ver = movil.matches && !dentro.hero && !dentro.cita && !dentro.pie && !document.body.classList.contains('menu') && ck.hidden;
      barra.classList.toggle('es-visible', ver);
      barra.setAttribute('aria-hidden', String(!ver));
      $$('a', barra).forEach((a) => { a.tabIndex = ver ? 0 : -1; });
      raiz.classList.toggle('con-barra', ver);
    };
    const io = new IntersectionObserver((es) => { es.forEach((e) => { dentro[e.target.dataset.barra] = e.isIntersecting; }); pintar(); });
    [['hero', '.hero'], ['cita', '#motor'], ['pie', '#pie']].forEach(([k, s]) => { const el = $(s); if (el) { el.dataset.barra = k; io.observe(el); } });
    const mo = new MutationObserver(pintar);
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    mo.observe(ck, { attributes: true, attributeFilter: ['hidden'] });
    movil.addEventListener('change', pintar);
    pintar();
  })();

  /* ============ 13. mapa de Google solo al pedirlo ============ */
  $('#mapa-btn').addEventListener('click', () => {
    const marco = document.createElement('iframe');
    marco.src = 'https://www.google.com/maps?q=' + encodeURIComponent('43.316822,-8.4817001 (Clínica Dental Miguel Ángel)') + '&z=16&output=embed';
    marco.loading = 'lazy';
    marco.title = 'Mapa con la Clínica Dental Miguel Ángel en Vilarrodís';
    marco.referrerPolicy = 'no-referrer-when-downgrade';
    $('#mapa').appendChild(marco);
    $('#mapa-consent').remove();
  });

  /* ============ 14. pie: el diente se completa ============ */
  (function pie() {
    const p = $('#pie');
    if (!motion) { p.classList.add('es-completo'); return; }
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { p.classList.add('es-completo'); o.disconnect(); } }, { threshold: 0.5 }).observe($('.pie__marca'));
  })();

  /* ============ 15. MANDO DE MAQUETA (no viaja al cliente) ============ */
  if (mando && raiz.classList.contains('revision')) {
    const botones = $$('button[data-densidad]', mando);
    const pintarMando = () => botones.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.densidad === 'sobria') === raiz.classList.contains('densidad-sobria'))));
    botones.forEach((b) => b.addEventListener('click', () => {
      raiz.classList.toggle('densidad-sobria', b.dataset.densidad === 'sobria');
      const u = new URL(location.href);
      if (b.dataset.densidad === 'sobria') u.searchParams.set('densidad', 'sobria'); else u.searchParams.delete('densidad');
      history.replaceState(null, '', u);
      pintarMando();
      if (hayGSAP) ScrollTrigger.refresh();
    }));
    pintarMando();
    verMando();
  }
  /* fin del MANDO DE MAQUETA */

  // la cortina arranca al final: cuando se retira usa las cookies, la barra y la cabecera
  lanzarCortina();

  /* ============ 16. resize de verdad (no el de la barra del móvil) ============ */
  let tRes = 0;
  addEventListener('resize', () => {
    if (esBarra()) return;
    clearTimeout(tRes);
    tRes = setTimeout(() => { anchoVista = innerWidth; altoVista = innerHeight; if (hayGSAP) ScrollTrigger.refresh(); }, 200);
  });
  addEventListener('load', () => { if (hayGSAP) ScrollTrigger.refresh(); });
  window.__ma = { ventana, irA };
})();
