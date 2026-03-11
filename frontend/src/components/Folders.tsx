import { Folder } from "lucide-react"
import styles from "./button.module.css"
import { createFolder } from "../api/folders";
import type { FolderProps } from "../types";



const AddFolderButton = ({ setFolders }: FolderProps) => {
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