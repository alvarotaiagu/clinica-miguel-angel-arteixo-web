/* El punto del símbolo más alejado de su borde (y su radio): la cortina hace el zoom final
   por ahí para no caer en un hueco del dibujo. Calcularlo en el navegador del visitante
   costaba una tarea larga de ~300 ms en un móvil lento; se calcula una vez aquí.
   Uso: node scripts/hondo.mjs  (rehacer si cambia img/marca/marca.svg) */
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/');
const { chromium } = require('playwright');
const svg = fs.readFileSync(new URL('../img/marca/marca.svg', import.meta.url), 'utf8');
const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(svg);
const h = await p.evaluate(() => {
  const paths = [...document.querySelectorAll('path')], s = document.querySelector('svg'), pt = s.createSVGPoint();
  const vb = s.getAttribute('viewBox').split(/\s+/).map(Number);
  const dentro = (x, y) => { pt.x = x; pt.y = y; return paths.some((e) => e.isPointInFill(pt)); };
  let mejor = null, rMax = 0;
  for (let x = vb[0]; x < vb[0] + vb[2]; x += 6) for (let y = vb[1]; y < vb[1] + vb[3]; y += 6) {
    if (!dentro(x, y)) continue;
    let r = 0;
    for (let k = 2; k < 400; k += 2) {
      let si = true;
      for (let a = 0; a < 16 && si; a++) si = dentro(x + k * Math.cos(a * Math.PI / 8), y + k * Math.sin(a * Math.PI / 8));
      if (si) r = k; else break;
    }
    if (r > rMax) { rMax = r; mejor = [x, y]; }
  }
  return { x: mejor[0], y: mejor[1], r: rMax };
});
await b.close();
fs.writeFileSync(new URL('../img/marca/hondo.json', import.meta.url), JSON.stringify(h) + '\n');
console.log('img/marca/hondo.json', h);
