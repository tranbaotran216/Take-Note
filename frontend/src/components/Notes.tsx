
import styles from "./SideNav.module.css"
import styles2 from "./button.module.css"

import modalStyles from "./Modal.module.css"
import { useState } from "react"
import React from "react"
import Modal from "react-modal"

import { Link, useLocation } from "react-router-dom"
import { CreateNote, updateNote, trashNoteById } from "../api/notes"
import type { NoteProps, NoteFormProps, NoteType, NoteItemProps } from "../types"


if (typeof window!= 'undefined'){
    Modal.setAppElement('#root');
}

function NoteForm({ send, showForm, setShowForm }: NoteFormProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        send(title, content);
        setTitle("")
        setContent("")
    }

    if (!showForm) return null;

    return(
        <Modal 
            isOpen={showForm} 
            onRequestClose={() => setShowForm(false)}
            className={modalStyles.content}
            overlayClassName={modalStyles.overlay}
            closeTimeoutMS={300}
        >
            <button className={modalStyles.closeButton} onClick={() => setShowForm(false)}>
                x
            </button>

            <h2 style={{ color:"black", marginTop:0, marginBottom:20 }}>Create New Note</h2>

            <form onSubmit={handleSubmit} className={modalStyles.form}>
                <div className={modalStyles.formGroup}>
                    <label >Note title</label>
                    <input type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className={modalStyles.formGroup}>
                    <label>Note content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter note content"
                        rows={10}
                        className={modalStyles.texterea}
                    />
                </div>
                <button type="submit" className={modalStyles.submitButton} >create note</button>
            </form>
        </Modal>
    )
}

export const AddNote = ({Note, setNotes, isOpenSideBar }: NoteProps & { isOpenSideBar:any }) =>{
    const [showForm, setShowForm] = useState(false);

    const handleAddNote = async (title: string, content: string) =>{
        const existingNames = Note.map(n => n.title)

        let uniqueName = title;
        let counter=1;

        while (existingNames.includes(uniqueName)) {
            uniqueName = `${title} (${counter})`;
            counter++;
        }
        const newNote = await CreateNote(uniqueName, content);
        setNotes(prevNotes => [...prevNotes, newNote]);
        setShowForm(false);
    }
    
    return (
        <div >
            <button 
                className={isOpenSideBar ? styles2.newNoteBtn : styles2.newNoteBtnSmall} 
                onClick={() => setShowForm(true)}
            >
                📝
            </button>
            <NoteForm send={handleAddNote} showForm={showForm} setShowForm={setShowForm}/>
        </div>
    );
}

export const DeleteNote = async (note: NoteType, setNotes: React.Dispatch<React.SetStateAction<NoteType[]>>) => {
    try{
        console.log("Sẽ xóa note có ID là:", note.id);

        await trashNoteById(note.id);
        setNotes(prevNotes => prevNotes.filter(n => n.id !== note.id));
        console.log("Xóa note thành công");
        window.dispatchEvent(new CustomEvent('refresh-trash'));
        console.log("🚀 Đã bắn tín hiệu refresh-trash!");
    }catch (error) {
        console.error("Lỗi xóa note:", error);
    }
}

export default AddNote;

export const UpdateNote = async (note: NoteType, notes: NoteType[], setNotes: React.Dispatch<React.SetStateAction<NoteType[]>>, title?: string, content?: string) => {
    try{

        let res;
        let finalTitle;
        
        if (title) {
            const existingTitles = notes.filter(n=> n.id !== note.id).map(n=> n.title);

            let unique = title;
            let counter = 1;

            while (existingTitles.includes(unique)) {
                unique = `${title} (${counter})`;
                counter++;
            }
            finalTitle = unique;
        }
          
        res = await updateNote(note.id, {title: finalTitle,  content: content}) ;
        setNotes(prevNotes => prevNotes.map( n => (n.id === note.id ? res: n)));
        console.log("Cập nhật ghi chú thành công!");
    } catch (error) {
        console.error("Lỗi khi cập nhật ghi chú:", error);
    }
}

export const NoteItem = ({ note, isOpen, depth=0, handleNoteRightClick, handleMoveToParent: _handleMoveToParent }: NoteItemProps) => {
    const location = useLocation()
    const isActive = location.pathname === `/notes/${note.id}`

    return (
        <div 
            key={note.id} 
            className={`
                ${styles.navItems}
                ${depth > 0 ? styles.childNoteItem : ""}
                ${isActive ? styles.activeNavItem : ""}
            `} 
            style={{ paddingLeft: `${(depth * 20) + 12}px` }}
            onContextMenu={(e) => handleNoteRightClick(e, note)} 
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("noteId", note.id.toString());
            }}
        >
            { isOpen &&
                (<Link to={`/notes/${note.id}`}>
                    <span >📔 {note.title}</span>
                </Link>)
            }
        </div>
    )
}

