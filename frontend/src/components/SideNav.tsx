import React, { useState, useEffect, useRef } from "react"
import { Home, Settings, Menu, User, BotMessageSquare } from "lucide-react"
import styles from "./SideNav.module.css"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { AddFolderButton, DeleteFolder, FolderList } from "./Folders"
import type { NoteType, FolderType, SideNavProps } from "../types"
import { AddNote, DeleteNote, NoteItem } from "./Notes"
import { getAllNotes, updateNoteToFolder } from "../api/notes"
import { getAllFolders, updateFolder, updateFolderToParent } from "../api/folders"


const MIN_SIDENAV_WIDTH = 130
const MAX_SIDENAV_WIDTH = 380


const SideNav = ({ isOpen, setIsOpen, width, setWidth }: SideNavProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [folders, setFolders] = useState<FolderType[]>([])
    const [notes, setNotes] = useState<NoteType[]>([])
    const [notificationCount] = useState(3)

    const [isResizing, setIsResizing] = useState<boolean>(false);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);

    const minWidth = MIN_SIDENAV_WIDTH;
    const maxWidth = MAX_SIDENAV_WIDTH;

    const startResizing = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e: MouseEvent) => {
        if (!isResizing) return;
        const delta = e.clientX - startXRef.current;

        const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
        setWidth(newWidth);
    };



    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);

    const [editingFolderId, setEditingFolderId] = useState<number | null>(null)
    const [tempFolderName, setTempFolderName] = useState<string>("")

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean
        type: "folder" | "note" | null
        item: NoteType  | FolderType | null;
        x : number;
        y: number;
    }>({
        visible: false,
        type : null,
        item: null,
        x: 0,
        y:0
    })
    
    const contextMenuRef= useRef<HTMLDivElement>(null)

    const handleUpdateFolderName = async(id: number) => {
        try{
            const basename = tempFolderName.trim();

            if (!basename){
                setEditingFolderId(null);
                return;
            }

            const currentFolder = folders.find(f => f.id === id);
            if (currentFolder && currentFolder.name === basename) {
                setEditingFolderId(null);
                return;
            }

            const existingNames = folders.filter(f => f.id !=id).map(f => f.name);
            
            let uniqueName = basename;
            let counter=1;

            while (existingNames.includes(uniqueName)){
                uniqueName = `${basename} (${counter})`;
                counter++;
            }

            const res = await updateFolder(id, uniqueName);
            if (res) {
                setFolders(prev => prev.map(f => f.id === id? res : f));
            } else {
                console.error("Failed to update folder: no response data");
            }
            setEditingFolderId(null);
        } catch (error) {
            console.error("Lỗi cập nhật tên folder:", error);
            setEditingFolderId(null);
        }
    }
    
    const handleNoteRightClick = (e: React.MouseEvent, note: NoteType) => {
        e.preventDefault();
        console.log(`right click on note ${note.id}`)
        setContextMenu({
            visible: true,
            type: 'note',
            item: note,
            x: e.clientX,
            y: e.clientY
        })
    }

    const handleFolderRightClick = (e: React.MouseEvent, folder: FolderType) => {
        e.preventDefault();
        setContextMenu({
            visible:true,
            type: 'folder',
            item: folder,
            x: e.clientX,
            y: e.clientY
        })
    }

    const handleMoveToParent = async (objectId:number, parentId: number, type:string)=> {
        try {
            if (type === "note") {
                const updatedNote = await updateNoteToFolder(objectId, parentId );
                setNotes(prev => prev.map(n => n.id === objectId ? updatedNote : n));
                console.log(`Moved note ${objectId} into folder ${parentId}`)
            }
            else if (type === "folder"){
                const updatedFolder = await updateFolderToParent(objectId, parentId);
                setFolders(prev => prev.map(n => n.id === objectId ? updatedFolder : n));
                console.log(`Moved folder ${objectId} into folder ${parentId}`)
            }
        } catch (error) {
            console.error("Error while moving object to parent!", error)
        }
    }

    const fetchFolders = async () => {
        try {
            const data = await getAllFolders();
            setFolders(data)
        } catch (error) {
            console.error("Error fetching folders:", error)
        }
    }

    const fetchNotes = async () => {
        try{
            const data = await getAllNotes();
            setNotes(data)
        }   
        catch (error) {

        }
    }

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
    
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        fetchFolders()
        fetchNotes()


        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    useEffect(() => {
        const handleTitleUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { id, title } = customEvent.detail;

            setNotes(prev => prev.map(notes => notes.id === id ? { ...notes, title } : notes))
        }

        window.addEventListener("update-note-title", handleTitleUpdate);
        return () => {
            window.removeEventListener("update-note-title", handleTitleUpdate);
        }
    }, []);
    
    const effectiveWidth = isOpen ? Math.max(minWidth, Math.min(maxWidth, width)) : 70;

    return ( 
        <aside
            className={`${styles.sidenav} ${isOpen ? styles.open : ""}`}
            style={{ width: effectiveWidth, transition: isResizing ? 'none' : 'width 0.15s ease-in-out' }}
        >
            {isOpen && (
                <div
                    className={styles.resizer}
                    onMouseDown={startResizing}
                    data-testid='sidenav-resizer'
                />
            )}
            <div className={styles.topActions}>
                <div className={styles.addButtonsWrapper}>
                    <AddNote 
                        Note={notes} 
                        setNotes={setNotes} 
                        isOpenSideBar={isOpen} 
                    />
                    <AddFolderButton
                        folderList={folders}
                        setFolders={setFolders}
                        isOpenSideBar={isOpen}
                    />
                </div>

                <button 
                    className={styles.menuButton}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Menu"
                >
                    <div style={{ position: 'relative' }}>
                        <Menu size={20} />
                        {!isOpen && notificationCount > 0 && (
                            <span className={styles.badge}>{notificationCount}</span>
                        )}
                    </div>
                </button>
            </div>

            <div className={styles.divider}/>

            <div className={styles.navContainer} style={{ overflowY: 'auto', flex: 1 }}>
                {isOpen && <div className={styles.sectionHeader}>Recent</div>}
                {/* Render recent notes here */}

                <div className={styles.divider}/>

                {isOpen && <div className={styles.sectionHeader}>Folders</div>}
                <nav>
                    {folders.filter(efolder => !efolder.parent_id && !efolder.is_deleted).map(folder => (
                        <FolderList 
                            key={folder.id}
                            folder={folder}
                            folders={folders}
                            notes={notes}
                            isOpen={isOpen}
                            editingFolderId={editingFolderId}
                            tempFolderName={tempFolderName}
                            setTempFolderName={setTempFolderName}
                            handleUpdateFolderName={handleUpdateFolderName}
                            handleFolderRightClick={handleFolderRightClick}
                            handleNoteRightClick={handleNoteRightClick}
                            handleMoveToParent={handleMoveToParent}
                        />
                    ))}

                    {contextMenu.visible && contextMenu.type ==='folder' &&(
                        <div ref={contextMenuRef} className={styles.contextMenu}>
                            <div onClick={ (e) => {
                                const folder = contextMenu.item as FolderType;
                                setEditingFolderId(folder.id);
                                setTempFolderName(folder.name);
                                setContextMenu({ visible: false, type: null, item: null, x:e.clientX, y: e.clientY });
                            }} >
                                Edit</div>
                            <div onClick={ async (e) => {
                                e.stopPropagation();

                                const folderToDelete = contextMenu.item as FolderType;
                                await DeleteFolder(folderToDelete, folders, setFolders, setNotes);
                                const match = location.pathname.match(/\/notes\/(\d+)/);
                                if (match) {
                                    const currentNoteId = parseInt(match[1]);
                                    const activeNote = notes.find(n => n.id === currentNoteId);

                                    if (activeNote && activeNote.folder_id === folderToDelete.id){
                                        navigate("/");
                                    }
                                }
                                setContextMenu({ visible: false, type:null, item:null, x: e.clientX, y:e.clientY });
                            }}>
                                Delete
                            </div>
                        </div>
                    )}
                </nav>
                
                <div className={styles.divider} />  
                <div className={styles.sectionHeader}>Notes</div>
                <div>
                    {notes.filter( note => !note.folder_id && !note.is_deleted).map(note => (
                        <NoteItem 
                            key={note.id}
                            note={note}
                            isOpen={isOpen}
                            handleNoteRightClick={handleNoteRightClick}
                            handleMoveToParent={handleMoveToParent}
                        />
                    ))}

                    {contextMenu.visible && contextMenu.type === 'note' && (
                        <div ref={contextMenuRef} className={styles.contextMenu}>
                            <div onClick={async (e) => {
                                e.stopPropagation();

                                const noteToDelete = contextMenu.item as NoteType;
                                console.log("onClick Delete triggered");
                                await DeleteNote(noteToDelete, setNotes);
                                if (location.pathname === `/notes/${noteToDelete.id}`) {
                                    navigate("/");
                                }
                                setContextMenu({ visible: false, type: null, item: null, x: e.clientX, y:e.clientY });
                            }}>
                                Delete</div>
                        </div>
                    )}
                </div>
           
            </div>

            <div className={styles.divider} />
            
            <nav style={{ marginBottom: 8 }}>
                {isOpen && <div className={styles.sectionHeader}>Manage</div>}
                
                <div className={styles.navItems}>                        
                    <Link to="/">
                        <Home size={18} />
                        {isOpen && <span>Home</span>}
                    </Link>
                </div>

                <div className={styles.navItems}>
                    <Link to="/chat">
                        <BotMessageSquare size={18}/>
                        {isOpen && <div>Agent</div>}
                    </Link>

                </div>

                <div className={styles.navItems}>
                    <Link to="/settings">
                        <Settings size={18}/>
                        {isOpen && <span>Settings</span>}
                    </Link>
                </div>
              
                <div className={styles.navItems}>
                    <Link to="/">
                        <User size={18}/>
                        {isOpen && <span>Account</span>}
                    </Link>
                </div>
            </nav>

            {isOpen && (
                <div 
                    className={styles.resize}
                    onMouseDown={startResizing}
                />
            )}
        </aside>
    )
}

export default SideNav