import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { sendMessage } from '../api/agent';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const AgentChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const reply = await sendMessage(input);
            if (reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Xin lỗi, tôi không nhận được phản hồi." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Đã có lỗi xảy ra trong quá trình kết nối." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#131314] text-[#e3e3e3] overflow-hidden">
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-[60vh] flex flex-col justify-center items-center text-center">
                            <h1 className="text-3xl font-medium mb-2 text-white"><span><Bot size={50} /></span> Trợ lý AI  </h1>
                            <p className="text-gray-400 mb-8">Hãy đặt câu hỏi về ghi chú của bạn</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            return (
                                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto">
                                            {isUser ? (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 flex items-center justify-center">
                                                    <User size={16} className="text-white"/>
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <Bot size={16} className="text-white"/>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                                            isUser 
                                            ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
                                            : 'bg-[#1e1f20] text-gray-200 rounded-2xl rounded-bl-sm border border-[#333537]'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    
                    {isLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="flex gap-3 max-w-[80%] flex-row">
                                <div className="w-8 h-8 rounded-full bg-[#1e1f20] flex items-center justify-center shrink-0 mt-auto">
                                    <Sparkles size={16} className="text-indigo-400" />
                                </div>
                                <div className="px-4 py-4 bg-[#1e1f20] rounded-2xl rounded-bl-sm border border-[#333537] flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 bg-[#131314] border-t border-[#2a2b2d] shrink-0">
                <div className="max-w-3xl mx-auto relative group">
                    <div className="bg-[#1e1f20] rounded-[24px] flex items-end px-2 border border-[#333537] focus-within:border-indigo-500 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Nhập tin nhắn..."
                            rows={1}
                            className="flex-1 bg-transparent border-none outline-none px-4 py-3.5 resize-none text-[15px] max-h-32"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentChat;