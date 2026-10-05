import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  folder_id: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  is_favorite: boolean;
}

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  is_favorite: boolean;
}

interface ChatHistoryItem {
  id: number;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}

const nowIso = () => new Date().toISOString();

let nextFolderId = 3;
let nextNoteId = 4;
let nextChatId = 1;

const folders: Folder[] = [
  {
    id: 1,
    name: "Công việc",
    parent_id: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    is_deleted: false,
    deleted_at: null,
    is_favorite: true,
  },
  {
    id: 2,
    name: "Cá nhân",
    parent_id: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    is_deleted: false,
    deleted_at: null,
    is_favorite: false,
  },
];

const notes: Note[] = [
  {
    id: 1,
    title: "Chào mừng đến với Take Note",
    content: "<p>Đây là ứng dụng ghi chú thông minh của bạn. Bạn có thể tạo ghi chú mới, sắp xếp theo thư mục và trò chuyện với Trợ lý AI.</p>",
    created_at: nowIso(),
    updated_at: nowIso(),
    folder_id: null,
    is_deleted: false,
    deleted_at: null,
    is_favorite: true,
  },
  {
    id: 2,
    title: "Kế hoạch dự án",
    content: "<p>Danh sách công việc cần hoàn thành trong tuần này:</p><ul data-type=\"taskList\"><li data-checked=\"true\" data-type=\"taskItem\"><label><input type=\"checkbox\" checked=\"checked\"><span></span></label><div><p>Thiết kế giao diện người dùng</p></div></li><li data-checked=\"false\" data-type=\"taskItem\"><label><input type=\"checkbox\"><span></span></label><div><p>Tích hợp trợ lý AI</p></div></li></ul>",
    created_at: nowIso(),
    updated_at: nowIso(),
    folder_id: 1,
    is_deleted: false,
    deleted_at: null,
    is_favorite: false,
  },
  {
    id: 3,
    title: "Ý tưởng đọc sách",
    content: "<p>Các cuốn sách hay nên đọc trong tháng tới: Atomic Habits, Deep Work, Pragmatic Programmer.</p>",
    created_at: nowIso(),
    updated_at: nowIso(),
    folder_id: 2,
    is_deleted: false,
    deleted_at: null,
    is_favorite: false,
  },
];

const chatHistory: ChatHistoryItem[] = [];

