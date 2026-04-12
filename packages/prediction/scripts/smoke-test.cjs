const assert = require('node:assert/strict');
const { buildPredictionSnapshot, buildCycleSummary } = require('../dist/index.js');

function makeRecord(id, startDate, endDate) {
  return {
    id,
    userId: 'user-1',
    startDate,
    endDate,
    flowLevel: 'medium',
    painLevel: 1,
    symptoms: ['cramps'],
    mood: 'steady',
    createdAt: `${startDate}T00:00:00.000Z`,
    updatedAt: `${startDate}T00:00:00.000Z`
  };
}

const records = [
  makeRecord('1', '2026-01-01', '2026-01-05'),
  makeRecord('2', '2026-01-29', '2026-02-02'),
  makeRecord('3', '2026-02-26', '2026-03-02')
];

const summary = buildCycleSummary(records);
assert.equal(summary.averageCycleLength, 28);
assert.equal(summary.averagePeriodLength, 5);

const prediction = buildPredictionSnapshot('user-1', records);
assert.equal(prediction.status, 'stable');
assert.equal(prediction.predictedCycleLength, 28);
assert.equal(prediction.predictedStartDate, '2026-03-26');

console.log('prediction smoke test passed');
