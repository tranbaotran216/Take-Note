import { Folder } from "lucide-react"
import styles from "./button.module.css"
import { createFolder, deleteFolder } from "../api/folders";
import type { FolderProps, FolderType } from "../types";



export const AddFolderButton = ({ setFolders }: FolderProps) => {
    const handleAddFolder = async () =>{
        console.log("add new folder")
        const name = prompt("Folder name")
        if(!name) return;
        const newFolder = await createFolder(name);
        if (newFolder){
            setFolders(prev=>[...prev, newFolder]);
        }
    };
    return (
        <button onClick={handleAddFolder} className={styles.add_folder_button}>
            <Folder></Folder>
        </button>
    )
}

export const DeleteFolder = async (folder:FolderType, setFolders: React.Dispatch<React.SetStateAction<FolderType[]>>) =>{
    try{
        await deleteFolder(folder); // da gui yeu cau delete folder den database + database da return ket qua cho request
        // database changed => re-render UI
        setFolders(prevFolders => prevFolders.filter(f => f.id !== folder.id));
        console.log (`deleted (re-render successfully) ${folder.id} - ${folder.name}`);
    } catch (error) {
        console.error("delete folder error:", error)
    }
}

export default AddFolderButton
