export const ONBOARDING_OPTIONS = [
  {
    label: "I'm planning a renovation",
    href: '/app',
    focus: 'planning',
  },
  {
    label: 'I need to track finish decisions',
    href: '/app/tools/finish-decisions',
    focus: 'selections',
  },
  {
    label: "I'm managing a punchlist",
    href: '/app/tools/punchlist',
    focus: 'punchlist',
  },
  {
    label: 'Just exploring',
    href: null,
    focus: 'exploring',
  },
] as const
