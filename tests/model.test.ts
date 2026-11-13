import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STATE, PEOPLE, YOU, reducer, isState, type Match } from '../src/model.ts';
const invitation: Match = { id: 'match-1', topicId: 'remote', proposition: 'Pay should reflect output, regardless of location.', opponent: PEOPLE[2], position: 'For', status: 'invited', turns: [], created: 1 };
test('a match requires acceptance and cannot accept submissions after completion', () => {
  let s = reducer(INITIAL_STATE, { type: 'invite', match: invitation });
  s = reducer(s, { type: 'turn', matchId: invitation.id, text: 'Too early', id: 'early' });
  assert.equal(s.matches[0].turns.length, 0);
  s = reducer(s, { type: 'accept', matchId: invitation.id });
  for (let i = 0; i < 3; i++) s = reducer(s, { type: 'turn', matchId: invitation.id, text: `Argument ${i}`, id: `t${i}` });
  assert.equal(s.matches[0].status, 'completed');
  assert.equal(s.matches[0].turns.length, 6);
  const done = s;
  s = reducer(s, { type: 'turn', matchId: invitation.id, text: 'Extra', id: 'extra' });
  assert.deepEqual(s, done);
  assert.equal(s.topics[0].comments.length, INITIAL_STATE.topics[0].comments.length);
});
test('duplicate submissions do not create extra turns', () => {
  let s = reducer(reducer(INITIAL_STATE, { type: 'invite', match: invitation }), { type: 'accept', matchId: invitation.id });
  const action = { type: 'turn', matchId: invitation.id, text: 'My point', id: 'same' } as const;
  s = reducer(s, action); assert.deepEqual(reducer(s, action), s);
});
test('cancelled and self-directed invitations cannot start a match', () => {
  assert.equal(reducer(INITIAL_STATE, { type: 'invite', match: { ...invitation, opponent: YOU } }).matches.length, 0);
  let s = reducer(INITIAL_STATE, { type: 'invite', match: invitation });
  s = reducer(s, { type: 'cancel', matchId: invitation.id });
  s = reducer(s, { type: 'accept', matchId: invitation.id });
  assert.equal(s.matches[0].status, 'cancelled');
});
test('spectator picks are scoped by replay and locked when replay starts', () => {
  let s = reducer(INITIAL_STATE, { type: 'pick', replayId: 'one', side: 'A' });
  s = reducer(s, { type: 'pick', replayId: 'two', side: 'B' });
  s = reducer(s, { type: 'replay', replayId: 'one' });
  s = reducer(s, { type: 'pick', replayId: 'one', side: 'B' });
  assert.deepEqual(s.picks, { one: 'A', two: 'B' });
});
test('malformed storage is rejected and likes toggle without inflation', () => {
  assert.equal(isState(INITIAL_STATE), true); assert.equal(isState({ version: 1, topics: [{}] }), false);
  assert.equal(isState({ ...INITIAL_STATE, topics: [{ ...INITIAL_STATE.topics[0], comments: [null] }] }), false);
  const action = { type: 'like', topicId: 'remote', commentId: 'r1' } as const;
  assert.deepEqual(reducer(reducer(INITIAL_STATE, action), action), INITIAL_STATE);
});
