// ============================================
// CONFIGURACIÓN DE LA API (TMDB)
const TMDB_API_KEY = "7361f0fa6f2a0f52a0109402a381e8f8";

// El ID que tiene "Spider-Man: Homecoming" en la base de TMDB
// (lo busqué una vez en su web, es fijo, no cambia)
const HOMECOMING_ID = 315635;

// Variables donde voy a ir guardando lo que me devuelva la API.
// Arrancan "vacías" y se van completando cuando llega la respuesta.
let movieData = null;   // acá va el JSON con título, sinopsis, fecha, etc
let posterImg = null;   // acá va la imagen del póster ya cargada
let loadingData = false; // true mientras estoy esperando la respuesta
let errorMsg = "";       // si algo sale mal, guardo el mensaje acá

// Estado: si el panel de "Mission Briefing" está abierto o cerrado.
// Empieza en false (cerrado) y lo vamos a ir cambiando con la tecla K.
let panelOpen = false;

// Acá guardo la posición del reticle (la mira).
// Uso un p5.Vector porque adentro tiene un x y un y juntos,
// en vez de tener dos variables sueltas (reticleX, reticleY).
let reticlePos;

// setup() corre UNA SOLA VEZ al arrancar el sketch.
// Acá solo creo el canvas del tamaño de toda la ventana del navegador.
function setup() {
  createCanvas(windowWidth, windowHeight);

  // arranco el reticle en el centro de la pantalla
  reticlePos = createVector(width / 2, height / 2);
}

// draw() corre en loop, 60 veces por segundo.
// Todo lo que se dibuja o se actualiza constantemente va acá adentro.
function draw() {
  // background() pinta todo el fondo en cada frame.
  // Si lo saco, todo lo que dibuje después queda "pegado" en pantalla
  // porque nunca se limpia el frame anterior.
  background(8, 8, 12); // gris bien oscuro, casi negro

  // llamo a mi propia función para no tener todo el código
  // amontonado dentro de draw()
  drawCityGrid();

  // lerp() = "linear interpolation". En vez de que el reticle
  // salte directo a la posición del mouse, lo voy acercando de
  // a poco (un 20% de la distancia que falta, cada frame).
  // Eso da ese efecto "suavizado" en vez de un movimiento brusco.
  reticlePos.x = lerp(reticlePos.x, mouseX, 0.2);
  reticlePos.y = lerp(reticlePos.y, mouseY, 0.2);

  drawReticle();
  drawTopHUD();

  // muestro una cosa u otra según el estado de panelOpen
  if (panelOpen) {
    drawPanel();
  } else {
    drawHint();
  }
}

// Dibuja la mira tipo "sistema de apuntado" del traje
function drawReticle() {
  // push()/pop() = guardo y después restauro el "estado" de dibujo
  // (posición, rotación, etc). Así lo que hago acá adentro
  // no afecta a lo que dibuje después, afuera de este bloque.
  push();

  // translate() mueve el "origen" (el punto 0,0) hasta la posición
  // del reticle. Así todo lo que dibuje después queda centrado ahí,
  // sin tener que sumarle reticlePos.x / reticlePos.y a cada forma.
  translate(reticlePos.x, reticlePos.y);

  // roto el reticle un poquito distinto en cada frame,
  // usando frameCount (el contador de frames que p5 lleva solo)
  rotate(frameCount * 0.01);

  noFill();
  stroke(255, 50, 50); // rojo, como el traje
  strokeWeight(1.5);

  circle(0, 0, 60);
  circle(0, 0, 80);

  // 4 marcas cortas alrededor del círculo (arriba, abajo, izq, der)
  for (let a = 0; a < 360; a += 90) {
    let ang = radians(a); // p5 trabaja en radianes, no en grados
    line(cos(ang) * 40, sin(ang) * 40, cos(ang) * 50, sin(ang) * 50);
  }

  pop(); // acá termina el "bloque" que empezó con push()
}

// Texto del HUD arriba a la izquierda, como si fuera
// la interfaz de Karen mostrando datos del sistema
function drawTopHUD() {
  noStroke();       // sin borde en el texto
  fill(255, 50, 50); // color del texto: rojo
  textSize(12);
  textFont('Courier New'); // fuente monoespaciada, look "sistema"

  // text(contenido, x, y) — dibuja el texto en esa posición.
  // Uso nf() (number format) para que las coordenadas del reticle
  // siempre se vean con el mismo ancho de dígitos (ej: "0042" en vez
  // de "42"), así el texto no "tiembla" de ancho en cada frame.
  text("KAREN OS v2.1 — TRAINING WHEELS PROTOCOL: ACTIVE", 20, 30);
  text("TARGET LOCK: " + nf(reticlePos.x, 4, 0) + " , " + nf(reticlePos.y, 4, 0), 20, 48);
}

// Texto de ayuda abajo, solo visible cuando el panel está cerrado
function drawHint() {
  noStroke();
  fill(255, 255, 255, 150); // blanco semi-transparente (el 4to valor es el alpha)
  textSize(13);
  text("[ presioná K para abrir Mission Briefing ]", 20, height - 24);
}

