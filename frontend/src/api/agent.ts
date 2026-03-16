import axios from "axios";
import type { ChatResponse } from "../types";

const API = "http://localhost:8000/chat/"

export const sendMessage = async (mes: string) => {
    try {
        const ans = await axios.post<ChatResponse>(`${API}`, { content: mes, role:"user" })
        return ans.data.reply
    } catch (error) {
        console.log("Error send message in api, ", error)
    } 
}
