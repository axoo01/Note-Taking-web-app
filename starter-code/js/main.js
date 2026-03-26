import * as storage from "./storage.js";
import * as ui from "./ui.js";
import * as themes from "./themes.js";

// ===============================
// GLOBAL STATE
// ===============================
let notes = [];               
let activeNoteId = null;     //stored app state in variables
let currentView = "all";     
let selectedTag = null;      
let searchQuery = "";        

// store original notes UI so we can restore it
let notesViewHTML = "";


let currentScreen = "notes"; // Ui screen state"notes" | "settings"


// ===============================
// APP INITIALIZATION
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("App started");

const savedPrefs = storage.loadPreferences() || {};

const initialTheme =
  savedPrefs.theme === "system"
    ? getSystemTheme()
    : savedPrefs.theme || "light";

themes.applyTheme(initialTheme);
themes.applyFont(savedPrefs.font || "serif");

pendingTheme = savedPrefs.theme || "light";
pendingFont = savedPrefs.font || "sans";  

  ui.cacheElements();

  notes = storage.loadNotes();

  // If empty → load from data.json
  if (!notes.length) {
    const response = await fetch("./data.json");
    const data = await response.json();

    notes = data.notes.map(note => ({
      ...note,
      id: crypto.randomUUID(),
    }));

    storage.saveNotes(notes);
  }


  const filtered = getFinalFilteredNotes();
  activeNoteId = filtered[0]?.id || null;

  // Initial rendering
  ui.renderAllNotes(filtered, activeNoteId);

  if (activeNoteId) {
    ui.renderNoteDetails(filtered.find(n => n.id === activeNoteId));
  }

  // Save initial notes layout
  notesViewHTML = document.querySelector("#appContent").innerHTML;

  const prefs = storage.loadPreferences();
  if (prefs) {
    themes.applyTheme(prefs.theme);
    themes.applyFont(prefs.font);
  }

  setupEventListeners();
});


// ===============================
// MASTER FILTER FUNCTION
// ===============================
const getFinalFilteredNotes = () => {
  let filtered = [...notes];

  // Archive filtering basically notes supposed to be viewed
  filtered =
    currentView === "archived"
      ? filtered.filter(n => n.isArchived)
      : filtered.filter(n => !n.isArchived);

  // Tag filter
  if (selectedTag) {
    filtered = filtered.filter(note =>
      note.tags.includes(selectedTag)
    );
  }

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();

    filtered = filtered.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
};


// ===============================
// UPDATE SIDEBAR ACTIVE STATE
// ===============================
const updateSidebarActive = () => {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((btn, index) => {
    btn.classList.remove("nav-item--active");

    if (
      (currentView === "all" && index === 0) ||
      (currentView === "archived" && index === 1)
    ) {
      btn.classList.add("nav-item--active");
    }
  });
};


// ===============================
// Swicthing VIEW 
// ===============================
const switchView = (view) => {
  const contentGrid = document.querySelector(".content-grid");

  // SWITCH TO SETTINGS
  if (view === "settings") {
  currentScreen = "settings";

  contentGrid.classList.add("settings-active");

  renderSettingsView();

  
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";

  themes.applyTheme(currentTheme);

  return;
}

  if (currentScreen === "settings") {
    document.querySelector("#appContent").innerHTML = notesViewHTML;
    contentGrid.classList.remove("settings-active");

    // re-cache the recreated notes DOM
    ui.cacheElements();

    setupEventListeners();

    currentScreen = "notes";
    updateSidebarActive();
  }

  
  currentView = view;

  updateSidebarActive();

  const filtered = getFinalFilteredNotes();
  activeNoteId = filtered[0]?.id || null;

  ui.renderAllNotes(filtered, activeNoteId);

  if (activeNoteId) {
    ui.renderNoteDetails(filtered.find((n) => n.id === activeNoteId));
  } else {
    ui.clearEditor();
  }
};


