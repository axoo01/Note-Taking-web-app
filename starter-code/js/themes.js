export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);

  updateIcons(theme);
};

export const applyFont = (fontName) => {
  document.documentElement.setAttribute("data-font", fontName);
};

export const updateIcons = (theme) => {
  document.querySelectorAll(".theme-icon").forEach(icon => {
    const base = icon.dataset.icon;

    if (!base) return;

    icon.src =
      theme === "dark"
        ? `./assets/images/${base}-dark.svg`
        : `./assets/images/${base}.svg`;
  });
};