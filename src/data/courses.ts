import acrilicasImg from "@/assets/course-acrilicas.jpg";
import semiImg from "@/assets/course-semi.jpg";
import nailartImg from "@/assets/course-nailart.jpg";
import rusaImg from "@/assets/course-rusa.jpg";
import negocioImg from "@/assets/course-negocio.jpg";
import kappingImg from "@/assets/course-kapping.jpg";

export type CourseLevel = "Principiante" | "Intermedio" | "Avanzado" | "Negocio";
export type CourseCategory = "Principiante" | "Intermedio" | "Avanzado" | "Negocio" | "Nail Art";

export interface Course {
  slug: string;
  title: string;
  category: CourseCategory;
  level: CourseLevel;
  shortDescription: string;
  description: string;
  image: string;
  modules: number;
  lessons: number;
  duration: string;
  price: number;
  includedInMembership: boolean;
  status: "available" | "coming-soon";
  learnings: string[];
  audience: string[];
  bonuses: string[];
  curriculum: { title: string; lessons: string[] }[];
}

export const courses: Course[] = [
  {
    slug: "unas-acrilicas-desde-cero",
    title: "Uñas Acrílicas desde Cero",
    category: "Principiante",
    level: "Principiante",
    shortDescription: "Aprendé la técnica acrílica paso a paso, desde la preparación hasta el acabado profesional.",
    description:
      "Un curso completo para que arranques en el mundo de las uñas acrílicas con bases sólidas, técnica limpia y resultados premium desde tu primera práctica.",
    image: acrilicasImg,
    modules: 6,
    lessons: 28,
    duration: "5h 40m",
    price: 89,
    includedInMembership: true,
    status: "available",
    learnings: [
      "Preparar la uña natural correctamente",
      "Dominar la relación líquido-polvo",
      "Aplicar tips y formas básicas",
      "Limar y dar forma profesional",
      "Acabado brillante y duradero",
    ],
    audience: [
      "Principiantes sin experiencia previa",
      "Manicuristas que quieren incorporar acrílico",
      "Emprendedoras del mundo de la belleza",
    ],
    bonuses: [
      "Lista de materiales y proveedores recomendados",
      "Plantillas de práctica imprimibles",
      "Guía de precios sugeridos",
    ],
    curriculum: [
      { title: "Bienvenida y materiales", lessons: ["Tu kit de inicio", "Higiene y bioseguridad", "Conociendo tu mesa de trabajo"] },
      { title: "Preparación profesional", lessons: ["Anatomía de la uña", "Cutícula y limpieza", "Pulido y deshidratado"] },
      { title: "Aplicación de acrílico", lessons: ["Líquido y polvo", "Primera bolita", "Modelado de la forma"] },
      { title: "Limado y forma", lessons: ["Limas y granulados", "Forma almendra", "Forma cuadrada y stiletto"] },
      { title: "Acabado y brillo", lessons: ["Sellado", "Top coat profesional", "Tips de durabilidad"] },
      { title: "Práctica final", lessons: ["Servicio completo", "Cómo cobrar tu trabajo", "Próximos pasos"] },
    ],
  },
  {
    slug: "kapping-profesional",
    title: "Nivelación y Kapping Profesional",
    category: "Intermedio",
    level: "Intermedio",
    shortDescription: "Lográ uñas perfectamente niveladas con la técnica de kapping en gel y acrílico.",
    description:
      "Aprendé a nivelar la lámina natural y crear una capa de protección impecable que prolonga el esmaltado y eleva la estética del trabajo.",
    image: kappingImg,
    modules: 5,
    lessons: 22,
    duration: "4h 20m",
    price: 79,
    includedInMembership: true,
    status: "available",
    learnings: [
      "Diagnóstico correcto de la lámina natural",
      "Nivelación con gel constructor",
      "Kapping con acrílico transparente",
      "Refuerzo en uñas débiles",
      "Acabado prolijo y natural",
    ],
    audience: ["Manicuristas con experiencia básica", "Profesionales que quieren mejorar la estética"],
    bonuses: ["Checklist de diagnóstico", "Tabla comparativa de geles"],
    curriculum: [
      { title: "Introducción al kapping", lessons: ["Qué es", "Cuándo usarlo", "Materiales"] },
      { title: "Nivelación con gel", lessons: ["Aplicación", "Curado", "Limado"] },
      { title: "Kapping en acrílico", lessons: ["Técnica", "Errores comunes"] },
      { title: "Refuerzo y reparación", lessons: ["Uñas débiles", "Reparación de fracturas"] },
      { title: "Acabado", lessons: ["Pulido", "Sellado natural"] },
    ],
  },
  {
    slug: "esmaltado-semipermanente",
    title: "Esmaltado Semipermanente Premium",
    category: "Principiante",
    level: "Principiante",
    shortDescription: "El semipermanente perfecto: sin levantamientos, brillo extremo y duración real.",
    description:
      "Una guía completa para que tus servicios de semipermanente duren más, se vean impecables y se conviertan en tu mejor carta de presentación.",
    image: semiImg,
    modules: 4,
    lessons: 18,
    duration: "3h 30m",
    price: 59,
    includedInMembership: true,
    status: "available",
    learnings: [
      "Preparación que evita levantamientos",
      "Aplicación capa por capa",
      "Sellado de borde libre",
      "Retiro sin dañar la uña",
    ],
    audience: ["Principiantes", "Manicuristas que tienen levantamientos frecuentes"],
    bonuses: ["Guía de marcas recomendadas", "Tabla de tiempos de curado por lámpara"],
    curriculum: [
      { title: "Bases del semi", lessons: ["Materiales", "Lámparas LED/UV"] },
      { title: "Preparación", lessons: ["Cutícula", "Deshidratado", "Primer"] },
      { title: "Aplicación", lessons: ["Base", "Color", "Top coat"] },
      { title: "Retiro y mantenimiento", lessons: ["Retiro correcto", "Cuidados al cliente"] },
    ],
  },
  {
    slug: "nail-art-comercial",
    title: "Nail Art Comercial",
    category: "Nail Art",
    level: "Intermedio",
    shortDescription: "Diseños rentables y modernos que tus clientas van a querer copiar de Instagram.",
    description:
      "Aprendé los diseños más solicitados del momento con técnicas rápidas, limpias y rentables para tu mesa de trabajo.",
    image: nailartImg,
    modules: 7,
    lessons: 32,
    duration: "6h 15m",
    price: 99,
    includedInMembership: true,
    status: "available",
    learnings: [
      "French moderno y baby boomer",
      "Foil y cromados",
      "Encapsulados sutiles",
      "Microart y línea fina",
      "Diseños minimalistas premium",
    ],
    audience: ["Manicuristas con técnica intermedia", "Profesionales que quieren subir el ticket promedio"],
    bonuses: ["50 referencias visuales", "Plantillas de práctica"],
    curriculum: [
      { title: "French y baby boomer", lessons: ["Pinceles", "Línea perfecta", "Degradé"] },
      { title: "Foil y cromados", lessons: ["Aplicación", "Sellado"] },
      { title: "Encapsulado", lessons: ["Flores secas", "Glitter"] },
      { title: "Microart", lessons: ["Líneas", "Puntillismo"] },
      { title: "Minimalismo premium", lessons: ["Combinaciones", "Composición"] },
      { title: "Tendencias 2025", lessons: ["Aura nails", "Velvet"] },
      { title: "Negocio del nail art", lessons: ["Cómo cobrar el extra"] },
    ],
  },
  {
    slug: "manicura-rusa",
    title: "Manicura Rusa y Preparación Perfecta",
    category: "Avanzado",
    level: "Avanzado",
    shortDescription: "La técnica más demandada del mundo. Cutícula impecable y resultado perfecto.",
    description:
      "Dominá la manicura rusa con seguridad: torno, fresas, ángulos y la rutina exacta para un acabado de salón premium.",
    image: rusaImg,
    modules: 6,
    lessons: 26,
    duration: "5h 10m",
    price: 119,
    includedInMembership: false,
    status: "available",
    learnings: [
      "Torno y fresas: cuál usar y cuándo",
      "Ángulos seguros sobre cutícula",
      "Preparación del eponiquio",
      "Acabado limpio sin sangrado",
    ],
    audience: ["Profesionales con experiencia", "Manicuristas que quieren especializarse"],
    bonuses: ["Guía de fresas con foto y uso", "Protocolo de bioseguridad"],
    curriculum: [
      { title: "Introducción", lessons: ["Historia", "Mitos y verdades"] },
      { title: "Torno y fresas", lessons: ["Tipos", "Velocidades"] },
      { title: "Ángulos", lessons: ["Posición de la mano", "Práctica guiada"] },
      { title: "Preparación profunda", lessons: ["Eponiquio", "Pterigión"] },
      { title: "Acabado", lessons: ["Pulido", "Hidratación"] },
      { title: "Servicio completo", lessons: ["Tiempos", "Precio sugerido"] },
    ],
  },
  {
    slug: "negocio-de-unas",
    title: "Cómo Iniciar tu Negocio de Uñas",
    category: "Negocio",
    level: "Negocio",
    shortDescription: "De pasión a profesión: precios, clientas, marca personal y agenda llena.",
    description:
      "Todo lo que la academia tradicional no te enseña: cómo cobrar, atraer clientas, construir tu marca y vivir de las uñas.",
    image: negocioImg,
    modules: 5,
    lessons: 20,
    duration: "4h",
    price: 69,
    includedInMembership: true,
    status: "available",
    learnings: [
      "Calcular precios reales y rentables",
      "Crear tu marca personal",
      "Estrategia de Instagram simple",
      "Conseguir clientas recurrentes",
      "Organizar tu agenda y finanzas",
    ],
    audience: ["Manicuristas que recién empiezan", "Profesionales que quieren formalizar su negocio"],
    bonuses: ["Plantilla de cálculo de precios", "Guía de contenido para 30 días"],
    curriculum: [
      { title: "Tu propuesta de valor", lessons: ["Quién es tu clienta ideal", "Tu diferencial"] },
      { title: "Precios rentables", lessons: ["Costos fijos y variables", "Margen sano"] },
      { title: "Marca personal", lessons: ["Nombre y logo", "Paleta visual"] },
      { title: "Instagram simple", lessons: ["Bio", "Reels que venden"] },
      { title: "Clientas y agenda", lessons: ["Reservas", "Fidelización"] },
    ],
  },
];

