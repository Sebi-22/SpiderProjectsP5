// CONFIGURACIÓN DE LA API (TMDB)
// Mi API key gratuita de themoviedb.org.
const TMDB_API_KEY = "7361f0fa6f2a0f52a0109402a381e8f8";

// Le pido a Karen que "identifique a una persona" — esto sí es una función real
// del traje (Karen puede investigar personas que Peter se cruzó).Uso el endpoint de búsqueda de personas de TMDB.
const PERSON_QUERY = "Michael Keaton"; // el actor que hace de Vulture, el villano

// Variables donde voy guardando lo que me devuelve la API
let personData = null;
let personImg = null;
let loadingData = false;
let errorMsg = "";

// Estado del panel "Personnel File" (cuando está abierto, se ve la info de la persona; cuando está cerrado, solo se ve un mensaje de ayuda)."Personnel File" — identificación de una persona)
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

function setup() {
  createCanvas(windowWidth, windowHeight);
  //createVector es una función de p5.js que crea un vector 2D (x, y) para representar la posición del reticle.
  reticlePos = createVector(width / 2, height / 2);
}

function draw() {
  background(6, 8, 12);
  drawCityGrid();
   //lerp es una función de p5.js que interpola linealmente entre dos valores. Aquí se usa para suavizar el movimiento del reticle hacia la posición del mouse.
  reticlePos.x = lerp(reticlePos.x, mouseX, 0.2);
  reticlePos.y = lerp(reticlePos.y, mouseY, 0.2);

  // el número de combinación va cambiando solo, en loop,
  // entre 1 y 576 (el máximo real de combinaciones del traje)
  // floor es una función de p5.js que redondea hacia abajo, y map es otra función de p5.js que mapea un valor de un rango a otro rango.
  //sin es una función de p5.js que devuelve el seno de un ángulo (en radianes). frameCount es una variable de p5.js que cuenta los frames desde que empezó el sketch.
  webCombo = floor(map(sin(frameCount * 0.03), -1, 1, 1, 576));
  // drawReticle dibuja el reticle en la pantalla
  drawReticle();
  // drawTopHUD dibuja la información de estado en la parte superior de la pantalla.
  drawTopHUD();

  //drawIntroMessage es la función que dibuja el mensaje de Karen al inicio. Se muestra solo si showIntroMsg es true, y se va decrementando introMsgTimer hasta que llega a 0, momento en el cual showIntroMsg se pone en false y el mensaje desaparece.
  if (showIntroMsg) {
    drawIntroMessage();
    introMsgTimer--;
    if (introMsgTimer <= 0) showIntroMsg = false;
  }
  // drawPanel dibuja el panel de "Personnel File" si panelOpen es true, y drawHint dibuja un mensaje de ayuda si panelOpen es false.
  if (panelOpen) {
    drawPanel();
  } else {
    // drawHint dibuja un mensaje de ayuda si panelOpen es false.
    drawHint();
  }
}

// Mensaje real de Karen la primera vez que se activa
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
// Dibuja el reticle (la mira) en la pantalla, con un efecto de rotación y líneas radiales. También muestra el número de combinación de telaraña al lado del reticle.
function drawReticle() {
  push();
  translate(reticlePos.x, reticlePos.y);
  rotate(frameCount * 0.008);

  noFill();
  stroke(120, 220, 255);
  strokeWeight(1.2);

  circle(0, 0, 60);
  circle(0, 0, 82);

  // líneas radiales que salen del reticle, cada 45 grados
  for (let a = 0; a < 360; a += 45) {
    let ang = radians(a); //radiands es una función de p5.js que convierte grados a radianes.
    line(cos(ang) * 42, sin(ang) * 42, cos(ang) * 50, sin(ang) * 50);
  }
  pop();

  // el número de combinación se muestra al lado del reticle,
  // fuera del push/pop de rotación (para que el texto no gire)
  noStroke();
  fill(120, 220, 255);
  textSize(10);
  textFont('Courier New');
  // nf es una función de p5.js que formatea un número con un número fijo de dígitos y decimales. Aquí se usa para mostrar el número de combinación con 3 dígitos y 0 decimales.
  text("WEB COMBO " + nf(webCombo, 3, 0) + "/576", reticlePos.x + 46, reticlePos.y);
}

function drawTopHUD() {
  noStroke();
  fill(120, 220, 255); 
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

// Panel "Personnel File" — Karen identificando a una persona, mostrando su foto, ocupación y biografía. Se abre y cierra con la tecla K.
function drawPanel() {
  let panelW = min(360, width * 0.85);// min es una función de p5.js que devuelve el menor de dos valores. Aquí se usa para que el panel no sea más ancho que 360px, pero tampoco más ancho que el 85% del ancho de la ventana.
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
      ? personData.biography.substring(0, 140) + "..." //substring es una función de JavaScript que devuelve una parte de una cadena. Aquí se usa para limitar la biografía a 140 caracteres y agregar "..." al final si es más larga.
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

// LLAMADA A LA API DE TMDB (búsqueda de persona)
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