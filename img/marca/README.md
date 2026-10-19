# Marca: Miguel Ángel Clínicas Dentales

## Ficheros

| Fichero | Qué es |
|---|---|
| `marca.svg` | Símbolo en vector, `fill="currentColor"`, tres `<path>`: `luna-izq`, `m`, `luna-der` |
| `marca-trazos.svg` | El mismo símbolo preparado para dibujarse (líneas centrales + máscaras) |
| `logo.svg` | Logo horizontal: símbolo + «Miguel Ángel» (Raleway 700) + «Clínicas dentales» (Raleway 400), con el texto en trazados |
| `marca-512.png` / `marca-azul-512.png` | Símbolo a 512 px de alto, blanco o #1A398C sobre transparente |
| `comparacion.png` | Original (gris) y vector (rojo al 50 %) superpuestos, ×8 |
| `comparacion-logo.png` | Lo mismo con el logo entero, ×4 |
| `trazo-0.png`, `trazo-50.png`, `trazo-100.png` | `marca-trazos.svg` con `stroke-dashoffset` 0, 0,5 y 1 |

## Cómo se hizo

- **Fuente:** el perfil de Facebook (720 px), donde el símbolo mide 84×139 px. Los PNG
  `logo-azul.png` y `logo-blanco.png` salen de esa misma imagen (coinciden píxel a píxel),
  así que no añaden información. La tarjeta de visita de Instagram tiene una versión antigua
  del símbolo (luna izquierda fina y sin pico), que no se usó.
- **Tinta:** se proyecta cada píxel sobre el eje azul→blanco, se amplía ×8 y se corta al 50 %.
- **Contornos:** no se usa potrace, porque daba entre 80 y 110 segmentos con las ondas del JPG.
  Se detectan las 9 esquinas reales (3 puntas de las lunas, 2 picos, la V, la muesca, el pie de
  la M y el pico de la luna izquierda) y se afilan cortando las rectas de los dos lados. En las
  puntas, el corte se para donde el JPG baja del 35 % de tinta. Entre esquinas, el contorno se
  suaviza y se ajusta con Bézier (algoritmo de Schneider, error máximo 0,375 px del original).
  Resultado: 4 a 9 Bézier por trazo.
- **La M y la luna derecha** son una sola mancha en el original. Se ajusta ese lazo una vez y
  se parte por la muesca. La M sigue 3 px por debajo de la luna, tapada por ella, para que no
  haya costura. Las dos piezas comparten exactamente el mismo borde.
- **IoU del símbolo contra el raster ampliado ×8: 0,9695.** Las diferencias son las ondas del
  JPG que el vector alisa y las puntas, que el JPG difumina.
- **Logo:** la letra es Raleway variable (Google Fonts), maquetada con HarfBuzz con su
  kerning. Cuerpo, posición, línea base y tracking se ajustaron por IoU contra el PNG:
  - «Miguel Ángel»: peso 700, IoU 0,91.
  - «Clínicas dentales»: peso 400, IoU 0,84. Es una letra fina y cualquier borde pesa mucho.
  - Logo completo: IoU 0,92.
  - Superpuestos, no se ve ninguna desviación.

## Cómo usar `marca-trazos.svg`

Hay que meterlo **en línea** en el HTML: dentro de un `<img>` no se anima. Cada trazo es su
relleno exacto visto a través de una máscara. La máscara es la línea central del trazo
(`.trazo`, `pathLength="1"`), con un grosor que tapa todo el relleno: 340, 258 y 223 unidades,
medidos para que no quede ningún hueco.

```css
.marca-trazos .trazo { stroke-dashoffset: 1; }              /* oculto */
.marca-trazos.dibuja .trazo { animation: trazo .9s cubic-bezier(.65,0,.35,1) forwards; }
.marca-trazos.dibuja #trazo-luna-der { animation-delay: .15s; }
.marca-trazos.dibuja #trazo-m        { animation-delay: .45s; }
@keyframes trazo { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .marca-trazos .trazo { stroke-dashoffset: 0; animation: none; } }
```

Con GSAP: `gsap.fromTo(svg.querySelectorAll('.trazo'), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: .9, ease: 'expo.inOut', stagger: .2})`.

- **Recorridos:**
  - Las lunas van de la raíz (abajo) a la corona.
  - La M va de izquierda a derecha: pico izquierdo, pie, pico derecho y la pata que baja
    hasta la luna derecha. Por el centro de la V el radio de la máscara sería 165 en vez de 100.
- **Arranque:** cada línea empieza por fuera del relleno. Así el remate redondo no deja ningún
  punto suelto a `dashoffset: 1` (lo comprueba `trazo-100.png`).
- **Prueba** (`scripts/prueba-trazos.mjs`, Playwright):
  - A 0 no hay huecos: ningún píxel se aleja más de 0,22 de `marca.svg`, solo por el suavizado
    del borde.
  - A 1 no queda ni un píxel de tinta.
  - A 0,5 se ve un 56 % del relleno.
- Si se pega dos veces en la misma página, hay que renombrar los `id` de la segunda copia.

## Regenerar

Desde `scripts/`, en este orden:

1. `python -I marca.py`
2. `python -I trazos.py`
3. `node prueba-trazos.mjs`
4. `python -I logo.py <Raleway[wght].ttf>`. Necesita `uharfbuzz` y la fuente de
   github.com/google/fonts, `ofl/raleway`.
5. `node render.mjs ../marca.svg ../marca-512.png 512 "#fff"`
