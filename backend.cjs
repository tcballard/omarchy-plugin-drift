'use strict';const C=require('./lib/js/core.cjs');const M=require('./Model.js');const crypto=require('node:crypto');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
function baseline(config){return C.expand(config.omarchyPath||process.env.OMARCHY_PATH||C.path.join(C.HOME,'.local/share/omarchy'));}
function selected(config){const base=C.path.join(baseline(config),'config');return C.walk(base,4).filter(p=>/\.(conf|toml|lua|json|jsonc)$/.test(p)&&!/\/themes?\/|\/current\/|theme\.|colors\.|bindings\.lua/.test(p)).map(p=>({source:p,relative:C.path.relative(base,p)})).filter(x=>/^(hypr|omarchy|alacritty|ghostty|walker|waybar)\//.test(x.relative));}
async function collect(config){
 if(!C.exists(C.path.join(baseline(config),'config')))throw new Error('Omarchy checkout unavailable; set omarchyPath');
 const records=C.json(C.state('drift','baselines.json'),{}),pins=C.json(C.state('drift','pins.json'),{}),rows=[];
 for(const f of selected(config)){const target=C.path.join(C.configRoot,f.relative);if(!C.exists(target)||C.fs.lstatSync(target).isSymbolicLink())continue;
 const a=C.read(f.source),b=C.read(target);const previous=records[f.relative]?.current;
 const prior=previous!==a?previous:records[f.relative]?.previous;
 if(previous!==a)records[f.relative]={current:a,previous};
 const differences=f.relative.endsWith('.conf')?M.diff(a,b,prior):[];
 if(a!==b&&!differences.length)differences.push({key:'file',line:0,from:'shipped file',to:'modified file',resettable:false,stale:!!prior&&prior!==a});
 for(const d of differences){const id=f.relative+':'+d.key;const fingerprint=digest(a+'\0'+b+'\0'+d.key);if(pins[id]===fingerprint)continue;
 rows.push(C.row(id,d.key,String(d.from)+' → '+String(d.to),{...d,path:target,relative:f.relative,source:f.source,fingerprint,baselineHash:digest(a),userHash:digest(b),reliability:'observed',category:/bind/.test(d.key)?'bindings':/input|kb_|mouse/.test(d.key)?'input':/monitor/.test(d.key)?'monitors':/gaps|border|color/.test(d.key)?'look':'other'}));}}
 C.atomic(C.state('drift','baselines.json'),records);rows.sort((a,b)=>Number(b.stale)-Number(a.stale));
 return C.snapshot(rows,rows.length+' changes',{severity:rows.some(x=>x.stale)?'warn':'ok'});
}
async function action(config,id,key){const r=(await collect(config)).rows.find(x=>x.id===id);if(!r)throw new Error('Diff changed; refresh');
 if(key==='pin'){const p=C.json(C.state('drift','pins.json'),{});p[id]=r.fingerprint;C.atomic(C.state('drift','pins.json'),p);return;}
 if(key==='e')return C.terminal(C.HOME,[process.env.EDITOR||'nvim','+'+(r.line+1),r.path]);
 if(key==='raw')return C.terminal(C.HOME,['diff','-u',r.source,r.path]);
 if(key==='enter'||key==='reset-file')return C.terminal(C.HOME,['node',C.path.join(__dirname,'cli.cjs'),'apply',r.relative,r.key,r.userHash,r.baselineHash,key==='reset-file'?'file':'key']);
 throw new Error('Unknown action');}
function apply(config,args){const [relative,key,userHash,baseHash,mode]=args;const file=selected(config).find(x=>x.relative===relative);if(!file)throw new Error('Not a managed baseline');
 const target=C.path.join(C.configRoot,relative);const a=C.read(file.source),b=C.read(target);if(digest(a)!==baseHash||digest(b)!==userHash)throw new Error('File changed since review; refresh first');
 let output=a;if(mode==='key'){const d=M.diff(a,b).find(x=>x.key===key);if(!d?.resettable)throw new Error('Ambiguous key; use raw diff');const lines=b.split('\n');lines[d.line]=d.replacement;output=lines.join('\n');}
 else if(mode!=='file')throw new Error('Unknown reset mode');
 const backup=C.state('drift','backups/'+relative.replace(/\//g,'_')+'.'+Date.now());C.atomic(backup,b);C.atomic(target,output);return {backup};}
module.exports={collect,action,apply};
