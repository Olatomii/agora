export type Category = 'Sport' | 'Technology' | 'Work & life' | 'Culture';
export type Person = { id: string; name: string; initials: string; color: string };
export type Comment = { id: string; author: Person; text: string; time: string; likes: number; liked: boolean };
export type Topic = { id: string; title: string; category: Category; description: string; author: Person; comments: Comment[]; created: number };
export type Turn = { id: string; round: number; side: 'you' | 'opponent'; text: string };
export type Match = { id: string; topicId: string; proposition: string; opponent: Person; position: string; status: 'invited' | 'active' | 'completed' | 'cancelled'; turns: Turn[]; created: number };
export type State = { version: 1; topics: Topic[]; matches: Match[]; saved: string[]; picks: Record<string, 'A' | 'B'>; replays: string[] };
export const YOU: Person = { id: 'you', name: 'You', initials: 'YO', color: 'green' };
export const PEOPLE: Person[] = [
  { id: 'kemi', name: 'Kemi', initials: 'KE', color: 'clay' },
  { id: 'dapo', name: 'Dapo', initials: 'DA', color: 'blue' },
  { id: 'sarah', name: 'Sarah', initials: 'SA', color: 'lilac' },
  { id: 'tunde', name: 'Tunde', initials: 'TU', color: 'green' },
];
export const CATEGORIES: Category[] = ['Sport', 'Technology', 'Work & life', 'Culture'];
export const ROUND_NAMES = ['Opening argument', 'Rebuttal', 'Closing statement'];
const comment = (id: string, author: Person, text: string, likes: number): Comment => ({ id, author, text, likes, liked: false, time: 'Sample conversation' });
export const INITIAL_STATE: State = {
  version: 1, matches: [], saved: [], picks: {}, replays: [],
  topics: [
    { id: 'remote', title: 'Same work. Same salary. Wherever you live?', category: 'Work & life', description: 'If two people deliver the same value, should their location change what they earn?', author: PEOPLE[3], created: 4,
      comments: [comment('r1', PEOPLE[3], 'If I ship the same product from Lagos as someone in London, I think the work should be paid the same. The value to the company hasn’t changed.', 24), comment('r2', PEOPLE[2], 'I get that. But companies also compete with local employers, and local costs matter. Would a single global salary actually make hiring fairer?', 17), comment('r3', PEOPLE[3], 'Maybe the starting point should be one salary band for the role, with local benefits handled separately. That keeps the value of the work consistent.', 12)] },
    { id: 'football', title: 'One unforgettable World Cup, or three Champions Leagues?', category: 'Sport', description: 'Which says more about greatness: one defining tournament or years at the top?', author: PEOPLE[0], created: 3,
      comments: [comment('f1', PEOPLE[0], 'For me it’s the World Cup. Those moments stay with an entire country. Greatness is partly about what people remember.', 31), comment('f2', PEOPLE[1], 'I’d choose sustained excellence. Having to come back and do it again is what separates a great run from a great career.', 26)] },
    { id: 'ai', title: 'Would you trust an AI to give you career advice?', category: 'Technology', description: 'A useful second opinion, or too much confidence without enough context?', author: PEOPLE[2], created: 2,
      comments: [comment('a1', PEOPLE[2], 'I’d use it to explore options, but I’d want a person who knows me to challenge the advice. A tidy answer isn’t always the right answer.', 15), comment('a2', PEOPLE[3], 'That’s fair, but some people don’t have access to a mentor. A starting point that helps you ask better questions can still be valuable.', 19)] },
    { id: 'music', title: 'Is a great album meant to be heard in order?', category: 'Culture', description: 'The artist’s story versus your shuffle button. Where do you stand?', author: PEOPLE[1], created: 1,
      comments: [comment('m1', PEOPLE[1], 'First listen: in order, always. After that, the songs belong to your day.', 22), comment('m2', PEOPLE[0], 'I find albums through individual tracks. There’s no wrong doorway into music you end up loving.', 18)] },
  ],
};
export type Action =
  | { type: 'topic'; topic: Topic }
  | { type: 'comment'; topicId: string; comment: Comment }
  | { type: 'like'; topicId: string; commentId: string }
  | { type: 'save'; topicId: string }
  | { type: 'invite'; match: Match }
  | { type: 'accept' | 'cancel'; matchId: string }
  | { type: 'turn'; matchId: string; text: string; id: string }
  | { type: 'pick'; replayId: string; side: 'A' | 'B' }
  | { type: 'replay'; replayId: string };

