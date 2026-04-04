'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import {
  loadThreads, saveThreads, sendChatMessage,
  isRequestActive,
  type ChatThread, type ChatMessage,
} from '@/lib/chat-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot, Send, User, Sparkles, Crown, Lock, Loader2,
  DollarSign, Shield, PiggyBank, HelpCircle, FileText, Heart,
  Plus, Trash2, ChevronDown, History,
} from 'lucide-react';

const STARTER_QUESTIONS = [
  { text: 'What tax credits am I missing?', icon: DollarSign },
  { text: 'How do I apply for FMLA?', icon: Shield },
  { text: 'FSA vs dependent care credit?', icon: HelpCircle },
  { text: 'How much should my emergency fund be?', icon: PiggyBank },
  { text: 'Explain Medicaid spend-down', icon: FileText },
  { text: 'Best way to save while caregiving?', icon: Heart },
];

const FREE_MESSAGE_LIMIT = 5;
const ACTIVE_KEY = 'carefund_active_thread';

function buildUserContext() {
  const profile = store.getProfile();
  const expenses = store.getExpenses();
  const credits = store.getEligibleCredits();
  const goals = store.getSavingsGoals();
  const benefits = store.getBenefits();
  const thisYear = expenses.filter(e => new Date(e.date).getFullYear() === new Date().getFullYear());

  return {
    full_name: profile.full_name,
    caregiver_type: profile.caregiver_type,
    employment_status: profile.employment_status,
    annual_income: profile.annual_income,
    care_hours_per_week: profile.care_hours_per_week,
    care_recipient_relationship: profile.care_recipient_relationship,
    care_recipient_conditions: profile.care_recipient_conditions,
    state: profile.state,
    total_expenses_this_year: thisYear.reduce((s, e) => s + e.amount, 0),
    total_deductible: thisYear.filter(e => e.is_tax_deductible).reduce((s, e) => s + e.amount, 0),
    eligible_credits: credits.map(c => ({ name: c.credit_name, value: c.estimated_value })),
    savings_goals: goals.map(g => ({ name: g.goal_name, current: g.current_amount, target: g.target_amount })),
    active_benefits: benefits.filter(b => b.status === 'active').map(b => b.benefit_name),
    available_benefits: benefits.filter(b => b.status === 'available').map(b => b.benefit_name),
  };
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-4 space-y-1 my-2">$&</ul>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

export default function AssistantPage() {
  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
  });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(() => isRequestActive());
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const isPremium = store.isPremium();
  const profile = store.getProfile();
  const firstName = profile.full_name.split(' ')[0] || 'there';

  const activeThread = threads.find(t => t.id === activeThreadId) || null;
  const messages = activeThread?.messages || [];
  const totalUserMessages = threads.reduce((sum, t) => sum + t.messages.filter(m => m.role === 'user').length, 0);
  const isAtLimit = !isPremium && totalUserMessages >= FREE_MESSAGE_LIMIT;

  // Clean up empty assistant messages on mount
  useEffect(() => {
    setThreads(prev => {
      const cleaned = prev.map(t => ({
        ...t,
        messages: t.messages.filter(m => !(m.role === 'assistant' && m.content.trim() === '')),
      }));
      const changed = cleaned.some((t, i) => t.messages.length !== prev[i].messages.length);
      return changed ? cleaned : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll localStorage for background fetch updates
  useEffect(() => {
    const interval = setInterval(() => {
      setThreads(loadThreads());
      setStreaming(isRequestActive());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Persist active thread ID
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (activeThreadId) localStorage.setItem(ACTIVE_KEY, activeThreadId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }, [activeThreadId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close history dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function createNewThread(): string {
    const id = `thread-${Date.now()}`;
    const thread: ChatThread = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [thread, ...threads];
    setThreads(updated);
    saveThreads(updated);
    setActiveThreadId(id);
    setHistoryOpen(false);
    return id;
  }

  function switchThread(id: string) {
    setActiveThreadId(id);
    setHistoryOpen(false);
  }

  function deleteThread(id: string) {
    const updated = threads.filter(t => t.id !== id);
    setThreads(updated);
    saveThreads(updated);
    if (activeThreadId === id) {
      setActiveThreadId(updated.length > 0 ? updated[0].id : null);
    }
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streaming || isAtLimit) return;

    setError(null);

    let threadId = activeThreadId;
    if (!threadId) {
      threadId = createNewThread();
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    const currentThread = threads.find(t => t.id === threadId);
    const currentMessages = currentThread?.messages || [];

    // Save to localStorage immediately
    const allThreads = loadThreads();
    const thread = allThreads.find(t => t.id === threadId);
    if (thread) {
      thread.messages.push(userMessage, assistantMessage);
      const firstUser = thread.messages.find(m => m.role === 'user');
      if (firstUser) {
        thread.title = firstUser.content.length > 40 ? firstUser.content.slice(0, 40) + '...' : firstUser.content;
      }
      thread.updatedAt = new Date().toISOString();
      saveThreads(allThreads);
      setThreads(allThreads);
    }

    setInput('');
    setStreaming(true);

    const apiMessages = [...currentMessages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await sendChatMessage(threadId, assistantMessage.id, apiMessages, buildUserContext());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setStreaming(false);
      setThreads(loadThreads());
    }
  }, [threads, activeThreadId, streaming, isAtLimit]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const sortedThreads = [...threads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const hasHistory = sortedThreads.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold flex items-center gap-2">
              CareFund AI
              {isPremium && <Badge className="bg-amber-100 text-amber-800 text-[10px]"><Crown className="h-2.5 w-2.5 mr-0.5" /> Premium</Badge>}
            </h1>
            <p className="text-[11px] text-muted-foreground">Your caregiver finance advisor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPremium && (
            <Badge variant="outline" className="text-[10px]">
              {Math.max(0, FREE_MESSAGE_LIMIT - totalUserMessages)} left
            </Badge>
          )}

          {/* History dropdown */}
          <div className="relative" ref={historyRef}>
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(!historyOpen)} className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">History</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
            </Button>

            {historyOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border bg-background shadow-lg z-50">
                <div className="p-2 border-b">
                  <Button size="sm" className="w-full" onClick={() => createNewThread()}>
                    <Plus className="mr-1.5 h-3 w-3" /> New Chat
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {!hasHistory ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No past conversations</p>
                  ) : (
                    sortedThreads.map(thread => (
                      <div
                        key={thread.id}
                        className={`group flex items-center gap-2 rounded-md px-2.5 py-2 cursor-pointer transition-colors ${
                          thread.id === activeThreadId ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => switchThread(thread.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{thread.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {thread.messages.length} messages &middot; {new Date(thread.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Hey {firstName}, how can I help?</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Ask me anything about tax credits, benefits, savings, or caregiving finances.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {STARTER_QUESTIONS.map((q, i) => {
                const Icon = q.icon;
                return (
                  <button key={i} type="button" onClick={() => sendMessage(q.text)}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs">{q.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="shrink-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {msg.role === 'assistant' && msg.content === '' ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none [&_strong]:font-semibold [&_ul]:my-1 [&_li]:ml-1"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 mb-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Premium gate */}
      {isAtLimit && (
        <Card className="border-amber-200 bg-amber-50 mb-2">
          <CardContent className="flex items-center gap-3 py-3">
            <Lock className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Free messages used up</p>
              <p className="text-xs text-muted-foreground">Upgrade for unlimited AI conversations</p>
            </div>
            <Link href="/settings">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Sparkles className="mr-1 h-3 w-3" /> Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Input */}
      <div className="border-t pt-3 pb-1">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAtLimit ? 'Upgrade to continue...' : 'Ask about tax credits, benefits, savings...'}
            disabled={streaming || isAtLimit}
            rows={1}
            className="min-h-[44px] max-h-[120px] resize-none"
          />
          <Button onClick={() => sendMessage(input)} disabled={!input.trim() || streaming || isAtLimit} size="icon">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          AI advisor, not a licensed professional. Consult a CPA for major decisions.
        </p>
      </div>
    </div>
  );
}
