#!/usr/bin/env node
// Seed the website coaching agent knowledge base.
// Usage:
//   COACH_INGEST_URL=http://localhost:3000/api/coach/ingest \
//   COACH_INGEST_TOKEN=<your-token> \
//   node scripts/seed-coach-kb.js

const INGEST_URL = process.env.COACH_INGEST_URL || "http://localhost:3000/api/coach/ingest";
const TOKEN = process.env.COACH_INGEST_TOKEN;

if (!TOKEN) {
  console.error("ERROR: COACH_INGEST_TOKEN env var is required");
  process.exit(1);
}

const DOCUMENTS = [
  {
    title: "What is Awakening Destiny Global (ADG)?",
    source: "about",
    content: `Awakening Destiny Global (ADG) is a leadership development organization that equips leaders, ministers, entrepreneurs, and purpose-driven individuals to step into their full Kingdom calling.

ADG was founded on the conviction that every believer carries a divine assignment — and that assignment is unlocked through intentional development across five dimensions of leadership known as the 5C Leadership Blueprint.

ADG serves individuals at every stage of their leadership journey: those just discovering their purpose, those in the middle of building something significant, and those ready to leave a generational legacy. The work is grounded in apostolic-prophetic grace — direct, Spirit-led, practical, and transformational.

ADG is not a typical leadership program. It is a covenant community where leaders grow together, receive accountability, and are equipped to carry their assignment with faithfulness and excellence.`,
  },
  {
    title: "The 5C Leadership Blueprint",
    source: "5c-framework",
    content: `The 5C Leadership Blueprint is ADG's core framework for developing Kingdom leaders across five dimensions:

CALLING — Who you are and what you carry. This dimension addresses identity, purpose, prophetic destiny, and your unique divine assignment. Many leaders skip this step and build on a foundation that doesn't belong to them. The Calling module helps you recover and clarify the specific burden and assignment you were born to carry.

CONNECTION — Who you're in covenant with. This dimension addresses relationships, accountability, sonship and fathering dynamics, team cohesion, and relational health. Leadership without right relationships is leadership without longevity. Connection explores the vertical dimension (intimacy with God) and the horizontal (covenant community with people).

COMPETENCY — What you do with what you carry. This dimension addresses spiritual gifts, practical skills, stewardship of resources, professional excellence, and faithful execution. Calling without competency leads to inspired but ineffective leadership. This module builds the execution layer.

CAPACITY — How much you can carry without breaking. This dimension addresses endurance, growth mindset, sustainable pace, expanding influence, and resilience under pressure. Many leaders are called and competent but overloaded. Capacity explores how to grow your leadership bandwidth without sacrificing your soul.

CONVERGENCE — When everything comes together. This is the dimension of legacy, integration, and Kingdom governance. It's the moment when your calling, relationships, skills, and capacity align to produce multi-generational impact. Convergence is not a destination — it's a lifestyle of faithful stewardship that builds something that outlasts you.`,
  },
  {
    title: "ADG Programs Overview",
    source: "programs",
    content: `ADG offers several pathways depending on where you are in your journey:

DISCOVERY CONVERSATION — A free 30-minute call with an ADG team member. This is the best first step for anyone exploring ADG. On this call you'll discuss where you are, what you're building, and whether there's a fit for deeper engagement. There is no pressure — just clarity. Schedule at awakeningdestiny.global.

ADG COHORT — A 6-month intensive group journey through the full 5C Leadership Blueprint. The Cohort is for leaders who are ready to go deep, receive honest coaching, and grow in community with a cohort of peers. Cohort members move through all five dimensions with weekly group calls, practical assignments, and direct access to ADG coaches.

SELF-PACED TRAINING — The 5C Blueprint modules available at your own pace. This is an excellent entry point for those who want to explore the framework before committing to the Cohort. Modules include video teaching, workbooks, and reflection prompts.

FINAL BLUEPRINT — A comprehensive capstone experience for Cohort graduates. The Final Blueprint integrates everything from the 5C journey into a clear, documented personal leadership blueprint — your calling, your community, your competencies, your capacity, and your convergence strategy.

ADVISORY / 1:1 COACHING — Personalized coaching for senior leaders, founders, and ministers who need individualized strategic guidance. Advisory engagements are tailored to the leader's specific assignment and season.`,
  },
  {
    title: "The ADG Cohort — What to Expect",
    source: "cohort",
    content: `The ADG Cohort is a 6-month group leadership development experience built around the 5C Blueprint.

WHO IT'S FOR: The Cohort is designed for leaders who are serious about growth — those who have sensed a call on their life and want to develop the depth, relationships, and competency to fulfill it. Past cohort members have included pastors, entrepreneurs, marketplace leaders, creatives, and ministry directors.

WHAT HAPPENS: Each cohort moves through the five 5C dimensions together. The journey includes weekly group calls, one-on-one coaching touchpoints, practical field assignments, peer accountability, and access to the full ADG training library.

THE COMMUNITY: One of the most consistent things cohort graduates say is that the relationships forged in the Cohort changed their lives. ADG cultivates a culture of honor, transparency, and genuine accountability — not performance-based community.

TIMING: Cohorts run on a scheduled basis. Contact ADG to learn about the next cohort start date and application process.

NEXT STEP: If the Cohort sounds like a fit, the best next step is to book a Discovery Conversation so an ADG team member can assess your readiness and walk you through the enrollment process.`,
  },
  {
    title: "Frequently Asked Questions",
    source: "faq",
    content: `WHAT IF I'M NOT SURE WHICH PROGRAM IS RIGHT FOR ME?
Start with a Discovery Conversation. This free 30-minute call is specifically designed to help you figure out where you are and what you need. The ADG team will help you identify the right entry point.

DO I HAVE TO BE IN MINISTRY TO JOIN ADG?
No. ADG serves leaders across all domains — business, ministry, government, arts, education, and family. The 5C Blueprint is built for anyone who carries a God-given assignment and wants to develop into it faithfully.

HOW LONG DOES THE SELF-PACED TRAINING TAKE?
The Self-Paced Training is designed to be worked through over several months, but you can go at whatever pace fits your season. Each module includes video teaching, a workbook, and reflection exercises.

IS THERE A COMMUNITY COMPONENT?
Yes. ADG is built around covenant community. Even self-paced students have access to community resources. The Cohort is the most immersive community experience.

WHAT DOES THE 5C FRAMEWORK HAVE TO DO WITH LEADERSHIP?
Everything. The 5C Blueprint addresses the full spectrum of what it takes to lead well — from the inside out. Most leadership programs focus only on skills (Competency). ADG addresses the foundation of identity (Calling), the relational infrastructure (Connection), the execution layer (Competency), the sustainability question (Capacity), and the legacy dimension (Convergence).

HOW DO I APPLY FOR THE COHORT?
Start with a Discovery Conversation. If there's alignment, the ADG team will walk you through the application and enrollment process.`,
  },
  {
    title: "Signs You're Ready for ADG",
    source: "readiness",
    content: `You might be ready for ADG if you resonate with any of the following:

- You sense a calling on your life but haven't been able to fully articulate or step into it.
- You're building something — a ministry, a business, a team — but feel isolated or unsupported.
- You've experienced leadership burnout and need to find a more sustainable rhythm.
- You have gifts and competencies but lack the relational infrastructure to maximize them.
- You feel like you're in a transition season and need clarity on your next assignment.
- You're hungry for community with other serious, purpose-driven leaders.
- You want your leadership to produce something that outlasts you.

If any of these resonate, the best next step is a Discovery Conversation with the ADG team.`,
  },
  {
    title: "What Makes ADG Different",
    source: "differentiators",
    content: `Most leadership development programs focus on one dimension: skills, mindset, or network. ADG addresses all five dimensions that Kingdom leaders need: identity (Calling), relationships (Connection), execution (Competency), sustainability (Capacity), and legacy (Convergence).

ADG is not a course — it's a community and a coaching journey. The relationships formed in ADG cohorts are one of the most consistently cited outcomes by graduates.

ADG operates with apostolic-prophetic grace: directness, spiritual discernment, practical wisdom, and a genuine commitment to seeing each leader fulfill their assignment. This is not a self-help program. It is a development environment built on the conviction that God's call on your life is real and worthy of serious investment.

ADG leaders believe that leadership is not about position — it is about stewardship, influence, and faithful execution of your God-given assignment. This conviction shapes everything about how ADG develops leaders.`,
  },
  {
    title: "How to Get Started with ADG",
    source: "getting-started",
    content: `Getting started with ADG is simple:

STEP 1 — BOOK A DISCOVERY CONVERSATION
This is a free 30-minute call with an ADG team member. It's a no-pressure conversation to understand where you are, what you're building, and what your next best step might be. Visit awakeningdestiny.global to schedule.

STEP 2 — EXPLORE SELF-PACED TRAINING
If you're not ready for a call, start with the Self-Paced Training. The first module is available for free and will give you a solid introduction to the 5C Blueprint and ADG's approach to leadership development.

STEP 3 — JOIN A COHORT
For those ready to go deep, the ADG Cohort is the most transformational pathway. Applications open periodically throughout the year. A Discovery Conversation is required before enrollment.

WHEREVER YOU ARE — there is a starting point for you. ADG is not a program you have to be "ready enough" to approach. If you're curious, start there. Book a call. Explore the training. The journey begins with one honest conversation.`,
  },
];

async function ingest(doc) {
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ingest-token": TOKEN,
    },
    body: JSON.stringify(doc),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function main() {
  console.log(`Seeding ${DOCUMENTS.length} documents to ${INGEST_URL}\n`);

  let success = 0;
  let failed = 0;

  for (const doc of DOCUMENTS) {
    try {
      const result = await ingest(doc);
      console.log(`✓ "${doc.title}" → ${result.chunkCount} chunks`);
      success++;
    } catch (err) {
      console.error(`✗ "${doc.title}" → ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
}

main();
