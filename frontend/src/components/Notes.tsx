
import styles from "./button.module.css"
import modalStyles from "./Modal.module.css"
import { useState } from "react"
import React from "react"
import Modal from "react-modal"

import { CreateNote } from "../api/notes"
import type { NoteProps, NoteFormProps } from "../types"



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

export const AddNote = ({ setNotes }: NoteProps) =>{
    const [showForm, setShowForm] = useState(false);

    const handleAddNote = async (title: string, content: string) =>{
        const newNote = await CreateNote(title, content);
        setNotes(prevNotes => [...prevNotes, newNote]);
        setShowForm(false);
    }
    
    return (
        <div >
            { !showForm ? (
                <button className={styles.newNoteBtn} onClick={() => setShowForm(true)}>
                    📝
                </button>
            ) : (
                <NoteForm send={handleAddNote} showForm={showForm} setShowForm={setShowForm}/>
            )}
        </div>
    );
}

export default AddNote;

