/* Verificación de la web de la Clínica Dental Miguel Ángel (Playwright, bajando con la rueda).
   Uso: node verificar.mjs [--capturas]   → capturas en ./pruebas/ */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/');
const { chromium } = require('playwright');

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = 8792;                 // puerto propio de esta web
const CAPTURAS = process.argv.includes('--capturas');
const DIR_CAP = path.join(RAIZ, 'pruebas');
if (CAPTURAS) fs.mkdirSync(DIR_CAP, { recursive: true });
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif' };
const servidor = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(RAIZ, p);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
servidor.on('error', (e) => { console.error(`El puerto ${PUERTO} está ocupado (¿otra sesión?): ${e.message}`); process.exit(2); });
await new Promise((r) => servidor.listen(PUERTO, r));
const BASE = `http://localhost:${PUERTO}/`;
console.log('sirviendo en ' + BASE);

const fallos = [];
let nOk = 0;
const mal = (m) => { fallos.push(m); console.log('  FALLO  ' + m); };
const ok = (m) => { nOk++; console.log('  ok     ' + m); };
const comprobar = (cond, m, detalle) => (cond ? ok(m) : mal(m + (detalle !== undefined ? ' → ' + JSON.stringify(detalle) : '')));
const cap = async (page, nombre, op) => { if (CAPTURAS) await page.screenshot({ path: path.join(DIR_CAP, nombre + '.png'), ...(op || {}) }); };
const LLAVE = 'ma-cookies';
const sinCookies = () => { try { localStorage.setItem('ma-cookies', 'si'); } catch (e) {} };
const MOVIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

const browser = await chromium.launch({ headless: true });

/* GSAP y Lenis desde una copia local: así la cortina no depende del CDN ese día */
const CDN = {
  'gsap.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'ScrollTrigger.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
  'lenis.min.js': 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js',
};
const CACHE = path.join(os.tmpdir(), 'neixon-cdn');   // la misma copia que usan las otras webs
fs.mkdirSync(CACHE, { recursive: true });
for (const [n, u] of Object.entries(CDN)) {
  const f = path.join(CACHE, n);
  if (!fs.existsSync(f)) fs.writeFileSync(f, Buffer.from(await (await fetch(u)).arrayBuffer()));
}
const RE_CDN = /(gsap\.min|ScrollTrigger\.min|lenis\.min)\.js$/;
const local = (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(CACHE, r.request().url().split('/').pop())) });

async function nueva(op = {}, { cdn = 'local', script } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...op });
  if (cdn === 'local') await ctx.route(RE_CDN, local);
  if (cdn === 'caido') await ctx.route(RE_CDN, (r) => r.abort());
  if (cdn === 'lento') await ctx.route(RE_CDN, async (r) => { await new Promise((x) => setTimeout(x, 3000)); await local(r); });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>fuera</p>' }));
  if (script) await ctx.addInitScript(script);
  const page = await ctx.newPage();
  page._errores = [];
  page.on('pageerror', (e) => page._errores.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) page._errores.push('consola: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) page._errores.push(r.status() + ' ' + r.url()); });
  return { ctx, page };
}
async function bajarA(page, sel, margen = 0) {
  const top = () => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, sel);
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    for (let i = 0; i < 200; i++) {
      const t = await top();
      if (Math.abs(t - margen) < 30) break;
      await page.mouse.wheel(0, Math.max(-450, Math.min(450, t - margen)));
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(800);
    if (Math.abs((await top()) - margen) < 40) break;
  }
  await page.waitForTimeout(300);
}
async function bajarTodo(page) {
  for (let i = 0; i < 400; i++) {
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(50);
    if (await page.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 4)) break;
  }
  await page.waitForTimeout(1600);
}
const esperarCortina = async (page, extra = 500) => {
  await page.waitForFunction(() => { const c = document.getElementById('cortina'); return !c || getComputedStyle(c).display === 'none'; }, null, { timeout: 12000 });
  await page.waitForTimeout(extra);
};

