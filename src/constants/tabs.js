export const tabs = [
  { id: "home", label: "Beranda", icon: "home" },
  { id: "film", label: "Film", icon: "film" },
  { id: "serial", label: "Serial", icon: "tv" },
  { id: "watchlist", label: "Watchlist", icon: "bookmark" },
  { id: "profile", label: "Profil", icon: "person" },
];

export const activeWidthMap = {
  home: 106,
  film: 86,
  serial: 94,
  watchlist: 114,
  profile: 92,
};

export function getTabGeometry(activeIndex, totalUsableW, activeTabId) {
  const desiredActiveW = activeWidthMap[activeTabId] || 98;
  const activeW = Math.min(desiredActiveW, totalUsableW * 0.36);
  const inactiveW = (totalUsableW - activeW) / (tabs.length - 1);

  const widths = [];
  const offsets = [];
  let curX = 0;
  for (let i = 0; i < tabs.length; i++) {
    const w = i === activeIndex ? activeW : inactiveW;
    widths.push(w);
    offsets.push(curX);
    curX += w;
  }
  return { widths, offsets, activeW, inactiveW };
}

