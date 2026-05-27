// pages/api/books/diagnostic/summarize.js
// Paid feature — checks active book access, then generates a 5-7 paragraph
// AI child profile summary using Claude. Saves summary back to Supabase.
// POST { email, productSlug, data }
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkProductAccess } from '@/lib/products/access';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatDataForClaude(d) {
  const yn = v => v ? 'Yes' : 'No';
  const checked = (prefix, options, d) =>
    options.filter(o => d[`${prefix}_${o}`]).join(', ') || 'None selected';

  const mi_names = ['Linguistic','Logical-Mathematical','Spatial','Bodily-Kinesthetic','Musical','Interpersonal','Intrapersonal','Naturalistic'];
  const mi_rows = mi_names.map((name, i) =>
    `  ${name}: ${d[`mi_rating_${i}`] || '?'}/5 — ${d[`mi_notes_${i}`] || 'no notes'}`
  ).join('\n');

  return `
CHILD PROFILE
Name: ${d.child_name || 'Not provided'}
Age / Grade: ${d.age_grade || 'Not provided'}
Primary Setting: ${checked('setting', ['Homeschool','Private','Public','Co-op','Other'], d)}
Lead Adult(s): ${d.lead_adults || 'Not provided'}

WHO THIS CHILD IS NOW
${d.child_now || 'Not provided'}

WHAT THE PARENT WANTS IN 5 YEARS
${d.child_future || 'Not provided'}

SECTION 1 — GIFTING AND PASSION
What they do well without being told: ${d.gifts_do_well || 'Not provided'}
What lights them up: ${d.gifts_lights_up || 'Not provided'}
Designed problem type: ${checked('problem_type', ['Organize','Empathize','Innovate','Analyze','Lead','Build','Repair','Other'], d)}
Top 3 gifts: ${[d.gift_1, d.gift_2, d.gift_3].filter(Boolean).join(' / ') || 'Not provided'}
Current passions: ${d.passions || 'Not provided'}
Action this season — exposure: ${d.action_exposure || 'Not provided'}
Action this season — mirror person: ${d.action_mirror || 'Not provided'}

SECTION 2 — MULTIPLE INTELLIGENCES
${mi_rows}
Top doorways: ${d.mi_doorways || 'Not provided'}
Weak domain to gently expand: ${d.mi_expand || 'Not provided'}

SECTION 3 — ADVERSITY AS A TEACHER
Current challenges: ${[d.challenge_1, d.challenge_2, d.challenge_3].filter(Boolean).join(' / ') || 'Not provided'}
Hidden curriculum: ${d.adversity_curriculum || 'Not provided'}
How adversity is framed: ${checked('adversity_frame', ['Dead end / unfair','Training ground / formation'], d)}
Framing adjustment: ${d.adversity_framing || 'Not provided'}
Challenge to lean into: ${d.adversity_lean || 'Not provided'}

SECTION 4 — SHEPHERD THE HEART
What they love: ${d.heart_loves || 'Not provided'}
What they fear: ${d.heart_fears || 'Not provided'}
What they want to be true about themselves: ${d.heart_wants || 'Not provided'}
Where performance is mistaken for formation: ${d.heart_performance || 'Not provided'}
Heart conversation to have: ${d.heart_conversation || 'Not provided'}

SECTION 5 — LEARNING PATHWAYS
Primary pathway: ${checked('primary_pathway', ['Visual','Auditory','Kinesthetic','Read/Write'], d)}
Also consider: ${checked('also_consider', ['Conversational','Project-based'], d)}
Secondary pathway: ${d.secondary_pathway || 'Not provided'}
Subject stuck in: ${d.stuck_subject || 'Not provided'}
Environmental adjustments — Light: ${d.env_light || '?'} / Sound: ${d.env_sound || '?'} / Time: ${d.env_time || '?'} / Posture: ${d.env_posture || '?'}
Two-week experiment: ${d.env_experiment || 'Not provided'}

SECTION 6 — ACTIVATE CREATIVITY
Current state: ${checked('creativity_state', ['Flourishing','Present but quiet','Suppressed','Underdeveloped'], d)}
What blocks it: ${d.creativity_blocks || 'Not provided'}
Creativity practices: ${[d.creativity_practice_1, d.creativity_practice_2, d.creativity_practice_3].filter(Boolean).join(' / ') || 'Not provided'}
60-day project: ${d.creativity_project || 'Not provided'}

SECTION 7 — HUMOR
Laughter trend: ${checked('humor_trend', ['Increased','Stayed the same','Decreased'], d)}
What changed: ${d.humor_change || 'Not provided'}
Where humor appears: ${d.humor_appears || 'Not provided'}
Where it has been wounded: ${d.humor_wounded || 'Not provided'}

SECTION 8 — GROUP PROJECTS
Current group role: ${checked('group_role', ['Initiator','Connector','Builder','Encourager','Quality-checker','Observer','Disrupter','Avoider'], d)}
Collaboration strengths: ${d.collab_strengths || 'Not provided'}
Collaboration gaps: ${d.collab_gaps || 'Not provided'}
Upcoming group project: ${d.project_what || 'Not provided'} — their role: ${d.project_role || '?'}

SECTION 9 — CRITICAL THINKING
Baseline: ${checked('ct_baseline', ['Accepts most at face value','Asks why naturally','Skeptical without grounding','Beginning to test claims'], d)}
Key inputs — Screens: ${d.ct_screens || '?'} / Peers: ${d.ct_peers || '?'} / Adults outside home: ${d.ct_adults || '?'} / Books: ${d.ct_books || '?'}
CT rep to install: ${d.ct_rep || 'Not provided'}

FORMATION PRIORITIES (90 DAYS)
1. ${d.priority_1 || 'Not provided'}
2. ${d.priority_2 || 'Not provided'}
3. ${d.priority_3 || 'Not provided'}
What we will stop: ${d.stop_doing || 'Not provided'}

IDENTITY DECLARATION
Three things we see in them: ${[d.identity_1, d.identity_2, d.identity_3].filter(Boolean).join(' / ') || 'Not provided'}
Scripture / promise: ${d.scripture || 'Not provided'}
Who they are becoming: ${d.becoming || 'Not provided'}
`.trim();
}

