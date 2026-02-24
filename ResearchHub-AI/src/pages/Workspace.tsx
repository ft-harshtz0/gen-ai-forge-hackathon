import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getWorkspaceById, getPapers, deletePaper, Paper } from '../storage';

export default function WorkspacePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const workspace = getWorkspaceById(id!);
    const [papers, setPapers] = useState<Paper[]>(() => getPapers(id!));

    if (!workspace) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400">Workspace not found.</p>
                    <Link to="/dashboard" className="text-blue-400 hover:underline text-sm mt-2 block">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    function handleRemove(paperId: string) {
        deletePaper(paperId);
        setPapers((prev) => prev.filter((p) => p.id !== paperId));
        toast.success('Paper removed');
    }

    return (
        <div className="min-h-screen">
            {/* Navbar */}
            <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
                <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm transition">
                    ← Dashboard
                </Link>
                <span className="text-xl font-bold text-white ml-2 truncate">{workspace.name}</span>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">{workspace.name}</h2>
                        {workspace.description && (
                            <p className="text-slate-400 mt-1">{workspace.description}</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/search"
                            className="text-sm border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition"
                        >
                            + Add Papers
                        </Link>
                        <button
                            onClick={() => navigate(`/chat/${id}`)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                        >
                            Chat with AI →
                        </button>
                    </div>
                </div>

                {/* Papers list */}
                {papers.length === 0 ? (
                    <div className="text-center text-slate-500 py-20">
                        <p className="text-lg">No papers yet.</p>
                        <p className="text-sm mt-1">
                            <Link to="/search" className="text-blue-400 hover:underline">
                                Search and import papers
                            </Link>{' '}
                            to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {papers.map((paper) => (
                            <div
                                key={paper.id}
                                className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white">{paper.title}</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">
                                        {paper.authors} {paper.year ? `· ${paper.year}` : ''}
                                    </p>
                                    {paper.abstract && (
                                        <p className="text-slate-400 text-sm mt-2 line-clamp-2">{paper.abstract}</p>
                                    )}
                                    {paper.sourceUrl && (
                                        <a
                                            href={paper.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 text-xs hover:underline mt-1 inline-block"
                                        >
                                            View source ↗
                                        </a>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRemove(paper.id)}
                                    className="text-slate-600 hover:text-red-400 transition text-sm shrink-0 self-start mt-1"
                                    title="Remove paper"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
