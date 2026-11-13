export type Side = 'A' | 'B';
export type LabConfig = { ready: boolean; provider: string; models: { A: string; B: string; judge: string }; maxCalls: number };
export type LabInput = { topic: string; positionA: string; positionB: string; firstSpeaker: Side; factCheck: boolean; requestId: string };
export type Citation = { url: string; title: string; start: number; end: number };
export type LabTurn = { id: string; round: number; side: Side; text: string; model: string; responseId: string; inputTokens: number; outputTokens: number };
export type Scores = { evidence: number; rebuttal: number; consistency: number; explanation: string };
export type Judgment = { A: Scores; B: Scores; confidence: 'low' | 'medium' | 'high'; explanation: string; keyTurns: string[]; limitations: string[]; claims: { claim: string; status: 'supported' | 'contradicted' | 'uncertain' | 'opinion'; explanation: string; sources: string[] }[] };
export type LabRun = { id: string; createdAt: string; input: LabInput; models: LabConfig['models']; status: 'running' | 'completed' | 'stopped' | 'failed'; stage: string; turns: LabTurn[]; evidence: { text: string; citations: Citation[] } | null; judgment: Judgment | null; outcome: Side | 'draw' | 'inconclusive' | null; error: string | null; calls: number; inputTokens: number; outputTokens: number };
export function total(score: Scores) { return score.evidence + score.rebuttal + score.consistency; }
export function outcomeFor(judgment: Judgment): LabRun['outcome'] {
  if (judgment.confidence === 'low') return 'inconclusive';
  const difference = total(judgment.A) - total(judgment.B);
  return Math.abs(difference) <= 2 ? 'draw' : difference > 0 ? 'A' : 'B';
}
