export const saveNotes = (notes) => {
  localStorage.setItem("notes", JSON.stringify(notes));
};

export const loadNotes = () => {
  const savedNotes = localStorage.getItem("notes");
  return savedNotes ? JSON.parse(savedNotes) : [];
};

export const savePreferences = (preferences) => {
  localStorage.setItem("preferences", JSON.stringify(preferences));
};

export const loadPreferences = () => {
  const savedPreferences = localStorage.getItem("preferences");
  return savedPreferences ? JSON.parse(savedPreferences) : {};
};

export const saveDraft = (draft) => {
  sessionStorage.setItem("noteDraft", JSON.stringify(draft));
};

export const loadDraft = () => {
  const savedDraft = sessionStorage.getItem("noteDraft");
  return savedDraft ? JSON.parse(savedDraft) : null;
};