// CONFIGURACIÓN DE LA API (TMDB)
// Mi API key gratuita de themoviedb.org.
const tmdb_api_key = "7361f0fa6f2a0f52a0109402a381e8f8";

// Ahora en vez de pedir datos de la PELÍCULA, le pido a Karen
// que "identifique a una persona" — esto sí es una función real
// del traje (Karen puede investigar personas que Peter se cruzó).
// Uso el endpoint de búsqueda de personas de TMDB.
const Villians = ["Michael Keaton", "Jamie Foxx", "Alfred Molina", "Willem Dafoe"];

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
let capturedList = [false, false, false, false];

// Cuando atrapás al último villano no salto directo a la pantalla
// final: espero unos frames para que alcances a ver la red sobre él.
// 0 = no hay cuenta regresiva en curso.
let completeTimer = 0;
const complete_delay = 90; // 90 frames = 1.5 segundos a 60fps

// Contador de "combinación de telaraña" — dato real:
// el traje tiene 576 combinaciones posibles de webbing.
let webCombo = 1;

let reticlePos;

// ============================================
// EL VILLANO
// ============================================
// Lo armo como un objeto con su propia posición y
// "semillas" de ruido para que se mueva distinto en X y en Y
let villain = {
  pos: null,
  noiseSeedX: 0,
  noiseSeedY: 1000 // arranco en un número distinto para X e Y,
                   // si no, se moverían siempre iguales en ambos ejes
};

// ============================================
// DISPARO DE TELARAÑA
// ============================================
// Todo el estado del disparo vive en un solo objeto.
// active = false cuando no hay ningún disparo en curso.
let webShot = {
  active: false,
  start: null,   // desde dónde sale (el reticle, en el momento del disparo)
  target: null,  // hacia dónde apunta (el villano, en el momento del disparo)
  tip: null,     // la posición ACTUAL de la punta del hilo (se va moviendo)
  t: 0           // "progreso" del disparo, de 0 a 1 (0 = recién salió, 1 = llegó)
};

// true cuando el último disparo le dio al villano.
// Lo uso para congelar su movimiento y cambiar el HUD a "modo atrapado".
let villainCaptured = false;

// radio de tolerancia: si el disparo llega a menos de esta
// distancia del villano (en su posición actual, no la de cuando
// disparaste), cuenta como acierto
const hit_radius = 45;

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

  //lerp es una función de p5.js que interpola suavemente entre dos valores. En este caso, hace que el reticlePos se acerque al mouseX y mouseY de manera gradual, creando un efecto de seguimiento suave.
  reticlePos.x = lerp(reticlePos.x, mouseX, 0.2);
  reticlePos.y = lerp(reticlePos.y, mouseY, 0.2);

  // el número de combinación va cambiando solo, en loop,
  // entre 1 y 576 (el máximo real de combinaciones del traje)
  webCombo = floor(map(sin(frameCount * 0.03), -1, 1, 1, 576));

  // ---- PANTALLA DE INICIO ----
  // Solo dibujo el fondo, el reticle y el cartel. El villano
  // no aparece ni se mueve hasta que empieza el juego.
  if (gameState === "start") {
    drawReticle();
    drawStartScreen();
    return; // corto acá: nada de lo de abajo se ejecuta
  }

  // ---- PANTALLA FINAL ----
  if (gameState === "complete") {
    drawReticle();
    drawTopHUD();
    drawCompleteScreen();
    return;
  }

  // ---- JUEGO----
  drawReticle();
  drawTopHUD();

  updateVillain();
  drawVillain();
  drawTrackerBox();

  // solo dibujo la red envolvente si el villano ya está atrapado
  if (villainCaptured) {
    drawCaptureWeb();
  }

  updateWebShot();
  drawWebShot();

  // si atrapé al último villano, corre la cuenta regresiva
  // y cuando llega a 0 paso a la pantalla final
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
// PANTALLA DE INICIO (NUEVO)
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
  text("ESPACIO: disparar telaraña   |   K: Personnel File   |   N: siguiente villano", width / 2, height / 2 + 30);

  // texto parpadeante: cada 30 frames alterna entre visible y oculto
  if (floor(frameCount / 30) % 2 === 0) {
    fill(120, 220, 255);
    textSize(15);
    text("[ presioná ESPACIO para comenzar ]", width / 2, height / 2 + 75);
  }

  textAlign(LEFT); // vuelvo a la alineación normal para el resto del sketch
}

