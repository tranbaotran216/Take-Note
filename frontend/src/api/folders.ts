import axios from "axios";


const API = "http://localhost:8000/folders/"


export const createFolder = async (name:string) => {
    const response = await axios.post(`${API}`, 
        { name: name }
    );
    return response.data;
};

export const getFolderById = async (id: number) => {
    try{
        const res = await axios.get(`${API}${id}`);
        return res.data
    } catch (error){
        console.error("error get folder by id:",{id}, error)
    }
}

export const getAllFolders = async () => {
    try{
        const res = await axios.get(`${API}`);
        return res.data
    } catch (error){
        console.error("error get all folders", error)
    }
}
