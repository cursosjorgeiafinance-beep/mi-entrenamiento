const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Flow = require('../mobility-flow.js');

test('programs preserve the reviewed durations, doses and short holds', () => {
  assert.deepEqual(Object.values(Flow.PROGRAMS).map(p => p.totalSeconds), [300, 480, 480]);
  for (const program of Object.values(Flow.PROGRAMS)) {
    assert.equal(program.steps.length, 9);
    assert.equal(program.steps.filter(s => s.phase === 'rest').length, 3);
    assert.equal(program.steps.filter(s => s.phase === 'rest').reduce((sum, s) => sum + s.durationSeconds, 0), 60);
    assert.equal(program.steps[1].holdSeconds, 2);
    assert.ok(program.steps.every(s => s.instructions && s.durationSeconds > 0));
    assert.ok(Object.isFrozen(program) && Object.isFrozen(program.steps) && Object.isFrozen(program.steps[0]));
  }
  assert.match(Flow.PROGRAMS.A.steps[0].instructions, /4 cambios por lado/);
  assert.match(Flow.PROGRAMS.B.steps[0].instructions, /4–5 cambios por lado/);
  assert.match(Flow.PROGRAMS.C.steps[0].instructions, /3 repeticiones por lado/);
});

test('a block waits for explicit start and cannot skip unperformed steps', () => {
  const initial = Flow.create('A', 1000);
  assert.equal(Flow.valid(initial), true);
  assert.deepEqual(Flow.tick(initial, 999999), initial);
  assert.deepEqual(Flow.next(initial, 999999), initial);
  const running = Flow.start(initial, 2000);
  assert.equal(running.endsAt, 62000);
  assert.equal(running.startedAt, 2000);
  assert.equal(initial.status, 'ready');
  const premature = Flow.next(running, 12000);
  assert.equal(premature.status, 'running');
  assert.equal(premature.stepIndex, 0);
  assert.equal(premature.completedSteps, 0);
  assert.equal(premature.remainingMs, 50000);
});

test('pause and resume preserve only the remaining time', () => {
  let state = Flow.start(Flow.create('B', 0), 1000);
  state = Flow.pause(state, 21000);
  assert.equal(state.status, 'paused');
  assert.equal(state.remainingMs, 100000);
  assert.equal(state.endsAt, null);
  assert.equal(Flow.snapshot(state, 500000).remainingSeconds, 100);
  state = Flow.start(state, 500000);
  assert.equal(state.endsAt, 600000);
  state = Flow.tick(state, 599001);
  assert.equal(Flow.snapshot(state, 599001).remainingSeconds, 1);
  assert.equal(state.completedSteps, 0);
  state = Flow.pause(state, 600000);
  assert.equal(state.status, 'step-complete');
  assert.equal(state.completedSteps, 1);
  assert.equal(Flow.valid(state), true);
});

test('a locked or suspended device completes only the active step', () => {
  const running = Flow.start(Flow.create('A', 0), 0);
  const restored = JSON.parse(JSON.stringify(running));
  const state = Flow.tick(restored, 12 * 60 * 60 * 1000);
  assert.equal(state.status, 'step-complete');
  assert.equal(state.stepIndex, 0);
  assert.equal(state.completedSteps, 1);
  assert.equal(Flow.snapshot(state, state.updatedAt).completedSeconds, 60);
  assert.equal(Flow.snapshot(state, state.updatedAt).isComplete, false);
  const following = Flow.next(state, state.updatedAt);
  assert.equal(following.stepIndex, 1);
  assert.equal(following.status, 'ready');
  assert.equal(following.remainingMs, 60000);
  assert.deepEqual(Flow.tick(following, state.updatedAt + 99999999), following);
});

test('clock rollback does not restore time or move timestamps backwards', () => {
  let state = Flow.start(Flow.create('A', 1000), 1000);
  state = Flow.tick(state, 21000);
  assert.equal(state.remainingMs, 40000);
  const rolled = Flow.tick(state, 500);
  assert.equal(rolled.remainingMs, 40000);
  assert.equal(rolled.updatedAt, 21000);
  const paused = Flow.pause(rolled, 0);
  const resumed = Flow.start(paused, 20000);
  assert.equal(resumed.endsAt, 61000);
  assert.equal(resumed.updatedAt, 21000);
});

test('JSON reload retains progress and finish requires all steps plus final confirmation', () => {
  let now = 1000, state = Flow.create('C', now);
  for (let index = 0; index < Flow.PROGRAMS.C.steps.length; index++) {
    state = Flow.start(JSON.parse(JSON.stringify(state)), now);
    assert.equal(state.stepIndex, index);
    assert.equal(Flow.valid(state), true);
    now = state.endsAt;
    const snap = Flow.snapshot(state, now);
    state = snap.state;
    assert.equal(state.status, 'step-complete');
    assert.equal(snap.isComplete, false);
    assert.equal(state.completedSteps, index + 1);
    if (index === 8) {
      assert.equal(snap.progress, 1);
      assert.equal(snap.completedSeconds, 480);
    }
    state = Flow.next(state, now);
    assert.equal(Flow.valid(state), true);
    now += 60000;
  }
  const final = Flow.snapshot(JSON.parse(JSON.stringify(state)), now);
  assert.equal(final.isComplete, true);
  assert.equal(final.state.status, 'completed');
  assert.equal(final.completedSteps, 9);
  assert.equal(final.completedSeconds, 480);
  assert.equal(final.state.completedAt, 961000);
});

test('invalid or forged drafts fail safely without mutations', () => {
  const base = Flow.create('A', 0);
  const invalid = [null, [], {}, {...base, programId: {toString: null}}, {...base, programId: '__proto__'}, {...base, programId: 'D'},
    {...base, stepIndex: -1}, {...base, stepIndex: 9}, {...base, remainingMs: 60001},
    {...base, remainingMs: 0}, {...base, updatedAt: NaN}, {...base, completedSteps: 1},
    {...base, status: 'completed'}, {...base, status: 'running'},
    {...base, status: 'paused'}, {...base, completedAt: 1}, {...base, endsAt: 60}];
  for (const value of invalid) {
    assert.equal(Flow.valid(value), false);
    assert.throws(() => Flow.tick(value, 100), TypeError);
  }
  assert.throws(() => Flow.create('D', 0), RangeError);
  assert.throws(() => Flow.create('A', -1), TypeError);
  assert.throws(() => Flow.start(base, Infinity), TypeError);
  assert.throws(() => Flow.start(Flow.create('A', Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER), TypeError);
});

test('UMD browser entry creates the same API without CommonJS', () => {
  const context = vm.createContext({Date});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../mobility-flow.js'), 'utf8'), context);
  assert.equal(context.MobilityFlow.PROGRAMS.A.totalSeconds, 300);
  assert.equal(context.MobilityFlow.valid(context.MobilityFlow.create('B', 1000)), true);
});
