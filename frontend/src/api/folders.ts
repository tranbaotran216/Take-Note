import axios from "axios";
import type { FolderType } from "../types";

const API = "/folders/"


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

export const updateFolderToParent = async (id: number, parent_id: number) => {
    try{
        const res = await axios.put(`${API}${id}/move`, { folder_id: parent_id })
        return res.data;
    } catch (error) {
        console.error("cant move folder to parent")
        throw error;
    }
}

export const trashFolderById = async (folder: FolderType) => {
    try{
        const id = folder.id;
        const res = await axios.put(`${API}${id}/trash`);
        return res.data;
    } catch (error) {
        console.error("cant move folder to trash")
        throw error;
    }
}

export const trashAllFolders = async () => {
    try {
        await axios.put(`${API}/trash`);
    } catch (error) {
        console.error("cant move all folders to trash")
        throw error;
    }
}
export const toggleFolderFavorite = async (id: number) => {
    try{
        const res = await axios.put(`${API}${id}/favorite`)
        return res.data;
    } catch (error) {
        console.error("cant toggle favorite toggle")
        throw error;
    }
}

export const restoreFolderByID = async(id: number) => {
    try{
        const res = await axios.put(`${API}${id}/restore`)
        return res.data;
    } catch (error){
        console.error("restore failed")
        throw error;
    }
}

export const restoreAllFolders = async() => {
    try{
        const res = await axios.put(`${API}/restore`)
        return res.data;
    } catch (error){
        console.error("restore failed")
        throw error;
    }
}

export const getTrashedFolders = async () => {
    const res = await axios.get(`${API}trash`); 
    return res.data;
}