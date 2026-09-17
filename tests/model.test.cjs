const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../Model.js');
test('Hyprland keys are scoped by section',()=>{const r=M.diff('general {\n gaps_in = 5\n}\n','general {\n gaps_in = 8\n}\n');assert.equal(r[0].key,'general:gaps_in');assert.equal(r[0].line,1);assert.ok(r[0].resettable);});
test('repeatable bindings cannot be reset as a unique key',()=>{const r=M.diff('bind = A\nbind = B','bind = A\nbind = C');assert.equal(r[0].resettable,false);});
test('stale requires actual prior baseline evidence',()=>{assert.equal(M.diff('x = 6','x = 8')[0].stale,false);assert.equal(M.diff('x = 6','x = 8','x = 5')[0].stale,true);assert.equal(M.diff('x = 6','x = 6','x = 5').length,0);});
