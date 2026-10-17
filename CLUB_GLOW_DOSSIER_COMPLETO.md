# 👑 Club Glow by Nilah — Dossier Completo de Arquitectura, Psicología y Funcionalidades

> **Documento Estratégico & Manual de Producto para Creadores de Contenido, Ventas y Dueñas de Salón**  
> *Autor: Equipo de Producto Korat Flow / Nilah*  
> *Objetivo:* Desglosar la lógica de ingeniería, los gatillos psicológicos y cada sub-funcionalidad del módulo **Club Glow**, demostrando por qué reemplaza de forma definitiva a las tarjetas de sellos de cartón y cómo genera miles de dólares en retención automática.

---

## 📑 Tabla de Contenidos
1. [La Gran Transformación: Cartón Físico vs. Club Glow Digital](#1-la-gran-transformación-cartón-físico-vs-club-glow-digital)
2. [Arquitectura General del Módulo (Las 4 Pestañas Clave)](#2-arquitectura-general-del-módulo-las-4-pestañas-clave)
3. [El Motor de Sellado & Anti-Fraude](#3-el-motor-de-sellado--anti-fraude)
4. [El Camino de Premios (Los 3 Regalos Consentidos)](#4-el-camino-de-premios-los-3-regalos-consentidos)
5. [El Asistente Inteligente de Margen & Rentabilidad (Wizard Glow)](#5-el-asistente-inteligente-de-margen--rentabilidad-wizard-glow)
6. [La Billetera Digital de la Clienta (Mobile Luxury Wallet)](#6-la-billetera-digital-de-la-clienta-mobile-luxury-wallet)
7. [Sistema de Canje Rápido con Código Único Anti-Fraude](#7-sistema-de-canje-rápido-con-código-único-anti-fraude)
8. [Los 4 Aceleradores Pro / Add-ons de Facturación](#8-los-4-aceleradores-pro--add-ons-de-facturación)
   - 8.1. Imán de Clientas Ausentes (Día 25 y Día 45)
   - 8.2. Especial Cumpleañera VIP (Estrategia de 2 Tiempos)
   - 8.3. Guardián de Cierre Diario por WhatsApp (Protección de Sueño)
   - 8.4. Martes & Miércoles Glow (2X Sellos en Días Flojos)
9. [Precios Psicológicos, Multitenancy y Modelo de Negocio SaaS](#9-precios-psicológicos-multitenancy-y-modelo-de-negocio-saas)
10. [Ideas de Guiones y Ángulos para TikTok / Reels](#10-ideas-de-guiones-y-ángulos-para-tiktok--reels)
11. [Blindaje Operativo, Puntos Ciegos Resueltos & Plantilla WhatsApp Maestra](#11-blindaje-operativo-puntos-ciegos-resueltos--plantilla-whatsapp-maestra)

---

## 1. La Gran Transformación: Cartón Físico vs. Club Glow Digital

### El Dolor Oculto de los Salones de Belleza:
Durante décadas, los salones de uñas, peluquerías, spas y centros de estética han utilizado tarjetas de cartón impresas con sellitos de tinta o perforaciones. **¿Por qué este método está matando sus ganancias?**

| Problema del Cartón Físico 🥀 | Solución de Club Glow Digital 💎 |
| :--- | :--- |
| **Se pierde en la cartera:** El 73% de las clientas lo olvidan en casa o lo extravían. La experiencia se frustra. | **Vive en su WhatsApp personal:** Se abre como una tarjeta VIP móvil en 1 clic desde el link de mensaje. Sin apps pesadas ni logins. |
| **Cero datos para el salón:** La dueña no sabe quién tiene cuántos sellos, quién dejó de ir hace 40 días, ni cuándo cumple años. | **Base de Datos Viva:** Cada acuñación registra fecha, staff que atendió, total acumulado y días sin volver. |
| **Fraude del personal:** Empleadas o amigas pueden sellar 10 veces de golpe sin que la dueña se entere. | **Límites Anti-Fraude Programables:** Límite de sellos por cita, ticket mínimo y registro auditor por cada sello emitido. |
| **Quiebre de margen:** Suelen prometer "el servicio 10 es gratis", regalando tratamientos de $80 USD que destruyen la ganancia neta. | **Asistente Matemático de Margen:** Los 3 premios se calculan para que el costo total de insumos nunca supere el 10%-15% del gasto acumulado. |
| **Pasivo y mudo:** El cartón no le habla a la clienta cuando pasan 3 semanas sin volver. | **Robots Proactivos de Reactivación:** Si pasan 25 o 45 días sin cita, el sistema le escribe solo para rescatarla. |

---

## 2. Arquitectura General del Módulo (Las 4 Pestañas Clave)

El módulo Club Glow dentro de la app de la dueña se divide en cuatro pantallas interconectadas:

1. **Dashboard de Clientas:**  
   - Métricas en tiempo real: Total de clientas en el club, clientas a solo 1 sello de ganar premio (*hot leads*), sellos totales emitidos y premios pendientes de canjear.
   - Buscador rápido por nombre o teléfono.
   - Filtro express: *"A 1 Sello de Ganar"* (para llamar o enviar WhatsApp a quienes están a punto de volver).
   - Acceso al botón de sellado manual express y cierre rápido del día.

2. **Premios Pendientes de Canje:**  
   - Control de recepción. Muestra la lista de clientas que han ganado su premio, el código alfanumérico generado (`SL-XXXXXX`), la fecha en que lo ganaron y su fecha de caducidad.

3. **Camino de Premios (Tus 3 Regalos Consentidos):**  
   - Visualización y calibración de los 3 hitos de la tarjeta (Hito 4, Hito 8 e Hito 12).
   - Subida de foto real en 1 solo clic optimizada en WebP HD.
   - Simulador de rentabilidad dinámico integrado.

4. **Ajustes & Reglas de Fidelización:**  
   - **Bloque 1 (Base Incluida):** Ticket mínimo por sello, límite de sellos por cita, vigencia de tarjeta (3, 6, 12 meses o infinita) y activación del sello de bienvenida.
   - **Bloque 2 (Aceleradores Pro de Facturación):** Oferta del Super Pack y los 4 robots autónomos de WhatsApp.
   - **Bloque 3 (Plantilla de Notificación):** Editor del mensaje que recibe la clienta con vista previa de simulación en vivo de WhatsApp.

---

## 3. El Motor de Sellado & Anti-Fraude

### ¿Cómo gana sellos la clienta?
Existen 3 vías de acuñación en el sistema:

1. **Acuñación Automática al Cerrar Cita:**  
   Cuando la recepcionista o estilista marca una cita como "Cobrada / Completada" en el calendario o POS de Korat Flow, el sistema calcula el ticket total y le asigna los sellos correspondientes de forma automática.
2. **Sellado Manual Express (`+ Sellar Clienta`):**  
   Un modal ultrarrápido donde la recepcionista busca a la clienta, ingresa el monto pagado o la cantidad de sellos ganados, y el sistema actualiza la tarjeta al instante disparando una animación de confeti.
3. **Cierre Rápido Guardián (`Cierre del Día`):**  
   Al final del día, lista en una sola pantalla todas las citas pendientes de hoy. Con 1 solo clic en "Cerrar y sellar todo", despacha los sellos del día en bloque.

- **Monto por 1 Sello (Ticket Mínimo):** Ej. S/ 30 o $10 USD. Evita que compras mínimas de gaseosas o servicios express generen sellos si no alcanzan el umbral.
- **Sistema de Alcancía / Saldo Acumulado:** Si una clienta consume un servicio por debajo del ticket mínimo (ej: depilación de cejas por S/ 15 con umbral de S/ 45), el sistema no le regala sellos ni satura su WhatsApp; acumula esos S/ 15 en su alcancía virtual para que al sumar otro servicio en su próxima cita (ej. manicure de S/ 35), alcance los S/ 50 y gane su sello de forma justa.
- **Límite de Sellos por Cita:** Máximo configurable (por defecto 3 sellos por visita). Evita que una clienta que se haga un balayage de $300 USD llene toda la tarjeta en un solo día y pida el premio mayor la próxima semana.
- **Vigencia Temporal:** Opciones de 3, 6 o 12 meses. Incentiva la alta rotación biológica y caduca tarjetas dormidas.
- **Sello de Bienvenida (Gatillo de Dopamina):** Al registrar a la clienta, arranca automáticamente con 1 sello acuñado de regalo. *Principio psicológico del Progreso Dotado (Endowed Progress Effect):* Las personas tienen un 82% más de probabilidades de terminar una tarea si sienten que ya empezaron con ventaja.

---

## 4. El Camino de Premios (Los 3 Regalos Consentidos)

A diferencia de las tarjetas tradicionales que obligan a esperar hasta la cita 10 para recibir algo (lo que causa un 60% de abandono antes del 5to sello), Club Glow utiliza la **Estructura Progresiva 4 - 8 - 12**:

```
[Inicio: Sello 1 Bienvenida] 
      └──> 🎁 HITO #4: El "Mimo Rápido" (Frecuencia Temprana)
                └──> 💎 HITO #8: El "Detalle VIP" (Consolidación)
                          └──> 👑 HITO #12: El "Gran Regalo Glow" (Lealtad Absoluta)
```

### 1. Hito #4 — El "Mimo Rápido" (Gratificación Temprana)
- **Objetivo Psicológico:** Que la clienta sienta que ganar premios es rápido y real. Elimina la desconfianza del primer mes.
- **Ejemplos de Salón:** Exfoliación e hidratación de manos express (5 min mientras se seca el cabello), ampolla selladora en el lavacabezas o diseño express de cejas.
- **Costo interno para el salón:** Menos de $1 a $1.5 USD en producto.

### 2. Hito #8 — El "Detalle VIP" (Barrera Anti-Competencia)
- **Objetivo Psicológico:** El punto crítico donde la clienta suele tentarse con ofertas de otros salones. Al estar en el sello 8, se resiste a irse porque "ya tiene casi dos premios ganados".
- **Ejemplos de Salón:** Nail art en 2 uñas, cepillado de brillo o retiro de esmalte en gel sin costo.
- **Costo interno para el salón:** ~$2 a $3 USD.

### 3. Hito #12 — El "Gran Regalo Glow" (La Graduación de Oro)
- **Objetivo Psicológico:** La clienta ha visitado el salón 12 veces, generando entre $300 y $600 USD de facturación anual. Se convierte en una clienta de por vida.
- **Ejemplos de Salón:** Manicure Spa Completo, Sesión de Hidratación Profunda con ozono o Corte de Puntas con Mascarilla de Lujo.
- **Costo interno para el salón:** ~$5 a $6 USD (costo de insumo real, el salón vende la percepción de un servicio de $30 USD).

### 📸 Subida de Foto Real en 1 Clic & Optimización Automática
- La dueña toca la foto del premio y sube la foto real de su producto o servicio desde su celular.
- **Optimización WebP HD:** El navegador recorta automáticamente a 1:1 y reduce el peso a menos de 150KB sin pérdida de nitidez.
- **WhatsApp Ready:** Esta misma foto es la que el robot de WhatsApp le envía adjunta a la clienta en el segundo exacto en que gana su premio, disparando el deseo de visitarlo para reclamarlo.

---

## 5. El Asistente Inteligente de Margen & Rentabilidad (Wizard Glow)

El temor #1 de toda dueña de salón es: *"¿Y si regalo un premio y salgo perdiendo dinero?"*.  
Para resolver esto, creamos el **RentabilidadWizardGlow**:

1. **Lectura de Servicios Reales:**  
   El asistente analiza la base de datos de servicios del salón (precios de cortes, tintes, uñas, pestañas) y sugiere premios complementarios que no canibalicen sus servicios más vendidos.
2. **Las 3 Fórmulas Pre-calibradas:**
   - **Estrategia A (Venta Cruzada):** Si la clienta viene por tinte, el premio es de uñas para que conozca a otra manicurista del equipo.
   - **Estrategia B (Alta Frecuencia):** Premios express de bajo costo que exigen volver cada 15-20 días.
   - **Estrategia C (VIP High-Ticket):** Premios de alta percepción estética para salones de ticket elevado.
3. **Simulador de Rentabilidad en Vivo:**  
   Calcula en tiempo real:
   $$\text{\% Inversión en Fidelización} = \left(\frac{\text{Costo Total de los 3 Premios}}{\text{Gasto Proyectado en 12 Citas}}\right) \times 100$$
   - Si el costo es $\le 15\%$, muestra el sello verde: **Margen Saludable**.
   - Si supera el $15\%$, emite una alerta preventiva recomendando ajustar los costos para blindar la caja del negocio.

---

## 6. La Billetera Digital de la Clienta (Mobile Luxury Wallet)

La clienta abre su enlace personal (`/club-glow/:businessId?c=:clienteId`) y experimenta:
- **Estética de Tarjeta Negra / Oro Pulido:** Tarjeta con reflejo 3D hiperrealista que gira con el giroscopio o movimiento del mouse/touch.
- **Sellos Físicos Digitalizados:** 12 casillas circulares con animación de acuñado de moneda dorada cuando suma un sello.
- **Premios Desbloqueados con Cuenta Regresiva:** Muestra el código de barras y código alfanumérico para canjear en recepción.
- **Acceso Directo a Citas:** Botón flotante para agendar su próxima visita en 1 clic.
- **PWA sin instalación:** Funciona en Safari, Chrome o dentro del navegador interno de WhatsApp sin obligar a descargar nada de la App Store.

---

## 7. Sistema de Canje Rápido con Código Único Anti-Fraude

Cuando la clienta llega a recepción diciendo: *"Tengo un premio ganado en mi tarjeta"*:
1. Muestra su código único (ej: `SL-A9B4C2`).
2. La recepcionista escribe el código en el recuadro **Canje Rápido en Recepción** de Club Glow y presiona `Canjear`.
3. El sistema valida al instante:
   - Que el código pertenezca a ese salón.
   - Que no haya sido canjeado previamente.
   - Que no esté vencido.
4. Quema el cupón en la base de datos y lanza confeti en pantalla. Imposible de duplicar o falsificar.

---

## 8. Los 4 Aceleradores Pro / Add-ons de Facturación

Diseñados como módulos autónomos de inteligencia artificial que trabajan en segundo plano por WhatsApp:

### 8.1. 🧲 Imán de Clientas Ausentes
- **El Problema:** El 68% de las clientas no cambian de salón por insatisfacción, sino por simple **olvido y desorganización**. Cuando se dan cuenta, ya pasaron 6 semanas.
- **La Solución en 2 Tiempos Biológicos:**
  - **Día 25 (Fin del ciclo de retoque):** Uñas quebradas, raíz de tinte o caída de pestañas. El robot detecta que no tiene cita futura y le escribe:  
    *"¡Hola [Nombre]! En [Salón] notamos que tu tarjeta Glow tiene [X] sellos. Si agendas tu retoque esta semana, te duplicamos los sellos de tu visita (2x1 en sellos) ✨."*
  - **Día 45 (Alerta de fuga):** Antes de que se vaya con la competencia, el sistema le regala sellos sorpresa y la deja **a solo 1 sello de su premio**:  
    *"Te extrañamos tanto que te regalamos sellos sorpresa en tu Tarjeta Glow. ¡Quedaste a 1 sola visita de tu premio de [Nombre Premio]! Agenda aquí para reclamarlo."*
- **Filtro Inteligente:** Si la clienta ya tiene una cita agendada en el sistema, el robot **no le escribe**. Cero spam.

### 8.2. 🎂 Especial Cumpleañera VIP
- **El Secreto Psicológico:** La semana de su cumpleaños es el momento del año donde una mujer gasta **hasta 3 veces más** en belleza (quiere uñas nuevas, peinado, cejas, pestañas y maquillaje para sus fotos y fiestas).
- **El Error de los Salones:** Escribirle el mismo día del cumpleaños. Para esa fecha, la clienta ya se arregló o está en su almuerzo familiar.
- **La Estrategia de 2 Tiempos Nilah:**
  - **7 Días Antes (Generador de Facturación):** Le envía un bono de sellos de cumpleaños anticipado con link de agenda para asegurar que pase su fin de semana de festejo en el salón.
  - **El Mismo Día (Calidez y Fidelización de Marca):** Mensaje cálido y festivo de felicitación sin venta agresiva, sellando el vínculo emocional.

### 8.3. 🔔 Guardián de Cierre Diario por WhatsApp
- **El Problema Operativo:** Las estilistas terminan a las 8:00 PM exhaustas, limpian el salón y olvidan marcar las citas como cobradas en el software. La dueña llega a su casa con números desfasados y clientas que se quejan porque no les llegaron sus sellos.
- **La Solución Automática:**
  - A las 8:30 PM, el robot audita la agenda del día.
  - Si quedaron citas pendientes, envía un WhatsApp a la dueña:  
    *"🌙 Hola! Hoy quedaron 2 citas sin cerrar (Mariana y Sofía). Toca aquí para cerrarlas y enviar sus sellos en 1 segundo: [Link Express]"*.
  - **Modo Protección de Sueño:** Si todas las citas se cerraron correctamente, el robot guarda silencio absoluto para que la dueña descanse con tranquilidad.

### 8.4. ⚡ Martes & Miércoles Glow (2X Sellos)
- **El Problema de los Salones:** Jueves, viernes y sábados están saturados sin espacio para más clientas, mientras que martes y miércoles el personal está desocupado pagando alquiler y sueldos muertos.
- **La Estrategia Anti-Descuento:**  
  Regalar descuentos en efectivo (ej. 20% off) devalúa el trabajo del salón. Martes & Miércoles Glow duplica los sellos digitales. La clienta percibe un beneficio gigante sin que el salón regale dinero de su caja diaria.

---

## 9. Precios Psicológicos, Multitenancy y Modelo de Negocio SaaS

### Arquitectura de Precios Multidivisa:
El sistema detecta automáticamente el país del negocio y calibra la moneda de visualización:
- **Perú (PEN):** Individual a **S/ 20/mes** | Super Pack Completo (los 4 aceleradores) a **S/ 39/mes** (Ahorro de S/ 41/mes).
- **Internacional / Base USD:** Individual a **$5 USD/mes** | Super Pack Completo a **$10 USD/mes** (Ahorro de 50%).
- **Colombia (COP) / México (MXN) / Chile (CLP):** Tipos de cambio automáticos redondeados psicológicamente.

### La Ecuación Irresistible de ROI para la Dueña:
> *"Con que el Imán de Ausentes recupere a **1 sola clienta al mes** que se haga un servicio de $20 o $30 USD, el módulo completo ya se pagó solo y te deja dinero a favor en el bolsillo."*

---

## 10. Ideas de Guiones y Ángulos para TikTok / Reels

### 🎬 Guión 1: "El error del cartón de sellos" (Gancho Negativo)
* **Hook (0-3s):** *(Mostrando una tarjeta de cartón arrugada o tirándola a la basura)* *"Si tu salón todavía usa estas tarjetitas de cartón para regalar sellos... estás perdiendo miles de dólares al mes."*
* **Problema (3-12s):** *"Tus clientas las pierden en la cartera, tu personal puede sellarlas sin control, y lo peor: el cartón no le avisa a tu clienta cuando pasan 30 días sin que vuelva a tu salón."*
* **Solución (12-25s):** *(Mostrando en el celular la tarjeta 3D de Club Glow)* *"Miren esto: se llama Club Glow. Vive directo en el WhatsApp de tu clienta. Cuando completa un servicio, le llega un mensaje de lujo con su tarjeta digital en vivo."*
* **Call to Action (25-30s):** *"Automatiza tu salón y haz que tus clientas vuelvan solas. Comenta 'GLOW' y te enseño cómo activarlo."*

---

### 🎬 Guión 2: "Cómo llené los martes y miércoles sin bajar precios"
* **Hook (0-3s):** *(Frente a sillones vacíos en el salón)* *"¿Tus martes y miércoles están vacíos y los fines de semana no das abasto?"*
* **Desarrollo (3-15s):** *"El peor error que cometen las dueñas de salón es poner descuentos del 20% o 30% en días flojos. Eso devalúa tu trabajo y acostumbra a tus clientas a pagar barato."*
* **Secreto (15-25s):** *"Nosotros activamos 'Martes & Miércoles Glow': 2x Sellos en su tarjeta digital. La clienta viene feliz porque avanza el doble hacia su regalo y tú cobras tu precio completo."*
* **Call to Action (25-30s):** *"Link en mi perfil para ver el sistema completo."*

---

### 🎬 Guión 3: "La máquina de cumpleaños"
* **Hook (0-3s):** *"¿Sabías que una mujer gasta el triple en belleza la semana de su cumpleaños? Pero la mayoría de salones cometen este grave error..."*
* **Desarrollo (3-15s):** *"Le escriben el mismo día de su cumpleaños cuando ya se peinó o está festejando. Nuestro robot le escribe exactamente 7 días antes con un bono de sellos VIP para asegurar su cita de fiesta en tu salón."*
* **Cierre (15-25s):** *"En promedio, este solo robot llena de 8 a 15 citas de alto ticket todos los meses en piloto automático."*

---

### 🎬 Guión 4: "El robot que te cuida el sueño a las 8:30 PM"
* **Hook (0-3s):** *"Son las 8:30 de la noche, acabas de llegar a tu casa cansada del salón y te preguntas: ¿Habrán cobrado y sellado todas las citas hoy?"*
* **Desarrollo (3-18s):** *(Mostrando la notificación de WhatsApp en el celular)* *"Te llega este mensaje de tu Guardián Nocturno: 'Hola, quedaron 2 citas sin cerrar hoy. Toca aquí para cerrarlas y enviar sus sellos'. Tocas un botón y en un segundo todo el día queda cuadrado sin abrir la laptop."*
* **Cierre (18-25s):** *"Y si todo se cerró bien, se activa el 'Modo Protección de Sueño' y no te molesta para que duermas en paz."*

---

## 11. Blindaje Operativo, Puntos Ciegos Resueltos & Plantilla WhatsApp Maestra

### 🛡️ Los 4 Puntos Ciegos Operativos Resueltos en la Base de Datos

En la versión de producción se blindó la lógica PostgreSQL (`fn_registrar_sello_visita`, `fn_sellos_activos`, `fn_deshacer_sello_visita`) resolviendo los siguientes riesgos de quiebre de margen:

1. **Blindaje de Margen y Ticket Mínimo (Caso S/ 15 vs S/ 45):**
   * **Problema:** Un `GREATEST(1, ...)` previo forzaba 1 sello incluso con compras menores (ej. cejas de S/ 15 con umbral de S/ 45).
   * **Solución Aplicada:** Si el monto efectivo no alcanza el ticket mínimo, otorga `0` sellos, acumula los S/ 15 en la alcancía (`sellos_sobrante`) para su próxima visita y **no envía mensaje de sellos por WhatsApp**, protegiendo la caja del salón y evitando spam.
2. **Soporte de Múltiples Hitos Cruzados (Efecto Tijera):**
   * **Problema:** Si una clienta pasaba del sello 3 al 9 (por ticket alto o día 2x), solo se emitía el premio del hito 8 y se perdía el hito 4.
   * **Solución Aplicada:** Bucle iterativo `FOR` que emite y registra todos los códigos de canje (`SL-XXXXXX`) correspondientes a cada hito superado.
3. **Corrección de Conteo y Reversiones Negativas (`fn_sellos_activos`):**
   * **Problema:** El conteo ignoraba movimientos negativos (`cantidad < 0`), impidiendo que los errores de recepcionista se corrigieran.
   * **Solución Aplicada:** Conteo con balance real `GREATEST(0, COALESCE(SUM(cantidad), 0))`.
4. **Cancelación Automática de Mensajes en Cola al Deshacer Cita:**
   * **Problema:** Si la recepcionista deshacía una cita completada por error, el WhatsApp programado (delay de 30 min) se enviaba igual.
   * **Solución Aplicada:** `fn_deshacer_sello_visita` busca y cancela cualquier mensaje pendiente en `cola_mensajes_salientes` para esa cita.

---

### 💬 Plantillas Maestras Globales de WhatsApp

#### 1. Mensaje de Bienvenida y Acuñación Inicial (Sello 1 y 2):
```text
✨ *¡Bienvenida al Club {salon}, {nombre}!* 👑🎁

Te regalamos *1 sello de bienvenida* por unirte y hoy sumaste otro: ya llevas *2 de 12 sellos* completados. ✨

🎯 Te faltan solo *2 sellos* para tu primer regalo VIP: *{premio_1}* 🌸💎

📲 *Mira tu tarjeta digital y progreso en vivo aquí:*
{link_tarjeta}
```

#### 2. Mensaje de Premio: Hito #4 (El Mimo Rápido):
```text
✨ *¡Lo lograste, {nombre}!* 🎉

Llegaste al *sello 4 de 12* en el Club {salon} y ganaste tu:
🎁 *{premio_1}*

Muéstrale este mensaje a recepción y dile tu código:
🎟️ Código: `{codigo}`

📲 *Ver tu tarjeta digital:*
{link_tarjeta}
```

#### 3. Mensaje de Premio: Hito #8 (El Detalle VIP):
```text
✨ *¡Vas increíble, {nombre}!* 💎🎉

Llegaste al *sello 8 de 12* en {salon} y ganaste tu:
🎁 *{premio_2}*

Muéstrale este mensaje a recepción y dile tu código:
🎟️ Código: `{codigo}`

🎯 Te faltan solo *4 sellos* para tu premio mayor: *{premio_3}* 👑

📲 *Ver tu tarjeta digital:*
{link_tarjeta}
```

#### 4. Mensaje de Premio: Hito #12 (La Gran Graduación Glow):
```text
👑 *¡Completaste todo el camino, {nombre}!* 🏆✨

Llegaste al *sello 12 de 12* en {salon} y ganaste tu:
🎁 *{premio_3}*

Muéstrale este mensaje a recepción y dile tu código:
🎟️ Código: `{codigo}`

🌟 Tu nueva tarjeta VIP ya comenzó con *2 sellos de regalo* ✨

📲 *Ver tu tarjeta de honor:*
{link_tarjeta}
```

---

### ⏳ Política de Validez de Premios Ganados (Anti-Pasivo Oculto)

Para evitar acumulación de deudas invisibles en el salón (que decenas de clientas reclamen tratamientos costosos gratis a fin de año):
- **Validez Recomendada:** **60 días (2 meses)** desde que la clienta desbloquea el código `SL-XXXXXX`.
- **Efecto de Urgencia Positivo:** Actúa como un imán para que la clienta agende su próxima cita en menos de 8 semanas.
- **Canje Anti-Fraude de 1 Solo Uso:** La recepcionista valida el código en el sistema, quemándolo en la base de datos al instante para impedir dobles canjes o reenvíos de mensajes.
- **Control en Dashboard:** El panel de la dueña muestra el conteo exacto de premios pendientes de canje y su fecha de expiración.

