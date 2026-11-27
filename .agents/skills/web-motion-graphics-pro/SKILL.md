---
name: web-motion-graphics-pro
description: >-
  Director de Motion Graphics 2D y 2.5D/3D de nivel agencia adaptado a Korat_MVP / Nilah IA
  (React 19 + Framer Motion + GSAP + Tailwind CSS + Lottie + Canvas Confetti).
  Eleva demos interactivas y UI SaaS a piezas cinematográficas con física orgánica,
  coreografía por capas, perspectiva 3D real y micro-vida continua.
---

# Web Motion Graphics Pro — Estándar de Agencia para Nilah IA

Esta skill define las reglas obligatorias de **física, coreografía, profundidad 2.5D/3D y rendimiento** para las animaciones de **Korat_MVP / Nilah IA** usando nuestro stack instalado (`framer-motion`, `gsap`, `@lottiefiles/dotlottie-react`, `canvas-confetti` y CSS/SVG).

---

## 1. Los 5 Mandamientos del Motion Profesional (Anti-Slop de IA)

1. **Prohibido `linear` y `bounce` caricaturesco:**
   - Todo movimiento debe tener **masa, fricción e inercia**.
   - **Entradas sedosas (Deceleration):** `cubic-bezier(0.16, 1, 0.3, 1)` (Framer: `ease: [0.16, 1, 0.3, 1]`, GSAP: `power4.out` / `expo.out`, `0.45s–0.85s`).
   - **Pop-ins táctiles (Micro-overshoot):** GSAP `back.out(1.35)` (`0.35s–0.5s`) o Framer `type: "spring", stiffness: 380, damping: 26`.
   - **Salidas rápidas y limpias (Acceleration):** `cubic-bezier(0.7, 0, 0.84, 0)` o `power3.in` (`0.2s–0.3s`).
2. **La Pausa También Anima (The Hold / Beat):**
   - Deja `0.2s–0.4s` de quietud antes/después de un dato clave (ej. el cambio de `4:00 PM` → `4:30 PM`, o antes de abrir la Billetera VIP) para que el ojo registre el impacto.
3. **Jerarquía Inflexible (Foco Único + Stagger):**
   - Orden estricto con `stagger: 0.05s–0.08s`:
     1. **Protagonista** (titular, cifra, burbuja principal o tarjeta VIP).
     2. **Contexto** (subtítulo, timestamp, barra de sellos).
     3. **Detalle** (badge, haz de luz SVG, destello o confeti).
4. **Always Alive (Cero Pantallas Congeladas):**
   - Tras entrar, los elementos clave mantienen micro-vida ambiental continua: flotación orgánica (`y: ±4px`, `sine.inOut`, `repeat: -1, yoyo: true`), *light sweeps* sutiles en tarjetas VIP o pulso en indicadores de estado.
5. **Coreografía de Salida Obligatoria:**
   - Nada desaparece con `opacity: 0` seco. Usa colapso por máscara (`clip-path`), desplazamiento con inercia o `AnimatePresence` con `blur(6px)` + `scale(0.96)`.

---

## 2. Técnicas 2D Aplicadas a Demos SaaS (Nilah IA)

1. **SVG Beam / Pipeline Connector (`stroke-dashoffset`):**
   - Conecta el panel de control (izquierda) con el mockup de WhatsApp (derecha) mediante un haz de luz SVG con gradiente animado que viaja al disparar cada evento.
2. **Masked Text & Clip-Path Reveals:**
   - Titulares y alertas emergiendo desde `clip-path: inset(0 0 100% 0)` → `inset(0 0 0% 0)` con `power4.out`.
3. **Contadores Odómetro & Progreso de Sellos:**
   - Cifras (`2/12` → `3/12`, reloj `4:00` → `4:30`) con `font-variant-numeric: tabular-nums` y transición fluida.
4. **Glassmorphism & Light Sweep Calibrado:**
   - Tarjetas VIP con `backdrop-filter: blur(12px)`, borde `1px solid rgba(255,255,255,0.12)` y reflejo diagonal (`linear-gradient`) que cruza la superficie al desbloquear un sello.
5. **Match-Cut Dimensional (`layoutId`):**
   - Usa `layoutId` de Framer Motion para transiciones fluidas entre tabs de planes (`Nilah Glow` ↔ `Nilah Pro`) y sub-módulos.
6. **Micro-Audio UI (Web Audio API):**
   - Sonido *"pop"* sutil al entrar burbujas de WhatsApp y *"ding"* cristalino al sumar sellos (con opción de silenciar).

---

## 3. Profundidad 2.5D / 3D Ligera (60fps)

- **Escenario con perspectiva real:** El contenedor del iPhone/WhatsApp debe tener `perspective: 1200px` y `transform-style: preserve-3d`.
- **Inclinación Editorial (3D Tilt):** Mockup del iPhone con inclinación sutil (`rotateY(-4deg) rotateX(2deg)`) que responde suavemente al hover o al estado activo.
- **Paralaje por Profundidad (`translateZ`):**
  - Halos de fondo: `translateZ(-60px)`.
  - Cuerpo del iPhone: `translateZ(0px)`.
  - Badges flotantes / Escudo de alerta: `translateZ(30px)`.
- **Rendimiento:** Animar **solo** `transform`, `opacity` y `clip-path`. Respetar `prefers-reduced-motion: reduce`.

---

## 4. Checklist de Calidad antes de Entregar

1. ¿Hay alguna curva `linear` o `ease` genérica en elementos protagonistas? → **Cambiar a `[0.16, 1, 0.3, 1]` o `power4.out`.**
2. ¿Entran todos los elementos a la vez? → **Aplicar jerarquía + `stagger`.**
3. ¿La escena queda 100% congelada tras entrar? → **Añadir micro-vida (flotación, shimmer o pulso).**
4. ¿Se animan propiedades costosas (`top`, `left`, `width`, `height`)? → **Refactorizar a `transform` y `clip-path`.**
