import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  userContext: {
    full_name: string;
    caregiver_type: string;
    employment_status: string;
    annual_income: number;
    care_hours_per_week: number;
    care_recipient_relationship: string;
    care_recipient_conditions: string[];
    state: string;
    total_expenses_this_year: number;
    total_deductible: number;
    eligible_credits: { name: string; value: number }[];
    savings_goals: { name: string; current: number; target: number }[];
    active_benefits: string[];
    available_benefits: string[];
  };
}

function buildSystemPrompt(ctx: ChatRequest['userContext']): string {
  const creditsList = ctx.eligible_credits.map(c => `  - ${c.name}: $${c.value.toLocaleString()}`).join('\n');
  const goalsList = ctx.savings_goals.map(g => `  - ${g.name}: $${g.current.toLocaleString()} of $${g.target.toLocaleString()}`).join('\n');
  const activeBenefits = ctx.active_benefits.length > 0 ? ctx.active_benefits.join(', ') : 'None currently active';
  const availableBenefits = ctx.available_benefits.length > 0 ? ctx.available_benefits.join(', ') : 'None identified';

  return `You are CareFund AI, a warm and knowledgeable financial advisor specializing in family caregiver finances. You help caregivers understand their tax benefits, find programs they qualify for, plan their savings, and navigate the financial impact of caregiving.

## User Profile
- Name: ${ctx.full_name}
- Caregiving role: ${ctx.caregiver_type.replace('_', ' ')}
- Caring for: ${ctx.care_recipient_relationship}
- Conditions: ${ctx.care_recipient_conditions.join(', ') || 'Not specified'}
- Employment: ${ctx.employment_status.replace('_', ' ')}
- Annual income: $${ctx.annual_income.toLocaleString()}
- Care hours/week: ${ctx.care_hours_per_week}
- State: ${ctx.state}

## Financial Snapshot
- Total expenses this year: $${ctx.total_expenses_this_year.toLocaleString()}
- Tax-deductible expenses: $${ctx.total_deductible.toLocaleString()}
- Eligible tax credits:
${creditsList || '  None identified yet'}
- Savings goals:
${goalsList || '  None set up yet'}
- Active benefits: ${activeBenefits}
- Available (not yet applied): ${availableBenefits}

## Guidelines
1. Always reference the user's actual data when relevant.
2. Be warm and supportive — these are stressed, overwhelmed caregivers.
3. Give specific, actionable advice with dollar amounts when possible.
4. Always disclaim: you're an AI assistant, not a licensed financial advisor or tax professional.
5. Keep responses concise — 2-3 paragraphs max unless the user asks for detail.
6. When discussing tax credits, reference specific IRS forms and deadlines.
7. Use plain language, not jargon.
8. Format with markdown for readability (bold key numbers, bullet lists for steps).`;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, userContext } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-api-key-here') {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add your key to .env.local' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Use non-streaming for reliability, then send as SSE
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(userContext),
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Send as SSE format so the client still works
    const encoder = new TextEncoder();

    // Chunk the text into small pieces to simulate streaming for a nicer UX
    const chunks: string[] = [];
    const words = text.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      chunks.push(words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : ''));
    }

    const readable = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