// ===============================
// SETTINGS
// ===============================
const renderSettingsView = () => {
  const container = document.querySelector("#appContent");
  const savedPrefs = storage.loadPreferences() || {};

  pendingTheme = savedPrefs.theme || "light";
  pendingFont = savedPrefs.font || "sans";

  container.innerHTML = `
    <div class="settings-layout">

      <!-- LEFT MENU -->
      <aside class="settings-menu">

  <button class="settings-item active" data-section="theme">
    <img 
      src="./assets/images/icon-sun.svg" 
      class="settings-icon theme-icon" 
      data-icon="icon-sun"
    />
    Color Theme
  </button>

  <button class="settings-item" data-section="font">
    <img 
      src="./assets/images/icon-font.svg" 
      class="settings-icon theme-icon" 
      data-icon="icon-font"
    />
    Font Theme
  </button>

  <button class="settings-item" data-section="password">
    <img 
      src="./assets/images/icon-lock.svg" 
      class="settings-icon theme-icon" 
      data-icon="icon-lock"
    />
    Change Password
  </button>

  <button class="settings-item">
    <img 
      src="./assets/images/icon-logout.svg" 
      class="settings-icon theme-icon" 
      data-icon="icon-logout"
    />
    Logout
  </button>

</aside>

      <!-- RIGHT PANEL -->
      <section class="settings-content">

        <!-- THEME PANEL -->
        <div id="theme" class="settings-panel active">
          <h2>Color Theme</h2>
          <p class="settings-desc">Choose your color theme:</p>

          <div class="settings-cards">
            <div class="settings-card ${pendingTheme === "light" ? "active" : ""}" data-theme="light">
              <div class="card-left">
                <div class="card-icon">
                  <img src="./assets/images/icon-sun.svg" class="theme-icon" data-icon="icon-sun"/>
                </div>
                <div>
                  <h4>Light Mode</h4>
                  <p>Pick a clean and classic light theme</p>
                </div>
              </div>
              <div class="radio ${pendingTheme === "light" ? "active" : ""}"></div>
            </div>

            <div class="settings-card ${pendingTheme === "dark" ? "active" : ""}" data-theme="dark">
              <div class="card-left">
                <div class="card-icon">
                  <img src="./assets/images/icon-moon.svg" class="theme-icon" data-icon="icon-moon"/>
                </div>
                <div>
                  <h4>Dark Mode</h4>
                  <p>Select a sleek and modern dark theme</p>
                </div>
              </div>
              <div class="radio ${pendingTheme === "dark" ? "active" : ""}"></div>
            </div>

            <div class="settings-card ${pendingTheme === "system" ? "active" : ""}" data-theme="system">
              <div class="card-left">
                <div class="card-icon">
                  <img src="./assets/images/icon-systemTheme.svg" class="theme-icon" data-icon="icon-systemTheme"/>
                </div>
                <div>
                  <h4>System</h4>
                  <p>Adapts to your device's theme</p>
                </div>
              </div>
              <div class="radio ${pendingTheme === "system" ? "active" : ""}"></div>
            </div>
          </div>
        </div>

        <!-- FONT PANEL -->
        <div id="font" class="settings-panel">
          <h2>Font Theme</h2>
          <p class="settings-desc">Choose your font:</p>

          <div class="settings-cards">
            <div class="settings-card ${pendingFont === "sans" ? "active" : ""}" data-font="sans">
              <div class="card-left">
                <div>
                  <h4>Sans-serif</h4>
                  <p>Clean and modern</p>
                </div>
              </div>
            </div>

            <div class="settings-card ${pendingFont === "serif" ? "active" : ""}" data-font="serif">
              <div class="card-left">
                <div>
                  <h4>Serif</h4>
                  <p>Classic and elegant</p>
                </div>
              </div>
            </div>

            <div class="settings-card ${pendingFont === "mono" ? "active" : ""}" data-font="mono">
              <div class="card-left">
                <div>
                  <h4>Monospace</h4>
                  <p>Technical style</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PASSWORD PANEL -->
        <div id="password" class="settings-panel">
          <h2>Change Password</h2>
          <p class="settings-desc">This section is placeholder for now.</p>
        </div>

        <div class="settings-footer">
          <button class="primary-btn" id="applySettingsBtn">
            Apply Changes
          </button>
        </div>

      </section>
    </div>
  `;

  setupSettingsListeners();
};



// ===============================
// SETTINGS LISTENERS
// ===============================
let pendingTheme = "light";
let pendingFont = "sans";

