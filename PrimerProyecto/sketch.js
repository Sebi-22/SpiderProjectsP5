// CONFIGURACIÓN DE LA API (TMDB)
// Mi API key gratuita de themoviedb.org.
const tmdb_api_key = "7361f0fa6f2a0f52a0109402a381e8f8";

// Ahora en vez de pedir datos de la PELÍCULA, le pido a Karen
// que "identifique a una persona" — esto sí es una función real
// del traje (Karen puede investigar personas que Peter se cruzó).
// Uso el endpoint de búsqueda de personas de TMDB.
const Villians = ["Michael Keaton", "Jamie Foxx", "Alfred Molina", "Willem Dafoe","Bokeem Woodbine"];

let villainIndex = 0;
// Variables donde voy guardando lo que me devuelve la API
let personData = null;
let personImg = null;
let loadingData = false;
let errorMsg = "";

// Estado del panel (antes se llamaba "Mission Briefing",
// ahora es "Personnel File" — identificación de una persona)
let panelOpen = false;

// ESTADO DEL JUEGO 
// El sketch ahora tiene 3 "pantallas":
//   "start"    -> pantalla de inicio, espera que aprietes ESPACIO
//   "playing"  -> el mini juego en sí
//   "complete" -> pantalla final con el mensaje de Karen
let gameState = "start";

// Un casillero por villano: true si ya lo atrapaste.
// El protocolo se completa cuando TODOS están en true.
//fill es una función de JS que permite inicializar un array con un valor fijo.
let capturedList = new Array(Villians.length).fill(false);

// Cuando atrapás al último villano no salto directo a la pantalla
// final: espero unos frames para que alcances a ver la red sobre él.
// 0 = no hay cuenta regresiva en curso.
let completeTimer = 0;
const complete_delay = 90; // 90 frames = 1.5 segundos a 60fps

// Contador de "combinación de telaraña" — dato real:
let webCombo = 1;

// ============================================
// MUNICIÓN DE TELARAÑA (WEB FLUID)
// ============================================
// Dato real de Homecoming: Peter usa cartuchos de fluido de
// telaraña que se le pueden terminar. Acá simulamos lo mismo:
// munición limitada + una tecla para recargar.
let webAmmo = 8;
const max_ammo = 8;
let reloading = false;
let reloadTimer = 0;
const reload_time = 90; // frames que tarda la recarga (1.5 seg a 60fps)

let reticlePos;

// EL VILLANO
let villain = {
  pos: null,
  noiseSeedX: 0,
  noiseSeedY: 1000
};

// ============================================
// DISPARO DE TELARAÑA
// ============================================
let webShot = {
  active: false,
  start: null,
  target: null,
  tip: null,
  t: 0
};

let villainCaptured = false;
//hit radius es el radio de "acierto" para que la telaraña atrape al villano.
const hit_radius = 45;

function setup() {
  createCanvas(windowWidth, windowHeight);
  reticlePos = createVector(width / 2, height / 2);
  villain.pos = createVector(random(100, width - 100), random(100, height - 100));
}

function draw() {
  background(6, 8, 12);
  drawCityGrid();
  //lerp es una función de p5.js que permite interpolar suavemente entre dos valores.
  reticlePos.x = lerp(reticlePos.x, mouseX, 0.2);
  reticlePos.y = lerp(reticlePos.y, mouseY, 0.2);

  webCombo = floor(map(sin(frameCount * 0.03), -1, 1, 1, 576));

  // ---- PANTALLA DE INICIO ----
  if (gameState === "start") {
    drawReticle();
    drawStartScreen();
    return;
  }

  // ---- PANTALLA FINAL ----
  if (gameState === "complete") {
    drawReticle();
    drawTopHUD();
    drawCompleteScreen();
    return;
  }

  // ---- JUEGO ----
  drawReticle();
  drawTopHUD();

  updateVillain();
  drawVillain();
  drawTrackerBox();

  if (villainCaptured) {
    drawCaptureWeb();
  }

  updateWebShot();
  drawWebShot();

  if (reloading) {
    reloadTimer--;
    if (reloadTimer <= 0) {
      webAmmo = max_ammo;
      reloading = false;
    }
  }

  if (completeTimer > 0) {
    completeTimer--;
    if (completeTimer === 0) {
      gameState = "complete";
    }
  }

  if (panelOpen) {
    drawPanel();
  } else {
    drawHint();
  }
}