// El panel en sí. Ahora muestra distintas cosas según el estado:
// cargando, error, o los datos ya listos (con póster incluido).
function drawPanel() {
  let panelW = min(360, width * 0.85); // ancho del panel, con tope de 360px
  let panelH = 460;
  let px = width - panelW - 30; // lo pego a la derecha, con 30px de margen
  let py = 70;

  noStroke();
  fill(10, 10, 14, 235); // fondo casi negro, casi opaco
  rect(px, py, panelW, panelH, 6); // el 6 final son los bordes redondeados

  stroke(255, 50, 50, 150);
  noFill();
  rect(px, py, panelW, panelH, 6); // mismo rectángulo, ahora solo el borde

  noStroke();
  fill(255, 50, 50);
  textSize(13);
  text("MISSION BRIEFING", px + 16, py + 26);

  // Caso 1: todavía esperando la respuesta de la API
  if (loadingData) {
    fill(255);
    textSize(12);
    text("Accediendo a los archivos...", px + 16, py + 55);
    return; // corto acá, no sigo dibujando nada más
  }

  // Caso 2: algo salió mal (sin internet, key mal puesta, etc.)
  if (errorMsg) {
    fill(255, 120, 120);
    textSize(11);
    text(errorMsg, px + 16, py + 55, panelW - 32, 100);
    return;
  }

  // Caso 3: todavía no se pidió nada (recién abrió el panel
  // por primera vez, en el frame antes de que llegue la respuesta)
  if (!movieData) return;

  // Caso 4: ya tengo los datos reales, los muestro
  if (posterImg) {
    let imgW = panelW - 32;
    let imgH = imgW * 1.5; // proporción típica de un póster de cine

    // image(imagen, x, y, ancho, alto) — dibuja la imagen cargada
    image(posterImg, px + 16, py + 40, imgW, imgH);

    fill(255);
    textSize(14);
    text(movieData.title, px + 16, py + 40 + imgH + 22);

    fill(200);
    textSize(11);
    text("Estreno: " + movieData.release_date, px + 16, py + 40 + imgH + 40);

    // recorto la sinopsis si es muy larga, para que entre en el panel
    let overview = movieData.overview.length > 140
      ? movieData.overview.substring(0, 140) + "..."
      : movieData.overview;
    text(overview, px + 16, py + 40 + imgH + 60, panelW - 32, 100);
  }
}

// keyPressed() es un evento de p5: se dispara SOLO una vez,
// justo en el momento en que apretás una tecla (no se repite
// mientras la mantenés apretada, a diferencia de keyIsDown()).
function keyPressed() {
  if (key === 'k' || key === 'K') {
    // esto es el truco típico para un "toggle": si estaba
    // en true pasa a false, y si estaba en false pasa a true.
    panelOpen = !panelOpen;

    // Si acabo de abrir el panel Y todavía no pedí los datos
    // (ni los estoy pidiendo ya), recién ahí hago el fetch.
    // Así no golpeo la API cada vez que abro/cierro el panel,
    // solo la primera vez.
    if (panelOpen && !movieData && !loadingData) {
      fetchMovieData();
    }
  }
}
// LLAMADA A LA API DE TMDB
// La marco como "async" porque adentro voy a usar "await",
// que significa "esperá a que esto termine antes de seguir".
// Sin async/await, JS seguiría ejecutando el resto del código
// sin esperar la respuesta de internet, y llegaría vacía.
async function fetchMovieData() {
  loadingData = true;
  errorMsg = "";

  try {
    // armo la URL pidiendo los datos de Homecoming, en español
    let url = `https://api.themoviedb.org/3/movie/${HOMECOMING_ID}?api_key=${TMDB_API_KEY}&language=es-ES`;

    // fetch() hace el pedido a internet. Con "await" espero
    // a que responda antes de seguir con la línea de abajo.
    let res = await fetch(url);

    // si la respuesta no vino bien (ej: error 401, 404, etc.)
    // corto acá y salto directo al catch de abajo
    if (!res.ok) throw new Error("Error en la respuesta de la API: " + res.status);

    // convierto la respuesta (que viene en formato raro) a un
    // objeto de JS que puedo usar normal, con .title, .overview, etc.
    let data = await res.json();
    movieData = data;

    // si la película tiene póster, armo la URL de la imagen
    // y la cargo con loadImage (envuelta en una Promise para
    // poder usar await acá también)
    if (data.poster_path) {
      let posterUrl = "https://image.tmdb.org/t/p/w500" + data.poster_path;
      posterImg = await loadImagePromise(posterUrl);
    }

  } catch (err) {
    // si algo falla en cualquier punto del try (sin internet,
    // key mal puesta, etc.) cae acá y guardo el mensaje de error
    errorMsg = "No se pudo conectar con la API: " + err.message;

  } finally {
    // esto se ejecuta SIEMPRE, haya salido bien o mal
    loadingData = false;
  }
}

// loadImage() de p5 normalmente funciona con callbacks
// (le pasás una función que se ejecuta cuando termina).
// Acá lo "envuelvo" en una Promise para poder usar await
// arriba, y que el código quede más ordenado y legible.
function loadImagePromise(url) {
  return new Promise((resolve, reject) => {
    loadImage(url, img => resolve(img), err => reject(err));
  });
}

// Esta función mía dibuja el grid de fondo, como si fuera
// la ciudad "escaneada" por el HUD del traje.
function drawCityGrid() {
  stroke(30, 30, 40);   // stroke = color de LÍNEAS (fill sería color de relleno)
  strokeWeight(1);      // grosor de la línea

  // width y height son variables que p5 ya trae con el tamaño
  // actual del canvas. Por eso el grid se adapta solo si cambia
  // el tamaño de la ventana, no hace falta tocar nada a mano.

  // líneas verticales: arranco en x=0 y voy saltando de 45 en 45
  // hasta llegar al ancho total del canvas
  for (let x = 0; x < width; x += 45) {
    line(x, 0, x, height);
  }

  // mismo criterio pero para las líneas horizontales
  for (let y = 0; y < height; y += 45) {
    line(0, y, width, y);
  }
}

// windowResized() es un evento de p5: se dispara automáticamente
// cada vez que cambia el tamaño de la ventana del navegador.
// Sin esto, si redimensionás la ventana el canvas queda con el
// tamaño viejo y se ve cortado.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}