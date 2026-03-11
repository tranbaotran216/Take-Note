import React, { useState, useEffect, useRef } from "react"
import { Home, Settings, Menu, User } from "lucide-react"
import styles from "./SideNav.module.css"
import { Link } from "react-router-dom"
import AddFolderButton from "./Folders"
import type { NoteType, FolderType, SideNavProps } from "../types"
import { AddNote } from "./Notes"
import { getAllNotes } from "../api/notes"
import { getAllFolders } from "../api/folders"


const SideNav = ({ isOpen, setIsOpen }: SideNavProps) => {
    const [folders, setFolders] = useState<FolderType[]>([])
    const [notes, setNotes] = useState<NoteType[]>([])
    const [notificationCount] = useState(3)

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean
        type: "folder" | "note" | null
        item: NoteType  | FolderType | null
    }>({
        visible: false,
        type : null,
        item: null
    })
    
    const contextMenuRef= useRef<HTMLDivElement>(null)


    const handleNoteRightClick = (e: React.MouseEvent, note: NoteType) => {
        e.preventDefault();
        console.log(`right click on note ${note.id}`)
        setContextMenu({
            visible: true,
            type: 'note',
            item: note
        })
    }

    const handleFolderRightClick = (e: React.MouseEvent, folder: FolderType) => {
        e.preventDefault();
        setContextMenu({
            visible:true,
            type: 'folder',
            item: folder
        })
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
                item:null
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

    return ( 
        <aside className={`${styles.sidenav} ${isOpen ? styles.open : ""}`}>
            <div className={styles.toggle}>
                {isOpen ? (
                    <AddNote Note={notes} setNotes={setNotes} />
                ) : (
                    <div style={{ width: 36 }} /> 
                )}

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

            <div className={styles.toggle}>
                <AddFolderButton
                    folderList={folders}
                    setFolders={setFolders}
                />
            </div>

            <div className={styles.divider}/>

            <div className={styles.navContainer} style={{ overflowY: 'auto', flex: 1 }}>
                {isOpen && <div className={styles.sectionHeader}>Recent</div>}
                {/* Render recent notes here */}

                <div className={styles.divider}/>

                {isOpen && <div className={styles.sectionHeader}>Folders</div>}
                <nav>
                    {folders.map(folder => (
                        <div key={folder.id} className={styles.navItems} onContextMenu={(e) => handleFolderRightClick(e, folder)}>
                            <div className={styles.folderItem}>
                                📁
                                {isOpen && <span>{folder.name}</span>}
                            </div>
                        </div>
                    ))}

                    {contextMenu.visible && contextMenu.type ==='folder' &&(
                        <div ref={contextMenuRef} className={styles.contextMenu}>
                            <div>Edit</div>
                            <div>Delete</div>
                        </div>
                    )}
                </nav>
                
            </div>

            <div className={styles.divider} />  
            <div className={styles.sectionHeader}>Notes</div>
            <div>
                {notes.map(note => (
                    <div key={note.id} className={styles.navItems} onContextMenu={(e) => handleNoteRightClick(e, note)} >
                        { isOpen &&
                            (<Link to={`/notes/${note.id}`}>📔 {note.title}</Link>)
                        }
                    </div>
                ))}

                {contextMenu.visible && contextMenu.type === 'note' && (
                    <div ref={contextMenuRef} className={styles.contextMenu}>
                        <div>Edit</div>
                        <div>Delete</div>
                    </div>
                )}
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
        </aside>
    )
}

export default SideNav