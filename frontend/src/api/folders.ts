import axios from "axios";
import type { FolderType } from "../types";

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

export const deleteFolder = async (folder: FolderType) => {
    try{
        await axios.delete(`${API}${folder.id}`)
    } catch (error) {
        console.error(`error delete folder ${folder.name}`)
    }
}

export const updateFolder = async (id: number, name: string) => {
    try{
        const res = await axios.put(`${API}${id}`, { name: name });
        return res.data;
    } catch(error) {
        console.error("error update folder by id:",{id}, error)
        throw error;
    }
}