export interface NoteType {
    id: number,
    title: string,
    content: string,
    created_at: Date,
    updated_at: Date
}

export interface NoteProps {
    Note: NoteType[],
    setNotes: React.Dispatch<React.SetStateAction<NoteType[]>>
}

export type NoteFormProps = {
    send: (title: string, content: string) => void
    showForm: boolean
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>
}


export interface Folder{

}


export interface SideNavProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export interface FolderType{
    id: number,
    name: string
}

export interface FolderProps {
    folderList: FolderType[],
    setFolders: React.Dispatch<React.SetStateAction<FolderType[]>>
}
