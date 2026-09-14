// setup() corre UNA SOLA VEZ al arrancar el sketch.
// Acá solo creo el canvas del tamaño de toda la ventana del navegador.
function setup() {
  createCanvas(windowWidth, windowHeight);
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