/* ================= 0. archivos ================= */
console.log('\n0. Archivos');
for (const f of fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html') && !f.endsWith('.src.html'))) {
  const s = fs.readFileSync(path.join(RAIZ, f), 'utf8');
  comprobar(/^<!DOCTYPE html>\s*<html lang="es">\s*<head>\s*<meta charset="utf-8">/.test(s), `${f}: el charset es lo primero del head`);
  comprobar(/<meta name="robots" content="noindex/.test(s), `${f}: noindex`);
  comprobar(!/<!--svg:|<!--marca:|data-foto="[^"]+"\s[^>]*>(?!<\/picture>)/.test(s.replace(/<picture data-foto="[^"]+">/g, '')), `${f}: sin marcadores de construir.mjs sin expandir`);
  const ids = [...s.replace(/<template[\s\S]*?<\/template>/g, '').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const rep = ids.filter((x, i) => ids.indexOf(x) !== i);
  comprobar(rep.length === 0, `${f}: ningún id repetido`, [...new Set(rep)].slice(0, 8));
}
comprobar(['.nojekyll', '404.html', 'manifest.json', 'img/og.jpg', 'marca/favicon.svg', 'marca/favicon-32.png', 'marca/apple-touch-icon.png', 'marca/logo-azul.svg', 'marca/logo-blanco.svg', 'img/marca/marca.svg', 'img/marca/marca-trazos.svg'].every((f) => fs.existsSync(path.join(RAIZ, f))), '.nojekyll, 404, manifest, og:image, favicons y piezas del logo');
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
{
  const rutas = new Set();
  for (const m of html.matchAll(/(src|srcset|href|imagesrcset)="([^"]+)"/g)) for (const parte of (/srcset/.test(m[1]) ? m[2].split(',') : [m[2]])) {
    const r = parte.trim().split(/\s+/)[0].split('?')[0];
    if (r && !/^(https?:|mailto:|tel:|#|data:)/.test(r)) rutas.add(r);
  }
  const faltan = [...rutas].filter((r) => !fs.existsSync(path.join(RAIZ, r)));
  comprobar(faltan.length === 0, `index.html: existen los ${rutas.size} archivos que enlaza`, faltan);
  comprobar(/rel="preload" as="image"[^>]*portada-gabinete-800\.avif/.test(html.replace(/\n\s*/g, ' ')), 'la foto de la portada va precargada');
  const texto = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  comprobar(!/(?<!escribir |dejar |deja )\b(1|una)( sola| única)? reseña/i.test(texto), 'sin «una reseña» (salvo «escribir una reseña»)');
  comprobar(!/clientes satisfechos|cientos de|miles de|los mejores|el mejor dentista/i.test(texto), 'sin prueba social inventada ni superlativos');
  comprobar(!/sin permanencia|sin cuotas|mejor precio|gratis|sin dolor garantizado|100 ?% indoloro/i.test(texto), 'sin reclamos comerciales ni promesas sanitarias');
  comprobar(!/rinomodelaci|bótox en la frente|patas de gallo/i.test(texto), 'estética facial: solo tercio inferior (nada de rinomodelación)');
  comprobar(/C-15-002286/.test(texto), 'el registro sanitario va en la página');
  comprobar(!/Mira Lista|Dr\.? Miguel/i.test(texto), 'el fundador no sale de protagonista (sin confirmar quién lleva hoy la clínica)');
  comprobar([...html.matchAll(/<img\b[^>]*>/g)].every((m) => /\salt="/.test(m[0])), 'todas las imágenes llevan alt');
  comprobar((() => { try { JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]); return true; } catch (e) { return false; } })(), 'el JSON-LD se lee');
  // fotos prohibidas: pacientes con cara y menores (lista de ref/instagram.md)
  const lista = fs.readFileSync(path.join(RAIZ, 'scripts/fotos-lista.json'), 'utf8');
  const prohibidas = ['DJUekpOIbZW', 'CZwkOOLMUfY', 'C528NDFtxti', 'DSpVmDciKY0', 'DQ31Y8-CIF4', 'CyLqUBgNKzN', 'ClOBADgsct7', 'DNnChP5IBpt', 'CWA9qkPMidY', 'DFzzPbntl-y', 'Crs8NTUtjBg', 'DKtnlp6I9_o', 'CjsgC52DrOz', 'CqlPQjktFZF', 'C5NqnJ5NVHO', 'DY6nijzIkx-'];
  comprobar(!prohibidas.some((c) => lista.includes(c)), 'ninguna foto con cara de paciente ni de menores');
}
const css = fs.readFileSync(path.join(RAIZ, 'css/estilos.css'), 'utf8');
comprobar(/\.cookies:not\(\[hidden\]\)\s*\{[^}]*display:\s*flex/.test(css) && !/\.cookies\s*\{[^}]*display:\s*flex/.test(css), 'cookies: display:flex solo en :not([hidden])');
comprobar(/\.mando:not\(\[hidden\]\)/.test(css) && !/\.mando\s*\{[^}]*display:/.test(css), 'mando: display solo en :not([hidden])');
comprobar(!/scroll-behavior:\s*smooth/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'sin scroll-behavior:smooth (pelearía con Lenis)');
comprobar(/height:\s*100dvh/.test(css.match(/\.menu-movil \{[^}]*\}/)?.[0] || ''), 'menú móvil con altura explícita 100dvh');
comprobar(!/cursor:\s*none/.test(css), 'sin cursor propio (no hay dos cursores)');
comprobar(!/\b100dvh\b/.test(css.replace(/\.menu-movil \{[^}]*\}/, '')), 'dvh solo en la capa fija del menú');
comprobar(!/^\.hoy\b|[\s,]\.hoy\b/m.test(css), 'ninguna clase de estado con nombre de bloque (.hoy)');
{
  const src = fs.readFileSync(path.join(RAIZ, 'index.src.html'), 'utf8');
  const js = fs.readFileSync(path.join(RAIZ, 'js/main.js'), 'utf8');
  comprobar(/<!-- MANDO DE MAQUETA/.test(src) && /fin del MANDO DE MAQUETA/.test(src) && /15\. MANDO DE MAQUETA/.test(js) && /fin del MANDO DE MAQUETA/.test(js), 'receta de borrado del mando: marcas en index.src.html y main.js');
  comprobar(/OPCIONAL «Tu primera visita»/.test(src) && /fin OPCIONAL «Tu primera visita»/.test(src), 'la sección opcional lleva sus marcas para quitarla');
  comprobar(/cdn\.jsdelivr\.net\/npm\/@studio-freight\/lenis@1\.0\.42/.test(src) && /gsap\/3\.12\.5/.test(src), 'GSAP y Lenis con versión fija');
  comprobar(/autoRound:\s*false/.test(js.match(/strokeDashoffset[^;]*;/)?.[0] || ''), 'los trazos de la cortina llevan autoRound:false');
  const fotos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'img/fotos/fotos.json'), 'utf8'));
  comprobar(fotos.every((f) => f.ancho <= f.ancho_origen), 'fotos: ningún tamaño generado por encima del original');
}

