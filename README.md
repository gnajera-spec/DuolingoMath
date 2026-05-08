# MathLingo 🦉

App web tipo **Duolingo** para practicar las **tablas de multiplicar**, diseñada para chic@s a partir de 8-11 años con la mejor experiencia UX/UI.

## Características

- 🎮 **Gamificación completa**: XP, niveles, racha diaria, vidas (corazones), combo de aciertos consecutivos y logros desbloqueables.
- 📐 **Tablas del 1 al 12** con seguimiento de dominio (estrellas) por tabla.
- 🎲 **Modos de juego**:
  - Práctica por tabla específica
  - Mezcla aleatoria de tablas
  - Reto contrarreloj (60 segundos)
  - Jefe final (todas las tablas mezcladas)
- 🧩 **4 tipos de pregunta**: opción múltiple, escribir respuesta, número faltante (`7 × ? = 49`), verdadero/falso.
- ✨ **Feedback inmediato** con confeti al acertar, animación de error y revelación de la respuesta correcta.
- 🔊 **Efectos de sonido y vibración** opcionales (configurables).
- 💾 **Persistencia local** — el progreso se guarda en LocalStorage.
- 📱 **Mobile-first responsive**: funciona genial en móvil, tablet y escritorio.
- ♿ **Accesible**: respeta `prefers-reduced-motion`, soporta safe-area en dispositivos con notch.

## Cómo usar

No necesita instalación ni build. Es HTML/CSS/JS puro.

### Opción 1 — Abrir directo
```
Abre index.html en cualquier navegador moderno.
```

### Opción 2 — Servidor local
```bash
python3 -m http.server 8000
# o
npx serve .
```
Luego visita `http://localhost:8000`.

### Opción 3 — Desplegar gratis
Sube los archivos a:
- **GitHub Pages**: activa Pages sobre la rama y listo.
- **Netlify Drop**: arrastra la carpeta a https://app.netlify.com/drop
- **Vercel**: `vercel deploy`

## Estructura

```
.
├── index.html   # Estructura semántica de la SPA
├── styles.css   # Diseño estilo Duolingo (paleta, tipografía, animaciones)
└── app.js       # Estado, lógica de juego, generación de preguntas, persistencia
```

## Decisiones de UX

- **Tipografía Nunito**: redondeada y amigable, parecida a la de Duolingo.
- **Botones con sombra 3D**: animación de "presión" en cada toque para sensación táctil.
- **Mascota 🦉 Buho**: guía emocional, con reacciones según el resultado.
- **Feedback positivo emfatizado**: más celebración que castigo (clave para chic@s de 11 años).
- **Sesiones cortas (10 preguntas)**: alineado con la atención de la edad objetivo.
- **Recarga de vidas automática** a los 30 minutos para no frustrar.
- **Meta diaria visible** (30 XP) para incentivar la constancia sin presionar.

## Logros disponibles

🎓 Primer paso · 🔥 En racha (5 seguidas) · ⚡ Imparable (10 seguidas) · ✨ Perfecto · 📆 3 días · 🏆 7 días · 🌟 Aprendiz (5 tablas) · 👑 Maestro · 💎 Sin errores · 🚀 Velocista · 🐉 Cazador de jefes

---

Hecho con ❤️ para practicar matemáticas de forma divertida.
