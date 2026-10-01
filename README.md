# Arkanoid

Juego de Arkanoid hecho con HTML, CSS y JavaScript vanilla. Cero dependencias, sin build, sin framework. Se juega directo en el navegador.

## Cómo jugar

Abre `index.html` en el navegador. No necesita servidor ni instalación.

### Controles

| Acción | Control |
| --- | --- |
| Mover paleta | Flechas izquierda/derecha, `A` / `D`, o mouse sobre el canvas |
| Iniciar / lanzar bola | Cualquier tecla (excepto `P`, `Esc`, `R`, `Enter`) o clic |
| Pausa / reanudar | `P` o `Esc` |
| Saltar de nivel (en pausa) | Teclas `1`–`5` o botones en pantalla |
| Siguiente nivel | `Enter` o botón "Continuar" |
| Reiniciar (game over / victoria) | `R` o botón en pantalla |

## Reglas

- 3 vidas. Si la bola cae bajo la paleta, pierdes una vida. A la tercera, game over.
- Cada bloque roto suma 10 puntos.
- Los bloques grises (`X`) requieren 2 golpes.
- El ángulo de rebote en la paleta depende del punto de impacto.
- Puntaje y vidas se conservan entre niveles.
- Romper todos los bloques del nivel 5 da la victoria.

### Niveles

| Nivel | Velocidad de bola (px/s) |
| --- | --- |
| 1 | 300 |
| 2 | 330 |
| 3 | 360 |
| 4 | 390 |
| 5 | 420 |

Cada nivel tiene un layout de bloques distinto. La paleta mide lo mismo en todos.

### Sonido y animación

- `ball-bounce.mp3` suena al rebotar en paleta o bordes.
- `break-sound.mp3` suena en cada golpe a un bloque.
- Cada bloque roto reproduce una explosión de 4 frames (150 ms).

## Estructura

```
index.html              canvas 480x640 y carga de scripts
style.css               centrado y escalado del canvas
game.js                 estado, input, física, render y loop
assets/
  spritesheet.js        loader y dibujo del atlas de sprites
  spritesheet-breakout.png
  sounds/               ball-bounce.mp3, break-sound.mp3
specs/                  especificaciones de cada feature
.agents/skills/         skills spec y spec-impl
```

## Desarrollo spec-driven

Las features se construyen a partir de specs en `specs/`, con dos skills:

- `/spec <idea>` — genera `specs/NN-slug.md` en estado `Draft` tras preguntas de aclaración. No escribe código.
- `/spec-impl NN-slug` — implementa una spec `Approved` en la rama `spec-NN-slug`, paso a paso, sin commits automáticos.

Estados: `Draft` → `In review` → `Approved` → `Implemented`. Solo una persona cambia una spec a `Approved`.

| Spec | Descripción | Estado |
| --- | --- | --- |
| 01 | MVP jugable | Implemented |
| 02 | Animación de destrucción de bloques | Implemented |
| 03 | Múltiples niveles con dificultad progresiva | Implemented |
| 04 | Cinco niveles, selector en pausa y reglas de sonido | Implemented |

Más detalle del proceso y de la arquitectura en [`CLAUDE.md`](CLAUDE.md).
