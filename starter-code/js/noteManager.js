export class Note {
  constructor(title, content = "", tags = []) {
    this.id = crypto.randomUUID();
    this.title = title;
    this.content = content;
    this.tags = tags;
    this.category = null;
    this.isArchived = false;
    this.lastEdited = new Date().toISOString();
    this.location = null;
  }

  archive() {
    this.isArchived = !this.isArchived;
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }
}

export const createNote = (title, content, tags) => {
  return new Note(title, content, tags);
};

export const deleteNote = (notes, id) => {
  return notes.filter((note) => note.id !== id);
};

export const updateNote = (notes, id, updates) => {
  return notes.map((note) =>
    note.id === id
      ? { ...note, ...updates, lastEdited: new Date().toISOString() }
      : note
  );
};

export const searchNotes = (notes, query) => {
  const normalizedQuery = query.trim().toLowerCase();

  return notes.filter((note) => {
    return (
      note.title.toLowerCase().includes(normalizedQuery) ||
      note.content.toLowerCase().includes(normalizedQuery) ||
      note.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  });
};

export const filterByTag = (notes, tag) => {
  return notes.filter((note) => note.tags.includes(tag));
};