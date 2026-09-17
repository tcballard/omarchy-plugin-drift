function keys(text) {
 var section=[],out={},counts={};text.split('\n').forEach(function(line,i){var clean=line.replace(/\s+#.*$/,'').trim();if(!clean||clean[0]==='#')return;
 var block=clean.match(/^([\w:-]+)\s*\{$/);if(block){section.push(block[1]);return;}if(clean==='}'){section.pop();return;}
 var kv=clean.match(/^([\w:$.-]+)\s*=\s*(.*)$/);if(!kv)return;
 var key=section.concat([kv[1]]).join(':');counts[key]=(counts[key]||0)+1;
 out[key]={value:kv[2],line:i,text:line,duplicate:counts[key]>1};
 });Object.keys(out).forEach(function(k){out[k].duplicate=counts[k]>1;});return out;
}
function diff(baseline,user,previous) {
 var a=keys(baseline),b=keys(user),old=previous===undefined?null:keys(previous),rows=[];
 Object.keys(b).forEach(function(k){if(!a[k]||a[k].value!==b[k].value){rows.push({key:k,line:b[k].line,from:a[k]?a[k].value:null,to:b[k].value,oldText:b[k].text,replacement:a[k]?a[k].text:null,resettable:!!a[k]&&!a[k].duplicate&&!b[k].duplicate,stale:!!old&&!!old[k]&&!!a[k]&&old[k].value!==a[k].value&&b[k].value!==a[k].value});}});return rows;
}
if(typeof module!=='undefined')module.exports={keys,diff};
