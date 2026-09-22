// ============================================
// CONFIGURACIÓN DE LA API (TMDB)
// Mi API key gratuita de themoviedb.org.
const TMDB_API_KEY = "7361f0fa6f2a0f52a0109402a381e8f8";

// Ahora en vez de pedir datos de la PELÍCULA, le pido a Karen
// que "identifique a una persona" — esto sí es una función real
// del traje (Karen puede investigar personas que Peter se cruzó).
// Uso el endpoint de búsqueda de personas de TMDB.
const PERSON_QUERY = "Michael Keaton"; // el actor que hace de Vulture, el villano

// Variables donde voy guardando lo que me devuelve la API
let personData = null;
let personImg = null;
let loadingData = false;
let errorMsg = "";

// Estado del panel (antes se llamaba "Mission Briefing",
// ahora es "Personnel File" — identificación de una persona)
let panelOpen = false;

// Mensaje real de Karen al activarse por primera vez.
// Esto es literal de la película (traducido), lo muestro
// unos segundos al arrancar el sketch.
let showIntroMsg = true;
let introMsgTimer = 240; // frames que dura en pantalla (240 = 4 segundos a 60fps)

// Contador de "combinación de telaraña" — dato real:
// el traje tiene 576 combinaciones posibles de webbing.
let webCombo = 1;

let reticlePos;

// ============================================
// EL VILLANO (por ahora solo el movimiento)
// Lo armo como un objeto con su propia posición y
// "semillas" de ruido para que se mueva distinto en X y en Y
let villain = {
  pos: null,
  noiseSeedX: 0,
  noiseSeedY: 1000 // arranco en un número distinto para X e Y,
  // si no, se moverían siempre iguales en ambos ejes
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  reticlePos = createVector(width / 2, height / 2);

  // arranco al villano en una posición random dentro del canvas,
  // dejando un margen de 100px para que no aparezca pegado al borde
  villain.pos = createVector(random(100, width - 100), random(100, height - 100));
}

function draw() {
  background(6, 8, 12);
  drawCityGrid();

  reticlePos.x = lerp(reticlePos.x, mouseX, 0.2);
  reticlePos.y = lerp(reticlePos.y, mouseY, 0.2);

  // el número de combinación va cambiando solo, en loop,
  // entre 1 y 576 (el máximo real de combinaciones del traje)
  webCombo = floor(map(sin(frameCount * 0.03), -1, 1, 1, 576));

  drawReticle();
  drawTopHUD();

  updateVillain();
  drawVillain();

  if (showIntroMsg) {
    drawIntroMessage();
    introMsgTimer--;
    if (introMsgTimer <= 0) showIntroMsg = false;
  }

  if (panelOpen) {
    drawPanel();
  } else {
    drawHint();
  }
}

// Mensaje real de Karen la primera vez que se activa
// (traducido de la línea original de la película)
function drawIntroMessage() {
  noStroke();
  fill(120, 220, 255, 220); // celeste, estilo Stark
  textSize(15);
  textFont('Courier New');
  textAlign(CENTER);
  text('"Felicitaciones por completar el Training Wheels Protocol."', width / 2, height / 2 - 10);
  textSize(12);
  fill(120, 220, 255, 160);
  text("— KAREN", width / 2, height / 2 + 14);
  textAlign(LEFT); // vuelvo a la alineación normal para el resto del sketch
}

// Reticle rediseñado: ahora simula el selector de
// combinaciones de telaraña (576 combos posibles, dato real)
function drawReticle() {
  push();
  translate(reticlePos.x, reticlePos.y);
  rotate(frameCount * 0.008);

  noFill();
  stroke(120, 220, 255); // celeste en vez de rojo
  strokeWeight(1.2);

  circle(0, 0, 60);
  circle(0, 0, 82);

  for (let a = 0; a < 360; a += 45) {
    let ang = radians(a);
    line(cos(ang) * 42, sin(ang) * 42, cos(ang) * 50, sin(ang) * 50);
  }
  pop();

  // el número de combinación se muestra al lado del reticle,
  // fuera del push/pop de rotación (para que el texto no gire)
  noStroke();
  fill(120, 220, 255);
  textSize(10);
  textFont('Courier New');
  text("WEB COMBO " + nf(webCombo, 3, 0) + "/576", reticlePos.x + 46, reticlePos.y);
}

function drawTopHUD() {
  noStroke();
  fill(120, 220, 255); // celeste, no rojo
  textSize(12);
  textFont('Courier New');

  text("KAREN OS v2.1 — TRAINING WHEELS PROTOCOL: UNLOCKED", 20, 30);
  text("SCAN LOCK: " + nf(reticlePos.x, 4, 0) + " , " + nf(reticlePos.y, 4, 0), 20, 48);
}

function drawHint() {
  noStroke();
  fill(255, 255, 255, 150);
  textSize(13);
  text("[ presioná K para Personnel File ]", 20, height - 24);
}

