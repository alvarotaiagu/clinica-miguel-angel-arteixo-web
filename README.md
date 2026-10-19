# Clínica Dental Miguel Ángel · Vilarrodís · «La M que es un diente»

Web nueva para la Clínica Dental Miguel Ángel (Av. Alcalde Manuel Platas Varela 70, Vilarrodís, Arteixo). No tienen web desde 2022. Propuesta en local, sin publicar, con `noindex` en todas las páginas.

- **Datos y fuentes:** `../clinica-miguel-angel-arteixo-bocetos/DATOS-CLINICA-MIGUEL-ANGEL.md`, `ref/investigacion-web.md` (Wayback, registro de dentistas, Google, OSM, competencia) y `ref/instagram.md` (382 publicaciones con su pie literal). Tablero de direcciones: https://claude.ai/artifact/GBGkH1SoF9oSZRYwJcJgU3
- **Decisión (2026-10-19, «básicamente tu recomendación»):** dirección A «La M que es un diente» con «¿Quién te atiende?» de C, «La clínica por dentro» de B (el plano), la cita con huecos y «Tu primera visita» de D como opcional. Solo castellano. Fotos de su Instagram, **ninguna generada con IA**. Motor de citas de demostración.
- **El equipo, en primer plano.** La web usa el nombre y el logo de la clínica y presenta a las siete profesionales que salen en su Instagram. El titular está pendiente de confirmar (ver `PENDIENTES.md`, fuera del repo).

## Concepto

Su símbolo es una **M que es un diente**: dos medias lunas hacen la silueta y la M va en medio. La web mira a través de él:

1. **Cortina:** azul de su logo. Los tres trazos del símbolo se dibujan (de la raíz a la corona y la M de izquierda a derecha), sube «Miguel Ángel · Clínica dental · Vilarrodís» y el símbolo se convierte en un **agujero** que crece hasta abrir la pantalla. El zoom final entra por el punto más hondo del dibujo (`scripts/hondo.mjs`) para no caer en un hueco.
2. **Portada:** «Cuidamos de tu sonrisa como en casa» (de las reseñas: «me sentí en casa»). La clínica se ve **dentro del símbolo**, con un eco verde agua (sus uniformes). **Gesto propio:** se desliza de lado dentro del diente (dedo o ratón; `touch-action: pan-y` deja hacer scroll) entre el gabinete, la sala de espera y la recepción; en el ordenador la foto se asoma con el ratón. Dato en vivo real: **«Abierto ahora · hasta las 20:30»** según su horario.
3. **El diente, capa a capa:** el diente cortado; cada capa es un tratamiento con el mismo peso (esmalte → estética, dentina → conservadora, pulpa → endodoncia, encía → higiene y periodoncia, hueso → implantes, posición → ortodoncia). Pestañas accesibles, el dibujo también se toca, y cada panel enseña quién lo hace con su retrato.
4. **¿Quién te va a atender?:** las siete (Bea, Patri, Irene, Uxía, Ana, Anabel, Jenny) con la frase que la clínica escribió de cada una en Instagram. «Me duele una muela», «Me falta un diente»… encienden a quien se encarga.
5. **La clínica por dentro:** plano esquemático (no a escala, **inventado**) con 8 salas; cada una abre su foto real. En el móvil, botones debajo. Seis piezas de tecnología.
6. **Casos:** tres antes y después de su Instagram (solo bocas) con deslizador.
7. **Los más pequeños** (el rincón del Ratoncito Pérez, sin fotos de niños) y **medicina estética facial** (solo tercio inferior).
8. **Opcional: Tu primera visita**, cinco pasos.
9. **Opiniones:** 4,9 con 248 reseñas, reparto por estrellas y seis reseñas literales de Google; los nombres del equipo enlazan a su ficha.
10. **Pedir cita (DEMOSTRACIÓN, `js/cita.js`):** motivo → día → hora → datos → confirmación `MA-XXXX`. Huecos de ejemplo sobre su horario real (`js/horario.js`), festivos que anuncian cerrados, «Me duele» abre en el primer hueco, casilla «me pone nervioso». **No envía ni guarda nada** y lo dice.
11. **Cómo llegar:** frente al Froiz, horario con el día de hoy marcado, coche, bus, accesibilidad y minutos en coche (OSRM, sin tráfico). Mapa de Google solo al pedirlo.
12. **Pie:** las tres piezas del símbolo llegan y **se completa el diente**; en la cabecera, el diente se llena según se lee (indicador de lectura). Registro sanitario C-15-002286.

### Nivel §5 bis

| Obligatoria | Cómo se cumple |
|---|---|
| Romper la fórmula | **Fuera:** cursor propio, imanes, marquesinas, pila sticky. **Propias:** cortina con agujero de diente, ventana del símbolo deslizable, el diente por capas, el plano. |
| Gesto táctil del hero | Deslizar de lado dentro del diente (probado con toques reales por CDP; el dedo vertical hace scroll). |
| El objeto se completa en el pie | El diente de la cabecera se llena al leer; en el pie llegan las tres piezas del símbolo. |
| Foco con la forma del motivo | Contorno de 2 px y, encima de botones, pestañas y chips, la **corona** del diente (dos cúspides, `::before` con máscara). |
| Rendimiento medido | Ver abajo. |

