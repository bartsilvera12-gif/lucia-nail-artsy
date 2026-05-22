export const site = {
  name: "Lucía Rojas Studio",
  tagline: "Academia privada de uñas online",
  admin: "Administrada por HorizontesWebIA",
  description:
    "Cursos online premium de uñas, comunidad privada, certificados y acompañamiento real para tu carrera profesional.",
  email: "hola@luciarojasstudio.com",
  phone: "+54 9 11 0000 0000",
  whatsapp: "+5491100000000",
  social: {
    instagram: "https://instagram.com/luciarojasstudio",
    tiktok: "https://tiktok.com/@luciarojasstudio",
  },
};

export const plans = [
  {
    id: "monthly",
    name: "Membresía Mensual",
    price: 29,
    period: "/ mes",
    description: "Acceso completo, renovación mensual flexible.",
    features: [
      "Espacio de Alumnos exclusivo",
      "Cursos incluidos en la membresía",
      "Bonos descargables",
      "Certificados al completar",
      "Cancelás cuando quieras",
    ],
    cta: "Empezar mensual",
    highlighted: false,
  },
  {
    id: "yearly",
    name: "Membresía Anual",
    price: 249,
    period: "/ año",
    description: "El mejor precio. Acceso completo durante 12 meses.",
    features: [
      "Todo lo del plan mensual",
      "Ahorrás más del 28%",
      "Bonos premium exclusivos",
      "Prioridad en novedades y lanzamientos",
      "Acceso a sesiones en vivo",
    ],
    cta: "Empezar anual",
    highlighted: true,
    badge: "Más elegido",
  },
  {
    id: "individual",
    name: "Curso Individual",
    price: 0,
    period: "desde",
    description: "Comprá el curso que necesitás, sin suscripción.",
    features: [
      "Acceso al curso elegido",
      "Certificado al completar",
      "Bonos del curso incluidos",
      "Sin suscripción mensual",
      "Pago único",
    ],
    cta: "Ver cursos",
    highlighted: false,
    individualPrice: true,
  },
] as const;

export const testimonials = [
  {
    name: "Camila Fernández",
    role: "Manicurista — Buenos Aires",
    initials: "CF",
    quote:
      "Empecé sin saber nada y en 3 meses ya tenía mi agenda llena. La forma de explicar de Lucía es clarísima y la comunidad es oro.",
    result: "Llené mi agenda en 3 meses",
  },
  {
    name: "Macarena Ríos",
    role: "Nail tech — Córdoba",
    initials: "MR",
    quote:
      "Subí mi precio un 40% después del curso de manicura rusa. Mis clientas notan la diferencia y vuelven siempre.",
    result: "Subí 40% mi precio",
  },
  {
    name: "Ana Belén Torres",
    role: "Emprendedora — Mendoza",
    initials: "AB",
    quote:
      "El curso de negocio cambió mi forma de cobrar. Por primera vez siento que tengo un negocio rentable, no un hobby.",
    result: "De hobby a negocio real",
  },
];

export const faqs = [
  {
    q: "¿Los cursos son en vivo o grabados?",
    a: "Los cursos son grabados para que puedas verlos a tu ritmo, las veces que necesites. Además hacemos sesiones en vivo periódicas para alumnas con membresía activa.",
  },
  {
    q: "¿Cuándo recibo el acceso?",
    a: "El acceso es inmediato. Apenas confirmamos tu pago, podés ingresar al panel de alumna y empezar a ver tu curso.",
  },
  {
    q: "¿Puedo ver las clases desde el celular?",
    a: "Sí. La plataforma está optimizada para celular, tablet y computadora. Tu progreso se guarda automáticamente.",
  },
  {
    q: "¿Recibo certificado?",
    a: "Sí. Al completar el 100% de un curso recibís un certificado digital con código único de validación.",
  },
  {
    q: "¿Qué pasa si cancelo mi suscripción?",
    a: "Podés cancelar cuando quieras desde tu panel. Mantenés el acceso hasta el final del período pagado.",
  },
  {
    q: "¿Puedo comprar un curso individual?",
    a: "Sí. Algunos cursos están disponibles como compra individual con acceso permanente, además de estar incluidos en la membresía.",
  },
];