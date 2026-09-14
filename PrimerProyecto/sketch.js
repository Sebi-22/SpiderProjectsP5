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

// El panel en sí. Por ahora es solo un rectángulo con texto fijo,
// más adelante (cuando conectemos la API) acá va a ir la info
// real de la película en vez de este texto de prueba.
function drawPanel() {
  let panelW = min(360, width * 0.85); // ancho del panel, con tope de 360px
  let panelH = 200;
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

  fill(200);
  textSize(11);
  text("(acá va a ir la data real de la API, todavía no la conectamos)", px + 16, py + 55, panelW - 32, 100);
}

// keyPressed() es un evento de p5: se dispara SOLO una vez,
// justo en el momento en que apretás una tecla (no se repite
// mientras la mantenés apretada, a diferencia de keyIsDown()).
function keyPressed() {
  if (key === 'k' || key === 'K') {
    // esto es el truco típico para un "toggle": si estaba
    // en true pasa a false, y si estaba en false pasa a true.
    panelOpen = !panelOpen;
  }
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