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