// ============================================
// PANTALLA FINAL
// ============================================
// El mensaje real de Karen (traducido de la película) ahora
// aparece ACÁ, como recompensa al completar el protocolo,
// y no más al arrancar.
function drawCompleteScreen() {
  noStroke();
  fill(6, 8, 12, 200);
  rect(0, 0, width, height);

  textFont('Courier New');
  textAlign(CENTER);

  fill(120, 220, 255, 220); // celeste, estilo Stark
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
    //line es la función de p5.js que dibuja una línea entre dos puntos (x1, y1, x2, y2)
    line(cos(ang) * 42, sin(ang) * 42, cos(ang) * 50, sin(ang) * 50);
    // cos es la función de p5.js que devuelve el coseno de un ángulo (en radianes)
    // sin es la función de p5.js que devuelve el seno de un ángulo (en radianes)
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
  fill(120, 220, 255);
  textSize(12);
  textFont('Courier New');

  // el protocolo figura "IN PROGRESS" mientras jugás y
  // "UNLOCKED" recién cuando lo completás
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

  // progreso: cuántos villanos llevo atrapados
  let capturedCount = capturedList.filter(c => c).length;
  fill(120, 220, 255);
  text("TARGETS NEUTRALIZED: " + capturedCount + "/" + Villians.length, 20, 84);
}

function drawHint() {
  noStroke();
  fill(255, 255, 255, 150);
  textSize(13);
  text("[ ESPACIO: disparar  |  K: Personnel File  |  N: siguiente villano ]", 20, height - 24);
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
      ? personData.biography.substring(0, 140) + "..." //substring es una función de JS que corta un string a la cantidad de caracteres que le indiques
      : (personData.biography || "Sin datos biográficos disponibles.");
    fill(200);
    //con text puedo pasarle un ancho máximo y un alto máximo, y el texto se ajusta automáticamente a ese rectángulo
    text(bio, px + 16, py + 40 + imgH + 60, panelW - 32, 100);
  }
}

function keyPressed() {
  // ---- ESPACIO en las pantallas de inicio y final ----
  // Ojo con el orden: acá el espacio SOLO cambia de pantalla y
  // corta con return. Así el mismo ESPACIO que inicia el juego
  // no dispara también una telaraña en el mismo instante.
  if (key === ' ') {
    if (gameState === "start") {
      gameState = "playing";
      return false; // false evita que el navegador scrollee la página con el espacio
    }
    if (gameState === "complete") {
      resetGame();
      return false;
    }
  }

  // fuera del modo "playing" ninguna otra tecla hace nada
  if (gameState !== "playing") return;

  if (key === 'k' || key === 'K') {
    panelOpen = !panelOpen;

    if (panelOpen && !personData && !loadingData) {
      fetchPersonData();
    }
  }

  // Barra espaciadora: dispara la telaraña, pero solo si
  // no hay ya un disparo en curso (evito que se acumulen varios)
  if (key === ' ' && !webShot.active) {
    webShot.active = true;
    webShot.t = 0;
    webShot.start = createVector(reticlePos.x, reticlePos.y);
    webShot.target = createVector(villain.pos.x, villain.pos.y);
    webShot.tip = webShot.start.copy();// copy es una función de p5.js que clona un vector, para no modificar el original
  }

  // no dejo cambiar de villano mientras corre la cuenta regresiva final
  if ((key === 'n' || key === 'N') && completeTimer === 0) {
    nextVillain();
  }

  if (key === ' ') return false; // evita el scroll de la página
}

function nextVillain() {
  villainIndex = (villainIndex + 1) % Villians.length;

  villainCaptured = false;
  webShot.active = false;
  webShot.tip = null;
  // createVector es una función de p5.js que crea un vector 2D (x, y)
  villain.pos = createVector(random(100, width - 100), random(100, height - 100));

  personData = null;
  personImg = null;

  if (panelOpen) {
    fetchPersonData();
  }
}

