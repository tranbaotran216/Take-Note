import type React from "react";

export interface NoteType {
    id: number,
    title: string,
    content: string,
    created_at: Date,
    updated_at: Date;
    folder_id: number | null;
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



export interface SideNavProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    width: number;
    setWidth: React.Dispatch<React.SetStateAction<number>>;
}

export interface FolderType{
    id: number,
    name: string
    parent_id: number | null;
}

export interface FolderProps {
    folderList: FolderType[],
    setFolders: React.Dispatch<React.SetStateAction<FolderType[]>>
}

export interface ChatResponse {
    reply: string;
}

export interface FolderListProps {
    folder: FolderType;
    folders: FolderType[];
    notes: NoteType[];
    depth? : number; //thut le
    isOpen: boolean; //sidebar is open?

    // edit folder name
    editingFolderId: number | null;
    tempFolderName: string;
    setTempFolderName: (name: string) => void;
    handleUpdateFolderName: (id: number) => void;
    handleFolderRightClick: (e: React.MouseEvent, folder: FolderType) => void;
    handleNoteRightClick: (e : React.MouseEvent, note: NoteType) => void;
    handleMoveToParent :(objectId: number, parentId: number, type:string) => Promise<void>;
}

export interface NoteItemProps {
    note: NoteType;
    isOpen: boolean;
    depth?: number;
    handleNoteRightClick: (e: React.MouseEvent, note: NoteType) => void;
    handleMoveToParent:(objectId: number, parentId: number, type:string) => Promise<void>;
}