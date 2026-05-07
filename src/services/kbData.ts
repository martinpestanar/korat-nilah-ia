import { 
    LucideIcon, 
    Calendar, 
    Users, 
    Crown, 
    MessageCircle, 
    Megaphone, 
    BarChart3, 
    Settings, 
    Lightbulb, 
    PlayCircle, 
    BookOpen, 
    Bot, 
    Target,
    Zap,
    TrendingUp,
    ShieldCheck,
    Palette
} from 'lucide-react';

export type ArticleType = 'doc' | 'masterclass' | 'video' | 'quick-tip';

export interface KBArticle {
    id: string;
    title: string;
    excerpt: string;
    type: ArticleType;
    readTime: string;
    content: string; 
    proTip?: string; 
    videoUrl?: string;
    difficulty?: 'Principiante' | 'Avanzado' | 'Experto';
}

export interface KBCategory {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    level: string;
    color: {
        bg: string;
        text: string;
        border: string;
    };
    articles: KBArticle[];
}

export const kbData: KBCategory[] = [
    // --- APP MASTERY PILLAR ---
    {
        id: 'inbox',
        title: 'Domina tu Inbox (Ventas por chat)',
        description: 'Deja de perder citas en WhatsApp. Convierte cada mensaje en una reserva confirmada al instante.',
        icon: MessageCircle,
        level: 'App Mastery',
        color: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
        articles: [
            {
                id: 'inbox-basics',
                title: 'WhatsApp e Inbox: El Arte de Vender sin Parecer que Vendes 💬✨',
                excerpt: 'Descubre cómo dominar la atención rápida para que tus clientas agenden contigo antes de escribirle a tu competencia.',
                type: 'doc',
                readTime: '4 min',
                difficulty: 'Principiante',
                content: `
                    <h3>Tu Bandeja de Entrada es tu Caja Registradora 💸</h3>
                    <p>Seamos sinceras, amiga: el 80% del dinero de tu salón hoy en día se decide en la palma de la mano de tu clienta. Estella está en pijama, son las 10 PM, y está buscando a quién confiarle su balayage esta semana. Si respondes tarde, o si respondes con un frío "Sí hay campo", acabas de perder una reserva de 400 soles frente a la peluquería del centro comercial. 💔</p>
                    
                    <p>Aquí es donde el <strong>Inbox de Nilah</strong> cambia las reglas del juego. No es solo un WhatsApp; es tu radar de atención VIP. 💅</p>

                    <h4>1. La Radiografía de la Clienta (Magia pura) 🪄</h4>
                    <p>¿Alguna vez te olvidaste qué tono exacto de tinte usaste con María hace tres meses? O peor, ¿qué es alérgica al amoniaco? Con el Inbox de Nilah, al abrir su chat, tienes su <em>historial completo a la derecha de la pantalla.</em></p>
                    <p>De pronto, no tienes que preguntarle nada, le puedes decir: <em>"Hola María bonita, ¿te agendo para tu retoque del rubio ceniza que te amaste en diciembre?"</em>. ¡BOOM! Explosión de confianza. Esa clienta ya no te suelta jamás. 👑</p>

                    <h4>2. Flujo de Agenda sin estrés ⏳</h4>
                    <p>Olvídate del libreto viejo, el lapicero sin tinta o cambiar de app y que el celular se te cuelgue. Estás chateando en Nilah, presionas <em>"Agendar Cita"</em> sobre el chat, eliges el bloque de la tarde y listo. El espacio desaparece para el resto del mundo y queda bloqueado a su nombre.</p>
                    <p>Un flujo de 3 segundos para ti, una experiencia de primera clase para ella. 🚀</p>

                    <h4>3. Plantillas: Tu equipo trabajando a tu velocidad 🏃‍♀️</h4>
                    <p>¿Cansada de escribir la misma dirección o lista de precios 15 veces al día? Crea mensajes pre-armados. Usando un comando rápido (ej: <code>/precio_manicure</code>), tu texto perfecto, con emojis estéticos y tono súper amable aparece y se envía en un click.</p>
                    <p>Si la respuesta es rápida (y educada), la reserva está hecha. ¡A reventar esa agenda! 📅💥</p>
                `,
                proTip: "Nunca respondas con un 'Tengo libre a las 4 y a las 6'. Eso suena a que estás vacía. Mejor di con confianza: 'Tengo los mejores horarios estelares para ti, bella: ¿Te reservo de una vez a las 4:00 PM o a las 6:00 PM?'. Dar 2 opciones exactas dispara el sí. 🎯"
            },
            {
                id: 'inbox-bot-interaction',
                title: 'Nilah IA: Tu Recepcionista Virtual 24/7 🤖💅',
                excerpt: 'Cómo hacer que el bot atienda lo aburrido mientras tú enamoras con los servicios de Alto Ticket.',
                type: 'masterclass',
                readTime: '6 min',
                difficulty: 'Avanzado',
                content: `
                    <h3>¿Te da miedo soltar el celular? Te entiendo. 📱</h3>
                    <p>Muchas dueñas de estética tienen pánico de dejarle el teléfono a un "bot" por miedo a que suene robótico, frío o pierda la venta. ¡Tranquila! Nilah no es un robot estúpido de líneas frías. Nilah es como tener a tu conserje de lujo, súper entrenado, trabajando de madrugada cuando tú, por fin, estás durmiendo. 🌙✨</p>

                    <h4>El Bot Atiende, El Humano Enamora 💖</h4>
                    <p>Imagina que alguien escribe: <em>"¿A qué hora abren el domingo?"</em> o <em>"Precio del esmaltado tradicional."</em> ¿De verdad necesitas interrumpir un corte de cabello para responder eso en tu celular? ¡No!</p>
                    <p>Nilah responde al instante, con suavidad. Pero ojo, aquí viene la magia: Si tú notas que la clienta pregunta por un <strong>Diseño de Color Complejo</strong> (que requiere asesoría), tú puedes tomar el control.</p>

                    <h4>El Arte de Intervenir (Tomar el timón) ⚓</h4>
                    <p>Observas el chat desde tu compu o celular y dices: "Yo me encargo". Sigue estos sencillos pasos:</p>
                    <ol>
                        <li><strong>Escribe y pausa:</strong> En el instante en que haces clic para escribir y enviar un mensaje, Nilah entra en modo <em>Sleep</em> (Zzz) y ya no responde. Cede el control a la reina. 👑</li>
                        <li><strong>Brilla:</strong> Usa tu audios, explícale cómo su tipo de rostro quedaría bellísimo con ese flequillo, dile el coste exacto de su mecha. Cierra el trato.</li>
                        <li><strong>Regrésale el trabajo duro:</strong> Cuando le envíes el CBU para el adelanto de la cita, haz click en el botoncito superior de tu chat <em>"Activar Nilah IA"</em> para que el sistema vuelva a tomar guardia y le siga agendando si te descuidas.</li>
                    </ol>

                    <h4>Escudos Antibalas 🛡️</h4>
                    <p>Si entra un cliente grosero, o con preguntas que Nilah no reconozca, no hará el ridículo. La inteligencia de Nilah frena sola, y dice de manera muy fina: <em>"Quiero darte el mejor consejo para tu caso, así que estoy derivando tu duda directo a las especialistas. Dame un momento amor."</em> y te manda a ti una alerta roja. ¡Todo en perfectas manos! 🙌</p>
                `,
                proTip: "No desconectes a Nilah por miedo. Monitorea las conversaciones los primeros 2 días, haz intervenciones solo en tratamientos de más de S/200, y deja que el software barra todo el trabajo sucio e interrupciones menores. Gana tiempo para TI."
            }
        ]
    },
    {
        id: 'marketing-mastery',
        title: 'Mkt & Atracción (Impact Center)',
        description: 'Convierte seguidores en facturación. Deja de esperar que el cliente venga; tráelo tú.',
        icon: Megaphone,
        level: 'App Mastery',
        color: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
        articles: [
            {
                id: 'mkt-impact-center',
                title: 'Likes vs. Dinero en Efectivo: Conectando con los Números 💰📈',
                excerpt: 'Tener 20,000 seguidores en Instagram no paga la luz del salón. Aprende a convertir likes en citas con el Impact Center.',
                type: 'doc',
                readTime: '5 min',
                difficulty: 'Principiante',
                content: `
                    <h3>¿Estás Jugando a ser "Influencer" o a ser Empresaria? 👑</h3>
                    <p>Muchas de mis alumnas dueñas de salón viven frustradas. Tienen TikToks con 50mil <em>views</em> pero miran la agenda de los días Miércoles y... está deprimente. 🦗 Hay muchos grillos sonando y pocos secadores prendidos.</p>
                    
                    <p>El problema no eres tú ni el talento de tu equipo; es que <strong>los likes no pagan los sueldos</strong>. Tu nuevo mejor amigo comercial se llama el <strong>Nilah Impact Center</strong>. 🎯</p>

                    <h4>El Dashboard que te Dice las Verdades 📊</h4>
                    <p>Cuando tú envías una promoción desde Nilah (Ej. "Descuento por el Día de la Madre" a toda tu base), Nilah no te dice "Cuánta gente le dio like". Nilah te dice cosas de Empresaria Grande:</p>
                    <ul>
                        <li><strong>Tasa de Apertura (Open Rate):</strong> ¿Cuántas clientas leyeron tu mensaje en WhatsApp? (Pista: Si envías un texto súper aburrido, la apertura baja. Escribe con gracia. Usa un título que diga "Te echábamos de menos ✨").</li>
                        <li><strong>Clics Directos:</strong> De las que leyeron, ¿cuántas tocaron el link para agendar su turno? Esto te indica si tu oferta de valor (el "gancho") fue lo suficientemente jugoso. 🍏</li>
                        <li><strong>Citas Confirmadas (Retorno Monetario 🤑):</strong> Nilah suma automáticamente el dinero de las que sí fueron y te muestra: <em>"Campaña Día de la Madre generó S/4,350 en ganancia dura"</em>.</li>
                    </ul>

                    <h4>La Psicología de la Prueba y el Error 🧪</h4>
                    <p>No tienes que acertar a la primera. Manda un WhatsApp que diga: <em>"Promoción keratina 20%"</em>. Mide cuánto dinero hace.<br/><br/>A la semana siguiente intenta esto otro: <em>"¡Valeria! Tengo a mi experta capilar libre mañana por la tarde. Te tengo un regalito de S/50 a tu favor para un hidratante profundo."</em></p>
                    <p>¿Notas la diferencia de emoción? 🥹 Verás en el tablero de tu Impact Center cómo un mensaje emocional y personal hace ganar tres veces más dinero que el frío.</p>
                `,
                proTip: "No quemes tu lista enviando mensajes tipo folleto barato todos los lunes. Guarda las campañas para crear urgencia o para tratar a la clienta como VIP. 'Solo hay 5 turnos de decoloración y quise avisarte a ti primero'. La exclusividad vende. 💎"
            },
            {
                id: 'segmentation-mastery',
                title: 'No le vendas barba a la de Uñas (Magia de Segmentación) ✂️💅',
                excerpt: 'Por qué enviar campañas masivas y estúpidas arruina tu reputación, y cómo la Hiper-Segmentación salva tu marca.',
                type: 'masterclass',
                readTime: '7 min',
                difficulty: 'Avanzado',
                content: `
                    <h3>Hola al SPAM no deseado, Adiós al Cliente ❌</h3>
                    <p>¿Qué odiamos más que un banco llamándonos al mediodía a vendernos una tarjeta? Un salón de belleza al que vamos religiosamente a hacernos acrílicas... mandándonos una oferta de "Descuento en perfilado de Barba de Caballero" un sábado en la noche. 🤦‍♀️</p>
                    <p>Es insultante, y demuestra que a tu negocio la clienta le importa un rábano; solo eres un número en una base de datos mal llevada. El cliente saca sus garras, y te bloquea.</p>

                    <h4>El Superpoder de Nilah: Los Filtros Inteligentes 🔍💖</h4>
                    <p>El Growth Marketing moderno (lo que hacen las verdaderas potencias mundiales como Sephora u Olaplex) se basa en la RELEVANCIA. Si a mí me gusta cuidarme el cuerpo, quiero mis ofertas de masajes.</p>
                    <p>Así construyes las listas en Nilah para que llueva el dinero sin hartar a tus clientes:</p>
                    
                    <ol>
                        <li><strong>Tu Mina de Oro - Clientas VIP (Top LTV) 👑:</strong> Filtra a la gente que ha gastado más de X dinero en tu salón en el último año. A ellas NUNCA les mandes promos del "2x1". Ellas ya tienen plata. A ellas mándales: <em>"Hola Belén bonita, acaba de llegar un matizador italiano exclusivo y reservamos los primeros potes para ustedes, nuestras clientas oro. ¿Te agendamos?"</em></li>
                        <li><strong>Clientas Fantasmas (En Riesgo de Churn) 👻:</strong> Esas muchachas que venían cada 20 días y de repente, puf, hace 3 meses no pisan el salón. Ellas no necesitan un folleto, necesitan cariño. Envíales algo nostálgico.</li>
                        <li><strong>Target Cansado (Servicio Cruce) 💆‍♀️:</strong> Si viste que muchas chicas se hicieron Keratina (y tú tienes sus historiales), a los 90 días exactos, el sistema sabe que ese tratamiento se está bajando. Dispárale una campaña diciendo: <em>"Tu cabello debe estar pidiendo un retoque nutritivo, te ofrezco..."</em> ¡Venta directa! 🚀</li>
                    </ol>

                    <h4>Piloto Automático (Menos estrés, más paz) 🧘‍♀️</h4>
                    <p>Automatiza el amor. Dile a Nilah: <em>"A cada clienta en su cumpleaños a las 10:00AM quiero que le hables por su nombre con un cupón de felicitación."</em> Lo programas una vez asando tu café, y vas a ver el dinero entrar todo el mes de chicas viniendo a celebrar a tu salón. 🥂</p>
                `,
                proTip: "Enviar 30 WhatsApps hiper-segmentados genera el DOBLE de ingresos que el envío de 200 WhatsApps a lo loco. Segmenta y cuida a tu cliente como el bien más preciado que tu negocio tiene. 💎"
            }
        ]
    },

    // --- BUSINESS IQ PILLAR ---
    {
        id: 'finance-iq',
        title: 'Inteligencia Financiera IQ 🧠📊',
        description: 'La diferencia abismal entre "tener movimiento en la caja" y dejar dinero en tu bolsillo a fin de mes.',
        icon: BarChart3,
        level: 'Business IQ',
        color: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
        articles: [
            {
                id: 'ltv-masterclass',
                title: 'LTV: Por qué no deberías llorar al Gastar en Publicidad 😢➡🚀',
                excerpt: 'Comprende el "Ciclo de Vida Monetaria" (LTV), y cómo Silicon Valley escala sus cuentas multimillonarias aplicándolo a la belleza.',
                type: 'masterclass',
                readTime: '8 min',
                difficulty: 'Experto',
                content: `
                    <h3>¿Te da terror meter 100 dólares a Meta Ads? 💀</h3>
                    <p>Todas caemos aquí al principio. Pagas en Facebook Ads 30 soles para traer a 1 clienta al salón. Se asoma la mujer, le haces un corte de pelo de 40 soles... y cuando sacas cuentas descubres que casi solo ganaste 10 soles brutos. Sientes rabia y renuncias a la publicidad porque "no funciona". 🥵</p>
                    
                    <p>Piénsalo así: Has fallado por completo en ver <strong>la fotografía gigante de esta industria</strong>. Y hoy te vengo a revelar el secreto mejor guardado (el LTV). 💡</p>

                    <h4>El Valor de por Vida del Cliente (Life-Time Value) 🕰️💖</h4>
                    <p>Una clienta no vale su primer corte de pelo. Una clienta feliz, amarrada a tu marca con fidelidad, va a regresar <strong>en promedio unas 8 veces a lo largo del año</strong>. Y se mantendrá yendo a ti por al menos de dos a tres años si la tratas como una diva.</p>
                    <p>Saquemos la calculadora de empresaria grande:</p>
                    <ul>
                        <li>Corte cada 2 meses (S/40 x 6): <strong>S/240 al año</strong></li>
                        <li>Un cambio de look de color para el bautizo de su hermana: <strong>S/300 extras</strong></li>
                        <li>Comidas extras con productos (shampoo de la marca para cuidar su tinte): <strong>S/120</strong></li>
                        <li>Valor Anual = S/660. Por 3 años... <strong>Casi S/2,000 en facturación fría de un solo ser humano.</strong> 🔥💸</li>
                    </ul>

                    <h4>Entonces... ¿Fueron caros esos 30 Soles? 🤔</h4>
                    <p>¿Qué importa que en la <em>primera interacción</em> su corte costara casi lo mismo que lo que invertiste en captarla? Gastaste S/30 hoy, para firmar un <em>contrato a largo plazo por S/2,000</em>.</p>
                    <p>Eso se llama poseer un margen insano. Si tu peluquera y tu atención son Top, deberías inyectar todo el dinero que tengas a traer mujeres por publicidad (eso se conoce como tu Costo de Adquisición o CAC). Si las retienes bien, es un juego que ya ganaste abismalmente. 🏆</p>

                    <h4>Apalancamiento Constante 📈</h4>
                    <p>La misión no es traer tráfico loco, sino exprimir a amor y Cross-Selling tu listado actual:</p>
                    <ul>
                        <li><strong>Véndele la ampolla en silla (Up-Sell):</strong> Acostumbra a tus chicos a que siempre sumen 20 dólares de hidratación de paso. El ticket sube mágicamente.</li>
                        <li><strong>Frecuencia forzada:</strong> Usa Nilah para que ella no se "olvide" de ti. El sistema la va a citar con cariño antes de que tenga que buscar el número de la competencia en Google. 📅</li>
                    </ul>
                `,
                proTip: "Frecuentemente el LTV (lo que gastan a lo largo de los años) debe ser TRES VECES el CAC (lo que te costó pescarla). Si le sacas más jugo, eres la loba de Wall-Street en el mundo Beauty. ¡Invierte con furia, atiende con lujo! ✨"
            }
        ]
    },
    {
        id: 'strategy-mastery',
        title: 'Escalamiento e Imperio 👑🦁',
        description: 'Cómo abrir tu segunda y tercera sucursal con mentalidad de Sistemas sin perder la cordura.',
        icon: TrendingUp,
        level: 'Business IQ',
        color: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
        articles: [
            {
                id: 'churn-prevention',
                title: 'La Hemorragia Silenciosa del Negocio: El Churn 🩸✂️',
                excerpt: 'Entiende y tapa rápidamente la métrica letal que está matando sigilosamente la industria tradicional de los salones de belleza.',
                type: 'doc',
                readTime: '6 min',
                difficulty: 'Avanzado',
                content: `
                    <h3>¿Estás intentando llenar un balde lleno de agujeros? 🪣💧</h3>
                    <p>Nos volvemos adictas al ego de ver rostros nuevos cruzando la puerta de cristal tras poner Ads de Influencers. A fin de mes miras la agenda, tuvimos 100 altas de chicas nuevas... ¡brindis y champaña, somos millonarias! 🥂</p>
                    <p>Excepto que miras tus ganancias del semestre... y sigues teniendo la cuenta del banco estancada. Extraño, ¿verdad?</p>
                    
                    <p>Bienvenida a tu peor pesadilla, la Muerte de Carteras (o <strong>Churn Rate</strong>). Así como 100 chicas entraron por publicidad, unas 95 de tus clientas clásicas se fueron molestas, olvidadas o aburridas hacia la competencia del centro comercial por la puerta trasera. 🚪🏃‍♀️</p>

                    <h4>¿Por qué te dejan tus reinas? 💔</h4>
                    <p>Las investigaciones demuestran un dato durísimo. No te abandonan porque "cobraste muy caro de repente". Y sorprendentemente, la mayoría ni siquiera se va porque les quemaste un mecho o el corte salió horrible (tú sabes que trabajas bien, eso no te pasa siempre).</p>
                    <p>El casi el 70% de tus clientas fijas se despiden para siempre por la total: <strong>Indiferencia.</strong> 🧊</p>
                    <p>Sentían que te valdría cien hectáreas de campo si ellas desaparecían y jamás volvían. Nunca les pasaste un "Feliz Cumple", jamás un recordatorio cuando pasaron dos meses, era un negocio totalmente egoísta esperando cobrar su tajada. Y al menor destello de afecto de un estilista de enfrente, el divorcio está servido.</p>

                    <h4>El Algoritmo Cazador de Nilah 🦅</h4>
                    <p>Para esto diseñamos a Nilah. Es literal tu escudo protector de facturación.</p>
                    <p>Ve directo a Nilah campañas, filtra a todos los que tienen la etiqueta <em>"High Churn Risk (Riesgo alto de fuga hace 90 días)"</em>. Mandales a estas pobres almas abandonadas este texto:</p>
                    <p><em>"María, estoy preocupada... ¿Hicimos algo mal? Han pasado 4 largos meses desde que iluminaste el local con ese planchado y de corazón tu fidelidad ha empujado este negocio adelante. 🥺 Me encantaría invitarte un detox capilar por cuenta de la dueña la semana que viene... dime si nos dejas recibirte. 💖"</em></p>
                    <p>Los corazones se derriten, la empatía explota, y la goteadera de agujeros en tu balde de ingresos quedará reparada.</p>
                `,
                proTip: "Apunta a revisar tu tablón de 'Clientes Perdidos' como una rutina sagrada de viernes en la noche, con un vinito en mano. Tráelas a casa antes de que abran la app para buscar The New Local. 🍷💅"
            },
            {
                id: 'systematization',
                title: 'De Auto-empleada Explotada a Empresaria Libre 🧘‍♀️🚀',
                excerpt: 'Si tu salón estalla en llamadas nerviosas de tu equipo cuando te vas a hacer mercado, tienes un empleo pésimamente pagado.',
                type: 'masterclass',
                readTime: '9 min',
                difficulty: 'Experto',
                content: `
                    <h3>La Trampa Romántica del Artesano Estrella 🌟⛓️</h3>
                    <p>Seamos sinceras, querida. Tú abriste este salón de altísimo nombre porque tienes unas manos benditas para el color y el corte. Eras inigualable. Dijiste "renuncio a enriquecer a los jefes, abro esto porque no quiero un explotador".</p>
                    <p>Y felicidades, ahora en vez del explotador, tú trabajas las pascuas, sábados y domingos a las 9 PM. Eres dueña, la esclava de ti misma. 🥲</p>
                    
                    <h4>El Santo Grial: Sistematizar tu Negocio 📖⚙️</h4>
                    <p>Un local <strong>NO</strong> es una empresa real hasta que no es una máquina aburrida y precisa de replicar excelencia operando mágicamente con o sin ti. 🪄</p>
                    <p>¿Quieres escalar y abrir un segundo local boutique en esa calle tan elegante? Tienes que dejar de ser "la artista talentosa que atiende en el local 1" y comenzar urgentemente a ser la CEO Directora que escribe las reglas del juego.</p>

                    <h4>Paso 1: Documentación Cruda (Crea tu Biblia) 📜</h4>
                    <p>Deja de gritar por cosas obvias y delegar a la loca. Comienza a asentar guías que un mono espacial debería entender sobre cómo ocurre cada milímetro de experiencia en tu local:</p>
                    <ul>
                        <li><strong>Manual de Arranque a las 8 AM:</strong> Cuáles son las luces exactas que se ponen calientes, de qué frasco viene el aromatizante, y si la cafetera debe ya servir Latte a las 8:05AM en punto sin fallar. ☕✨</li>
                        <li><strong>Recepción (La Joya Mayor) 💁‍♀️:</strong> Cómo demonios quiere la Dueña que se responda al saludo, los manuales exactos del software y las reglas estrictas de dar "El Café o el Gin" a los 2 minutos que se sienta y lee Vogue.</li>
                        <li><strong>Drama Management 🧯:</strong> Cuando le destrocen un poco de cabello a la VIP, qué poder de decisión en SÓLES tiene la administradora para invitar el tratamiento de nutrición intenso para arreglar y comprar perdón automático para impedir la catástrofe en redes sin acudir directo a ti.</li>
                    </ul>

                    <h4>Paso 2: Exprime la Tecnología Integrada 💻🤖</h4>
                    <p>Ningún humano puede registrar a pelo cuántas horas desde la última visita ha pasado cada cliente. Apóyate violentamente en tu ecosistema, usa plataformas completas para agendar, lanzar WhatsApps solos, capturar el estado financiero sin usar tu Excel. Cuando veas que tu máquina rueda automatizada como Tesla Motors el 60% del día operativo... ¡Alégrate! Ahora sí, el Imperio espera tu apertura a nivel nacional. 👑🦅</p>
                `,
                proTip: "No te afanes pretendiendo hacer la enciclopedia de Wikipedia completa esta misma semana. Agarra Post-its rosas cada vez que sientas fuego y coraje de algo que se hizo mal en el salón en el día a día. Haz un manual de de 3 líneas del 'Por qué es inaceptable eso' y listo. Cultura lograda semana tras semana. 🎉💖"
            }
        ]
    }
];