**Menú opcional elegido: dato en vivo** («Abierto ahora», de su horario). Solo guarda en el navegador la marca del aviso de cookies.

### Paleta y letras

| Token | Color | De dónde sale |
|---|---|---|
| `--azul` | `#1a398c` | el azul de su logo, **medido** en el PNG; también su fachada |
| `--azul-hondo` | `#10276a` | la carpintería de la fachada; pie |
| `--porcelana` | `#f4f6fa` | fondos claros |
| `--agua` / `--agua-texto` | `#9fe0c9` / `#17694f` | el verde agua de los uniformes (adorno / texto) |
| `--azul-claro` | `#c9d4ee` | «encía»: rellenos suaves |

`verificar.mjs` mide 20 parejas de contraste; todas pasan 4,5:1. **Letras:** `Gloock` (titulares), `Figtree` (texto) y `Raleway` (la de su logo, solo en rótulos pequeños).

## Logo

Vectorizado aparte en `img/marca/` (calcado del PNG de su perfil, sin rediseñar; ver su README): `marca.svg` (tres trazados: `luna-izq`, `m`, `luna-der`), `marca-trazos.svg` (máscaras para dibujarlo) y, si está, `logo.svg`. `node scripts/marca.mjs` saca `marca/` (símbolo en azul, blanco y «encía», logo azul y blanco, favicons) e `img/og.jpg`. **Pedir el vector original.**

## Cómo se trabaja

- **Edita siempre los `*.src.html`.** `node construir.mjs` genera los `.html` (`<img data-foto>` → `<picture>` AVIF/WebP/JPG; `<!--marca:…-->` → el símbolo) y pone `?v=<huella>` a CSS y JS.
- **Legales y 404:** `node scripts/legales.mjs` y después `node construir.mjs`.
- **Fotos:** `scripts/fotos-lista.json` + `node scripts/fotos.mjs` (lee de `../clinica-miguel-angel-arteixo-bocetos/ref/fotos`; nunca amplía; recortes de retratos y casos en la lista).
- **Si cambia el símbolo:** `node scripts/hondo.mjs`, `node scripts/marca.mjs`, `node construir.mjs`.
- **`node verificar.mjs [--capturas]`** (puerto 8792): archivos, noindex, marcadores, ids, fotos prohibidas (pacientes y menores), sin «una reseña» ni reclamos, estética solo tercio inferior, sin nombres sin confirmar; cortina (trazo a medias, agujero que crece sin fondo opaco, sin CDN, CDN lento, sin JS, movimiento reducido); ventana (ratón, teclado, toque real de lado y vertical); capas (pestañas, teclado, dibujo); equipo; plano (cada sala abre **su** foto por nombre); casos; cita completa (fines de semana y 8 de diciembre cerrados, horas dentro del horario, validación, confirmación); «abierto ahora» en cinco momentos; horario con 6 filas y hoy marcado; cookies en 4 pasos; cabecera e indicador; pie; móvil a 360/375/390/768; barra del navegador (0 `refresh`); densidades; foco; fotos no ampliadas; contraste y legales. **148/148** el 2026-10-19.
- **`node scripts/rendimiento.mjs`** (puerto 8793).

### Quitar la sección opcional

Borra el bloque entre `<!-- OPCIONAL «Tu primera visita»` y `<!-- fin OPCIONAL «Tu primera visita» -->`. No hay que tocar nada más.

## Mando de densidades (solo con `?revision`)

- **«Diente»:** eco verde detrás de la ventana, corona que se traza sobre cada titular y fotos que se abren desde la silueta del diente.
- **«Sobria»:** sin eco, sin coronas y fotos rectas. **Añade** la tabla «Los tratamientos, de un vistazo».

### Receta de borrado del mando

1. En `index.src.html`: el bloque `<!-- MANDO DE MAQUETA` … `<!-- fin del MANDO DE MAQUETA -->` y, en el script del `<head>`, el `try { … }` de `// MANDO DE MAQUETA`.
2. En `js/main.js`: el bloque `15. MANDO DE MAQUETA` hasta `fin del MANDO DE MAQUETA`.
3. Opcional: `.mando` y `.vistazo` en `css/estilos.css`, y la tabla `#vistazo` del HTML.
4. `node construir.mjs`.

## Rendimiento (2026-10-19)

Pixel 7 emulado, 4G lento (1,6 Mbps, 150 ms), CPU ×4, 3 pasadas: **LCP 1,8–1,9 s** (la foto del gabinete, precargada en AVIF de 800), 18 peticiones, 482 KB, tareas largas de 90–140 ms. Antes de precalcular el punto del zoom había una tarea larga de 300–380 ms.

## Fotos

De su Instagram (hasta 1440 px) y la fachada limpia de 2016 (Wayback, 800 px). **Retratos:** recortes de la felicitación del 1 de mayo de 2026, de 250–300 px (se ven pequeños a propósito; pedir los originales). **Casos:** recortes de sus carruseles de antes y después. **Fuera:** toda foto con cara de paciente y toda foto de menores (lista en `verificar.mjs`).

## Para publicar

`noindex` en todas las páginas mientras no venda. `?v=<huella>` ya lo pone `construir.mjs`; avisar de Ctrl+F5. Fuera del repo: `pruebas/`, `PENDIENTES.md` e `img/marca/scripts/`. Las fotos salen de la carpeta de bocetos, que no se sube.
