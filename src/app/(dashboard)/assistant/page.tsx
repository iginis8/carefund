'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import {
  loadThreads, saveThreads, subscribeToUpdates, sendChatMessage,
  isRequestActive, getActiveAssistantId,
  type ChatThread, type ChatMessage,
} from '@/lib/chat-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot, Send, User, Sparkles, Crown, Lock, Loader2, MessageSquare,
  DollarSign, Shield, PiggyBank, HelpCircle, FileText, Heart,
  Plus, Trash2, MessageCircle,
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
  // Read from localStorage on every render via the service
  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
  });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(() => isRequestActive());
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPremium = store.isPremium();
  const profile = store.getProfile();
  const firstName = profile.full_name.split(' ')[0] || 'there';

  const activeThread = threads.find(t => t.id === activeThreadId) || null;
  const messages = activeThread?.messages || [];
  const totalUserMessages = threads.reduce((sum, t) => sum + t.messages.filter(m => m.role === 'user').length, 0);
  const isAtLimit = !isPremium && totalUserMessages >= FREE_MESSAGE_LIMIT;

  // Subscribe to chat service updates (fires when localStorage is written by the service)
  useEffect(() => {
    const unsub = subscribeToUpdates(() => {
      setThreads(loadThreads());
      setStreaming(isRequestActive());
    });
    return unsub;
  }, []);

  // Also poll localStorage on a short interval to catch updates from the background fetch
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = loadThreads();
      setThreads(fresh);
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
    return id;
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

    // Get current messages before adding new ones
    const currentThread = threads.find(t => t.id === threadId);
    const currentMessages = currentThread?.messages || [];

    // Add messages to localStorage immediately
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
      // This runs in the chat-service module — survives component unmount
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
  const activeAssistantId = getActiveAssistantId();

  return (
    <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
      {/* Chat History Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} shrink-0 border-r overflow-hidden transition-all duration-200`}>
        <div className="flex flex-col h-full w-64">
          <div className="p-3 border-b">
            <Button className="w-full" size="sm" onClick={() => createNewThread()}>
              <Plus className="mr-2 h-3 w-3" /> New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {sortedThreads.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
              ) : (
                sortedThreads.map(thread => (
                  <div
                    key={thread.id}
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                      thread.id === activeThreadId ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground/70'
                    }`}
                    onClick={() => setActiveThreadId(thread.id)}
                  >
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate flex-1 text-xs">{thread.title}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }}
                      className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setShowSidebar(!showSidebar)} className="text-muted-foreground hover:text-foreground">
              <MessageSquare className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold flex items-center gap-2">
                CareFund AI
                {isPremium && <Badge className="bg-amber-100 text-amber-800 text-[10px]"><Crown className="h-2.5 w-2.5 mr-0.5" /> Premium</Badge>}
              </h1>
            </div>
          </div>
          {!isPremium && (
            <Badge variant="outline" className="text-xs">
              {Math.max(0, FREE_MESSAGE_LIMIT - totalUserMessages)} messages left
            </Badge>
          )}
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Hey {firstName}, how can I help?</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                I know your caregiving situation, finances, and benefits. Ask me anything about saving money, tax credits, or planning ahead.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {STARTER_QUESTIONS.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <button key={i} type="button" onClick={() => sendMessage(q.text)}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span>{q.text}</span>
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
                    <div className="shrink-0 flex items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
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
                    <div className="shrink-0 flex items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 mb-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {isAtLimit && (
          <Card className="border-amber-200 bg-amber-50 mb-2">
            <CardContent className="flex items-center gap-3 py-3">
              <Lock className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">You&apos;ve used all {FREE_MESSAGE_LIMIT} free messages</p>
                <p className="text-xs text-muted-foreground">Upgrade to Premium for unlimited AI conversations</p>
              </div>
              <Link href="/settings">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  <Sparkles className="mr-1 h-3 w-3" /> Upgrade
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="border-t pt-3 pb-1">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAtLimit ? 'Upgrade to Premium to continue...' : 'Ask about tax credits, benefits, savings...'}
              disabled={streaming || isAtLimit}
              rows={1}
              className="min-h-[44px] max-h-[120px] resize-none"
            />
            <Button onClick={() => sendMessage(input)} disabled={!input.trim() || streaming || isAtLimit} size="icon">
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            CareFund AI is not a licensed financial advisor. Always consult a professional for major decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
