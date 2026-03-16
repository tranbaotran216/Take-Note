import axios from "axios";


const API = "http://localhost:8000/notes/"

export const CreateNote = async(title:string, content:string) =>{
    const response = await axios.post(`${API}`, 
        { title: title , content: content}
    );
    return response.data;
};

export const getNoteById = async(id: string) => {
    const res = await axios.get(`${API}${id}`)
    return res.data
}

export const getAllNotes = async () => {
    const res = await axios.get(`${API}`)
    return res.data
}

export const deleteNoteById = async(id: number) => {
    const res = await axios.delete(`${API}${id}`);
    return res.data
}

export const updateNote = async(id: number, updates:{ title?: string, content?: string}) => {
    const res = await axios.put(`${API}${id}`, updates);
    return res.data;
}

export const updateNoteToFolder = async(id: number, folder_id: number) => {
    const res = await axios.put(`${API}${id}/folder`, { folder_id })
    return res.data;
}

export const trashNoteById = async (id: number) => {
    const res = await axios.put(`${API} ${id}/trash`);
    return res.data;
}

export const trashAllNotes = async () => {
    try {
        await axios.put(`${API}/trash`);
    } catch (error) {
        console.error("cant move all notes to trash")
        throw error;
    }
}