import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { searchPapers, SearchResult } from '../api';
import { getCurrentUser, getWorkspaces, savePaper, Workspace } from '../storage';

export default function Search() {
    const user = getCurrentUser()!;
    const workspaces = getWorkspaces(user.id);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<string | null>(null);
    const [selectedWs, setSelectedWs] = useState<Record<string, string>>({});

    async function handleSearch(e: FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        try {
            const data = await searchPapers(query.trim());
            setResults(data);
            if (data.length === 0) toast('No results found.', { icon: '🔍' });
        } catch {
            toast.error('Search failed. Try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleImport(paper: SearchResult) {
        const wsId = selectedWs[paper.paperId];
        if (!wsId) {
            toast.error('Select a workspace first');
            return;
        }
        setImporting(paper.paperId);
        savePaper({
            title: paper.title,
            authors: paper.authors,
            abstract: paper.abstract,
            year: paper.year,
            sourceUrl: paper.url,
            workspaceId: wsId,
            userId: user.id,
        });
        toast.success(`"${paper.title.slice(0, 40)}…" imported!`);
        setImporting(null);
    }

    return (
        <div className="min-h-screen">
            {/* Navbar */}
            <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
                <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm transition">
                    ← Dashboard
                </Link>
                <span className="text-xl font-bold text-blue-400 ml-2">Search Papers</span>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-10">
                {/* Search bar */}
                <form onSubmit={handleSearch} className="flex gap-3 mb-10">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for research papers…"
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition"
                    >
                        {loading ? 'Searching…' : 'Search'}
                    </button>
                </form>

                {/* Results */}
                <div className="space-y-5">
                    {results.map((paper) => (
                        <div
                            key={paper.paperId}
                            className="bg-slate-800 border border-slate-700 rounded-xl p-6"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white">{paper.title}</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">
                                        {paper.authors} {paper.year ? `· ${paper.year}` : ''}
                                    </p>
                                    {paper.abstract && (
                                        <p className="text-slate-400 text-sm mt-2 line-clamp-3">{paper.abstract}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 min-w-max">
                                    <select
                                        value={selectedWs[paper.paperId] || ''}
                                        onChange={(e) =>
                                            setSelectedWs((prev) => ({ ...prev, [paper.paperId]: e.target.value }))
                                        }
                                        className="bg-slate-900 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">Select workspace</option>
                                        {workspaces.map((ws: Workspace) => (
                                            <option key={ws.id} value={ws.id}>
                                                {ws.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleImport(paper)}
                                        disabled={importing === paper.paperId}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
                                    >
                                        {importing === paper.paperId ? 'Importing…' : 'Import'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && results.length === 0 && (
                    <p className="text-center text-slate-500 mt-20">
                        Search for papers above to get started.
                    </p>
                )}
            </main>
        </div>
    );
}
