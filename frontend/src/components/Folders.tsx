import { Folder, ChevronRight, ChevronDown } from "lucide-react"
import styles from "./SideNav.module.css"
import { createFolder, deleteFolder, trashFolderById } from "../api/folders";
import type { FolderProps, FolderType, FolderListProps, NoteType } from "../types";
import { NoteItem } from "./Notes";
import { useState } from "react";
import styles2 from "./button.module.css"


export const AddFolderButton = ({folderList, setFolders, isOpenSideBar }: FolderProps & { isOpenSideBar: boolean }) => {
    const handleAddFolder = async () =>{
        console.log("add new folder")
        const name = prompt("Folder name")
        if(!name) return;

        const existingNames = folderList.map(f => f.name)

        let uniqueName = name;
        let count = 1;
        while (existingNames.includes(uniqueName)){
            uniqueName = `${name} (${count})`;
            count++;
        }
        
        const newFolder = await createFolder(uniqueName);
        if (newFolder){
            setFolders(prev=>[...prev, newFolder]);
        }
    };
    return (
        <button onClick={handleAddFolder} className={isOpenSideBar ? styles2.add_folder_button : styles2.add_folder_button_small}>
            <Folder />
            {isOpenSideBar && <span>Thêm thư mục</span>}
        </button>
    )
}

export const DeleteFolder = async (
    deleted_folder:FolderType, 
    folders: FolderType[], 
    setFolders: React.Dispatch<React.SetStateAction<FolderType[]>>,
    setNotes: React.Dispatch<React.SetStateAction<NoteType[]>>
) =>{
    try{
        await trashFolderById(deleted_folder); // da gui yeu cau delete folder den database + database da return ket qua cho request

        //find all folders'id
        const folderIdsToDelelte = new Set<number>();
        folderIdsToDelelte.add(deleted_folder.id);

        const collectChildFolders = (parentId: number) => {
            folders.forEach( f => {
                if (f.parent_id === parentId && !folderIdsToDelelte.has(f.id)){
                    folderIdsToDelelte.add(f.id);
                    collectChildFolders(f.id); // de quy
                }
            })
        }

        collectChildFolders(deleted_folder.id);

        setFolders(prevFolders => prevFolders.filter(f => !folderIdsToDelelte.has(f.id)));
        setNotes(prevNotes => prevNotes.filter(n => {
            return !n.folder_id || !folderIdsToDelelte.has(n.folder_id);
        }))
        console.log (`deleted (re-render successfully) ${deleted_folder.id} - ${deleted_folder.name}`);
    } catch (error) {
        console.error("delete folder error:", error)
    }
}

export default AddFolderButton

export const FolderList = ({ 
    folder, folders, notes, depth=0, isOpen, editingFolderId, tempFolderName, 
    setTempFolderName, handleUpdateFolderName, handleFolderRightClick, handleNoteRightClick, handleMoveToParent
 }: FolderListProps & { handleNoteRightClick : (e: React.MouseEvent, note:NoteType) => void }) => {
    
    // State quản lý việc đóng/mở thư mục
    const [isExpanded, setIsExpanded] = useState(true);

    const childFolders = folders.filter((f: FolderType) => f.parent_id === folder.id  && !f.is_deleted)
    const childNotes = notes.filter((n: NoteType) => n.folder_id == folder.id && !n.is_deleted)
    
    // Khoảng cách thụt lề cơ sở
    const indentBase = 16; 
    
    return(
        <div className={styles.folderWrapper}>
            <div
                className={styles.navItems}
                style={{ paddingLeft: `${(depth * indentBase) + 4}px` }}
                onContextMenu={(e) => handleFolderRightClick(e, folder)}
                onClick={() => setIsExpanded(!isExpanded)} // Click để đóng mở
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("folderId", folder.id.toString());
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(styles.dragOver);
                }}
                onDragLeave={(e) => {
                    e.currentTarget.classList.remove(styles.dragOver);
                }}
                onDrop={async(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(styles.dragOver);
                    const noteId = e.dataTransfer.getData("noteId");
                    const folderID = e.dataTransfer.getData("folderId");
                    if (noteId) await handleMoveToParent(parseInt(noteId), folder.id, "note");
                    else if (folderID && parseInt(folderID)!== folder.id) await handleMoveToParent(parseInt(folderID),folder.id, "folder" );
                }}
            >
                <div className={styles.folderItem}>
                    {/* Icon Mũi tên thay cho Emoji */}
                    
                    
                    { editingFolderId === folder.id ? (
                        <input
                            value={tempFolderName}
                            autoFocus
                            onClick={(e) => e.stopPropagation()} // Ngăn việc click input làm đóng/mở folder
                            onChange={(e) => setTempFolderName(e.target.value)}
                            onBlur={() => handleUpdateFolderName(folder.id)}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdateFolderName(folder.id)}
                            style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none' }}
                        />
                    ) : (isOpen && <span>
                        {isExpanded ? <ChevronDown size={14} color="#888" /> : <ChevronRight size={14} color="#888" />}
                        📁 {folder.name}</span>)}
                </div>
            </div>

            {/* Vùng chứa file con - Chỉ hiển thị khi isExpanded = true */}
            {isOpen && isExpanded && (
                <div className={styles.childGroup}>
                    {/* Vẽ đường kẻ dọc ở phía bên trái */}
                    {(childFolders.length > 0 || childNotes.length > 0) && (
                        <div 
                            className={styles.treeLine} 
                            style={{ left: `${(depth * indentBase) + 30}px` }} 
                        />
                    )}

                    {childFolders.map(f => (
                        <FolderList 
                            key={f.id} folder={f} folders={folders} notes={notes} depth={depth+1} isOpen={isOpen}
                            editingFolderId={editingFolderId} tempFolderName={tempFolderName} setTempFolderName={setTempFolderName}
                            handleUpdateFolderName={handleUpdateFolderName} handleFolderRightClick={handleFolderRightClick}
                            handleNoteRightClick={handleNoteRightClick} handleMoveToParent={handleMoveToParent}
                        />
                    ))}

                    {childNotes.map(n => (
                        <NoteItem 
                            key={n.id} note={n} isOpen={isOpen} depth={depth + 1}
                            handleNoteRightClick={handleNoteRightClick} handleMoveToParent={handleMoveToParent}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}