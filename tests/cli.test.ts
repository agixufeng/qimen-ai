import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli, CLI_VERSION } from '../packages/cli/src/index.js';
import { importChart } from '../packages/core/src/index.js';

test('CLI produces replayable JSON without notes or runtime clock', () => {
  const result = runCli(['chart', '--datetime', '2026-10-28T12:00:00']);
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, '');
  const doc = JSON.parse(result.stdout);
  assert.equal(doc.version, 2);
  assert.equal(doc.note, undefined);
  assert.equal(doc.chart.pillars.day, '乙亥');
  assert.equal(doc.annotations.pillars.hour.horseBranch, '申');
  const replay = importChart(result.stdout);
  assert.equal(replay.baseMatches, true);
  assert.equal(replay.annotationsMatch, true);
});

test('CLI selected display options survive JSON and SVG output', () => {
  const args = ['chart', '--datetime', '2026-10-28T12:00:00', '--professional', '--day-horse'];
  const doc = JSON.parse(runCli(args).stdout);
  assert.equal(doc.displayOptions.mode, 'professional');
  assert.equal(doc.displayOptions.dayHorse, true);
  const svg = runCli([...args, '--format', 'svg']);
  assert.equal(svg.exitCode, 0);
  assert.match(svg.stdout, /^<svg /);
  assert.match(svg.stdout, /日马/);
  assert.match(svg.stdout, /未:墓/);
});

test('CLI rejects ambiguous times, invalid dates, duplicate and unknown options', () => {
  for (const args of [
    [],
    ['chart'],
    ['chart', '--datetime', '2026-02-30T12:00:00'],
    ['chart', '--datetime', '2026-10-28T12:00:00Z'],
    ['chart', '--datetime', '2026-10-28T12:00:00+08:00'],
    ['chart', '--datetime', '2026-10-28'],
    ['chart', '--datetime', '2026-10-28T12:00:00', '--format', 'png'],
    ['chart', '--datetime', '2026-10-28T12:00:00', '--format', 'json', '--format', 'svg'],
    ['chart', '--datetime', '2026-10-28T12:00:00', '--now'],
    ['chart', '--datetime', '2026-10-28T12:00:00', '--day-horse', '--day-horse'],
  ]) {
    const result = runCli(args);
    assert.equal(result.exitCode, 2, args.join(' '));
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.length > 0);
  }
});

test('CLI help and version work without calculating a chart', () => {
  assert.equal(runCli(['--version']).stdout, CLI_VERSION + '\n');
  assert.match(runCli(['--help']).stdout, /UTC\+8/);
  assert.equal(runCli(['--help']).exitCode, 0);
});
