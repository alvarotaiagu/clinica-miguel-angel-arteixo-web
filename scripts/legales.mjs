/* Genera los *.src.html de las páginas legales y el 404 con una plantilla común.
   Uso: node scripts/legales.mjs  (después, node construir.mjs)
   El titular actual y su NIF no se publican en ninguna fuente: van como PENDIENTE visible. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const TITULAR = `<p class="aviso">PENDIENTE: nombre o razón social del titular y NIF/CIF.</p>
<dl>
  <dt>Nombre comercial</dt><dd>Clínica Dental Miguel Ángel</dd>
  <dt>Domicilio</dt><dd>Av. Alcalde Manuel Platas Varela, 70, bajo · Vilarrodís · 15143 Arteixo (A Coruña)</dd>
  <dt>Teléfono</dt><dd><a href="tel:+34981640945">981 64 09 45</a></dd>
  <dt>Correo</dt><dd><a href="mailto:clinicamiguelangelvilarrodis@gmail.com">clinicamiguelangelvilarrodis@gmail.com</a></dd>
  <dt>Registro sanitario</dt><dd>C-15-002286 (Registro de Centros, Servicios y Establecimientos Sanitarios de Galicia)</dd>
</dl>`;

const paginas = {
  'aviso-legal': {
    titulo: 'Aviso legal',
    cuerpo: `
<p>En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), estos son los datos del titular de esta web:</p>
${TITULAR}
<h2>Profesionales sanitarios</h2>
<p class="aviso">PENDIENTE: nombre completo y número de colegiación de cada odontóloga (Colegio Oficial de Odontólogos y Estomatólogos de A Coruña).</p>
<h2>Uso de la web</h2>
<p>Esta web informa sobre la clínica y sus tratamientos. La información es general: no sustituye a una consulta ni a un diagnóstico, que siempre se hacen en persona. Cada boca es distinta y los resultados de los casos que se muestran dependen de cada paciente.</p>
<p>Por ahora, la petición de cita de esta web es una demostración: los huecos son de ejemplo y no se envía ni se guarda nada.</p>
<h2>Propiedad intelectual</h2>
<p>Los textos, el logotipo y las fotografías son del titular o se usan con su permiso. No se pueden reproducir sin autorización.</p>
<p class="aviso">PENDIENTE: confirmar que hay consentimiento escrito de los pacientes de los casos de antes y después.</p>
<p>Los tiempos en coche se han calculado con datos de <a href="https://www.openstreetmap.org/copyright">© colaboradores de OpenStreetMap</a> (licencia ODbL) y el servicio OSRM.</p>
<h2>Responsabilidad</h2>
<p>Las distancias y los tiempos de viaje son aproximados. Los enlaces a otras webs (Google Maps, Instagram, Facebook) llevan a servicios de terceros con sus propias condiciones.</p>
<h2>Ley aplicable</h2>
<p>Estas condiciones se rigen por la ley española. Para cualquier reclamación, escríbenos o llámanos: buscaremos siempre una solución amistosa.</p>`,
  },
  privacidad: {
    titulo: 'Política de privacidad',
    cuerpo: `
<h2>Responsable</h2>
${TITULAR}
<h2>Qué datos tratamos y para qué</h2>
<p>Los que nos das al pedir una cita o hacer una consulta (por teléfono, en la clínica o por correo): nombre, teléfono, el motivo de la consulta y lo que quieras contarnos. Los usamos para darte cita y para atenderte.</p>
<p>Los datos de tu historia clínica son datos de salud: se tratan con la confidencialidad que exige la ley y solo los ven los profesionales que te atienden.</p>
<p>La petición de cita de esta web es, por ahora, una demostración: lo que escribas en ella no sale de tu navegador ni se guarda.</p>
<h2>Base legal y plazos</h2>
<p>La base es tu consentimiento al pedir cita y, si eres paciente, la prestación de la asistencia sanitaria. La historia clínica se conserva el tiempo que exige la Ley 41/2002 de autonomía del paciente (como mínimo, cinco años desde el alta de cada proceso).</p>
<h2>Con quién se comparten</h2>
<p>Con nadie, salvo obligación legal o cuando lo pida tu tratamiento (por ejemplo, el laboratorio que hace una prótesis o el centro que hace un TAC), y siempre con lo imprescindible.</p>
<h2>Tus derechos</h2>
<p>Puedes pedir el acceso, la rectificación, la supresión, la oposición, la limitación o la portabilidad de tus datos en la clínica o en <a href="mailto:clinicamiguelangelvilarrodis@gmail.com">clinicamiguelangelvilarrodis@gmail.com</a>. Si crees que no se han respetado, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">aepd.es</a>).</p>
<h2>Lo que guarda esta web en tu navegador</h2>
<p>Una sola cosa: <code>ma-cookies</code> en el almacenamiento local, para recordar que ya has visto el aviso de cookies. Más detalles en <a href="cookies.html">cookies</a>.</p>`,
  },
  cookies: {
    titulo: 'Política de cookies',
    cuerpo: `
<p>Esta web no usa cookies propias de análisis ni de publicidad.</p>
<h2>Lo que se guarda en tu navegador</h2>
<ul>
  <li><b>ma-cookies</b> (almacenamiento local): recuerda que has visto el aviso, para no enseñártelo en cada visita. Es técnica y no caduca sola; puedes borrarla desde tu navegador.</li>
</ul>
<h2>Servicios de terceros</h2>
<ul>
  <li><b>Google Fonts</b>: las letras de la web se cargan desde los servidores de Google, que reciben tu dirección IP.</li>
  <li><b>Google Maps</b>: el mapa de «Cómo llegar» solo se carga si pulsas «Ver el mapa». A partir de ese momento, Google puede instalar sus cookies.</li>
  <li><b>Librerías</b> (GSAP y Lenis, para las animaciones): se descargan de cdnjs y jsDelivr, que reciben tu dirección IP. No instalan cookies.</li>
</ul>
<p>Puedes volver a ver el aviso desde «Preferencias de cookies», en el pie de la portada.</p>`,
  },
  accesibilidad: {
    titulo: 'Declaración de accesibilidad',
    cuerpo: `
<p>El titular se compromete a que esta web sea accesible conforme al Real Decreto 1112/2018, de 7 de septiembre, y a la norma UNE-EN 301 549 (nivel AA de las WCAG 2.1).</p>
<h2>Situación de cumplimiento</h2>
<p class="aviso">PENDIENTE: completar tras la revisión de accesibilidad previa a la publicación.</p>
<p>La web se ha construido para poder usarse entera con el teclado y con lector de pantalla: contrastes de al menos 4,5:1, foco visible, textos alternativos en las fotos, formularios con etiquetas y animaciones que se desactivan si tu sistema pide reducir el movimiento. Las vistas de la portada se cambian también con las flechas del teclado, las capas del diente son pestañas y el plano de la clínica se recorre con el tabulador.</p>
<h2>La clínica</h2>
<p>La entrada está a pie de calle y el aseo está adaptado para sillas de ruedas.</p>
<h2>Contacto</h2>
<p>Si encuentras una barrera, escribe a <a href="mailto:clinicamiguelangelvilarrodis@gmail.com">clinicamiguelangelvilarrodis@gmail.com</a> o llama al <a href="tel:+34981640945">981 64 09 45</a>. Te responderemos y te daremos la información en un formato accesible.</p>`,
  },
};

const cabeza = (titulo) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${titulo} · Clínica Dental Miguel Ángel</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Gloock&family=Raleway:wght@700&display=swap">
<link rel="stylesheet" href="css/estilos.css">
<link rel="stylesheet" href="css/legal.css">
<link rel="icon" href="marca/favicon.svg" type="image/svg+xml">
<link rel="icon" href="marca/favicon-32.png" sizes="32x32" type="image/png">
</head>`;

for (const [nombre, p] of Object.entries(paginas)) {
  const html = `${cabeza(p.titulo)}
<body>
<header class="legal-cab">
  <div class="env">
    <a href="index.html" aria-label="Clínica Dental Miguel Ángel, a la portada"><img src="marca/logo-blanco.svg" alt="" width="200" height="50"></a>
    <a class="volver" href="index.html">Volver a la portada</a>
  </div>
</header>
<main class="legal">
  <div class="env">
    <h1>${p.titulo}</h1>
${p.cuerpo}
  </div>
</main>
<footer class="legal-pie">
  <div class="env">
    <a href="aviso-legal.html">Aviso legal</a>
    <a href="privacidad.html">Privacidad</a>
    <a href="cookies.html">Cookies</a>
    <a href="accesibilidad.html">Accesibilidad</a>
  </div>
</footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(RAIZ, `${nombre}.src.html`), html);
  console.log(`${nombre}.src.html`);
}

fs.writeFileSync(path.join(RAIZ, '404.src.html'), `${cabeza('Página no encontrada')}
<body class="no-hay">
<style>
  .no-hay { background: var(--azul); color: var(--blanco); min-height: 100svh; display: grid; place-items: center; text-align: center; padding: 24px; --foco: var(--agua); }
  .no { display: grid; gap: 22px; justify-items: center; max-width: 30em; }
  .no img { width: min(30vw, 120px); height: auto; }
  .no h1 { font-family: var(--letra-tit); font-weight: 400; font-size: clamp(2.4rem, 7vw, 3.6rem); line-height: 1; }
  .no p { color: var(--niebla); }
</style>
  <main class="no">
    <img src="marca/marca-blanco.svg" alt="" width="120" height="204">
    <h1>Aquí no hay nada que empastar.</h1>
    <p>La página que buscas no existe o ha cambiado de sitio.</p>
    <a class="btn btn--blanco" href="./">Volver a la portada</a>
  </main>
</body>
</html>
`);
console.log('404.src.html');
