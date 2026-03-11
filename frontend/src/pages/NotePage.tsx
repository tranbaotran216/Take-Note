import { useParams } from "react-router-dom";
import { getNoteById, updateNote } from "../api/notes"; // Nhớ import updateNote
import { useState, useEffect } from "react";

import { useEditor,EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import "./NotePage.css"

export const OpenNote = () => {
    const { id } = useParams();
    const [editTitle, setEditTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false); // Trạng thái hiển thị chữ "Đang lưu..."

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
                setEditTitle(data.title);
                if (editor){
                    editor.commands.setContent(data.content); // content to tip-tap
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

    

    return(
        <div className="note-container">
            {/* Input Tiêu đề */}
            <input 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="title-input"
            />

            <EditorContent editor={editor} />
            
            {isSaving && <div className="status">Saving...</div>}
        </div>
    );
};