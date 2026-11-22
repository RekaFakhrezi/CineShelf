// Read old saved emoji values without rewriting the user's shelves.
export const SHELF_ICONS = [
  { name: "albums-outline", label: "Koleksi" },
  { name: "film-outline", label: "Film" },
  { name: "bulb-outline", label: "Ide" },
  { name: "cafe-outline", label: "Santai" },
  { name: "moon-outline", label: "Malam" },
  { name: "heart-outline", label: "Favorit" },
];
const legacyIcons = { "🌟": "albums-outline", "🍿": "film-outline", "🧠": "bulb-outline", "☕": "cafe-outline", "📁": "folder-outline", "🎬": "film-outline", "🔥": "flame-outline", "⚡": "flash-outline", "🌙": "moon-outline", "🎭": "happy-outline", "🚀": "rocket-outline" };
export function shelfIconName(value) {
  return legacyIcons[value] || (SHELF_ICONS.some(icon => icon.name === value) ? value : "folder-outline");
}
