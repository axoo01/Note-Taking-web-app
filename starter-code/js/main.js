import * as storage from "./storage.js";
import * as ui from "./ui.js";
import * as themes from "./themes.js";

// ===============================
// GLOBAL STATE
// ===============================
let notes = [];              // all notes
let activeNoteId = null;     // currently selected note
let currentView = "all";     // "all" or "archived"
let selectedTag = null;      // currently selected tag
let searchQuery = "";        // used for final notes

// store original notes UI so we can restore it
let notesViewHTML = "";

// UI screen state (notes vs settings)
let currentScreen = "notes"; // "notes" | "settings"


// ===============================
// APP INITIALIZATION
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("App started");

  themes.applyTheme("light");
  themes.applyFont("serif");

  ui.cacheElements();

  // Load notes from localStorage
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

  // Set first note as active
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

  // 1️⃣ Archive filter
  filtered =
    currentView === "archived"
      ? filtered.filter(n => n.isArchived)
      : filtered.filter(n => !n.isArchived);

  // 2️⃣ Tag filter
  if (selectedTag) {
    filtered = filtered.filter(note =>
      note.tags.includes(selectedTag)
    );
  }

  // 3️⃣ Search filter
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
// SWITCH VIEW (SINGLE SOURCE OF TRUTH)
// ===============================
const switchView = (view) => {

  const contentGrid = document.querySelector(".content-grid");

  // ===============================
  // 👉 SWITCH TO SETTINGS
  // ===============================
  if (view === "settings") {
    currentScreen = "settings";

    // 🔥 ADD THIS LINE (important)
    contentGrid.classList.add("settings-active");

    renderSettingsView();
    return;
  }

  // ===============================
  // 👉 LEAVING SETTINGS → BACK TO NOTES
  // ===============================
  if (currentScreen === "settings") {

  document.querySelector("#appContent").innerHTML = notesViewHTML;

  listenersAttached = false;
  setupEventListeners();

  currentScreen = "notes";

  updateSidebarActive(); // 🔥 FIXES ARCHIVE / NAV ISSUE
}

  // ===============================
  // 👉 NORMAL NOTES VIEW
  // ===============================
  currentView = view;

  updateSidebarActive();

  const filtered = getFinalFilteredNotes();
  activeNoteId = filtered[0]?.id || null;

  ui.renderAllNotes(filtered, activeNoteId);

  if (activeNoteId) {
    ui.renderNoteDetails(filtered.find(n => n.id === activeNoteId));
  } else {
    ui.clearEditor();
  }
};


