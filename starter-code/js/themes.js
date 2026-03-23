export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

export const applyFont = (fontName) => {
  document.documentElement.setAttribute("data-font", fontName);
};