// ============================================
// PANTALLA DE INICIO
// ============================================
function drawStartScreen() {
  noStroke();
  textFont('Courier New');
  textAlign(CENTER);

  fill(120, 220, 255);
  textSize(24);
  text("KAREN OS v2.1", width / 2, height / 2 - 60);

  textSize(13);
  fill(120, 220, 255, 180);
  text("TRAINING WHEELS PROTOCOL", width / 2, height / 2 - 34);

  fill(255, 255, 255, 170);
  textSize(12);
  text("Atrapá a los " + Villians.length + " villanos para completar el protocolo", width / 2, height / 2 + 10);
  text("ESPACIO: disparar  |  R: recargar  |  K: Personnel File  |  N: siguiente villano", width / 2, height / 2 + 30);

  if (floor(frameCount / 30) % 2 === 0) {
    fill(120, 220, 255);
    textSize(15);
    text("[ presioná ESPACIO para comenzar ]", width / 2, height / 2 + 75);
  }

  textAlign(LEFT);
}

// ============================================
// PANTALLA FINAL
// ============================================
function drawCompleteScreen() {
  noStroke();
  fill(6, 8, 12, 200);
  rect(0, 0, width, height);

  textFont('Courier New');
  textAlign(CENTER);

  fill(120, 220, 255, 220);
  textSize(15);
  text('"Felicitaciones por completar el Training Wheels Protocol."', width / 2, height / 2 - 10);

  textSize(12);
  fill(120, 220, 255, 160);
  text("— KAREN", width / 2, height / 2 + 14);

  if (floor(frameCount / 30) % 2 === 0) {
    fill(255, 255, 255, 170);
    textSize(13);
    text("[ presioná ESPACIO para jugar de nuevo ]", width / 2, height / 2 + 70);
  }

  textAlign(LEFT);
}

// Reticle rediseñado
function drawReticle() {
  push();
  translate(reticlePos.x, reticlePos.y);
  rotate(frameCount * 0.008);

  noFill();
  stroke(120, 220, 255);
  strokeWeight(1.2);

  circle(0, 0, 60);
  circle(0, 0, 82);

  for (let a = 0; a < 360; a += 45) {
    let ang = radians(a);
    line(cos(ang) * 42, sin(ang) * 42, cos(ang) * 50, sin(ang) * 50);
  }
  pop();

  noStroke();
  textSize(10);
  textFont('Courier New');

  if (reloading) {
    fill(255, 200, 90);
    text("RECARGANDO...", reticlePos.x + 46, reticlePos.y);
  } else {
    fill(webAmmo <= 2 ? color(255, 90, 90) : color(120, 220, 255));
    text("WEB FLUID: " + webAmmo + "/" + max_ammo, reticlePos.x + 46, reticlePos.y);
  }
}

function drawTopHUD() {
  noStroke();
  fill(120, 220, 255);
  textSize(12);
  textFont('Courier New');

  let protocolState = (gameState === "complete") ? "UNLOCKED" : "IN PROGRESS";
  text("KAREN OS v2.1 — TRAINING WHEELS PROTOCOL: " + protocolState, 20, 30);
  text("SCAN LOCK: " + nf(reticlePos.x, 4, 0) + " , " + nf(reticlePos.y, 4, 0), 20, 48);

  if (villainCaptured) {
    fill(255, 90, 90);
    text("STATUS: TARGET AMBUSHED", 20, 66);
  } else {
    fill(120, 220, 255);
    text("STATUS: PRÓFUGO — EN FUGA", 20, 66);
  }

  let capturedCount = capturedList.filter(c => c).length;
  fill(120, 220, 255);
  text("TARGETS NEUTRALIZED: " + capturedCount + "/" + Villians.length, 20, 84);
}