const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const setupSettingsListeners = () => {
  console.log("SETTINGS LISTENERS ATTACHED");

  const container = document.querySelector(".settings-layout");
  if (!container) return;

  container.addEventListener("click", (e) => {
    // ===============================
    // LEFT MENU (Theme / Font switching)
    // ===============================
    const menuBtn = e.target.closest(".settings-item[data-section]");
    if (menuBtn) {
      const section = menuBtn.dataset.section;

      container.querySelectorAll(".settings-item").forEach((btn) => {
        btn.classList.remove("active");
      });
      menuBtn.classList.add("active");

      container.querySelectorAll(".settings-panel").forEach((panel) => {
        panel.classList.remove("active");
      });

      const panel = container.querySelector(`#${section}`);
      if (panel) panel.classList.add("active");
      return;
    }

    // ===============================
    // THEME SELECTION
    // ===============================
    const themeCard = e.target.closest(".settings-card[data-theme]");
    if (themeCard) {
      pendingTheme = themeCard.dataset.theme;

      container.querySelectorAll(".settings-card[data-theme]").forEach((card) => {
        card.classList.remove("active");
        card.querySelector(".radio")?.classList.remove("active");
      });

      themeCard.classList.add("active");
      themeCard.querySelector(".radio")?.classList.add("active");

      console.log("Theme selected:", pendingTheme);
      return;
    }

    // ===============================
    // FONT SELECTION
    // ===============================
    const fontCard = e.target.closest(".settings-card[data-font]");
    if (fontCard) {
      pendingFont = fontCard.dataset.font;

      container.querySelectorAll(".settings-card[data-font]").forEach((card) => {
        card.classList.remove("active");
      });

      fontCard.classList.add("active");

      console.log("Font selected:", pendingFont);
      return;
    }

    // ===============================
    // APPLY BUTTON
    // ===============================
    const applyBtn = e.target.closest("#applySettingsBtn");
    if (applyBtn) {
      const finalTheme =
        pendingTheme === "system"
          ? getSystemTheme()
          : pendingTheme;

      themes.applyTheme(finalTheme);
      themes.applyFont(pendingFont);

      const currentPrefs = storage.loadPreferences() || {};
      currentPrefs.theme = pendingTheme;
      currentPrefs.font = pendingFont;
      storage.savePreferences(currentPrefs);

      console.log("Applied:", currentPrefs);
      console.log("Current theme attr:", document.documentElement.getAttribute("data-theme"));
      console.log("Current font attr:", document.documentElement.getAttribute("data-font"));
    }
  });
};