const SYSTEM = `You are Ezra — a warm, practical coach trained on Will Meier's book "How to Educate Children and Develop Talent." A parent has completed the Child Strategic Plan Diagnostic and you are writing them a personalized profile of their child based on their answers.

Write 5 to 7 substantial paragraphs. Cover: who this child is and their designed purpose; how they learn and what their intelligence profile reveals; what is happening in their heart and how to shepherd it; their creative and social development; how they currently engage with challenge and critical thinking; and the formation priorities and identity you see emerging from the data. Close with a direct, specific sentence about who this child is becoming.

Tone: warm, direct, specific to THIS child — not generic. Reference their actual answers. Write in plain prose. No bullet points, no headers, no markdown. Speak as a coach who sees the child clearly and wants to help the parent see the same.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, productSlug = 'child-education', data } = req.body || {};
  if (!email || !data) return res.status(400).json({ error: 'email and data are required' });

  const normalizedEmail = email.trim().toLowerCase();

  // Check paid access
  const access = await checkProductAccess(normalizedEmail, productSlug);
  if (!access.allowed) {
    return res.status(200).json({
      blocked: true,
      reason: access.reason,
      message: "Purchase 60-day coaching access to unlock your child's personalized profile summary.",
    });
  }

  try {
    const formatted = formatDataForClaude(data);

    const response = await anthropic.messages.create({
      model:      process.env.BOOK_CLAUDE_MODEL || 'claude-sonnet-4-5',
      max_tokens: 2048,
      system:     SYSTEM,
      messages:   [{ role: 'user', content: `Please write the child profile summary based on this diagnostic data:\n\n${formatted}` }],
    });

    const summary = response.content?.[0]?.text || '';

    // Save summary back to Supabase
    await supabase
      .from('diagnostic_plans')
      .upsert(
        { email: normalizedEmail, product_slug: productSlug, data, summary },
        { onConflict: 'email,product_slug' }
      );

    return res.status(200).json({ ok: true, summary });
  } catch (err) {
    console.error('[diagnostic/summarize]', err.message);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
}
