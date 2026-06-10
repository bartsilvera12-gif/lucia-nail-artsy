/**
 * Detecta si la pagina esta corriendo dentro del navegador embebido (in-app
 * browser) de una red social tipo Instagram, Facebook, TikTok, etc.
 *
 * Por que importa: estos browsers limitan JS, cookies, storage y popups, lo
 * que rompe checkouts de pasarelas de pago como Pagopar (el mapa o el iframe
 * de tarjeta se quedan cargando infinito, o el redirect no completa).
 *
 * Estrategia: leemos el User-Agent y buscamos firmas conocidas. No es 100%
 * preciso (los UA cambian), pero alcanza para mostrar un aviso preventivo
 * antes de empezar el flujo de pago.
 */
export type InAppHost =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "twitter"
  | "linkedin"
  | "snapchat"
  | "messenger"
  | "line"
  | "unknown-in-app";

export interface InAppBrowserInfo {
  inApp: boolean;
  host: InAppHost | null;
  /** "ios" | "android" | "other" — para mostrar instrucciones correctas */
  platform: "ios" | "android" | "other";
}

/** Lee el UA y deduce si estamos en un in-app browser. SSR-safe: en el server
 *  devuelve `{ inApp: false }` y no rompe el render. */
export function detectInAppBrowser(): InAppBrowserInfo {
  if (typeof navigator === "undefined") {
    return { inApp: false, host: null, platform: "other" };
  }
  const ua = navigator.userAgent || "";

  // Plataforma
  let platform: InAppBrowserInfo["platform"] = "other";
  if (/iPhone|iPad|iPod/i.test(ua)) platform = "ios";
  else if (/Android/i.test(ua)) platform = "android";

  // Detect hosts. Orden importa: algunos UAs incluyen mas de una firma
  // (ej. Instagram + FBAN), nos quedamos con el "mas chico" (Instagram).
  let host: InAppHost | null = null;
  if (/Instagram/i.test(ua)) host = "instagram";
  else if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) host = "facebook";
  else if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) host = "tiktok";
  else if (/Twitter/i.test(ua)) host = "twitter";
  else if (/LinkedInApp/i.test(ua)) host = "linkedin";
  else if (/Snapchat/i.test(ua)) host = "snapchat";
  else if (/Messenger/i.test(ua)) host = "messenger";
  else if (/Line\//i.test(ua)) host = "line";
  // Heuristica generica para webviews que no se identifican: WKWebView puro
  // en iOS no expone "Safari" en el UA. Solo lo marcamos como in-app si
  // ademas no es Safari/Chrome estandar y no es desktop.
  else if (
    platform === "ios" &&
    /AppleWebKit/i.test(ua) &&
    !/Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS/i.test(ua)
  ) {
    host = "unknown-in-app";
  } else if (
    platform === "android" &&
    /; wv\)/i.test(ua) // Android WebView clasico se identifica con "; wv)"
  ) {
    host = "unknown-in-app";
  }

  return { inApp: !!host, host, platform };
}

/** Texto humano del host para mostrar en la UI. */
export function hostLabel(host: InAppHost | null): string {
  switch (host) {
    case "instagram": return "Instagram";
    case "facebook":  return "Facebook";
    case "tiktok":    return "TikTok";
    case "twitter":   return "X (Twitter)";
    case "linkedin":  return "LinkedIn";
    case "snapchat":  return "Snapchat";
    case "messenger": return "Messenger";
    case "line":      return "Line";
    default:          return "esta app";
  }
}
