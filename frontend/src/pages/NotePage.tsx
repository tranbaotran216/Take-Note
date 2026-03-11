import { useParams } from "react-router-dom";
import { getNoteById } from "../api/notes";
import { useState, useEffect } from "react";
import type { NoteType } from "../types";

export const OpenNote = () => {
    const { id } = useParams();
    const [noteDetail, setNoteDetail] = useState<NoteType | null>(null)
    
    useEffect(() => {
        const fetchNoteDetail = async () => {
            try{
                if(!id) return;
                const data = await getNoteById(id);
                setNoteDetail(data);
            }
            catch (error) {
                console.error("Error fetching note details: {error}")
            }
        }

        if(id) {
            fetchNoteDetail();
        }
    }, [id]);

    if (!noteDetail) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;

    return(
        <div>
            <h1>{noteDetail.title}</h1>
            <small>{new Date(noteDetail.created_at).toLocaleString()}</small>
            <div>{noteDetail.content}</div>
        </div>
    );
}