/* Egyptian Football Culture Manager Handle Generator */

const FIRST_NAMES = [
  "El-Kapten",
  "El-Mister",
  "El-Gaffer",
  "El-Basha",
  "El-Don",
  "El-Sultan",
  "El-Maestro",
  "Coach",
  "Khedewy",
  "General",
  "Amo",
  "Ustaz",
  "Captain",
];

const LAST_NAMES = [
  "Salah",
  "Zizo",
  "Aboutrika",
  "Shikabala",
  "El-Shenawy",
  "Hassan",
  "El-Gohary",
  "Metwally",
  "Hegazi",
  "Trezeguet",
  "Sobhi",
  "El-Sayed",
  "Fathy",
  "Afsha",
  "Marmoush",
  "El-Neny",
  "Emam",
  "Wael",
  "Gomaa",
];

export function randomEgyptianManagerName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}
