// Chat service that runs outside React component lifecycle.
// Fetch requests survive component unmount / page navigation within the SPA.

const STORAGE_KEY = 'carefund_chat_threads';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Active request tracking
let activeRequest: { threadId: string; assistantId: string; controller: AbortController } | null = null;
// Listeners that the React component can subscribe to
let onUpdate: (() => void) | null = null;

export function subscribeToUpdates(cb: () => void) {
  onUpdate = cb;
  return () => { onUpdate = null; };
}

function notify() {
  if (onUpdate) onUpdate();
}

export function loadThreads(): ChatThread[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(threads)); } catch {}
}

function updateAssistantMessage(threadId: string, assistantId: string, content: string) {
  const threads = loadThreads();
  const thread = threads.find(t => t.id === threadId);
  if (!thread) return;
  const msg = thread.messages.find(m => m.id === assistantId);
  if (msg) msg.content = content;
  // Update title from first user message
  const firstUser = thread.messages.find(m => m.role === 'user');
  if (firstUser) {
    thread.title = firstUser.content.length > 40 ? firstUser.content.slice(0, 40) + '...' : firstUser.content;
  }
  thread.updatedAt = new Date().toISOString();
  saveThreads(threads);
  notify();
}

function removeEmptyAssistant(threadId: string, assistantId: string) {
  const threads = loadThreads();
  const thread = threads.find(t => t.id === threadId);
  if (!thread) return;
  thread.messages = thread.messages.filter(m => !(m.id === assistantId && m.content.trim() === ''));
  saveThreads(threads);
  notify();
}

export function isRequestActive(): boolean {
  return activeRequest !== null;
}

export function getActiveAssistantId(): string | null {
  return activeRequest?.assistantId || null;
}

export async function sendChatMessage(
  threadId: string,
  assistantMessageId: string,
  apiMessages: { role: string; content: string }[],
  userContext: Record<string, unknown>,
): Promise<void> {
  // Cancel any existing request
  if (activeRequest) {
    activeRequest.controller.abort();
  }

  const controller = new AbortController();
  activeRequest = { threadId, assistantId: assistantMessageId, controller };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, userContext }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to get response');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              // Write directly to localStorage — survives unmount
              updateAssistantMessage(threadId, assistantMessageId, accumulated);
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Aborted by new request, don't clean up
      return;
    }
    // Remove empty assistant message on real errors
    removeEmptyAssistant(threadId, assistantMessageId);
    throw err;
  } finally {
    activeRequest = null;
    notify();
  }
}
