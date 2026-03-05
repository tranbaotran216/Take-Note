import { useState } from "react"
import { Folder } from "lucide-react"
import styles from "./button.module.css"
import axios from "axios"

export interface FolderType{
    id: number,
    name: string
}

interface Props {
    folderList: FolderType[],
    setFolders: React.Dispatch<React.SetStateAction<FolderType[]>>
}

const createFolder = async (name:string) => {
    const response = await axios.post("http://localhost:8000/folders/", 
        { name: name }
    );
    return response.data;
};



const AddFolderButton = ({ setFolders }: Props) => {
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

export default AddFolderButton;