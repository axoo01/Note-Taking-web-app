let elements = {};

export const cacheElements = () => {
  elements = {
    notesList: document.querySelector("#notesList"),

    noteTitle: document.querySelector("#noteTitle"),
    noteTags: document.querySelector("#noteTags"),
    noteDate: document.querySelector("#noteDate"),
    noteContent: document.querySelector("#noteContent"),

    createBtn: document.querySelector("#createNoteBtn"),
    saveBtn: document.querySelector("#saveNoteBtn"),

    archiveBtn: document.querySelector("#archiveBtn"),
    deleteBtn: document.querySelector("#deleteBtn"),
    searchInput: document.querySelector("#searchInput"),
  };

  console.log("Cached UI elements:", elements);
};

export const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const renderNote = (note, isActive = false) => {
  return `
    <article 
      class="note-card ${isActive ? "note-card--active" : ""}" 
      tabindex="0"
      data-id="${note.id}"
    >
      <h3>${note.title}</h3>

      <div class="note-card__tags">
        ${note.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join("")}
      </div>

      <p>${formatDate(note.lastEdited)}</p>
    </article>
  `;
};

export const renderAllNotes = (notes, activeId = null) => {
  elements.notesList.innerHTML = notes
    .map(note => renderNote(note, note.id === activeId))
    .join("");
};

// Fill editor with note data
export const renderNoteDetails = (note) => {
  if (!note) return;

  elements.noteTitle.textContent = note.title;
  elements.noteTags.textContent = note.tags.join(", ");
  elements.noteDate.textContent = formatDate(note.lastEdited);
  elements.noteContent.innerHTML = note.content.replace(/\n/g, "<br>");

  const archiveText = document.querySelector("#archiveText");

if (archiveText) {
  if (note.isArchived) {
    archiveText.textContent = "Restore Note";
  } else {
    archiveText.textContent = "Archive Note";
  }
}
};

// Clear editor for new note
export const clearEditor = () => {
  elements.noteTitle.textContent = "";
  elements.noteTags.textContent = "";
  elements.noteContent.textContent = "";
};

// ===============================
// MODAL
// ===============================
export const showModal = ({ title, message, confirmText, color = "red" }) => {
  const overlay = document.querySelector("#modalOverlay");
  const titleEl = document.querySelector("#modalTitle");
  const msgEl = document.querySelector("#modalMessage");
  const confirmBtn = document.querySelector("#modalConfirm");

  overlay.classList.remove("hidden");

  titleEl.textContent = title;
  msgEl.textContent = message;
  confirmBtn.textContent = confirmText;

  // color logic
  confirmBtn.style.background =
    color === "red" ? "var(--red-500)" : "var(--blue-500)";

  return new Promise((resolve) => {
    document.querySelector("#modalCancel").onclick = () => {
      overlay.classList.add("hidden");
      resolve(false);
    };

    confirmBtn.onclick = () => {
      overlay.classList.add("hidden");
      resolve(true);
    };
  });
};


// ===============================
// TOAST
// ===============================
export const showToast = (message, actionText, actionCallback) => {
  const toast = document.querySelector("#toast");
  const msg = document.querySelector("#toastMessage");
  const link = document.querySelector("#toastLink");

  toast.classList.remove("hidden");
  msg.textContent = message;

  link.textContent = actionText;
  link.onclick = actionCallback;

  document.querySelector("#toastClose").onclick = () => {
    toast.classList.add("hidden");
  };

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
};