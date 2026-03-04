import { Folder } from "lucide-react"
import styles from "./button.module.css"

const handleAddFolder = () =>{
    console.log("add new folder")
}

const AddFolderButton = () => {
    return (
        <button onClick={handleAddFolder} className={styles.add_folder_button}>
            <Folder></Folder>
        </button>
    )
}

export default AddFolderButton;