function drawHint() {
  noStroke();
  fill(255, 255, 255, 150);
  textSize(13);
  text("[ ESPACIO: disparar  |  R: recargar  |  K: Personnel File  |  N: siguiente villano ]", 20, height - 24);
}

// Panel "Personnel File"
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
  if (key === ' ') {
    if (gameState === "start") {
      gameState = "playing";
      return false;
    }
    if (gameState === "complete") {
      resetGame();
      return false;
    }
  }

  if (gameState !== "playing") return;

  if (key === 'k' || key === 'K') {
    panelOpen = !panelOpen;
    if (panelOpen && !personData && !loadingData) {
      fetchPersonData();
    }
  }

  // Barra espaciadora: dispara la telaraña, solo si no hay
  // disparo en curso, hay munición, y no estás recargando
  if (key === ' ' && !webShot.active && webAmmo > 0 && !reloading) {
    webAmmo--;
    webShot.active = true;
    webShot.t = 0;
    webShot.start = createVector(reticlePos.x, reticlePos.y);
    webShot.target = createVector(villain.pos.x, villain.pos.y);
    //copy es una función de p5.js que permite duplicar un vector.
    webShot.tip = webShot.start.copy();
  }

  if ((key === 'r' || key === 'R') && !reloading && webAmmo < max_ammo) {
    reloading = true;
    reloadTimer = reload_time;
  }

  if ((key === 'n' || key === 'N') && completeTimer === 0) {
    nextVillain();
  }

  if (key === ' ') return false;
}

function nextVillain() {
  villainIndex = (villainIndex + 1) % Villians.length;

  villainCaptured = false;
  webShot.active = false;
  webShot.tip = null;
  villain.pos = createVector(random(100, width - 100), random(100, height - 100));

  personData = null;
  personImg = null;

  if (panelOpen) {
    fetchPersonData();
  }
}

function resetGame() {
  capturedList = new Array(Villians.length).fill(false);
  completeTimer = 0;
  villainIndex = 0;
  villainCaptured = false;

  webShot.active = false;
  webShot.tip = null;

  // también reseteo la munición al arrancar una partida nueva
  webAmmo = max_ammo;
  reloading = false;
  reloadTimer = 0;

  villain.pos = createVector(random(100, width - 100), random(100, height - 100));

  personData = null;
  personImg = null;
  panelOpen = false;

  gameState = "playing";
}

