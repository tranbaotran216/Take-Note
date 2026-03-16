import { data, useParams } from "react-router-dom";
import { getAllNotes, getNoteById, updateNote } from "../api/notes"; // Nhớ import updateNote
import { useState, useEffect, useRef } from "react";

import { useEditor,EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import "./NotePage.css"

export const OpenNote = () => {
    const { id } = useParams();
    const [editTitle, setEditTitle] = useState("");
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false); // Trạng thái hiển thị chữ "Đang lưu..."

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    
    useEffect(() => {
        const fetchAll = async () => {
            try{
                const data = await getAllNotes();
                setAllNotes(data || []);
            } catch (err) {
                console.error("Không thể lấy danh sách notes:", err);
            }
        }

        fetchAll();
    }, [id]);
    
        // initial editor
    const editor = useEditor({
        extensions: [
            StarterKit, 
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content: '',
        editorProps:{
            attributes:{
                class: 'prose-editor',
            },
        },
    });

    useEffect(() => {
        const fetchNoteDetail = async () => {
            try {
                if(!id) return;
                const data = await getNoteById(id);
                if (!data) {
                    console.warn(`Note with id=${id} not found`);
                    setEditTitle("");
                    if (editor) {
                        editor.commands.setContent("");
                    }
                    return;
                }

                setEditTitle(data.title || "");
                if (editor){
                    editor.commands.setContent(data.content || ""); // content to tip-tap
                }
            }
            catch (error) {
                console.error("Error fetching note details:", error);
            }
        }
        if(id) {
            fetchNoteDetail();
        }
    }, [id, editor]);

    // Hàm gọi API lưu ghi chú (ctrl+S)
    const handleSaveNote = async () => {
        if (!id || !editor) return;
        try {
            setIsSaving(true);
            const htmlContent = editor.getHTML(); // TipTap sẽ trả về HTML (chứa cả checkbox)
            await updateNote(parseInt(id), { title: editTitle, content: htmlContent }); 
            console.log("Đã lưu ghi chú!");
        } catch (error) {
            console.error("Lỗi khi lưu ghi chú:", error);
        } finally {
            // Hiển thị chữ "Saving..." khoảng 1 giây cho user biết đã lưu xong
            setTimeout(() => setIsSaving(false), 1000);
        }
    };

    // Lắng nghe phím Ctrl + S
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Kiểm tra phím Ctrl (Windows/Linux) hoặc Meta (Cmd trên Mac) kết hợp phím 's'
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault(); // Chặn cửa sổ "Save As" mặc định của trình duyệt
                handleSaveNote();
            }
        };

        // Gắn sự kiện vào document
        document.addEventListener("keydown", handleKeyDown);
        
        // Dọn dẹp sự kiện khi component unmount
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [editTitle, editor]); // Đưa các state vào dependency để hàm handleSaveNote lấy được dữ liệu mới nhất

    // changing title
    const handleTitleChange= (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setEditTitle(newTitle);

        if (!id) return;

        // 1. Bắn event để SideNav cập nhật UI ngay lập tức
        window.dispatchEvent(new CustomEvent("update-note-title", {
            detail: { id: parseInt(id), title: newTitle }
        }));

        // 2. Xóa bộ đếm cũ nếu người dùng vẫn đang gõ liên tục
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // 3. Đặt bộ đếm mới: Chờ 600ms sau khi người dùng ngừng gõ mới gọi API
        debounceTimer.current = setTimeout(async () => {
            try {
                setIsSaving(true);

                let finalTitle = newTitle.trim();
                if (finalTitle !== "") {
                    const otherTitles = allNotes.filter(n => n.id !== parseInt(id)).map(n => n.title);
                    let uniqueTitle = finalTitle;
                    let c = 1;

                    while (otherTitles.includes(uniqueTitle)){
                        uniqueTitle = `${finalTitle} (${c})`;
                        c++;
                    }

                    finalTitle = uniqueTitle;

                    if(finalTitle !== newTitle) {
                        setEditTitle(finalTitle);
                        window.dispatchEvent(new CustomEvent("update-note-title", {
                            detail: { id: parseInt(id), title: finalTitle }
                        }));
                    }
                }

                const htmlContent = editor?.getHTML();
                await updateNote(parseInt(id), { title: finalTitle, content: htmlContent });
                setAllNotes(prev => prev.map(n => n.id === parseInt(id) ? { ...n, title: finalTitle } : n));

            } catch (error) {
                console.error("Lỗi auto-save title:", error);
            } finally {
                setTimeout(() => setIsSaving(false), 1000);
            }
        }, 800);
    }

    return(
        <div className="note-container">
            {/* Input Tiêu đề */}
            <input 
                value={editTitle}
                onChange={handleTitleChange}
                className="title-input"
            />

            <EditorContent editor={editor} />
            
            {isSaving && <div className="status">Saving...</div>}
        </div>
    );
};