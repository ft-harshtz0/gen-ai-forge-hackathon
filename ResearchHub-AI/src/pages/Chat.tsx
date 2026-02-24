import { useState, useEffect, useRef, FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { askGroq, ChatMessage } from '../api';
import {
    getWorkspaceById,
    getPapers,
    getMessages,
    saveMessage,
    clearMessages,
    getCurrentUser,
    Message,
} from '../storage';

export default function Chat() {
    const { id } = useParams<{ id: string }>();
    const user = getCurrentUser()!;
    const workspace = getWorkspaceById(id!);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages(getMessages(id!));
    }, [id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    async function handleSend(e: FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;
        setInput('');

        // Save + show user message
        const userMsg = saveMessage(id!, 'user', text);
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            // Build context from papers
            const papers = getPapers(id!);
            const context =
                papers.length > 0
                    ? papers
                        .map(
                            (p) =>
                                `Title: ${p.title}\nAuthors: ${p.authors}\nAbstract: ${p.abstract || 'N/A'}`
                        )
                        .join('\n\n')
                    : 'No papers imported yet.';

            // Build history (last 6 messages)
            const recentHistory = getMessages(id!)
                .slice(-7, -1) // last 6 before the new one
                .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

            const groqMessages: ChatMessage[] = [
                {
                    role: 'system',
                    content: `You are a research assistant. Answer questions based on these research papers:\n\n${context}`,
                },
                ...recentHistory,
                { role: 'user', content: text },
            ];

            const reply = await askGroq(groqMessages);
            const aiMsg = saveMessage(id!, 'assistant', reply);
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
            toast.error(err.message || 'AI request failed');
        } finally {
            setLoading(false);
        }
    }

    function handleClear() {
        clearMessages(id!);
        setMessages([]);
        toast.success('Chat history cleared');
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/workspace/${id}`}
                        className="text-slate-400 hover:text-white text-sm transition"
                    >
                        ← Workspace
                    </Link>
                    <span className="text-white font-semibold truncate">
                        {workspace?.name ?? 'Chat'}
                    </span>
                </div>
                <button
                    onClick={handleClear}
                    className="text-slate-500 hover:text-red-400 text-xs transition"
                >
                    Clear History
                </button>
            </nav>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 max-w-3xl mx-auto w-full">
                {messages.length === 0 && !loading && (
                    <p className="text-center text-slate-500 mt-20">
                        Ask anything about your imported papers.
                    </p>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                            <span className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-slate-700 bg-slate-800 px-4 sm:px-6 py-4 shrink-0">
                <form
                    onSubmit={handleSend}
                    className="max-w-3xl mx-auto flex gap-3"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your papers…"
                        disabled={loading}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
