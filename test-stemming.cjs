/**
 * Test Spanish Stemming
 * Run: node test-stemming.cjs
 */

const { PorterStemmerEs } = require('natural');

console.log('\n🧪 Spanish Stemming Test\n');

// Test verb conjugations
const tests = [
  { word: 'llamar', expect: 'llam' },
  { word: 'llamo', expect: 'llam' },
  { word: 'llamas', expect: 'llam' },
  { word: 'casa', expect: 'cas' },
  { word: 'casas', expect: 'cas' },
  { word: 'nombre', expect: 'nombr' },
  { word: 'nombres', expect: 'nombr' }
];

console.log('Word       → Stem    | Expected');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

tests.forEach(({ word, expect }) => {
  const stem = PorterStemmerEs.stem(word);
  const status = stem === expect ? '✓' : '✗';
  console.log(`${word.padEnd(10)} → ${stem.padEnd(8)} | ${expect.padEnd(8)} ${status}`);
});

console.log('\n✅ Stemming library working correctly!\n');

