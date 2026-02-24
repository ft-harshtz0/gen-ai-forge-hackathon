// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
    id: string;
    email: string;
    password: string; // stored as plain text (MVP only)
    fullName: string;
}

export interface Workspace {
    id: string;
    name: string;
    description: string;
    userId: string;
    createdAt: string;
}

export interface Paper {
    id: string;
    title: string;
    authors: string;
    abstract: string;
    year: number | null;
    sourceUrl: string;
    workspaceId: string;
    userId: string;
}

export interface Message {
    id: string;
    workspaceId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
    users: 'rh_users',
    currentUser: 'rh_current_user',
    workspaces: 'rh_workspaces',
    papers: 'rh_papers',
    messages: 'rh_messages',
};

function load<T>(key: string): T[] {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function save<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
    return load<User>(KEYS.users);
}

export function getUserByEmail(email: string): User | undefined {
    return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(fullName: string, email: string, password: string): User {
    const users = getUsers();
    const user: User = { id: uid(), email, password, fullName };
    save(KEYS.users, [...users, user]);
    return user;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function getCurrentUser(): Omit<User, 'password'> | null {
    try {
        return JSON.parse(localStorage.getItem(KEYS.currentUser) || 'null');
    } catch {
        return null;
    }
}

export function setCurrentUser(user: User): void {
    const { password: _pw, ...safe } = user;
    localStorage.setItem(KEYS.currentUser, JSON.stringify(safe));
}

export function logout(): void {
    localStorage.removeItem(KEYS.currentUser);
}

// ─── Workspaces ───────────────────────────────────────────────────────────────

export function getWorkspaces(userId: string): Workspace[] {
    return load<Workspace>(KEYS.workspaces).filter((w) => w.userId === userId);
}

export function getWorkspaceById(id: string): Workspace | undefined {
    return load<Workspace>(KEYS.workspaces).find((w) => w.id === id);
}

export function createWorkspace(userId: string, name: string, description: string): Workspace {
    const all = load<Workspace>(KEYS.workspaces);
    const ws: Workspace = { id: uid(), name, description, userId, createdAt: new Date().toISOString() };
    save(KEYS.workspaces, [...all, ws]);
    return ws;
}

export function deleteWorkspace(id: string): void {
    save(KEYS.workspaces, load<Workspace>(KEYS.workspaces).filter((w) => w.id !== id));
    save(KEYS.papers, load<Paper>(KEYS.papers).filter((p) => p.workspaceId !== id));
    save(KEYS.messages, load<Message>(KEYS.messages).filter((m) => m.workspaceId !== id));
}

// ─── Papers ───────────────────────────────────────────────────────────────────

export function getPapers(workspaceId: string): Paper[] {
    return load<Paper>(KEYS.papers).filter((p) => p.workspaceId === workspaceId);
}

export function savePaper(paper: Omit<Paper, 'id'>): Paper {
    const all = load<Paper>(KEYS.papers);
    const p: Paper = { ...paper, id: uid() };
    save(KEYS.papers, [...all, p]);
    return p;
}

export function deletePaper(id: string): void {
    save(KEYS.papers, load<Paper>(KEYS.papers).filter((p) => p.id !== id));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function getMessages(workspaceId: string): Message[] {
    return load<Message>(KEYS.messages)
        .filter((m) => m.workspaceId === workspaceId)
        .slice(-50);
}

export function saveMessage(workspaceId: string, role: 'user' | 'assistant', content: string): Message {
    const all = load<Message>(KEYS.messages);
    const msg: Message = { id: uid(), workspaceId, role, content, createdAt: new Date().toISOString() };
    save(KEYS.messages, [...all, msg]);
    return msg;
}

export function clearMessages(workspaceId: string): void {
    save(KEYS.messages, load<Message>(KEYS.messages).filter((m) => m.workspaceId !== workspaceId));
}