/* ================= 1. la cortina ================= */
console.log('\n1. Cortina');
{
  const { ctx, page } = await nueva({}, { script: sinCookies });
  await page.addInitScript(() => {
    window.__muestras = [];
    const t0 = performance.now();
    const tomar = () => {
      const c = document.getElementById('cortina');
      if (c) {
        const tr = c.querySelector('[data-trazo]'), h = document.getElementById('cortina-hueco');
        const m = h && /scale\(([\d.e-]+)\)/.exec(h.getAttribute('transform') || '');
        window.__muestras.push({ t: performance.now() - t0, vis: getComputedStyle(c).display !== 'none', fondo: getComputedStyle(c).backgroundColor, dash: tr ? parseFloat(getComputedStyle(tr).strokeDashoffset) : null, s: m ? +m[1] : 0 });
      }
      if (performance.now() - t0 < 7000) requestAnimationFrame(tomar);
    };
    requestAnimationFrame(tomar);
  });
  const t0 = Date.now();
  await page.goto(BASE);
  await page.waitForTimeout(900);
  await cap(page, '01-cortina-trazo');
  await page.waitForTimeout(1700);
  await cap(page, '01-cortina-abriendo');
  await esperarCortina(page, 300);
  const dur = Date.now() - t0;
  const m = await page.evaluate(() => window.__muestras);
  comprobar(m.length > 20 && m[0].vis, 'la cortina tapa al cargar', m.length);
  comprobar(m.some((x) => x.dash > 0.15 && x.dash < 0.85), 'el símbolo se traza (fotogramas a medio dibujar)', m.filter((x, i) => i % 12 === 0).map((x) => x.dash).slice(0, 10));
  const escalas = m.map((x) => x.s).filter((s) => s > 0);
  comprobar(escalas.length > 10 && Math.max(...escalas) / Math.min(...escalas) > 20, 'el agujero con forma de diente crece hasta abrir la pantalla', [Math.min(...escalas), Math.max(...escalas)]);
  comprobar(m.filter((x) => x.s > 0).every((x) => x.fondo === 'rgba(0, 0, 0, 0)'), 'mientras crece el agujero, la capa no tiene fondo opaco');
  comprobar(dur > 2000 && dur < 6400, 'la cortina dura entre 2 y 6,4 s', dur);
  comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none' && document.documentElement.classList.contains('cortina-fuera')), 'la cortina desaparece de verdad (display:none)');
  comprobar(await page.evaluate(() => document.getElementById('hero').classList.contains('abierta') && document.querySelector('.hero h1').classList.contains('es-visto')), 'al abrirse, el titular de la portada entra');
  comprobar(m[0].fondo === 'rgb(26, 57, 140)' && await page.evaluate(() => getComputedStyle(document.body).backgroundColor) !== m[0].fondo, 'la cortina (azul) es de otro color que la portada (porcelana)', m[0].fondo);
  comprobar(page._errores.length === 0, 'sin errores', page._errores);
  await ctx.close();
}
{
  const { ctx, page } = await nueva({ reducedMotion: 'reduce' }, { script: sinCookies });
  await page.goto(BASE);
  await page.waitForTimeout(150);
  comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none'), 'movimiento reducido: la cortina no se ve ni un fotograma');
  await page.waitForTimeout(600);
  comprobar(await page.evaluate(() => !document.documentElement.classList.contains('con-movimiento') && getComputedStyle(document.querySelector('.hero h1')).opacity === '1' && !document.querySelector('.hero h1 .pal')), 'movimiento reducido: el titular se lee sin animación');
  await ctx.close();
}
{
  const { ctx, page } = await nueva({}, { cdn: 'caido', script: sinCookies });
  await page.goto(BASE);
  await page.waitForTimeout(1200);
  comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none'), 'sin CDN: la cortina se retira');
  comprobar(await page.evaluate(() => document.querySelectorAll('.motivo').length === 8 && document.querySelectorAll('.capa-panel.on').length === 1), 'sin CDN: capas y cita funcionan');
  await ctx.close();
}
{
  const { ctx, page } = await nueva({}, { cdn: 'lento', script: sinCookies });
  await page.goto(BASE);
  await page.waitForTimeout(4200);
  comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none'), 'CDN lento: la cortina no se queda puesta');
  await ctx.close();
}
{
  const { ctx, page } = await nueva({ javaScriptEnabled: false });
  await page.goto(BASE);
  await page.waitForTimeout(400);
  comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none'), 'sin JS: no hay cortina');
  comprobar(await page.evaluate(() => Array.from(document.querySelectorAll('.capa-panel')).every((p) => getComputedStyle(p).display !== 'none') && document.querySelectorAll('.capa-panel').length === 6), 'sin JS: se leen los seis tratamientos');
  await ctx.close();
}

