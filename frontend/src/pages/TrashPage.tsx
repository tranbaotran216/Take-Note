import styles from './TrashPage.module.css'
import { useEffect, useRef, useState } from 'react'
import type { FolderType, NoteType } from '../types'
import { NoteItem } from '../components/Notes'
import { DeleteFolder, FolderList } from '../components/Folders'
import { deleteFolder, getTrashedFolders, restoreFolderByID } from '../api/folders'
import { deleteNoteById, getTrashedNotes, restoreNoteByID } from '../api/notes'
import { Folder, RotateCcw, Trash2 } from 'lucide-react'

const Trash = () => {
    const [folders, setFolders] = useState<FolderType[]>([])
    const [notes, setNotes] = useState<NoteType[]>([])

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean,
        type: 'folder' | 'note' | null;
        item: NoteType | FolderType | null;
        x: number,
        y: number
    }>({
        visible: false,
        type:null,
        item: null,
        x: 0,
        y: 0
    })

    const fetchTrashData = async () => {
        try{
            const trashFolders = await getTrashedFolders();
            const trashNotes = await getTrashedNotes();
            setFolders(trashFolders);
            setNotes(trashNotes);
        } catch (err) {
            console.error("Lỗi khi tải thùng rác:", err);
        }
    }

    useEffect( () => {
        fetchTrashData();
        const handleClickOutside = (event:MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu({
                    visible: false,
                    type:null,
                    item:null,
                    x: event.clientX,
                    y: event.clientY
                })
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    },[] );

    const contextMenuRef = useRef<HTMLDivElement>(null);

    const handleRightClick = (e: React.MouseEvent, object: NoteType | FolderType, type: 'folder' | 'note' ) => {
        e.preventDefault();
        console.log(`right click ${object.id}`)
        setContextMenu({
            visible: true,
            type: type,
            item: object,
            x: e.clientX,
            y: e.clientY
        })
    }

    const handleRestore = async () => {
        if (!contextMenu.item) return;

        try {
            if (contextMenu.type === 'folder') {
                await restoreFolderByID (contextMenu.item.id);
                setFolders ( prev => prev.filter(f=> f.id !== contextMenu.item?.id));
            }
            else {
                await restoreNoteByID(contextMenu.item.id);
                setNotes(prev => prev.filter(n => n.id !== contextMenu.item?.id));
            }
            window.dispatchEvent(new CustomEvent('refresh-sidebar'));
        } catch (error) {
            console.error("Lỗi khi khôi phục:", error);
        } finally {
            setContextMenu(prev => ({...prev, visible:false}));
        }
    }

    const handlePermanentDelete = async () => {
        if (!contextMenu.item) return;
        const confirmDelete = window.confirm("delete permanently?")
        if (!confirmDelete) return ;
        
        try {
            if (contextMenu.type === 'folder') {
                await deleteFolder(contextMenu.item as FolderType);
                setFolders(prev => prev.filter( f=> f.id !== contextMenu.item?.id))
            }
            else {
                await deleteNoteById(contextMenu.item.id);
                setNotes(prev =>  prev.filter(n => n.id !== contextMenu.item?.id));
            }
        } catch (error) {
            console.error("Lỗi khi xóa vĩnh viễn:", error);
        } finally {
            setContextMenu(prev => ({...prev, visible:false}));
        }
    }


    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Thùng Rác</h1>
            
            <h3 className={styles.sectionTitle}>FOLDERS</h3>
            <div className={styles.listContainer}>
                {folders.length === 0 && <span className={styles.emptyText}>Không có thư mục nào.</span>}
                {folders.map(folder => (
                    <div 
                        key={`del-f-${folder.id}`} 
                        onContextMenu={(e) => handleRightClick(e, folder, 'folder')}
                        className={styles.folderItem}
                    >
                        <Folder size={18} color="#dcb67a" />
                        <span className={styles.folderName}>{folder.name}</span>
                        <span className={styles.dateText}>
                            Đã xóa: {folder.deleted_at ? new Date(folder.deleted_at).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                ))}
            </div>

            <h3 className={styles.sectionTitle}>NOTES</h3>
            <div className={styles.listContainer}>
                {notes.length === 0 && <span className={styles.emptyText}>Không có ghi chú nào.</span>}
                {notes.map(n => (
                    <NoteItem 
                        key={n.id}
                        note={n}
                        isOpen={true} 
                        depth={0}
                        handleNoteRightClick={(e) => handleRightClick(e, n, 'note')}
                        handleMoveToParent={async() => {}} 
                    />
                ))}
            </div>

            {/* Context Menu cho Trash */}
            {contextMenu.visible && (
                <div 
                    ref={contextMenuRef} 
                    className={styles.contextMenu}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <div onClick={handleRestore} className={styles.menuItem}>
                        <RotateCcw size={14} /> Khôi phục
                    </div>
                    {/* Bổ sung class deleteItem để hiển thị màu đỏ cảnh báo */}
                    <div onClick={handlePermanentDelete} className={`${styles.menuItem} ${styles.deleteItem}`}>
                        <Trash2 size={14} /> Xóa vĩnh viễn
                    </div>
                </div>
            )}
        </div>
    )
}

export default Trash