import { useState, useEffect } from "react"
import { Home, Settings, Menu, User } from "lucide-react"
import styles from "./SideNav.module.css"
import { Link } from "react-router-dom"
import AddFolderButton from "../button/add_folder"
import type { FolderType } from "../button/add_folder"
import axios from "axios"


const SideNav = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [folders, setFolders] = useState<FolderType[]>([])

    const fetchFolders = async () => {
        const res = await axios.get("http://localhost:8000/folders/")
        setFolders(res.data)
    }

    useEffect(() => {
        fetchFolders()
    }, [])

    return ( 
        <>
            <aside className={`${styles.sidenav} ${isOpen ? styles.open : "" }`}>
                <div className={styles.toggle}>
                    <button onClick={() => setIsOpen(!isOpen)}>
                        <Menu size={20}/>
                    </button>
                </div>

                <nav>
                    {folders.map(folders => (
                        <div key={folders.id} className={styles.navItems}>
                            {isOpen && <span>📁{folders.name}</span>}
                        </div>
                    ))}
                </nav>

                <nav>
                    <div className={styles.navItems}>                        
                        <Link to={"/"} className={styles.navItems}>
                            <Home size={18} />
                            {isOpen && <span>Home</span>}
                        </Link>
                    </div>

                    <div className={styles.navItems}>
                        <Link to={"/settings"} className={styles.navItems}>
                            <Settings size={18}/>
                            {isOpen && <span>Settings</span>}
                        </Link>
                    </div>
                  
                    <div className={styles.navItems}>
                        <User size={18} className={styles.navItems}/>
                        {isOpen && <span>Account</span>}
                    </div>

                    <div className={styles.navItems}>
                        <AddFolderButton
                            folderList={folders}
                            setFolders={setFolders}
                        />
                        {isOpen && <span>New folder</span>}
                    </div>
                </nav>
            </aside>
        </>
    )
}

export default SideNav