/* ================= 2. la portada: la clínica dentro del diente ================= */
console.log('\n2. Portada');
{
  const { ctx, page } = await nueva({}, { script: sinCookies });
  await page.goto(BASE);
  await esperarCortina(page, 1400);
  const i = () => page.evaluate(() => window.__ma.ventana.i);
  const marco = await page.evaluate(() => { const m = document.querySelector('.ventana__marco'); const b = m.getBoundingClientRect(); return { ta: getComputedStyle(m).touchAction, mask: getComputedStyle(m).maskImage || getComputedStyle(m).webkitMaskImage, x: b.left, y: b.top, w: b.width, h: b.height }; });
  comprobar(marco.ta === 'pan-y', 'touch-action: pan-y en la ventana');
  comprobar(/marca\.svg/.test(marco.mask), 'la ventana lleva la máscara del símbolo', marco.mask);
  await page.mouse.move(marco.x + marco.w * 0.75, marco.y + marco.h * 0.45);
  await page.mouse.down();
  for (let k = 1; k <= 10; k++) { await page.mouse.move(marco.x + marco.w * (0.75 - k * 0.05), marco.y + marco.h * 0.45); await page.waitForTimeout(16); }
  await page.mouse.up();
  await page.waitForTimeout(500);
  comprobar(await i() === 1, 'arrastrar con el ratón hacia la izquierda pasa a la siguiente vista');
  comprobar(await page.evaluate(() => document.getElementById('ventana-nombre').textContent === 'La sala de espera' && document.getElementById('ventana-num').textContent === '2 / 3'), 'el rótulo sigue a la vista');
  await page.focus('.ventana__flecha[data-dir="1"]');
  await page.keyboard.press('ArrowRight');
  comprobar(await i() === 2, 'teclado (→) avanza');
  await page.click('.ventana__flecha[data-dir="1"]');
  comprobar(await i() === 0, 'el botón › da la vuelta al principio');
  await page.mouse.move(200, 300); await page.waitForTimeout(400); await page.mouse.move(1300, 700); await page.waitForTimeout(400);
  comprobar(await page.evaluate(() => document.querySelector('.ventana__vista img').style.getPropertyValue('--px') !== ''), 'en el ordenador, la foto se asoma con el ratón');
  comprobar(await page.evaluate(() => /Abierto|Cerrado/.test(document.querySelector('.hero__estado [data-ahora]').textContent)), 'la portada dice si está abierto ahora');
  await cap(page, '02-portada');
  comprobar(page._errores.length === 0, 'sin errores', page._errores);
  await ctx.close();
}
{
  // toque real (CDP) en el móvil: de lado cambia la vista, de arriba abajo hace scroll
  const { ctx, page } = await nueva(MOVIL, { script: sinCookies });
  await page.goto(BASE);
  await esperarCortina(page, 1400);
  const cdp = await ctx.newCDPSession(page);
  const toque = (t, x, y) => cdp.send('Input.dispatchTouchEvent', { type: t, touchPoints: t === 'touchEnd' ? [] : [{ x, y }] });
  const r = await page.evaluate(() => { const b = document.querySelector('.ventana__marco').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await toque('touchStart', r.x + r.w * 0.85, r.y + r.h * 0.4);
  for (let k = 1; k <= 10; k++) { await toque('touchMove', r.x + r.w * (0.85 - k * 0.07), r.y + r.h * 0.4); await page.waitForTimeout(16); }
  await toque('touchEnd', 0, 0);
  await page.waitForTimeout(500);
  comprobar(await page.evaluate(() => window.__ma.ventana.i) === 1, 'móvil: el dedo de lado cambia la vista');
  const y0 = await page.evaluate(() => scrollY);
  await toque('touchStart', r.x + r.w * 0.5, r.y + r.h * 0.8);
  for (let k = 1; k <= 10; k++) { await toque('touchMove', r.x + r.w * 0.5, r.y + r.h * 0.8 - k * 25); await page.waitForTimeout(16); }
  await toque('touchEnd', 0, 0);
  await page.waitForTimeout(700);
  comprobar(await page.evaluate(() => scrollY) > y0 + 40 && await page.evaluate(() => window.__ma.ventana.i) === 1, 'móvil: el dedo de arriba abajo hace scroll y no cambia la vista');
  comprobar(page._errores.length === 0, 'sin errores', page._errores);
  await ctx.close();
}

/* ================= 3. capas, equipo, plano y casos ================= */
console.log('\n3. Capas, equipo, plano y casos');
{
  const { ctx, page } = await nueva({}, { script: sinCookies });
  await page.goto(BASE);
  await esperarCortina(page);
  await bajarA(page, '#tratamientos', 0);
  const estado = () => page.evaluate(() => ({ on: Array.from(document.querySelectorAll('.capa-panel')).filter((p) => getComputedStyle(p).display !== 'none').map((p) => p.dataset.k), sel: document.querySelector('[role="tab"][aria-selected="true"]').dataset.k, capa: Array.from(document.querySelectorAll('.diente .capa.activa')).map((c) => c.dataset.k) }));
  let e = await estado();
  comprobar(e.on.join() === 'esmalte' && e.sel === 'esmalte' && e.capa.join() === 'esmalte', 'empieza en el esmalte: una pestaña, un panel y una capa', e);
  await page.click('#t-hueso');
  e = await estado();
  comprobar(e.on.join() === 'hueso' && e.capa.join() === 'hueso', 'la pestaña «Implantes» enciende el hueso y su panel', e);
  await page.keyboard.press('ArrowRight');
  e = await estado();
  comprobar(e.sel === 'posicion' && e.on.join() === 'posicion' && await page.evaluate(() => document.activeElement.id === 't-posicion'), 'teclado (→) pasa a la siguiente pestaña y la enfoca', e);
  await page.click('.diente .capa[data-k="pulpa"]', { force: true });
  e = await estado();
  comprobar(e.on.join() === 'pulpa', 'tocar la capa del dibujo también la elige', e);
  comprobar(await page.evaluate(() => Array.from(document.querySelectorAll('.capa-panel__quien')).every((p) => p.querySelectorAll('a.quien img').length === p.dataset.quien.split(' ').length)), 'cada tratamiento enseña quién lo hace, con su retrato');
  await cap(page, '03-capas');

  await bajarA(page, '#equipo', 0);
  await page.click('#motivos button:nth-child(3)');
  let q = await page.evaluate(() => ({ enc: Array.from(document.querySelectorAll('.persona.encendida')).map((p) => p.dataset.p), nota: document.getElementById('equipo-nota').textContent, filtra: document.getElementById('equipo-lista').classList.contains('filtra') }));
  comprobar(q.filtra && q.enc.join() === 'ana,jenny' && /implante/.test(q.nota), '«Me falta un diente» enciende a Jenny y a Ana', q);
  await page.click('#motivos button:nth-child(3)');
  q = await page.evaluate(() => ({ enc: document.querySelectorAll('.persona.encendida').length, filtra: document.getElementById('equipo-lista').classList.contains('filtra') }));
  comprobar(!q.filtra && q.enc === 0, 'pulsarlo otra vez vuelve a enseñar a las siete', q);
  comprobar(await page.evaluate(() => document.querySelectorAll('.persona').length === 7), 'las siete del equipo');
  await cap(page, '03-equipo');

  await bajarA(page, '#clinica', 0);
  const salas = { gabinete: 'portada-gabinete', gabinete2: 'gabinete2', rayos: 'rayos', esteril: 'material', aseo: 'fachada', recepcion: 'portada-recepcion', sala: 'portada-sala', raton: 'raton-rincon' };
  const malos = [];
  for (const [k, f] of Object.entries(salas)) {
    await page.click(`.sala[data-k="${k}"]`);
    await page.waitForTimeout(420);
    const r = await page.evaluate(() => ({ src: document.querySelector('.plano__foto img').getAttribute('src'), n: document.getElementById('plano-nombre').textContent, act: document.querySelectorAll('.sala.activa').length }));
    if (!r.src.includes('/' + f + '-') || r.act !== 1) malos.push([k, r]);
  }
  comprobar(malos.length === 0, 'cada sala del plano abre SU foto (por nombre, no por posición)', malos);
  await page.focus('.sala[data-k="rayos"]');
  await page.keyboard.press('Enter');
  comprobar(await page.evaluate(() => document.getElementById('plano-nombre').textContent === 'Rayos X'), 'el plano se recorre con el teclado');

  await bajarA(page, '#casos', 0);
  const c = await page.$('.caso__rango');
  await c.evaluate((r) => { r.value = 20; r.dispatchEvent(new Event('input')); });
  comprobar(await page.evaluate(() => document.querySelector('.caso__comp').style.getPropertyValue('--x') === '20%' && /80%/.test(getComputedStyle(document.querySelector('.caso__antes')).clipPath)), 'el deslizador de antes y después recorta la foto');
  comprobar(page._errores.length === 0, 'sin errores', page._errores);
  await ctx.close();
}

/* ================= 4. pedir cita (demostración) y horario ================= */
console.log('\n4. Cita y horario');
{
  const { ctx, page } = await nueva({}, { script: sinCookies });
  await page.goto(BASE);
  await esperarCortina(page);
  await bajarA(page, '#cita', 0);
  const vista = () => page.evaluate(() => +document.querySelector('.motor__vista:not([hidden])').dataset.vista);
  comprobar(await vista() === 1 && await page.evaluate(() => document.getElementById('motor-sigue').disabled), 'empieza en el motivo, con «Seguir» desactivado');
  await page.click('.motivo[data-k="limpieza"]');
  comprobar(await vista() === 2 && await page.evaluate(() => document.getElementById('r-quien').textContent === 'Patri'), 'elegir «Revisión y limpieza» pasa al día y dice que atiende Patri');
  const cal = await page.evaluate(() => {
    const bs = Array.from(document.querySelectorAll('#cal button[data-iso]'));
    const finde = bs.filter((b) => { const d = new Date(b.dataset.iso + 'T12:00'); return d.getDay() === 0 || d.getDay() === 6; });
    return { n: bs.length, finde: finde.length, findeLibre: finde.filter((b) => !b.disabled).length, libres: bs.filter((b) => !b.disabled).length };
  });
  comprobar(cal.finde > 0 && cal.findeLibre === 0 && cal.libres > 0, 'sábados y domingos, cerrado; entre semana, días con huecos', cal);
  // diciembre: el 8 (martes) cierran
  for (let k = 0; k < 3 && !(await page.$('#cal button[data-iso="2026-12-08"]')); k++) await page.click('#cal-sig');
  const dic = await page.evaluate(() => { const b = document.querySelector('#cal button[data-iso="2026-12-08"]'); return b ? { dis: b.disabled, et: b.getAttribute('aria-label') } : null; });
  comprobar(!dic || (dic.dis && /cerrado/.test(dic.et)), 'el 8 de diciembre (festivo que anuncian) está cerrado', dic);
  while (!(await page.evaluate(() => document.getElementById('cal-ant').disabled))) await page.click('#cal-ant');
  await page.click('#cal button[data-iso]:not(:disabled)');
  comprobar(await vista() === 3, 'elegir un día pasa a las horas');
  const horas = await page.evaluate(() => {
    const iso = document.querySelector('#cal button.es-elegido')?.dataset.iso;
    const d = new Date(iso + 'T12:00');
    const tr = window.HORARIO.tramos(d), dur = 45;
    const hs = Array.from(document.querySelectorAll('#horas button')).map((b) => { const [h, m] = b.textContent.split(':').map(Number); return h * 60 + m; });
    return { n: hs.length, fuera: hs.filter((m) => !tr.some(([a, z]) => m >= a && m + dur <= z)).map(window.HORARIO.hhmm) };
  });
  comprobar(horas.n > 0 && horas.fuera.length === 0, 'todas las horas caben dentro de su horario (con la duración de la cita)', horas);
  await page.click('#horas button');
  comprobar(await vista() === 4 && await page.evaluate(() => document.getElementById('r-hora').textContent !== '—'), 'elegir una hora pasa a los datos y la apunta en el resumen');
  await page.click('#datos button[type="submit"]');
  comprobar(await page.evaluate(() => /nombre/.test(document.getElementById('datos-error').textContent) && document.activeElement.name === 'nombre'), 'sin datos no se envía: avisa y enfoca el primer campo');
  await page.fill('#datos [name="nombre"]', 'Lucía Prueba');
  await page.fill('#datos [name="tel"]', '600 11 22 33');
  await page.check('#datos [name="miedo"]');
  await page.check('#datos [name="priv"]');
  await page.click('#datos button[type="submit"]');
  const hecho = await page.evaluate(() => ({ v: +document.querySelector('.motor__vista:not([hidden])').dataset.vista, cod: document.getElementById('hecho-codigo').textContent, txt: document.getElementById('hecho-texto').textContent }));
  comprobar(hecho.v === 5 && /^MA-[A-Z0-9]{4}$/.test(hecho.cod) && /Lucía/.test(hecho.txt) && /600 11 22 33/.test(hecho.txt) && /nervios/.test(hecho.txt) && /demostración/.test(hecho.txt), 'confirmación con código, sus datos, el aviso de nervios y «demostración»', hecho);
  await cap(page, '04-cita');
  await page.click('#motor-otra');
  comprobar(await vista() === 1, '«Pedir otra cita» vuelve al principio');
  // horario: el «abierto ahora» con horas fijas
  const est = await page.evaluate(() => {
    const H = window.HORARIO;
    const t = (s) => H.estado(new Date(s)).texto;
    return { lun: t('2026-10-19T10:00'), mar: t('2026-10-20T14:30'), vie: t('2026-10-23T21:00'), dom: t('2026-10-25T12:00'), fest: t('2026-12-07T21:00') };
  });
  comprobar(est.lun === 'Abierto ahora · hasta las 20:30' && est.mar === 'Cerrado ahora · abrimos a las 15:30' && est.vie === 'Cerrado ahora · abrimos el lunes a las 9:00' && est.dom === 'Cerrado ahora · abrimos mañana a las 9:00' && est.fest === 'Cerrado ahora · abrimos el miércoles a las 9:00', '«Abierto ahora»: lunes, mediodía del martes, viernes noche, domingo y víspera del 8 de diciembre', est);
  await bajarA(page, '#llegar', 0);
  const filas = await page.evaluate(() => ({ vis: Array.from(document.querySelectorAll('.horario tr')).filter((tr) => tr.getBoundingClientRect().height > 0).length, hoy: document.querySelectorAll('.horario tr.es-hoy').length }));
  comprobar(filas.vis === 6 && filas.hoy === 1, 'horario: las seis filas a la vista y una marcada como hoy', filas);
  comprobar(page._errores.length === 0, 'sin errores', page._errores);
  await ctx.close();
}

/* ================= 5. cabecera, cookies y pie ================= */
console.log('\n5. Cabecera, cookies y pie');
{
  const { ctx, page } = await nueva();
  await page.goto(BASE);
  await esperarCortina(page);
  comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display === 'flex'), 'cookies: se ven en la primera visita');
  await page.click('#ck-si');
  comprobar(await page.evaluate((k) => getComputedStyle(document.getElementById('cookies')).display === 'none' && localStorage.getItem(k) === 'si', LLAVE), 'cookies: «Entendido» las cierra y lo recuerda');
  await page.reload(); await esperarCortina(page);
  comprobar(await page.evaluate(() => document.getElementById('cookies').hidden), 'cookies: al recargar no vuelven');
  await page.evaluate((k) => localStorage.removeItem(k), LLAVE);
  await page.reload(); await esperarCortina(page);
  comprobar(await page.evaluate(() => !document.getElementById('cookies').hidden), 'cookies: borrando la marca vuelven a salir');
  await page.click('#ck-no');
  await bajarA(page, '#equipo', -200);
  const est = await page.evaluate(() => ({ p: +getComputedStyle(document.querySelector('.cab__lectura')).getPropertyValue('--p'), sc: document.getElementById('cab').classList.contains('sc'), fondo: getComputedStyle(document.getElementById('cab')).backdropFilter }));
  comprobar(est.p > 0.05 && est.sc && /blur/.test(est.fondo), 'al bajar, la cabecera se vuelve opaca con desenfoque y el diente se llena', est);
  await bajarA(page, '#casos', 0);
  comprobar(await page.evaluate(() => document.querySelector('.dos__foto').classList.contains('abre') || !document.documentElement.classList.contains('con-movimiento')), 'las fotos se preparan para abrirse desde el diente');
  await bajarTodo(page);
  comprobar(await page.evaluate(() => document.getElementById('pie').classList.contains('es-completo') && +getComputedStyle(document.querySelector('.cab__lectura')).getPropertyValue('--p') > 0.97), 'al llegar al pie, el diente se completa y el de la cabecera está lleno');
  comprobar(await page.evaluate(() => Array.from(document.querySelectorAll('.pie__diente .pieza')).every((p) => getComputedStyle(p).opacity === '1')), 'las tres piezas del símbolo, en su sitio');
  comprobar(await page.evaluate(() => { const b = document.querySelector('.pie .btn--blanco'); const c = getComputedStyle(b); return c.color !== c.backgroundColor; }), 'el botón del pie se lee (texto de otro color que el fondo)');
  comprobar(await page.evaluate(() => Array.from(document.querySelectorAll('.dos__foto, .plano__foto')).every((f) => f.classList.contains('abierta'))), 'todas las fotos que se abren desde el diente acaban abiertas');
  await page.click('#abrir-cookies');
  comprobar(await page.evaluate(() => !document.getElementById('cookies').hidden), '«Preferencias de cookies» vuelve a abrir el aviso');
  await page.click('#ck-si');
  await page.click('#mapa-btn');
  comprobar(await page.evaluate(() => !!document.querySelector('#mapa iframe') && !document.getElementById('mapa-consent')), 'el mapa de Google solo se carga al pedirlo');
  await cap(page, '05-pie');
  comprobar(page._errores.length === 0, 'sin errores', page._errores);
  await ctx.close();
}