function getSubtreeFolderIds(rootId: number): number[] {
  const result = new Set<number>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of folders) {
      if (f.parent_id !== null && result.has(f.parent_id) && !result.has(f.id)) {
        result.add(f.id);
        added = true;
      }
    }
  }
  return Array.from(result);
}

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ==================== NOTES ROUTES ====================
  const notesRouter = express.Router();

  notesRouter.post("/", (req, res) => {
    const { title = "Untitled", content = "" } = req.body || {};
    const newNote: Note = {
      id: nextNoteId++,
      title,
      content,
      created_at: nowIso(),
      updated_at: nowIso(),
      folder_id: null,
      is_deleted: false,
      deleted_at: null,
      is_favorite: false,
    };
    notes.push(newNote);
    res.json(newNote);
  });

  notesRouter.get("/trash", (_req, res) => {
    res.json(notes.filter((n) => n.is_deleted));
  });

  notesRouter.put("/restore", (_req, res) => {
    let restored = 0;
    for (const n of notes) {
      if (n.is_deleted) {
        n.is_deleted = false;
        n.deleted_at = null;
        n.updated_at = nowIso();
        restored++;
      }
    }
    if (restored === 0) {
      res.status(404).json({ detail: "No deleted notes to restore" });
      return;
    }
    res.json({ detail: `Restored ${restored} notes` });
  });

  notesRouter.put("/trash", (_req, res) => {
    if (notes.length === 0) {
      res.status(404).json({ detail: "no note found" });
      return;
    }
    const now = nowIso();
    for (const n of notes) {
      n.is_deleted = true;
      n.deleted_at = now;
      n.updated_at = now;
    }
    res.json({ detail: "All notes moved to trash" });
  });

  notesRouter.get("/", (_req, res) => {
    res.json(notes.filter((n) => !n.is_deleted));
  });

  notesRouter.get("/:note_id", (req, res) => {
    const id = Number(req.params.note_id);
    const note = notes.find((n) => n.id === id) || null;
    res.json(note);
  });

  notesRouter.delete("/:note_id", (req, res) => {
    const id = Number(req.params.note_id);
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) {
      res.status(404).json({ detail: "note not found" });
      return;
    }
    notes.splice(idx, 1);
    res.json({ detail: "note deleted successfully" });
  });

  notesRouter.put("/:id", (req, res) => {
    const id = Number(req.params.id);
    const note = notes.find((n) => n.id === id);
    if (!note) {
      res.status(404).json({ detail: "note not found" });
      return;
    }
    if (req.body.title !== undefined) note.title = req.body.title;
    if (req.body.content !== undefined) note.content = req.body.content;
    note.updated_at = nowIso();
    res.json(note);
  });

  notesRouter.put("/:id/folder", (req, res) => {
    const id = Number(req.params.id);
    const note = notes.find((n) => n.id === id);
    if (!note) {
      res.status(404).json({ detail: "note not found" });
      return;
    }
    note.folder_id = req.body.folder_id ?? null;
    note.updated_at = nowIso();
    res.json(note);
  });

  notesRouter.put("/:id/trash", (req, res) => {
    const id = Number(req.params.id);
    const note = notes.find((n) => n.id === id);
    if (!note) {
      res.status(404).json({ detail: "note not found" });
      return;
    }
    note.is_deleted = true;
    note.deleted_at = nowIso();
    note.updated_at = nowIso();
    res.json(note);
  });

  notesRouter.put("/:id/favorite", (req, res) => {
    const id = Number(req.params.id);
    const note = notes.find((n) => n.id === id);
    if (!note) {
      res.status(404).json({ detail: "Note not found" });
      return;
    }
    note.is_favorite = !note.is_favorite;
    note.updated_at = nowIso();
    res.json(note);
  });

  notesRouter.put("/:id/restore", (req, res) => {
    const id = Number(req.params.id);
    const note = notes.find((n) => n.id === id && n.is_deleted);
    if (!note) {
      res.status(404).json({ detail: "Note not found" });
      return;
    }
    note.is_deleted = false;
    note.deleted_at = null;
    note.updated_at = nowIso();
    res.json(note);
  });

  app.use("/notes", notesRouter);

  // ==================== FOLDERS ROUTES ====================
  const foldersRouter = express.Router();

  foldersRouter.post("/", (req, res) => {
    const { name = "New Folder" } = req.body || {};
    const newFolder: Folder = {
      id: nextFolderId++,
      name,
      parent_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
      is_deleted: false,
      deleted_at: null,
      is_favorite: false,
    };
    folders.push(newFolder);
    res.json(newFolder);
  });

  foldersRouter.get("/trash", (_req, res) => {
    res.json(folders.filter((f) => f.is_deleted));
  });

  foldersRouter.put("/restore", (_req, res) => {
    let restored = 0;
    for (const f of folders) {
      if (f.is_deleted) {
        f.is_deleted = false;
        f.deleted_at = null;
        f.updated_at = nowIso();
        restored++;
      }
    }
    if (restored === 0) {
      res.status(404).json({ detail: "No deleted folders to restore" });
      return;
    }
    res.json({ detail: `Restored ${restored} folders` });
  });

  foldersRouter.put("/trash", (_req, res) => {
    const now = nowIso();
    for (const f of folders) {
      if (!f.is_deleted) {
        f.is_deleted = true;
        f.deleted_at = now;
        f.updated_at = now;
      }
    }
    for (const n of notes) {
      if (!n.is_deleted && n.folder_id === null) {
        n.is_deleted = true;
        n.deleted_at = now;
        n.updated_at = now;
      }
    }
    res.json({ detail: "Trashed all folders" });
  });

  foldersRouter.get("/", (_req, res) => {
    res.json(folders.filter((f) => !f.is_deleted));
  });

  foldersRouter.get("/:folder_id", (req, res) => {
    const id = Number(req.params.folder_id);
    const folder = folders.find((f) => f.id === id) || null;
    res.json(folder);
  });

  foldersRouter.delete("/:folder_id", (req, res) => {
    const id = Number(req.params.folder_id);
    const folder = folders.find((f) => f.id === id);
    if (!folder) {
      res.status(404).json({ detail: "Folder not found" });
      return;
    }

    const deleteRecursive = (curFolderId: number) => {
      for (const n of notes) {
        if (n.folder_id === curFolderId && !n.is_deleted) {
          n.folder_id = null;
        }
      }
      for (let i = notes.length - 1; i >= 0; i--) {
        if (notes[i].folder_id === curFolderId && notes[i].is_deleted) {
          notes.splice(i, 1);
        }
      }

      const children = folders.filter((f) => f.parent_id === curFolderId);
      for (const child of children) {
        if (child.is_deleted) {
          deleteRecursive(child.id);
        } else {
          child.parent_id = null;
        }
      }

      const idx = folders.findIndex((f) => f.id === curFolderId);
      if (idx !== -1) {
        folders.splice(idx, 1);
      }
    };

    deleteRecursive(folder.id);
    res.json({ detail: "Folder deleted successfully" });
  });

  foldersRouter.put("/:id/trash", (req, res) => {
    const id = Number(req.params.id);
    const folder = folders.find((f) => f.id === id);
    if (!folder) {
      res.status(404).json({ detail: "Folder not found" });
      return;
    }
    const ids = new Set(getSubtreeFolderIds(id));
    const now = nowIso();
    for (const n of notes) {
      if (n.folder_id !== null && ids.has(n.folder_id)) {
        n.is_deleted = true;
        n.deleted_at = now;
        n.updated_at = now;
      }
    }
    for (const f of folders) {
      if (ids.has(f.id)) {
        f.is_deleted = true;
        f.deleted_at = now;
        f.updated_at = now;
      }
    }
    res.json(folder);
  });

  foldersRouter.put("/:id", (req, res) => {
    const id = Number(req.params.id);
    const folder = folders.find((f) => f.id === id);
    if (!folder) {
      res.status(404).json({ detail: "Folder not found" });
      return;
    }
    if (req.body.name !== undefined) folder.name = req.body.name;
    folder.updated_at = nowIso();
    res.json(folder);
  });

  foldersRouter.put("/:id/move", (req, res) => {
    const id = Number(req.params.id);
    const folder = folders.find((f) => f.id === id);
    if (!folder) {
      res.status(404).json({ detail: "Folder not found" });
      return;
    }
    folder.parent_id = req.body.folder_id ?? null;
    folder.updated_at = nowIso();
    res.json(folder);
  });

  foldersRouter.put("/:id/favorite", (req, res) => {
    const id = Number(req.params.id);
    const folder = folders.find((f) => f.id === id);
    if (!folder) {
      res.status(404).json({ detail: "Folder not found" });
      return;
    }
    folder.is_favorite = !folder.is_favorite;
    folder.updated_at = nowIso();
    res.json(folder);
  });

  foldersRouter.put("/:id/restore", (req, res) => {
    const id = Number(req.params.id);
    const folder = folders.find((f) => f.id === id && f.is_deleted);
    if (!folder) {
      res.status(404).json({ detail: "Folder not found" });
      return;
    }
    const ids = new Set(getSubtreeFolderIds(id));
    const now = nowIso();
    for (const n of notes) {
      if (n.folder_id !== null && ids.has(n.folder_id)) {
        n.is_deleted = false;
        n.deleted_at = null;
        n.updated_at = now;
      }
    }
    for (const f of folders) {
      if (ids.has(f.id)) {
        f.is_deleted = false;
        f.deleted_at = null;
        f.updated_at = now;
      }
    }
    res.json(folder);
  });

  app.use("/folders", foldersRouter);

  // ==================== CHAT / AGENT ROUTE ====================
  app.post("/chat", async (req, res) => {
    try {
      const { content = "", role = "user" } = req.body || {};
      const activeNotes = notes.filter((n) => !n.is_deleted);
      const contextText = activeNotes
        .map((n) => `--- Note ID: ${n.id} | Title: ${n.title} ---\n${stripHtml(n.content)}`)
        .join("\n\n");

      let reply = "Xin lỗi, hiện chưa thể kết nối tới trợ lý AI.";

      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `Note context:\n${contextText || "(Chưa có ghi chú nào)"}\n\nQuestion:\n${content}`,
          config: {
            systemInstruction:
              "Bạn là một trợ lý ghi chú thông minh. Bạn sẽ nhận được các đoạn trích từ ghi chú của người dùng. Hãy trả lời dựa trên chúng. Nếu thông tin không có sẵn, hãy trả lời một cách lịch sự và gợi ý người dùng bổ sung ghi chú.",
          },
        });

        reply = response.text || reply;
      } else {
        reply = `Hiện có ${activeNotes.length} ghi chú đang lưu. Vui lòng cấu hình GEMINI_API_KEY để sử dụng câu trả lời thông minh từ AI.`;
      }

      const sessionId = String(Date.now());
      chatHistory.push(
        {
          id: nextChatId++,
          session_id: sessionId,
          role,
          content,
          created_at: nowIso(),
          is_deleted: false,
          deleted_at: null,
        },
        {
          id: nextChatId++,
          session_id: sessionId,
          role: "agent",
          content: reply,
          created_at: nowIso(),
          is_deleted: false,
          deleted_at: null,
        }
      );

      res.json({ reply });
    } catch (error) {
      console.error("Error in /chat:", error);
      res.status(500).json({ detail: String(error) });
    }
  });

  // ==================== VITE / STATIC MIDDLEWARE ====================
  const frontendRoot = path.resolve(__dirname, "frontend");
  const distPath = path.resolve(frontendRoot, "dist");

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      root: frontendRoot,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server listening on http://0.0.0.0:3000");
  });
}

startServer();