// ===============================
// EVENT LISTENERS
// ===============================
const setupEventListeners = () => {

  // ===============================
  // SETTINGS BUTTON
  // ===============================
  const settingsBtn = document.querySelector("#settingsBtn");

  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      switchView("settings");
    });
  }

  const notesList = document.querySelector("#notesList");

  // ===============================
  // NOTE SELECTION (EVENT DELEGATION)
  // ===============================
  notesList.addEventListener("click", (event) => {
    const noteCard = event.target.closest(".note-card");
    if (!noteCard) return;

    const noteId = noteCard.dataset.id;
    activeNoteId = noteId;

    const filtered = getFinalFilteredNotes();

    ui.renderAllNotes(filtered, activeNoteId);

    const selectedNote = notes.find(note => note.id === noteId);
    ui.renderNoteDetails(selectedNote);
  });


  // ===============================
  // CREATE NOTE
  // ===============================
  document.querySelector("#createNoteBtn").addEventListener("click", () => {
    const newNote = {
      id: crypto.randomUUID(),
      title: "Untitled Note",
      content: "",
      tags: [],
      isArchived: false,
      lastEdited: new Date().toISOString(),
    };

    notes.unshift(newNote);
    activeNoteId = newNote.id;

    const filtered = getFinalFilteredNotes();

    ui.renderAllNotes(filtered, activeNoteId);
    ui.clearEditor();

    document.querySelector("#noteTitle").focus();
  });


  // ===============================
  // SAVE NOTE
  // ===============================
  document.querySelector("#saveNoteBtn").addEventListener("click", () => {
    const title = document.querySelector("#noteTitle").textContent.trim();
    const tagsRaw = document.querySelector("#noteTags").textContent;

    const content = document
      .querySelector("#noteContent")
      .innerHTML
      .replace(/<br>/g, "\n")
      .trim();

    const tags = tagsRaw
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    notes = notes.map(note =>
      note.id === activeNoteId
        ? {
            ...note,
            title,
            content,
            tags,
            lastEdited: new Date().toISOString(),
          }
        : note
    );

    storage.saveNotes(notes);

    const filtered = getFinalFilteredNotes();

    ui.renderAllNotes(filtered, activeNoteId);
    ui.renderNoteDetails(notes.find(n => n.id === activeNoteId));
  });


  // ===============================
  // DELETE NOTE
  // ===============================
  document.querySelector("#deleteBtn").addEventListener("click", async () => {
    if (!activeNoteId) return;

    const confirmed = await ui.showModal({
      title: "Delete Note",
      message: "Are you sure you want to delete this note? This action cannot be undone.",
      confirmText: "Delete Note",
      color: "red"
    });

    if (!confirmed) return;

    notes = notes.filter(n => n.id !== activeNoteId);
    storage.saveNotes(notes);

    const filtered = getFinalFilteredNotes();
    activeNoteId = filtered[0]?.id || null;

    ui.renderAllNotes(filtered, activeNoteId);

    if (activeNoteId) {
      ui.renderNoteDetails(notes.find(n => n.id === activeNoteId));
    } else {
      ui.clearEditor();
    }
  });


  // ===============================
  // ARCHIVE TOGGLE
  // ===============================
  document.querySelector("#archiveBtn").addEventListener("click", async () => {
    if (!activeNoteId) return;

    const currentNote = notes.find(n => n.id === activeNoteId);
    const wasArchived = currentNote.isArchived;

    const confirmed = await ui.showModal({
      title: wasArchived ? "Restore Note" : "Archive Note",
      message: wasArchived
        ? "Do you want to restore this note?"
        : "Are you sure you want to archive this note?",
      confirmText: wasArchived ? "Restore" : "Archive",
      color: "blue"
    });

    if (!confirmed) return;

    notes = notes.map(note =>
      note.id === activeNoteId
        ? { ...note, isArchived: !note.isArchived }
        : note
    );

    storage.saveNotes(notes);

    const isNowArchived = !wasArchived;

    const filtered = getFinalFilteredNotes();
    activeNoteId = filtered[0]?.id || null;

    ui.renderAllNotes(filtered, activeNoteId);

    if (activeNoteId) {
      ui.renderNoteDetails(notes.find(n => n.id === activeNoteId));
    } else {
      ui.clearEditor();
    }

    ui.showToast(
      isNowArchived ? "Note archived." : "Note restored.",
      isNowArchived ? "Archived Notes" : "All Notes",
      () => {
        switchView(isNowArchived ? "archived" : "all");
      }
    );
  });


  // ===============================
  // SIDEBAR NAVIGATION
  // ===============================
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      switchView(index === 0 ? "all" : "archived");
    });
  });


  // ===============================
  // REAL-TIME SEARCH
  // ===============================
  document.querySelector("#searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value;

    const filtered = getFinalFilteredNotes();

    if (!filtered.find(n => n.id === activeNoteId)) {
      activeNoteId = filtered[0]?.id || null;
    }

    ui.renderAllNotes(filtered, activeNoteId);

    if (activeNoteId) {
      ui.renderNoteDetails(notes.find(n => n.id === activeNoteId));
    } else {
      ui.clearEditor();
    }
  });


  // ===============================
  // TAG FILTERING
  // ===============================
  const tagButtons = document.querySelectorAll(".tag-link");

  tagButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag;

      selectedTag = selectedTag === tag ? null : tag;

      tagButtons.forEach(b => b.classList.remove("active-tag"));
      if (selectedTag) btn.classList.add("active-tag");

      const filtered = getFinalFilteredNotes();
      activeNoteId = filtered[0]?.id || null;

      ui.renderAllNotes(filtered, activeNoteId);

      if (activeNoteId) {
        ui.renderNoteDetails(filtered.find(n => n.id === activeNoteId));
      } else {
        ui.clearEditor();
      }
    });
  });
};