/* ================= 6. móvil ================= */
console.log('\n6. Móvil');
for (const [w, h] of [[360, 640], [375, 667], [390, 844], [768, 1024]]) {
  const { ctx, page } = await nueva({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, { script: sinCookies });
  await page.goto(BASE);
  await esperarCortina(page, 1200);
  const g = await page.evaluate(() => {
    const t = document.querySelector('.hero__txt').getBoundingClientRect();
    const v = document.querySelector('.ventana__marco').getBoundingClientRect();
    const cab = document.getElementById('cab').getBoundingClientRect();
    return { ancho: document.documentElement.scrollWidth, vw: innerWidth, solapa: !(v.bottom <= t.top + 1 || t.bottom <= v.top + 1), bajoCab: v.top >= cab.bottom - 30, h1: document.querySelector('.hero h1').getBoundingClientRect().top < innerHeight };
  });
  comprobar(g.ancho <= g.vw, `${w}×${h}: sin scroll horizontal`, g);
  comprobar(!g.solapa && g.bajoCab && g.h1, `${w}×${h}: la ventana y el texto no se pisan, quedan bajo la cabecera y el titular asoma en la primera pantalla`, g);
  if (w === 390) {
    await bajarA(page, '#tratamientos', -200);
    await page.waitForTimeout(700);
    comprobar(await page.evaluate(() => document.getElementById('barra').classList.contains('es-visible')), 'la barra fija del móvil sale al dejar la portada');
    await page.click('#menu-btn');
    await page.waitForTimeout(500);
    const mm = await page.evaluate(() => { const r = document.getElementById('menu-movil').getBoundingClientRect(); return { h: r.height, vh: innerHeight, vis: getComputedStyle(document.getElementById('menu-movil')).visibility }; });
    comprobar(mm.vis === 'visible' && Math.abs(mm.h - mm.vh) < 2, 'el menú móvil abre a pantalla completa con la cabecera ya fija', mm);
    await page.click('#menu-movil a[href="#clinica"]');
    await page.waitForTimeout(1800);
    comprobar(await page.evaluate(() => !document.body.classList.contains('menu') && Math.abs(document.getElementById('clinica').getBoundingClientRect().top - 80) < 70), 'un enlace del menú cierra el menú y lleva a su sección');
    await page.tap('.plano__chips button[data-k="rayos"]');
    await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => document.getElementById('plano-nombre').textContent === 'Rayos X' && document.querySelector('.plano__foto img').getAttribute('src').includes('/rayos-')), 'móvil: los botones del plano abren su sala');
    await bajarA(page, '#motor', 80);
    comprobar(await page.evaluate(() => !document.getElementById('barra').classList.contains('es-visible')), 'la barra se aparta sobre la cita');
    await cap(page, '06-cita-390');
  }
  comprobar(page._errores.length === 0, `${w}×${h}: sin errores`, page._errores);
  await ctx.close();
}
{
  // la barra del navegador del móvil sube y baja: nada se rehace ni salta
  const { ctx, page } = await nueva(MOVIL, { script: () => { try { localStorage.setItem('ma-cookies', 'si'); } catch (e) {} window.__refrescos = 0; addEventListener('DOMContentLoaded', () => { const t = setInterval(() => { if (window.ScrollTrigger) { ScrollTrigger.addEventListener('refresh', () => window.__refrescos++); clearInterval(t); } }, 20); }); } });
  await page.goto(BASE);
  await esperarCortina(page, 1500);
  await bajarA(page, '#clinica', 0);
  const n0 = await page.evaluate(() => window.__refrescos);
  const top0 = await page.evaluate(() => document.getElementById('casos').getBoundingClientRect().top + scrollY);
  for (let i = 0; i < 6; i++) { await page.setViewportSize({ width: 390, height: i % 2 ? 844 : 788 }); await page.waitForTimeout(260); }
  await page.waitForTimeout(500);
  const n1 = await page.evaluate(() => window.__refrescos);
  const top1 = await page.evaluate(() => document.getElementById('casos').getBoundingClientRect().top + scrollY);
  comprobar(n1 === n0, 'barra del móvil: 0 refresh de ScrollTrigger en 6 cambios', [n0, n1]);
  comprobar(Math.abs(top1 - top0) < 1, 'barra del móvil: nada se mueve de sitio', [top0, top1]);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(700);
  comprobar(await page.evaluate(() => window.__refrescos) > n1, 'al girar el móvil sí se rehace');
  await ctx.close();
}