courses.push(
  {
    slug: "esculpidas-en-molde",
    title: "Uñas Esculpidas en Molde",
    category: "Avanzado",
    level: "Avanzado",
    shortDescription: "La técnica más versátil para crear largo y formas imposibles con molde.",
    description:
      "Aprendé a esculpir uñas extra largas con molde y dominar las formas más demandadas: stiletto, ballerina, coffin y edge.",
    image: acrilicasImg,
    modules: 5,
    lessons: 24,
    duration: "4h 50m",
    price: 99,
    includedInMembership: true,
    status: "available",
    learnings: [
      "Colocación perfecta del molde",
      "Construcción del arco C",
      "Esculpido en stiletto, ballerina y coffin",
      "Equilibrio y simetría",
    ],
    audience: ["Manicuristas con experiencia básica", "Profesionales que quieren ofrecer largos extremos"],
    bonuses: ["Plantillas de moldes imprimibles", "Tabla de pricing para largo extra"],
    curriculum: [
      { title: "Introducción al molde", lessons: ["Tipos de molde", "Cuándo usar molde vs. tip"] },
      { title: "Apoyo y colocación", lessons: ["Ajuste sin levantar", "Ángulo correcto"] },
      { title: "Construcción", lessons: ["Bolita de arco", "Modelado del cuerpo"] },
      { title: "Formas avanzadas", lessons: ["Stiletto", "Ballerina", "Coffin"] },
      { title: "Acabado", lessons: ["Limado de forma", "Pulido espejo"] },
    ],
  },
  {
    slug: "pedicuria-spa",
    title: "Pedicuría Spa Profesional",
    category: "Intermedio",
    level: "Intermedio",
    shortDescription: "Servicio de pedicuría de salón premium que tus clientas van a amar.",
    description:
      "Una rutina completa de pedicuría spa: desde el diagnóstico hasta el masaje y el esmaltado impecable que dura semanas.",
    image: semiImg,
    modules: 5,
    lessons: 20,
    duration: "3h 50m",
    price: 75,
    includedInMembership: true,
    status: "available",
    learnings: [
      "Diagnóstico y bioseguridad",
      "Tratamiento de callos y durezas",
      "Masaje relajante con técnica",
      "Esmaltado semipermanente en pies",
    ],
    audience: ["Manicuristas que quieren sumar pedicuría", "Profesionales que quieren elevar su servicio"],
    bonuses: ["Lista de insumos spa", "Protocolo paso a paso"],
    curriculum: [
      { title: "Bioseguridad", lessons: ["Esterilización", "Patologías comunes"] },
      { title: "Tratamiento", lessons: ["Cutícula", "Callos"] },
      { title: "Masaje", lessons: ["Maniobras", "Aceites"] },
      { title: "Esmaltado", lessons: ["Preparación", "Color"] },
      { title: "Cierre del servicio", lessons: ["Pago", "Recomendaciones"] },
    ],
  },
  {
    slug: "diseno-3d-encapsulado",
    title: "Diseño 3D y Encapsulados de Lujo",
    category: "Nail Art",
    level: "Avanzado",
    shortDescription: "Flores secas, gemas, acrigel y encapsulados que se vuelven virales en Instagram.",
    description:
      "Aprendé a crear diseños 3D y encapsulados de alta gama: flores secas, foils metalizados, gemas y composiciones premium.",
    image: nailartImg,
    modules: 6,
    lessons: 28,
    duration: "5h 30m",
    price: 109,
    includedInMembership: false,
    status: "available",
    learnings: [
      "Encapsulado limpio sin burbujas",
      "Composición visual de un diseño",
      "Foil y cromados profesionales",
      "Aplicación de gemas duraderas",
    ],
    audience: ["Nail techs avanzadas", "Profesionales del nail art"],
    bonuses: ["Catálogo de proveedores premium", "100 referencias de diseño"],
    curriculum: [
      { title: "Materiales", lessons: ["Acrigel", "Flores secas", "Foils"] },
      { title: "Encapsulado", lessons: ["Capa fina", "Sellado de borde"] },
      { title: "Composición", lessons: ["Centro de interés", "Espacios negativos"] },
      { title: "Foils y cromados", lessons: ["Aplicación", "Top coat compatible"] },
      { title: "Gemas y 3D", lessons: ["Pegado durable", "Pirámide de tamaños"] },
      { title: "Foto y portfolio", lessons: ["Luz natural", "Edición rápida"] },
    ],
  },
  {
    slug: "instagram-para-manicuristas",
    title: "Instagram para Manicuristas",
    category: "Negocio",
    level: "Negocio",
    shortDescription: "Atraé clientas ideales sin bailar reels. Estrategia simple y constante.",
    description:
      "Una estrategia simple y replicable para llenar tu agenda usando Instagram, sin depender de algoritmos ni tendencias virales.",
    image: negocioImg,
    modules: 4,
    lessons: 18,
    duration: "3h 20m",
    price: 65,
    includedInMembership: true,
    status: "available",
    learnings: [
      "Bio que convierte en 5 segundos",
      "Plan de contenido de 30 días",
      "Reels rápidos sin bailar",
      "Cierre por DM sin parecer pesada",
    ],
    audience: ["Manicuristas con cuenta nueva", "Profesionales con poca constancia en Instagram"],
    bonuses: ["Calendario editorial editable", "Plantillas Canva premium"],
    curriculum: [
      { title: "Perfil que vende", lessons: ["Foto", "Bio", "Highlights"] },
      { title: "Contenido", lessons: ["Reels", "Carruseles", "Stories"] },
      { title: "Constancia", lessons: ["Bloques de creación", "Banco de ideas"] },
      { title: "Cierre por DM", lessons: ["Plantilla de mensajes", "Seguimiento"] },
    ],
  },
);

export const featuredCourses = courses.slice(0, 6);

export function getCourseBySlug(slug: string) {
  return courses.find((c) => c.slug === slug);
}