// Deja todo como al principio y arranca una partida nueva
// (se usa cuando apretás ESPACIO en la pantalla final)
function resetGame() {
  capturedList = [false, false, false, false];
  completeTimer = 0;
  villainIndex = 0;
  villainCaptured = false;

  webShot.active = false;
  webShot.tip = null;

  villain.pos = createVector(random(100, width - 100), random(100, height - 100));

  personData = null;
  personImg = null;
  panelOpen = false;

  gameState = "playing";
}

// ============================================
// LLAMADA A LA API DE TMDB (búsqueda de persona)
// ============================================
async function fetchPersonData() {
  loadingData = true;
  errorMsg = "";

  try {
    // Paso 1: busco a la persona por nombre
    let searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${tmdb_api_key}&query=${encodeURIComponent(Villians[villainIndex])}&language=es-ES`;
    let res = await fetch(searchUrl);
    if (!res.ok) throw new Error("Error en la búsqueda: " + res.status);

    let searchData = await res.json();
    if (!searchData.results || searchData.results.length === 0) {
      throw new Error("No se encontraron resultados para esa persona.");
    }

    // tomo el primer resultado (el más relevante)
    let person = searchData.results[0];

    // Paso 2: pido el detalle completo de esa persona (incluye biografía)
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

// Mueve al villano usando noise() en vez de random().
// La diferencia importante: random() salta de un valor a otro
// sin relación entre sí (se ve tembloroso/errático). noise()
// da valores que cambian GRADUALMENTE, por eso el movimiento
// se ve como una fuga calculada, no un tirón nervioso.
function updateVillain() {
  // si ya está atrapado, no se mueve más — se "congela" en el lugar
  if (villainCaptured) return;

  // noise() siempre devuelve un valor entre 0 y 1, es una función de "ruido" que genera números pseudoaleatorios pero suaves.
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
  // si está atrapado, lo tiño de un rojo más intenso para
  // reforzar visualmente el cambio de estado
  fill(villainCaptured ? color(255, 40, 40, 220) : color(255, 80, 80, 200));
  ellipse(0, 0, 34, 46); // torso
  ellipse(0, -26, 22, 22); // cabeza

  pop();
}

// Red de telaraña radial envolviendo al villano — líneas que
// salen del centro hacia afuera, más un par de anillos
// concéntricos simulando los hilos "circulares" de una telaraña real.
function drawCaptureWeb() {
  push();
  translate(villain.pos.x, villain.pos.y);

  stroke(255, 255, 255, 200);
  strokeWeight(1);
  noFill();

  // líneas radiales (los "rayos" de la telaraña)
  let rayCount = 10;
  for (let i = 0; i < rayCount; i++) {
    let ang = (TWO_PI / rayCount) * i;
    line(0, 0, cos(ang) * 60, sin(ang) * 60);
  }

  // anillos concéntricos (los "hilos circulares")
  for (let r = 20; r <= 55; r += 17) {
    circle(0, 0, r * 2);
  }

  pop();
}

// CAJA DE MIRA (TRACKER BOX)
// Dibuja el marco angular alrededor del villano, y al lado
// muestra sus coordenadas y la distancia real al reticle.
function drawTrackerBox() {
  let boxSize = 70;
  let x = villain.pos.x;
  let y = villain.pos.y;
  let half = boxSize / 2;
  let cornerLen = 14; // largo de cada "esquina" angular

  // elijo el color según el estado. Antes siempre era rojo; ahora es celeste
  // mientras está prófugo, y rojo brillante solo al atraparlo.
  if (villainCaptured) {
    stroke(255, 40, 40);
    strokeWeight(2.5);
  } else {
    stroke(120, 220, 255);
    strokeWeight(1.5);
  }
  noFill();

  // en vez de un rectángulo completo, dibujo solo las 4 esquinas
  // (2 líneas cortas por esquina) — es el look típico de HUD militar,
  // más "táctico" que un cuadrado cerrado común
  drawCorner(x - half, y - half, cornerLen, 1, 1);   // arriba-izquierda
  drawCorner(x + half, y - half, cornerLen, -1, 1);  // arriba-derecha
  drawCorner(x - half, y + half, cornerLen, 1, -1);  // abajo-izquierda
  drawCorner(x + half, y + half, cornerLen, -1, -1); // abajo-derecha

  // dist() calcula la distancia real en píxeles entre dos puntos.
  // Es básicamente el teorema de Pitágoras, pero p5 ya te lo resuelve.
  let d = dist(reticlePos.x, reticlePos.y, villain.pos.x, villain.pos.y);

  noStroke();
  fill(villainCaptured ? color(255, 90, 90) : color(150, 220, 255));
  textSize(10);
  textFont('Courier New');

  if (villainCaptured) {
    text("STATUS: AMBUSHED", x + half + 10, y - 6);
  } else {
    // nf es una función de p5.js que formatea números a un string con cantidad fija de dígitos y decimales. En este caso, quiero 4 dígitos enteros y 0 decimales.
    text("TARGET " + nf(x, 4, 0) + " , " + nf(y, 4, 0), x + half + 10, y - 6);
    text("RANGE: " + nf(d, 4, 0) + "px", x + half + 10, y + 8);
  }
}

// Función auxiliar: dibuja una sola "esquina" angular (2 líneas
// en forma de L). dirX y dirY (1 o -1) me dicen hacia dónde
// apuntan esas líneas según en qué esquina estoy dibujando.
function drawCorner(cx, cy, len, dirX, dirY) {
  line(cx, cy, cx + len * dirX, cy);
  line(cx, cy, cx, cy + len * dirY);
}

// ============================================
// LÓGICA DEL DISPARO DE TELARAÑA
// ============================================
function updateWebShot() {
  if (!webShot.active) return; // si no hay disparo activo, no hago nada

  // t va de 0 a 1. Le sumo un poquito cada frame — ese "0.04"
  // es la VELOCIDAD del disparo. Más grande = más rápido.
  webShot.t += 0.04;

  if (webShot.t >= 1) {
    // el disparo llegó a destino (o se pasó del 100%)
    webShot.t = 1;
    webShot.tip = webShot.target.copy();
    webShot.active = false; // termina el disparo

    // ACÁ está la detección de colisión:
    // comparo dónde llegó el disparo (webShot.target, que es
    // donde estaba el villano CUANDO disparaste) contra dónde
    // está el villano AHORA (villain.pos, que se siguió moviendo
    // mientras el hilo viajaba por el aire)
    let hitDist = dist(webShot.target.x, webShot.target.y, villain.pos.x, villain.pos.y);

    // agrego "!villainCaptured" para que un villano que YA está
    // atrapado no cuente dos veces si le volvés a disparar
    if (hitDist < hit_radius && !villainCaptured) {
      // el villano seguía lo bastante cerca del punto apuntado: ¡acierto!
      villainCaptured = true;

      // lo anoto en la lista de atrapados
      capturedList[villainIndex] = true;

      // every() devuelve true solo si TODOS los elementos cumplen
      // la condición. Si los 4 están en true, se completó el protocolo:
      // arranco la cuenta regresiva hacia la pantalla final.
      if (capturedList.every(c => c)) {
        completeTimer = complete_delay;
      }
    }
    // si hitDist es mayor a hit_radius, el villano ya se había
    // movido demasiado lejos del punto apuntado: erraste el tiro,
    // y no pasa nada más (villainCaptured sigue en false)

  } else {
    // lerp() entre el punto de inicio y el objetivo, según
    // el progreso "t". Con t=0 la punta está en start,
    // con t=1 está en target, y en el medio va interpolando.
    webShot.tip.x = lerp(webShot.start.x, webShot.target.x, webShot.t);
    webShot.tip.y = lerp(webShot.start.y, webShot.target.y, webShot.t);
  }
}

function drawWebShot() {
  // si nunca se disparó nada, tip va a ser null, no dibujo nada
  if (!webShot.tip) return;
  // si ya terminó el disparo (t llegó a 1) tampoco lo sigo dibujando
  if (!webShot.active) return;

  stroke(255); // hilo blanco, como la telaraña real
  strokeWeight(2);
  line(webShot.start.x, webShot.start.y, webShot.tip.x, webShot.tip.y);

  noStroke();
  fill(255);
  circle(webShot.tip.x, webShot.tip.y, 6); // la "punta" del disparo
}