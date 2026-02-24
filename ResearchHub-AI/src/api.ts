export interface SearchResult {
    paperId: string;
    title: string;
    authors: string;
    abstract: string;
    year: number | null;
    url: string;
}

// ─── Semantic Scholar ─────────────────────────────────────────────────────────

export async function searchPapers(query: string): Promise<SearchResult[]> {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
        query
    )}&limit=10&fields=title,authors,abstract,year,url`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Semantic Scholar request failed');

    const data = await res.json();
    return (data.data || []).map((p: any) => ({
        paperId: p.paperId,
        title: p.title || 'Untitled',
        authors: (p.authors || []).map((a: any) => a.name).join(', ') || 'Unknown',
        abstract: p.abstract || '',
        year: p.year || null,
        url: p.url || '',
    }));
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function askGroq(history: ChatMessage[]): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        throw new Error('Groq API key not configured. Please set VITE_GROQ_API_KEY in your .env file.');
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: history,
            max_tokens: 1024,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq error: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response from AI.';
}
