import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { LabEngine, labMiddleware, responseText, validateInput, validateJudgment, type Generate } from '../server/lab.ts';
import { outcomeFor, type Judgment, type LabConfig, type LabInput, type LabRun } from '../src/labTypes.ts';
const config: LabConfig = { ready: true, provider: 'OpenAI', models: { A:'model-a', B:'model-b', judge:'model-judge' }, maxCalls:8 };
const input: LabInput = { topic:'Should the workweek be four days?', positionA:'A four-day default is better.', positionB:'Flexible schedules are better.', firstSpeaker:'A', factCheck:false, requestId:'test-request' };
const judgment = (): Judgment => ({ A:{ evidence:7,rebuttal:8,consistency:8,explanation:'Addressed B.' },B:{ evidence:6,rebuttal:6,consistency:7,explanation:'Left a concern unanswered.' },confidence:'medium',explanation:'A engaged more directly.',keyTurns:['A2','B2'],limitations:['No external evidence was checked.'],claims:[] });
const data = (text:string) => ({id:'response-test',status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}],usage:{input_tokens:10,output_tokens:20}});
async function finish(run: LabRun) { for (let i=0;i<100 && run.status === 'running';i++) await new Promise(r=>setTimeout(r,5)); assert.notEqual(run.status,'running'); }
test('three balanced rounds precede a model-blind separate judge call', async () => {
  const calls: Parameters<Generate>[0][] = [];
  const engine = new LabEngine(config,async req=>{calls.push(req); return data(req.text ? JSON.stringify(judgment()) : 'An argument.');});
  const run = engine.start(input); await finish(run);
  assert.equal(run.status,'completed'); assert.equal(run.calls,7); assert.equal(run.turns.length,6); assert.equal(run.outcome,'A');
  for(let round=0;round<3;round++) { const a=JSON.parse(calls[round*2].input); const b=JSON.parse(calls[round*2+1].input); assert.deepEqual(a.previousRounds,b.previousRounds); assert.equal(a.previousRounds.length,round*2); }
  assert.equal(calls[6].model,'model-judge'); assert.ok(!calls[6].input.includes('model-a')); assert.ok(!calls[6].input.includes('model-b'));
  assert.equal(run.inputTokens,70); assert.equal(run.outputTokens,140);
});
test('source checks occur before judgment and unknown URLs never become verified evidence', async () => {
  const engine = new LabEngine(config,async req=>{
    if(req.tools) return { ...data('Claim checked [source].'),output:[{type:'message',content:[{type:'output_text',text:'Claim checked [source].',annotations:[{type:'url_citation',url:'https://example.org/report',title:'Report',start_index:14,end_index:22}]}]}] };
    if(req.text) return data(JSON.stringify({...judgment(),claims:[{claim:'Invented assertion',status:'supported',explanation:'A claim.',sources:['https://unretrieved.example/fake']}]}));
    return data('An argument.');
  });
  const run=engine.start({...input,factCheck:true}); await finish(run);
  assert.equal(run.calls,8); assert.equal(run.evidence?.citations.length,1); assert.equal(run.judgment?.claims[0].status,'uncertain'); assert.deepEqual(run.judgment?.claims[0].sources,[]);
});
test('duplicate starts reuse a run; concurrent starts are rejected; stopping retains partial text', async () => {
  let release: (()=>void) | undefined;
  const wait = new Promise<void>(resolve=>{release=resolve;});
  const engine=new LabEngine(config,async()=>{await wait;return data('Late argument');});
  const run=engine.start(input); assert.equal(engine.start(input).id,run.id);
  assert.throws(()=>engine.start({...input,requestId:'another'}),/already running/);
  engine.stop(run.id); release!(); await new Promise(r=>setTimeout(r,10));
  assert.equal(run.status,'stopped');assert.equal(run.turns.length,0);assert.equal(run.calls,1);assert.equal(run.judgment,null);
});
test('provider failure stops the loop without fabricated turns or automatic retries', async () => {
  let count=0; const engine=new LabEngine(config,async()=>{if(++count===2) throw new Error('Quota exceeded');return data('First argument');});
  const run=engine.start(input);await finish(run);assert.equal(run.status,'failed');assert.equal(run.turns.length,1);assert.equal(count,2);assert.equal(run.judgment,null);assert.equal(run.error,'Quota exceeded');
});
test('draw and inconclusive rules are symmetric; incomplete responses cannot be judged', () => {
  const j=judgment();j.B={...j.A};assert.equal(outcomeFor(j),'draw');j.A.evidence=9;assert.equal(outcomeFor(j),'draw');j.confidence='low';assert.equal(outcomeFor(j),'inconclusive');
  assert.throws(()=>responseText({...data('Truncated'),status:'incomplete'}),/incomplete/);
  assert.throws(()=>validateInput({...input,positionB:input.positionA}),/different positions/);
  assert.throws(()=>validateInput({...input,topic:'x'.repeat(501)}),/500/);
});
test('invalid judge ranges and nonexistent turn references fail validation', async () => {
  const engine=new LabEngine(config,async req=>data(req.text ? JSON.stringify(judgment()) : 'Argument'));const run=engine.start(input);await finish(run);
  assert.throws(()=>validateJudgment({...judgment(),keyTurns:['made-up']},run),/references/);
  assert.throws(()=>validateJudgment({...judgment(),A:{...judgment().A,evidence:999}},run),/0 to 10/);
});
test('no key means no AI requests, and cross-origin mutation is rejected', async () => {
  let calls=0;const engine=new LabEngine({...config,ready:false},async()=>{calls++;return data('No');});
  assert.throws(()=>engine.start(input),/OPENAI_API_KEY/);assert.equal(calls,0);
  const middleware=labMiddleware(engine);const server=createServer((req,res)=>{void middleware(req,res,()=>{res.writeHead(404);res.end();});});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address && typeof address==='object');const origin=`http://127.0.0.1:${address.port}`;
  try {
    const cfg=await fetch(origin+'/api/lab/config').then(r=>r.json());assert.equal(cfg.ready,false);assert.ok(!JSON.stringify(cfg).includes('apiKey'));
    const denied=await fetch(origin+'/api/lab/runs',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify(input)});assert.equal(denied.status,403);
    const missing=await fetch(origin+'/api/lab/runs',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input)});assert.equal(missing.status,400);assert.equal(calls,0);
  } finally { server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve())); }
});
