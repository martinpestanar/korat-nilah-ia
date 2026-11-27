---
name: nilah-landing-design-system
description: >-
  Sistema de diseño oficial extraído de la Landing v1 de Nilah IA (src/pages/Landing.tsx).
  Preserva su paleta Light editorial, gradientes por sección, MorphingBlobs, tarjetas 3D con
  ParallaxTiltWrapper + bordes neón giratorios (neon-border-glow), glass-widgets y responsive.
---

# Sistema de Diseño Oficial — Landing Nilah IA (`/nilah`)

Este documento preserva la esencia visual, colores, efectos 3D y estructura responsive de `src/pages/Landing.tsx` para reconstruir `/nilah` sin perder su identidad.

---

## 1. Paleta, Tipografía y Fondos Light
- **Contenedor Raíz:** `force-hardcoded-violet relative min-h-screen bg-gradient-to-b from-white via-violet-50/20 to-white text-gray-900 font-sans`
- **Alternancia de Secciones (Ritmo Visual):**
  - Hero: `bg-transparent` con `MorphingBlob` (`from-gray-300 via-violet-100 to-transparent`, `opacity-20`) + halo central `bg-violet-500/5 blur-[100px]`.
  - Secciones neutras / diagnóstico: `bg-gray-50` o `bg-gradient-to-b from-gray-50 to-white`.
  - Secciones protagonicas / IA: `bg-white` o `bg-gradient-to-br from-violet-50 via-fuchsia-50 to-white`.
  - Secciones de control / finanzas: `bg-gradient-to-b from-emerald-50/30 to-white`.
  - Banner Social Proof: `bg-violet-600 text-white`.
  - CTA Final: `bg-gradient-to-br from-gray-900 to-black text-white`.
- **Navbar Sticky:**
  - Al hacer scroll: `border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm`.
  - Botón Login con borde gradiente `from-violet-500 via-fuchsia-500 to-pink-500` y CTA principal `rounded-full bg-gray-900 text-white`.

---

## 2. Tarjetas de Planes 3D (Firma Visual de Nilah)
Las tarjetas de precios usan **3D Tilt interactivo + borde cónico giratorio**:
- **Wrapper 3D:** `<ParallaxTiltWrapper className="h-full">` (de `src/components/UI/AnimatedSVGs`).
- **Contenedor Neón:** `neon-border-container relative bg-white rounded-[2rem] p-0.5 shadow-2xl h-full overflow-hidden group`
  - **Variante Violeta/Fucsia (Plan Estrella / Pro):** `.neon-border-glow` (`conic-gradient(transparent, rgba(139,92,246,0.4), rgba(236,72,153,0.4), transparent 30%)` con `@keyframes neon-rotate` 5s) + `.ultra-card-shadow` (`0 0 40px rgba(139,92,246,0.15)`).
  - **Variante Esmeralda/Cyan (Plan Glow / Base):** `.neon-border-glow-emerald` (`rgba(16,185,129,0.4)` → `rgba(6,182,212,0.4)`) + `.ultra-card-shadow-emerald`.
- **Badge Superior Flotante (fuera del `overflow-hidden`):**
  - `absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg tracking-widest animate-pulse`.
- **Micro-items internos (`.glass-widget`):**
  - Cada beneficio dentro de la card va en `flex items-center gap-3 p-3 rounded-xl glass-widget border shadow-sm` con ícono en cuadrado `w-8 h-8 rounded-lg` de color sólido (`bg-violet-600`, `bg-pink-500`, `bg-emerald-600`, `bg-amber-500`, `bg-cyan-500`).

---

## 3. Reglas Responsive
- **Grid de Planes:** `grid lg:grid-cols-2` (o `lg:grid-cols-3` si hay Free/Corporativo) con `max-w-6xl mx-auto px-4 gap-6`.
- **Tipografía:** Titulares `text-3xl md:text-5xl font-extrabold tracking-tight`, Hero `sm:text-4xl md:text-5xl lg:text-6xl`.
- **Menú Móvil:** Drawer desplegable `md:hidden` con transiciones `opacity` + `translate-y` y CTAs full-width.
