/**
 * Formats time/season indicators for Rank questions into clean, human-readable labels.
 * e.g. "2026-08" -> "Through 2025/26" / "حتى موسم 2025/26"
 */
export function formatAsOfDate(dateStr?: string, locale: "en" | "ar" = "en"): string | null {
  if (!dateStr) return null;

  const clean = dateStr.trim();

  if (clean.includes("2026") || clean.includes("2025")) {
    return locale === "ar" ? "حتى موسم 2025/26" : "Through 2025/26";
  }

  if (clean.includes("2024")) {
    return locale === "ar" ? "حتى موسم 2024/25" : "Through 2024/25";
  }

  return locale === "ar" ? `حتى ${clean}` : `Through ${clean}`;
}

export interface CategoryBadgeInfo {
  label: string;
  style: string;
}

/**
 * Clean, minimal competition / category badge without noisy emojis or saturated backgrounds.
 */
export function getCategoryBadgeInfo(
  tags: string[] = [],
  scopeType?: string,
  title?: string,
  locale: "en" | "ar" = "en"
): CategoryBadgeInfo {
  const combined = [...tags, scopeType || "", title || ""].join(" ").toLowerCase();

  const minimalStyle = "border-slate-800 bg-slate-900/90 text-slate-300";

  if (combined.includes("champions-league") || combined.includes("ucl") || combined.includes("champions league")) {
    return {
      label: locale === "ar" ? "دوري أبطال أوروبا" : "CHAMPIONS LEAGUE",
      style: "border-blue-500/30 bg-slate-900/90 text-blue-300",
    };
  }
  if (combined.includes("europa-league") || combined.includes("uel") || combined.includes("europa league")) {
    return {
      label: locale === "ar" ? "الدوري الأوروبي" : "EUROPA LEAGUE",
      style: "border-amber-500/30 bg-slate-900/90 text-amber-300",
    };
  }
  if (combined.includes("conference-league") || combined.includes("uecl") || combined.includes("conference league")) {
    return {
      label: locale === "ar" ? "دوري المؤتمر" : "CONFERENCE LEAGUE",
      style: "border-emerald-500/30 bg-slate-900/90 text-emerald-300",
    };
  }
  if (combined.includes("world-cup") || combined.includes("fifa") || combined.includes("world cup")) {
    return {
      label: locale === "ar" ? "كأس العالم" : "WORLD CUP",
      style: "border-amber-500/30 bg-slate-900/90 text-amber-300",
    };
  }
  if (combined.includes("ballon-dor") || combined.includes("ballon d'or")) {
    return {
      label: locale === "ar" ? "الكرة الذهبية" : "BALLON D'OR",
      style: "border-yellow-500/30 bg-slate-900/90 text-yellow-300",
    };
  }
  if (combined.includes("golden-shoe") || combined.includes("golden shoe")) {
    return {
      label: locale === "ar" ? "الحذاء الذهبي" : "GOLDEN SHOE",
      style: "border-amber-500/30 bg-slate-900/90 text-amber-300",
    };
  }
  if (combined.includes("premier-league") || combined.includes("premier league") || combined.includes("pl")) {
    return {
      label: locale === "ar" ? "البريميرليج" : "PREMIER LEAGUE",
      style: "border-lime/30 bg-slate-900/90 text-slate-200",
    };
  }
  if (combined.includes("la-liga") || combined.includes("laliga") || combined.includes("la liga")) {
    return {
      label: locale === "ar" ? "الدوري الإسباني" : "LA LIGA",
      style: "border-slate-700 bg-slate-900/90 text-slate-200",
    };
  }
  if (combined.includes("serie-a") || combined.includes("serie a") || combined.includes("scudetto")) {
    return {
      label: locale === "ar" ? "الدوري الإيطالي" : "SERIE A",
      style: "border-slate-700 bg-slate-900/90 text-slate-200",
    };
  }
  if (combined.includes("bundesliga")) {
    return {
      label: locale === "ar" ? "الدوري الألماني" : "BUNDESLIGA",
      style: "border-slate-700 bg-slate-900/90 text-slate-200",
    };
  }
  if (combined.includes("afcon") || combined.includes("africa")) {
    return {
      label: locale === "ar" ? "أمم أفريقيا" : "AFCON",
      style: "border-emerald-500/30 bg-slate-900/90 text-emerald-300",
    };
  }
  if (combined.includes("copa-america") || combined.includes("copa américa")) {
    return {
      label: locale === "ar" ? "كوبا أمريكا" : "COPA AMÉRICA",
      style: "border-slate-700 bg-slate-900/90 text-slate-200",
    };
  }
  if (combined.includes("uefa euro") || combined.includes("euro titles") || combined.includes("euro")) {
    return {
      label: locale === "ar" ? "أمم أوروبا" : "UEFA EURO",
      style: "border-slate-700 bg-slate-900/90 text-slate-200",
    };
  }
  if (combined.includes("transfers") || combined.includes("transfer")) {
    return {
      label: locale === "ar" ? "سوق الانتقالات" : "TRANSFERS",
      style: "border-lime/30 bg-slate-900/90 text-lime",
    };
  }
  if (scopeType === "PLAYER_STINTS") {
    return {
      label: locale === "ar" ? "فترات النجوم" : "PLAYER STINTS",
      style: "border-lime/30 bg-slate-900/90 text-lime",
    };
  }

  return {
    label: locale === "ar" ? "أرقام كرة القدم" : "FOOTBALL HISTORY",
    style: minimalStyle,
  };
}