/* ================= 7. densidades, foco, fotos y contraste ================= */
console.log('\n7. Densidades, foco, fotos y contraste');
{
  const { ctx, page } = await nueva({}, { script: sinCookies });
  await page.goto(BASE);
  await esperarCortina(page);
  comprobar(await page.evaluate(() => document.getElementById('mando').hidden && getComputedStyle(document.getElementById('mando')).display === 'none'), 'sin ?revision el mando no se ve');
  await page.goto(BASE + '?revision');
  await esperarCortina(page);
  comprobar(await page.evaluate(() => !document.getElementById('mando').hidden), 'con ?revision el mando se ve');
  await page.click('#mando [data-densidad="sobria"]');
  const s = await page.evaluate(() => ({ cls: document.documentElement.classList.contains('densidad-sobria'), url: location.search, tabla: getComputedStyle(document.getElementById('vistazo')).display, eco: getComputedStyle(document.querySelector('.ventana__eco')).display }));
  comprobar(s.cls && /densidad=sobria/.test(s.url) && s.tabla === 'grid' && s.eco === 'none', 'la sobria: sin eco verde y además la tabla de tratamientos', s);
  await page.click('#mando [data-densidad="cargada"]');
  comprobar(await page.evaluate(() => !document.documentElement.classList.contains('densidad-sobria') && getComputedStyle(document.getElementById('vistazo')).display === 'none' && getComputedStyle(document.querySelector('.ventana__eco')).display !== 'none'), '«Diente» vuelve al eco verde y quita la tabla');
  // foco con la corona del diente
  await page.goto(BASE);
  await esperarCortina(page);
  await page.focus('.hero__acc .btn');
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  const foco = await page.evaluate(() => { const e = document.activeElement; const c = getComputedStyle(e), a = getComputedStyle(e, '::before'); return { tag: e.tagName, o: c.outlineStyle, antes: a.content, mask: a.maskImage || a.webkitMaskImage }; });
  comprobar(foco.o === 'solid' && foco.antes === '""' && /data:image\/svg/.test(foco.mask), 'el foco del teclado lleva encima la corona del diente', foco);
  // fotos: ninguna pintada por encima de su ancho original
  await bajarTodo(page);
  const fotos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'img/fotos/fotos.json'), 'utf8'));
  const orig = Object.fromEntries(fotos.map((f) => [f.nombre, f.ancho_origen]));
  const grandes = await page.evaluate((orig) => Array.from(document.querySelectorAll('picture[data-foto] img')).map((i) => ({ n: i.parentElement.dataset.foto, w: Math.round(i.getBoundingClientRect().width), vis: i.getBoundingClientRect().width > 0 })).filter((x) => x.vis && x.w > orig[x.n] * 1.05), orig);
  comprobar(grandes.length === 0, 'ninguna foto se pinta más ancha que su original', grandes);
  // contraste (WCAG 2) de las parejas que se usan
  const lum = (h) => { const c = h.match(/\w\w/g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const tok = Object.fromEntries([...css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));
  const parejas = [['tinta', 'porcelana'], ['tinta-2', 'porcelana'], ['tinta-2', 'blanco'], ['tinta-2', 'porcelana-2'], ['tinta-2', 'agua-claro'], ['azul', 'porcelana'], ['azul', 'blanco'], ['azul', 'agua-claro'], ['azul', 'porcelana-2'], ['agua-texto', 'blanco'], ['agua-texto', 'porcelana'], ['agua-texto', 'agua-claro'], ['blanco', 'azul'], ['niebla', 'azul'], ['niebla', 'azul-hondo'], ['agua', 'azul'], ['agua', 'azul-hondo'], ['agua', 'tinta'], ['blanco', 'tinta'], ['aviso', 'blanco']];
  const malas = parejas.map(([a, b]) => [a, b, Math.round(cr(tok[a], tok[b]) * 100) / 100]).filter((p) => !(p[2] >= 4.5));
  comprobar(malas.length === 0, `contraste: las ${parejas.length} parejas de texto pasan 4,5:1`, malas);
  comprobar(page._errores.length === 0, 'sin errores', page._errores);
  await ctx.close();
}
{
  // páginas legales y 404
  const { ctx, page } = await nueva();
  for (const f of ['aviso-legal', 'privacidad', 'cookies', 'accesibilidad', '404']) {
    await page.goto(BASE + f + '.html');
    comprobar(await page.evaluate(() => document.querySelector('h1') && document.body.scrollWidth <= innerWidth), `${f}.html se abre y no desborda`);
  }
  comprobar(page._errores.length === 0, 'legales: sin errores', page._errores);
  await ctx.close();
}

await browser.close();
servidor.close();
console.log(`\n${nOk} bien, ${fallos.length} mal`);
if (fallos.length) { console.log(fallos.map((f) => ' - ' + f).join('\n')); process.exit(1); }
