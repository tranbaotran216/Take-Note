import React, { useState, useEffect, useRef, useMemo } from "react"
import { Home, Settings, Menu, User, BotMessageSquare, Search, Folder, Star, Trash2Icon, SortAscIcon } from "lucide-react"
import styles from "./SideNav.module.css"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { AddFolderButton, DeleteFolder, FolderList } from "./Folders"
import type { NoteType, FolderType, SideNavProps } from "../types"
import { AddNote, DeleteNote, NoteItem } from "./Notes"
import { getAllNotes, updateNoteToFolder, toggleFavoriteNote } from "../api/notes"
import { getAllFolders, updateFolder, updateFolderToParent, toggleFolderFavorite } from "../api/folders"


const MIN_SIDENAV_WIDTH = 250
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

    const [sortBy, setSortBy] = useState<'date' | 'name'>('date')

    const sortedFolders = useMemo(() => {
        return [...folders].sort((a,b) => {
            if (sortBy === 'name') {
                return (a.name || "" ).localeCompare(b.name || "");
            } else {
                const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
                const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
                return dateB - dateA;
            }
        });
    }, [folders, sortBy]);

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            if (sortBy === 'name') {
                return (a.title || "").localeCompare(b.title || "");
            } else {
                const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
                const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
                return dateB - dateA;
            }
        });
    }, [notes, sortBy]);

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

    useEffect(() => {
        const handleRefresh = () => {
            fetchFolders();
            fetchNotes();
        };
        window.addEventListener("refresh-sidebar", handleRefresh);
        return () => {
            window.removeEventListener("refresh-sidebar", handleRefresh)
        };
    }, []);

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

    // -------------- search bar -----------------------------
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLDivElement>(null); // click outside close search bar
    const query = searchQuery.toLocaleLowerCase().trim();

    const matchedFolders = query? folders.filter(f => !f.is_deleted && f.name.toLocaleLowerCase().includes(query)) : [];
    const matchedTitleNotes = query ? notes.filter(n => !n.is_deleted && n.title.toLocaleLowerCase().includes(query)) : [];

    const matchedContentNotes = query ? notes.filter(n => {
        if (n.is_deleted) return false;
        if (n.title.toLocaleLowerCase().includes(query)) return false;

        const rawContent = n.content ? n.content.replace(/<[^>]*>?/gm, '').toLowerCase() : "";
        return rawContent.includes(query);
    }) : [];

    useEffect(() => {
        const handleOutsideSearch = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchQuery("");   
            }
        };
        document.addEventListener("mousedown", handleOutsideSearch);
        return () => document.removeEventListener("mousedown", handleOutsideSearch);
    }, []);

    // ----------- expand folders --------------------
    const handleClickFolderExpansion = (targetFolderId : number) => {
        const ancestorsIds = new Set<number>();
        let curId : number | null | undefined = targetFolderId;
        while (curId) {
            ancestorsIds.add(curId);
            const curFolderId = folders.find(f => f.id === curId);
            curId = curFolderId?.parent_id;
        }

        window.dispatchEvent(new CustomEvent("expand-folders", {
            detail:{
                folderIds:  Array.from(ancestorsIds),
                targetId: targetFolderId
            }
        }));
    }

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

                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {isOpen && (
                        <button 
                            className={styles.menuButton}
                            onClick={() => setSortBy(prev => prev === 'date' ? 'name' : 'date')}
                            title={sortBy === 'date' ? "Đang sắp xếp theo Mới cập nhật" : "Đang sắp xếp theo Tên (A-Z)"}
                        >
                            <div>
                                <SortAscIcon size={16} color={sortBy === 'date' ? '#3b82f6' : '#888'} />
                            </div>
                        </button>
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
            </div>

            <div className={styles.divider}/>

            <div className={styles.navContainer} style={{ overflowY: 'auto', flex: 1 }}>
                {/* search bar */}
                {isOpen && (
                    <div className={styles.searchContainer} ref={searchRef}>
                        <div className={styles.searchInputWrapper}>
                            <Search size={14} className={styles.searchIcon}/>
                            <input 
                                type="text" 
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            
                            />
                        </div>
                        {/* dropdown search results */}
                        {searchQuery && (
                            <div className={styles.searchDropdown}>
                                {(matchedFolders.length > 0 || matchedTitleNotes.length > 0) && (
                                    <div>
                                        {matchedFolders.map(f => (
                                            <div key={`f-${f.id}`} className={styles.searchItem} onClick={() => setSearchQuery("")}>
                                                <span className={styles.itemIcon}><Folder size={14} color="#dcb67a" /></span>
                                                <span className={styles.itemText}>{f.name}</span>
                                                <span className={styles.itemMeta}>folder</span>
                                            </div>
                                        ))}
                                        {matchedTitleNotes.map(n => (
                                            <div key={`nt-${n.id}`} className={styles.searchItem} onClick={() => {
                                                navigate(`/notes/${n.id}`);
                                                setSearchQuery(""); // Chọn xong thì đóng dropdown
                                            }}>
                                                <span className={styles.itemIcon}>📔</span>
                                                <span className={styles.itemText}>{n.title}</span>
                                                <span className={styles.itemMeta}>title match</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(matchedFolders.length > 0 || matchedTitleNotes.length > 0) && matchedContentNotes.length > 0 && (
                                    <div className={styles.searchDivider}/>
                                )}

                                {matchedContentNotes.length >0 && (
                                    <div>
                                        {matchedContentNotes.map(n => (
                                            <div key={`nc-${n.id}`} className={styles.searchItem} onClick={() => {
                                                navigate(`/notes/${n.id}`);
                                                setSearchQuery("");
                                            }}>
                                                <span className={styles.itemIcon}>📔</span>
                                                <span className={styles.itemText}>{n.title}</span>
                                                <span className={styles.itemMeta}>content match</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {matchedFolders.length === 0 && matchedTitleNotes.length === 0 && matchedContentNotes.length === 0 && (
                                    <div className={styles.noResults}>No results found</div>
                                )}
                            </div>
                        )}
                    </div>
                )}


                {isOpen && <div className={styles.sectionHeader}>Recent</div>}
                {/* Render recent notes here */}

                <div className={styles.divider}/>

                {isOpen && <div className={styles.sectionHeader}>Folders</div>}
                <nav>
                    {sortedFolders.filter(efolder => !efolder.parent_id && !efolder.is_deleted).map(folder => (
                        <FolderList 
                            key={folder.id}
                            folder={folder}
                            folders={sortedFolders}
                            notes={sortedNotes}
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
                                e.stopPropagation();
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

                            <div onClick={ async (e) => {
                                e.stopPropagation();
                                const folder = contextMenu.item as FolderType;
                                const updatedFolder = await toggleFolderFavorite(folder.id);

                                setFolders(prev => prev.map(f => f.id === folder.id ? updatedFolder : f));
                                setContextMenu({ visible: false, type: null, item: null, x: 0, y: 0 });
                            }}>
                                {contextMenu.item?.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                            </div>
                        </div>
                    )}
                </nav>
                
                <div className={styles.divider} />  
                <div className={styles.sectionHeader}>Notes</div>
                <div>
                    {sortedNotes.filter( note => !note.folder_id && !note.is_deleted).map(note => (
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

                            <div onClick={async (e) => {
                                e.stopPropagation();
                                const note = contextMenu.item as NoteType;
                                const noteUpdated = await toggleFavoriteNote(note.id);

                                setNotes(prev => prev.map(n => n.id === note.id ? noteUpdated : n));
                                setContextMenu({ visible: false, type: null, item: null, x: e.clientX, y:e.clientY });
                            }}>
                                {contextMenu.item?. is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                            </div>
                        </div>
                    )}
                </div>
           
            </div>

            <div className={styles.divider} />
            {/* Favorite section */}
            {isOpen && (
                <>
                    <div className={styles.sectionHeader}>Favorites</div>
                    <div style={{ marginBottom: 12 }}>
                        {sortedFolders.filter( f=> f.is_favorite && !f.is_deleted).map( folder => (
                            <div key={`fav-f-${folder.id}`} className={styles.navItems} onClick={() => handleClickFolderExpansion(folder.id)}>
                                <div className={styles.folderItem}>
                                    <Star size={14} fill="#eab308" color="#eab308" /> {/* Ngôi sao vàng */}
                                    <span>{folder.name}</span>
                                </div>
                            </div>
                        ))}

                        {sortedNotes.filter(n => n.is_favorite && !n.is_deleted).map(note => (
                            <div key={`fav-n-${note.id}`} className={styles.navItems} onClick={() => navigate(`/notes/${note.id}`)}>
                                <div className={styles.folderItem}> {/* Dùng chung class cho đẹp */}
                                    <Star size={14} fill="#f1cb58" color="#f8cd4c" />
                                    <span>{note.title}</span>
                                </div>
                            </div>
                        ))}
                        
                        {/* Hiển thị dòng chữ nếu chưa có Favorite nào */}
                        {sortedFolders.filter(f => f.is_favorite && !f.is_deleted).length === 0 && 
                        sortedNotes.filter(n => n.is_favorite && !n.is_deleted).length === 0 && (
                            <div style={{ padding: '0 24px', color: '#6a6b71', fontSize: '12px' }}>
                                No favorites yet.
                            </div>
                        )}

                    </div>
                </>
            )}

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
                    <Link to="/trash">
                        <Trash2Icon size={18}/>
                        {isOpen && <span>Trash</span>}
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