// ============================================
// LLAMADA A LA API DE TMDB
// ============================================
async function fetchPersonData() {
  loadingData = true;
  errorMsg = "";

  try {
    let searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${tmdb_api_key}&query=${encodeURIComponent(Villians[villainIndex])}&language=es-ES`;
    let res = await fetch(searchUrl);
    if (!res.ok) throw new Error("Error en la búsqueda: " + res.status);

    let searchData = await res.json();
    if (!searchData.results || searchData.results.length === 0) {
      throw new Error("No se encontraron resultados para esa persona.");
    }

    let person = searchData.results[0];

    let detailUrl = `https://api.themoviedb.org/3/person/${person.id}?api_key=${tmdb_api_key}&language=es-ES`;
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
  stroke(20, 26, 32);
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
function updateVillain() {
  if (villainCaptured) return;
   // noise es una función de p5.js que genera un valor pseudoaleatorio suave entre 0 y 1, basado en un "semilla" (seed) que va cambiando con el tiempo.
  let nx = noise(villain.noiseSeedX);
  let ny = noise(villain.noiseSeedY);
   // map es una función de p5.js que permite reescalar un valor de un rango a otro. En este caso, los valores de ruido (0 a 1) se mapean a las coordenadas de la pantalla, con un margen de 80 píxeles desde los bordes.
  villain.pos.x = map(nx, 0, 1, 80, width - 80);
  villain.pos.y = map(ny, 0, 1, 80, height - 80);

  villain.noiseSeedX += 0.003;
  villain.noiseSeedY += 0.003;
}

function drawVillain() {
  push();
  translate(villain.pos.x, villain.pos.y);

  noStroke();
  fill(villainCaptured ? color(255, 40, 40, 220) : color(255, 80, 80, 200));
  ellipse(0, 0, 34, 46);
  ellipse(0, -26, 22, 22);

  pop();
}

function drawCaptureWeb() {
  push();
  translate(villain.pos.x, villain.pos.y);

  stroke(255, 255, 255, 200);
  strokeWeight(1);
  noFill();

  let rayCount = 10;
  for (let i = 0; i < rayCount; i++) {
    let ang = (TWO_PI / rayCount) * i;
    line(0, 0, cos(ang) * 60, sin(ang) * 60);
  }

  for (let r = 20; r <= 55; r += 17) {
    circle(0, 0, r * 2);
  }

  pop();
}

function drawTrackerBox() {
  let boxSize = 70;
  let x = villain.pos.x;
  let y = villain.pos.y;
  let half = boxSize / 2;
  let cornerLen = 14;

  if (villainCaptured) {
    stroke(255, 40, 40);
    strokeWeight(2.5);
  } else {
    stroke(120, 220, 255);
    strokeWeight(1.5);
  }
  noFill();

  drawCorner(x - half, y - half, cornerLen, 1, 1);
  drawCorner(x + half, y - half, cornerLen, -1, 1);
  drawCorner(x - half, y + half, cornerLen, 1, -1);
  drawCorner(x + half, y + half, cornerLen, -1, -1);

  let d = dist(reticlePos.x, reticlePos.y, villain.pos.x, villain.pos.y);

  noStroke();
  fill(villainCaptured ? color(255, 90, 90) : color(150, 220, 255));
  textSize(10);
  textFont('Courier New');

  if (villainCaptured) {
    text("STATUS: AMBUSHED", x + half + 10, y - 6);
  } else {
    text("TARGET " + nf(x, 4, 0) + " , " + nf(y, 4, 0), x + half + 10, y - 6);
    text("RANGE: " + nf(d, 4, 0) + "px", x + half + 10, y + 8);
  }
}

function drawCorner(cx, cy, len, dirX, dirY) {
  line(cx, cy, cx + len * dirX, cy);
  line(cx, cy, cx, cy + len * dirY);
}

// ============================================
// LÓGICA DEL DISPARO DE TELARAÑA
// ============================================
function updateWebShot() {
  if (!webShot.active) return;

  webShot.t += 0.04;

  if (webShot.t >= 1) {
    webShot.t = 1;
    webShot.tip = webShot.target.copy();
    webShot.active = false;
    //dist es una función de p5.js que calcula la distancia entre dos puntos (x1, y1) y (x2, y2).
    let hitDist = dist(webShot.target.x, webShot.target.y, villain.pos.x, villain.pos.y);

    if (hitDist < hit_radius && !villainCaptured) {
      villainCaptured = true;
      capturedList[villainIndex] = true;
      // every es una función de JS que verifica si todos los elementos de un array cumplen con una condición. En este caso, si todos los villanos han sido capturados.
      if (capturedList.every(c => c)) {
        completeTimer = complete_delay;
      }
    }

  } else {
    webShot.tip.x = lerp(webShot.start.x, webShot.target.x, webShot.t);
    webShot.tip.y = lerp(webShot.start.y, webShot.target.y, webShot.t);
  }
}

function drawWebShot() {
  if (!webShot.tip) return;
  if (!webShot.active) return;

  stroke(255);
  strokeWeight(2);
  line(webShot.start.x, webShot.start.y, webShot.tip.x, webShot.tip.y);

  noStroke();
  fill(255);
  circle(webShot.tip.x, webShot.tip.y, 6);
}