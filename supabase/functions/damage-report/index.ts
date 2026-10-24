import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createOpenAI } from 'npm:@ai-sdk/openai@2';
import { streamText, Output, jsonSchema } from 'npm:ai@5';
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from '../_shared/run-id.ts';

const MODEL = 'openai/gpt-6-astra';
const GATEWAY = 'https://ai.gateway.lovable.dev/v1';

type Draft = { title: string; urgency: 'low' | 'medium' | 'high' | 'critical'; report: string };

const schema = jsonSchema<Draft>({
  type: 'object',
  additionalProperties: false,
  required: ['title', 'urgency', 'report'],
  properties: {
    title: { type: 'string', description: 'Short title, max 8 words' },
    urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    report: { type: 'string', description: 'Plain-text report with sections: Description, Likely cause, Safety / operational impact, Recommended action, Parts or materials needed, Urgency reasoning' },
  },
});

const SYSTEM = `You write concise, professional damage reports for superyacht crew (deck department).
Use the crew's notes and photos. Be factual; do not invent details you cannot see or were not told — say "Not determined" instead.
Urgency: critical = safety risk or vessel cannot operate safely, act now; high = fix within 24-48h or before next guest trip/passage; medium = schedule within 1-2 weeks; low = cosmetic, next yard period or routine maintenance.
Use British English. Write the report as plain text with short section headings on their own line followed by a colon.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return respond({ error: 'AI is not configured' }, 500);
    const authHeader = req.headers.get('Authorization') ?? '';
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
    const { data: { user } } = await db.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return respond({ error: 'Please sign in' }, 401);

    const body = await req.json().catch(() => ({}));
    const notes = String(body.notes ?? '').slice(0, 4000).trim();
    const location = String(body.location ?? '').slice(0, 200).trim();
    const paths: string[] = Array.isArray(body.photoPaths) ? body.photoPaths.filter((p: unknown) => typeof p === 'string').slice(0, 8) : [];
    if (!notes && paths.length === 0) return respond({ error: 'Add notes or at least one photo' }, 400);

    // Signed with the crew member's own session, so storage rules limit them to their vessel's photos.
    let urls: string[] = [];
    if (paths.length) {
      const { data, error } = await db.storage.from('attachments').createSignedUrls(paths, 600);
      if (error) return respond({ error: 'Could not read the photos' }, 403);
      urls = (data ?? []).map(d => d.signedUrl).filter(Boolean) as string[];
    }

    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const provider = createOpenAI({
      baseURL: GATEWAY, apiKey,
      headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
      fetch: runIdFetch.fetch,
    });

    let failure: { status: number; message: string } | null = null;
    const result = streamText({
      model: provider.responses(MODEL),
      system: SYSTEM,
      experimental_output: Output.object({ schema }),
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Location: ${location || 'Not given'}\nCrew notes: ${notes || 'None — use the photos.'}` },
          ...urls.map(u => ({ type: 'image' as const, image: new URL(u) })),
        ],
      }],
      abortSignal: req.signal,
      onError: ({ error }) => {
        const e = error as { statusCode?: number; message?: string };
        failure = { status: e.statusCode ?? 500, message: e.message ?? 'AI request failed' };
      },
      providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: 'low', reasoningSummary: 'auto', include: ['reasoning.encrypted_content'] } },
    });

    const text = await result.text.catch(() => '');
    if (failure || !text) {
      const f = failure as { status: number; message: string } | null;
      const status = f?.status ?? 500;
      const msg = status === 429 ? 'AI is busy, try again in a minute' : status === 402 ? 'AI credits have run out for this workspace' : 'Could not draft the report';
      return respond({ error: msg }, status);
    }
    const draft = JSON.parse(text) as Draft;
    return respond(draft);
  } catch (e) {
    console.error(e);
    return respond({ error: 'Could not draft the report' }, 500);
  }
});
