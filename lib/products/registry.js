// lib/products/registry.js
// ─────────────────────────────────────────────────────────────────────────────
// MASTER BOOK REGISTRY
// To add a new book: add an entry here + a prompt.js + a knowledge base file.
// No other files need to change.
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT_REGISTRY = {
  'child-education': {
    // Public-facing
    name:        'How to Educate Your Child',
    tagline:     'Build a real education strategy for your child — personalized, not generic.',
    description: 'Ask Ezra anything about your child\'s learning style, gifts, development, and education strategy. Trained on Will Meier\'s book.',
    // Pricing
    priceUsd:    1999,   // cents — $19.99
    daysAccess:  60,
    dailyLimit:  10,
    // Internal
    slug:          'child-education',
    promptModule:  'child-education/prompt',  // relative to lib/products/
    knowledgeFile: 'child-education/content.md', // relative to knowledge/
    // What people can ask (shown on landing page)
    exampleQuestions: [
      '"My 8-year-old hates reading but loves building things. How should I approach literacy with him?"',
      '"We are deciding between homeschooling and private school. What questions should we be asking?"',
      '"My daughter is gifted but unmotivated. How do I find out what she is actually wired for?"',
      '"I run a team of 12. How do I apply these education principles to developing my people?"',
      '"My son shuts down when he fails. How do I build resilience without pushing too hard?"',
      '"How do I build a real education strategy — not just pick a curriculum?"',
    ],
  },

  // ── ADD YOUR NEXT BOOK HERE ──────────────────────────────────────────────
  // 'leadership-legacy': {
  //   name:        'Leadership Legacy',
  //   tagline:     'Build something that outlasts you.',
  //   description: 'Ask Ezra about building organizations, raising up leaders, and leaving a lasting legacy.',
  //   priceUsd:    2000,
  //   daysAccess:  60,
  //   dailyLimit:  10,
  //   slug:          'leadership-legacy',
  //   promptModule:  'leadership-legacy/prompt',
  //   knowledgeFile: 'leadership-legacy/content.md',
  //   exampleQuestions: [ ... ],
  // },
};

export function getProduct(slug) {
  return PRODUCT_REGISTRY[slug] || null;
}

export function getAllSlugs() {
  return Object.keys(PRODUCT_REGISTRY);
}