// ===============================
// SETTINGS
// ===============================
const renderSettingsView = () => {
  const container = document.querySelector("#appContent");

  container.innerHTML = `
    <div class="settings-layout">

      <!-- LEFT MENU -->
      <aside class="settings-menu">
        <button class="settings-item active" data-section="theme">
          <img src="./assets/images/icon-sun.svg" class="settings-icon"/>
          Color Theme
        </button>

        <button class="settings-item" data-section="font">
          <img src="./assets/images/icon-font.svg" class="settings-icon"/>
          Font Theme
        </button>

        <button class="settings-item" data-section="password">
          <img src="./assets/images/icon-lock.svg" class="settings-icon"/>
          Change Password
        </button>

        <button class="settings-item">
          <img src="./assets/images/icon-logout.svg" class="settings-icon"/>
          Logout
        </button>
      </aside>

      <!-- RIGHT PANEL -->
      <section class="settings-content">

        <div id="theme" class="settings-panel active">
          <h2>Color Theme</h2>
          <p class="settings-desc">Choose your color theme:</p>

          <div class="settings-cards">

            <div class="settings-card active" data-theme="light">
              <div class="card-left">
                <img src="./assets/images/icon-sun.svg" />
                <div>
                  <h4>Light Mode</h4>
                  <p>Pick a clean and classic light theme</p>
                </div>
              </div>
              <div class="radio active"></div>
            </div>

            <div class="settings-card" data-theme="dark">
              <div class="card-left">
                <img src="./assets/images/icon-moon.svg" />
                <div>
                  <h4>Dark Mode</h4>
                  <p>Select a sleek and modern dark theme</p>
                </div>
              </div>
              <div class="radio"></div>
            </div>

            <div class="settings-card" data-theme="system">
              <div class="card-left">
                <img src="./assets/images/icon-system-theme.svg" />
                <div>
                  <h4>System</h4>
                  <p>Adapts to your device's theme</p>
                </div>
              </div>
              <div class="radio"></div>
            </div>

          </div>

          <div class="settings-footer">
            <button class="primary-btn" id="applySettingsBtn">
              Apply Changes
            </button>
          </div>

        </div>

      </section>
    </div>

   <div id="font" class="settings-panel">
    <h2>Font Theme</h2>
    <p class="settings-desc">Choose your font:</p>

    <div class="settings-cards">

        <div class="settings-card" data-font="sans">
        <div class="card-left">
            <div>
            <h4>Sans-serif</h4>
            <p>Clean and modern</p>
            </div>
        </div>
        </div>

        <div class="settings-card" data-font="serif">
        <div class="card-left">
            <div>
            <h4>Serif</h4>
            <p>Classic and elegant</p>
            </div>
        </div>
        </div>

        <div class="settings-card" data-font="mono">
        <div class="card-left">
            <div>
            <h4>Monospace</h4>
            <p>Technical style</p>
            </div>
        </div>
        </div>

    </div>
    </div>
  `;

  setupSettingsListeners();
};


// ===============================
// SETTINGS LISTENERS (FULL FIXED)
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

  // ===============================
  // LEFT MENU (Theme / Font switching)
  // ===============================
  document.querySelectorAll(".settings-item").forEach(btn => {
    btn.addEventListener("click", () => {

      const section = btn.dataset.section;

      // highlight menu
      document.querySelectorAll(".settings-item").forEach(b =>
        b.classList.remove("active")
      );
      btn.classList.add("active");

      // switch panels safely
      document.querySelectorAll(".settings-panel").forEach(p =>
        p.classList.remove("active")
      );

      const panel = document.getElementById(section);
      if (panel) panel.classList.add("active");
    });
  });


  // ===============================
  // THEME SELECTION
  // ===============================
 const themeContainer = document.querySelector(".settings-cards");

if (themeContainer) {
  themeContainer.addEventListener("click", (e) => {

    const card = e.target.closest("[data-theme]");
    if (!card) return;

    pendingTheme = card.dataset.theme;

    document.querySelectorAll("[data-theme]").forEach(c => {
      c.classList.remove("active");
      c.querySelector(".radio")?.classList.remove("active");
    });

    card.classList.add("active");
    card.querySelector(".radio")?.classList.add("active");

    console.log("Theme selected:", pendingTheme);
  });
}


  // ===============================
  // FONT SELECTION
  // ===============================
  document.querySelectorAll("[data-font]").forEach(card => {
    card.addEventListener("click", () => {

      pendingFont = card.dataset.font;

      document.querySelectorAll("[data-font]").forEach(c => {
        c.classList.remove("active");
      });

      card.classList.add("active");
    });
  });


  // ===============================
  // APPLY BUTTON
  // ===============================
 const applyBtn = document.querySelector("#applySettingsBtn");

if (applyBtn) {
  applyBtn.addEventListener("click", () => {

    console.log("APPLY CLICKED"); // 🔥 MUST SHOW

    let finalTheme = pendingTheme;

    if (pendingTheme === "system") {
      finalTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    console.log("FINAL THEME:", finalTheme);

    themes.applyTheme(finalTheme);

    console.log(
      "AFTER APPLY:",
      document.documentElement.getAttribute("data-theme")
    );

    const prefs = storage.loadPreferences() || {};
    prefs.theme = pendingTheme;
    storage.savePreferences(prefs);
  });
}
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