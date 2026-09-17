'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),os=require('node:os');const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function fixture(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stack-integration-'));try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
function node(dir,code){const p=spawnSync(process.execPath,['-e',code],{cwd:root,env:{...process.env,HOME:dir,XDG_CONFIG_HOME:path.join(dir,'config'),XDG_STATE_HOME:path.join(dir,'state')},encoding:'utf8'});assert.equal(p.status,0,p.stderr||p.stdout);return p.stdout;}
test('Drift staged reset rejects changed content and creates a backup',()=>fixture(dir=>{node(dir,`
 const C=require('./lib/js/core.cjs'),B=require('./backend.cjs');
 const base=C.path.join(C.HOME,'omarchy'),file=C.path.join(C.configRoot,'hypr/test.conf');
 C.atomic(C.path.join(base,'config/hypr/test.conf'),'x = 5\\n');C.atomic(file,'x = 8\\n');
 (async()=>{const c={omarchyPath:base};const row=(await B.collect(c)).rows[0];C.atomic(file,'x = 9\\n');
 require('node:assert/strict').throws(()=>B.apply(c,[row.relative,row.key,row.userHash,row.baselineHash,'key']),/changed/);
 C.atomic(file,'x = 8\\n');const result=B.apply(c,[row.relative,row.key,row.userHash,row.baselineHash,'key']);
 require('node:assert/strict').equal(C.read(file),'x = 5\\n');require('node:assert/strict').equal(C.read(result.backup),'x = 8\\n');})();`);}));
test('atomic writes reject symlinked ancestor directories',()=>fixture(dir=>{node(dir,`const C=require('./lib/js/core.cjs');C.fs.mkdirSync(C.path.join(C.HOME,'real'));C.fs.symlinkSync(C.path.join(C.HOME,'real'),C.path.join(C.HOME,'link'));require('node:assert/strict').throws(()=>C.atomic(C.path.join(C.HOME,'link/sub/file'),'bad'),/symlink/);`);}));
