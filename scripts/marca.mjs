/* Saca de img/marca/ (símbolo y logo vectorizados) las piezas de marca/ que usa la web:
   - marca-azul.svg, marca-blanco.svg, marca-encia.svg: el símbolo en cada color
   - logo-azul.svg y logo-blanco.svg: el logo completo (si no hay logo.svg vectorizado,
     el PNG recortado de su perfil, envuelto en un SVG)
   - favicon.svg, favicon-32.png, apple-touch-icon.png, icono-512.png
   - img/og.jpg (1200 × 630): la clínica vista a través del símbolo
   Uso: node scripts/marca.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/');
const sharp = require('sharp');

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = path.join(RAIZ, 'img/marca');
const SALIDA = path.join(RAIZ, 'marca');
fs.mkdirSync(SALIDA, { recursive: true });

const AZUL = '#1a398c', ENCIA = '#c9d4ee';
const svg = fs.readFileSync(path.join(ORIGEN, 'marca.svg'), 'utf8');
const vb = /viewBox="([^"]+)"/.exec(svg)[1].split(/\s+/).map(Number);
const ds = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
const simbolo = (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}"><g fill="${color}">${ds.map((d) => `<path d="${d}"/>`).join('')}</g></svg>\n`;
for (const [nombre, color] of [['marca-azul', AZUL], ['marca-blanco', '#fff'], ['marca-encia', ENCIA]]) fs.writeFileSync(path.join(SALIDA, nombre + '.svg'), simbolo(color));

// logo completo
const logoVec = path.join(ORIGEN, 'logo.svg');
if (fs.existsSync(logoVec)) {
  const l = fs.readFileSync(logoVec, 'utf8').replace(/<\?xml[^>]*>\s*/, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const [nombre, color] of [['logo-azul', AZUL], ['logo-blanco', '#fff']]) {
    fs.writeFileSync(path.join(SALIDA, nombre + '.svg'), l.replace(/currentColor/g, color).replace(/\s(role|aria-label)="[^"]*"/g, ''));
  }
  console.log('logo: vectorizado');
} else {
  const REF = path.join(RAIZ, '../clinica-miguel-angel-arteixo-bocetos/ref/logo');
  for (const [nombre, png] of [['logo-azul', 'logo-azul.png'], ['logo-blanco', 'logo-blanco.png']]) {
    const buf = await sharp(path.join(REF, png)).trim().png().toBuffer();
    const m = await sharp(buf).metadata();
    fs.writeFileSync(path.join(SALIDA, nombre + '.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.width} ${m.height}"><image width="${m.width}" height="${m.height}" href="data:image/png;base64,${buf.toString('base64')}"/></svg>\n`);
  }
  console.log('logo: PNG envuelto (falta logo.svg)');
}

// favicon: el símbolo blanco sobre azul, en un cuadrado redondeado
const lado = 512, alto = 360, ancho = alto * vb[2] / vb[3];
const icono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}"><rect width="${lado}" height="${lado}" rx="112" fill="${AZUL}"/><g transform="translate(${(lado - ancho) / 2} ${(lado - alto) / 2}) scale(${alto / vb[3]}) translate(${-vb[0]} ${-vb[1]})" fill="#fff">${ds.map((d) => `<path d="${d}"/>`).join('')}</g></svg>\n`;
fs.writeFileSync(path.join(SALIDA, 'favicon.svg'), icono);
for (const [nombre, t] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icono-512.png', 512]]) await sharp(Buffer.from(icono)).resize(t, t).png().toFile(path.join(SALIDA, nombre));

// og.jpg: azul, el logo blanco a la izquierda y el gabinete visto a través del símbolo
const foto = path.join(RAIZ, 'img/fotos/portada-gabinete-800.jpg');
const hS = 560, wS = Math.round(hS * vb[2] / vb[3]);
const mascara = await sharp(Buffer.from(simbolo('#fff'))).resize(wS, hS).png().toBuffer();
const ventana = await sharp(foto).resize(wS, hS, { fit: 'cover', position: 'centre' }).composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
const eco = await sharp(Buffer.from(simbolo('#9fe0c9'))).resize(wS, hS).png().toBuffer();
const logo = await sharp(Buffer.from(fs.readFileSync(path.join(SALIDA, 'logo-blanco.svg')))).resize({ width: 520 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: AZUL } })
  .composite([{ input: logo, left: 80, top: 250 }, { input: eco, left: 1200 - wS - 100 + 14, top: 35 + 10 }, { input: ventana, left: 1200 - wS - 100, top: 35 }])
  .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(RAIZ, 'img/og.jpg'));
console.log('marca/ e img/og.jpg listos');