// Panel "Personnel File" — Karen identificando a una persona,
// usando la API. Esto sí tiene sentido dentro del universo:
// es la función real de investigar personas de la que hablan
// las fuentes de la película.
function drawPanel() {
  let panelW = min(360, width * 0.85);
  let panelH = 460;
  let px = width - panelW - 30;
  let py = 70;

  noStroke();
  fill(8, 12, 16, 235);
  rect(px, py, panelW, panelH, 6);

  stroke(120, 220, 255, 150);
  noFill();
  rect(px, py, panelW, panelH, 6);

  noStroke();
  fill(120, 220, 255);
  textSize(13);
  text("PERSONNEL FILE", px + 16, py + 26);

  if (loadingData) {
    fill(255);
    textSize(12);
    text("Escaneando base de datos...", px + 16, py + 55);
    return;
  }

  if (errorMsg) {
    fill(255, 140, 140);
    textSize(11);
    text(errorMsg, px + 16, py + 55, panelW - 32, 100);
    return;
  }

  if (!personData) return;

  if (personImg) {
    let imgW = panelW - 32;
    let imgH = imgW * 1.3;

    image(personImg, px + 16, py + 40, imgW, imgH);

    fill(255);
    textSize(14);
    text(personData.name, px + 16, py + 40 + imgH + 22);

    fill(150, 220, 255);
    textSize(11);
    text("Ocupación: " + personData.known_for_department, px + 16, py + 40 + imgH + 40);

    let bio = personData.biography && personData.biography.length > 140
      ? personData.biography.substring(0, 140) + "..."
      : (personData.biography || "Sin datos biográficos disponibles.");
    fill(200);
    text(bio, px + 16, py + 40 + imgH + 60, panelW - 32, 100);
  }
}

function keyPressed() {
  if (key === 'k' || key === 'K') {
    panelOpen = !panelOpen;

    if (panelOpen && !personData && !loadingData) {
      fetchPersonData();
    }
  }
}

// ============================================
// LLAMADA A LA API DE TMDB (búsqueda de persona)
// ============================================
async function fetchPersonData() {
  loadingData = true;
  errorMsg = "";

  try {
    // Paso 1: busco a la persona por nombre
    let searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(PERSON_QUERY)}&language=es-ES`;
    let res = await fetch(searchUrl);
    if (!res.ok) throw new Error("Error en la búsqueda: " + res.status);

    let searchData = await res.json();
    if (!searchData.results || searchData.results.length === 0) {
      throw new Error("No se encontraron resultados para esa persona.");
    }

    // tomo el primer resultado (el más relevante)
    let person = searchData.results[0];

    // Paso 2: pido el detalle completo de esa persona (incluye biografía)
    let detailUrl = `https://api.themoviedb.org/3/person/${person.id}?api_key=${TMDB_API_KEY}&language=es-ES`;
    let detailRes = await fetch(detailUrl);
    if (!detailRes.ok) throw new Error("Error al traer el detalle: " + detailRes.status);

    personData = await detailRes.json();

    if (personData.profile_path) {
      let imgUrl = "https://image.tmdb.org/t/p/w300" + personData.profile_path;
      personImg = await loadImagePromise(imgUrl);
    }

  } catch (err) {
    errorMsg = "No se pudo conectar con la API: " + err.message;
  } finally {
    loadingData = false;
  }
}

function loadImagePromise(url) {
  return new Promise((resolve, reject) => {
    loadImage(url, img => resolve(img), err => reject(err));
  });
}

function drawCityGrid() {
  stroke(20, 26, 32); // grid también ajustado a tono azulado, no gris neutro
  strokeWeight(1);

  for (let x = 0; x < width; x += 45) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 45) {
    line(0, y, width, y);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ============================================
// LÓGICA DEL VILLANO
// ============================================

// Mueve al villano usando noise() en vez de random().
// La diferencia importante: random() salta de un valor a otro
// sin relación entre sí (se ve tembloroso/errático). noise()
// da valores que cambian GRADUALMENTE, por eso el movimiento
// se ve como una fuga calculada, no un tirón nervioso.
function updateVillain() {
  // noise() siempre devuelve un valor entre 0 y 1.
  // Yo lo "reencuadro" con map() al rango de todo el canvas.
  let nx = noise(villain.noiseSeedX);
  let ny = noise(villain.noiseSeedY);

  villain.pos.x = map(nx, 0, 1, 80, width - 80);
  villain.pos.y = map(ny, 0, 1, 80, height - 80);

  // avanzo la semilla de a poquito cada frame — cuanto más
  // grande el incremento, más rápido/errático se mueve
  villain.noiseSeedX += 0.003;
  villain.noiseSeedY += 0.003;
}

// Dibuja al villano como una silueta simple (no uso ninguna
// imagen real, para no tener problemas de derechos de imagen)
function drawVillain() {
  push();
  translate(villain.pos.x, villain.pos.y);

  noStroke();
  fill(255, 80, 80, 200); // rojo de alerta, para que se distinga del HUD celeste
  ellipse(0, 0, 34, 46); // torso
  ellipse(0, -26, 22, 22); // cabeza

  pop();
}