// Scripted practice responses are deliberately not presented as generated AI.
const RESPONSES: Record<string, string[]> = {
  remote: ['I think a pay policy should consider both the work and the market where a company hires. My position is that transparent location bands can still be fair.', 'Equal output is a useful principle. My concern is how you compare output across roles and account for local benefits. How would your policy handle those differences?', 'My case is for transparent, explainable bands rather than arbitrary discounts. I agree that employers should make the basis of pay visible before someone accepts a role.'],
  football: ['I value sustained success more than one defining event. Repeating a strong performance requires adapting to different opponents and circumstances.', 'Memorable moments matter, but they measure emotional impact. If we are judging sustained excellence, I would compare consistency over several seasons.', 'My conclusion depends on our definition of greatness: I prioritize repeatability. Your position gives more weight to the significance of a single event.'],
  ai: ['I would use AI to explore choices, while keeping the final decision with the person. Accessible advice can be useful even when it needs checking.', 'Personal context is an important limitation. I would ask the tool to state its assumptions and suggest questions to discuss with someone who knows me.', 'I see it as a starting point for reflection. It should help someone compare options, not claim authority over their future.'],
  music: ['I prefer listening in order the first time because sequencing can be part of the creative work. After that, listening is a personal choice.', 'Finding a single track is a valid way in. My argument is that the sequence may add something worth experiencing, rather than that shuffle is wrong.', 'I would encourage one full listen in order, while respecting how people enjoy music afterward. Intent and personal experience can coexist.'],
};
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'topic': return action.topic.title.trim() ? { ...state, topics: [action.topic, ...state.topics] } : state;
    case 'comment': return action.comment.text.trim() ? { ...state, topics: state.topics.map(t => t.id === action.topicId ? { ...t, comments: [...t.comments, action.comment] } : t) } : state;
    case 'like': return { ...state, topics: state.topics.map(t => t.id === action.topicId ? { ...t, comments: t.comments.map(c => c.id === action.commentId ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) } : c) } : t) };
    case 'save': return { ...state, saved: state.saved.includes(action.topicId) ? state.saved.filter(id => id !== action.topicId) : [...state.saved, action.topicId] };
    case 'invite': {
      if (action.match.opponent.id === YOU.id || !action.match.proposition.trim() || !action.match.position.trim() || state.matches.some(m => m.id === action.match.id)) return state;
      return { ...state, matches: [action.match, ...state.matches] };
    }
    case 'accept': case 'cancel': return { ...state, matches: state.matches.map(m => m.id === action.matchId && m.status === 'invited' ? { ...m, status: action.type === 'accept' ? 'active' : 'cancelled' } : m) };
    case 'turn': return { ...state, matches: state.matches.map(m => {
      if (m.id !== action.matchId || m.status !== 'active' || !action.text.trim() || action.text.length > 2000 || m.turns.some(t => t.id === action.id)) return m;
      const round = m.turns.filter(t => t.side === 'you').length;
      if (round >= 3) return m;
      const response = (RESPONSES[m.topicId] || ['Let’s make the terms precise. Which part of your position would you like me to respond to?', 'Consider the strongest objection to your argument and which evidence would help resolve it.', 'We have both had a chance to explain our positions. The next step is an independent assessment against the agreed rubric.'])[round];
      return { ...m, status: round === 2 ? 'completed' : 'active', turns: [...m.turns, { id: action.id, round, side: 'you', text: action.text.trim() }, { id: action.id + '-reply', round, side: 'opponent', text: response }] };
    }) };
    case 'pick': return state.replays.includes(action.replayId) ? state : { ...state, picks: { ...state.picks, [action.replayId]: action.side } };
    case 'replay': return state.replays.includes(action.replayId) ? state : { ...state, replays: [...state.replays, action.replayId] };
    default: return state;
  }
}

export const STORAGE_KEY = 'agora-conversation-first-v1';
// Validate restored JSON before trusting it as application state.
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const person = (v: unknown): boolean => obj(v) && ['id','name','initials','color'].every(k => str(v[k]));
export function isState(v: unknown): v is State {
  if (!obj(v) || v.version !== 1 || !Array.isArray(v.topics) || !Array.isArray(v.matches) || !Array.isArray(v.saved) || !Array.isArray(v.replays) || !obj(v.picks)) return false;
  return v.saved.every(str) && v.replays.every(str) && Object.values(v.picks).every(p => p === 'A' || p === 'B') &&
    v.topics.every(t => obj(t) && str(t.id) && str(t.title) && str(t.description) && CATEGORIES.includes(t.category as Category) && typeof t.created === 'number' && person(t.author) && Array.isArray(t.comments) && t.comments.every(c => obj(c) && str(c.id) && person(c.author) && str(c.text) && str(c.time) && typeof c.likes === 'number' && typeof c.liked === 'boolean')) &&
    v.matches.every(m => obj(m) && ['id','topicId','proposition','position'].every(k => str(m[k])) && person(m.opponent) && typeof m.created === 'number' && ['invited','active','completed','cancelled'].includes(m.status as string) && Array.isArray(m.turns) && m.turns.every(t => obj(t) && str(t.id) && str(t.text) && typeof t.round === 'number' && ['you','opponent'].includes(t.side as string)));
}
export function loadState(): State {
  try { const raw = localStorage.getItem(STORAGE_KEY); const data: unknown = raw ? JSON.parse(raw) : null; return isState(data) ? data : INITIAL_STATE; }
  catch { return INITIAL_STATE; }
}
