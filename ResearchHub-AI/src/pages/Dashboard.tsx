import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    getCurrentUser,
    getWorkspaces,
    createWorkspace,
    deleteWorkspace,
    getPapers,
    logout,
    Workspace,
} from '../storage';

export default function Dashboard() {
    const navigate = useNavigate();
    const user = getCurrentUser()!;
    const [workspaces, setWorkspaces] = useState<Workspace[]>(() => getWorkspaces(user.id));
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        const ws = createWorkspace(user.id, name.trim(), desc.trim());
        setWorkspaces((prev) => [...prev, ws]);
        setName('');
        setDesc('');
        setShowForm(false);
        toast.success('Workspace created!');
    }

    function handleDelete(id: string) {
        deleteWorkspace(id);
        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
        toast.success('Workspace deleted');
    }

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div className="min-h-screen">
            {/* Navbar */}
            <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                <span className="text-xl font-bold text-blue-400">ResearchHub AI</span>
                <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm hidden sm:block">Hi, {user.fullName}</span>
                    <Link
                        to="/search"
                        className="text-slate-300 hover:text-white text-sm transition"
                    >
                        Search Papers
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-slate-400 hover:text-red-400 transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">My Workspaces</h2>
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                    >
                        {showForm ? 'Cancel' : '+ New Workspace'}
                    </button>
                </div>

                {/* New workspace form */}
                {showForm && (
                    <form
                        onSubmit={handleCreate}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8 space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder="e.g. NLP Research"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Description <span className="text-slate-500">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Brief description"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg transition"
                        >
                            Create
                        </button>
                    </form>
                )}

                {/* Workspace grid */}
                {workspaces.length === 0 ? (
                    <div className="text-center text-slate-500 py-20">
                        <p className="text-lg">No workspaces yet.</p>
                        <p className="text-sm mt-1">Create one above to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {workspaces.map((ws) => {
                            const paperCount = getPapers(ws.id).length;
                            return (
                                <div
                                    key={ws.id}
                                    className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-blue-500 transition group relative"
                                >
                                    <Link to={`/workspace/${ws.id}`} className="block">
                                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition truncate">
                                            {ws.name}
                                        </h3>
                                        {ws.description && (
                                            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{ws.description}</p>
                                        )}
                                        <p className="text-slate-500 text-xs mt-3">
                                            {paperCount} paper{paperCount !== 1 ? 's' : ''}
                                        </p>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(ws.id)}
                                        className="absolute top-4 right-4 text-slate-600 hover:text-red-400 text-xs transition"
                                        title="Delete workspace"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
