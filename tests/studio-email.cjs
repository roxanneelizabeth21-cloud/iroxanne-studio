const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file){const m={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);return m.exports;}
(async()=>{
const {sendStudioEmail}=load('base44/shared/studioEmail.ts');
let sent=[],wrong=false,fail=false;
global.fetch=async(url,opts)=>{
 if(url.endsWith('/profile'))return {ok:true,json:async()=>({emailAddress:wrong?'wrong@example.invalid':'roxanne@iroxannestudio.com'})};
 sent.push(JSON.parse(opts.body));return {ok:!fail,json:async()=>({id:'test-message'})};
};
const b={asServiceRole:{connectors:{getConnection:async()=>({accessToken:'mock-token'})}}};
await sendStudioEmail(b,{to:'test@example.invalid',subject:'Your agreement — Studio',body:'<p>Thank you, José</p>'});
const raw=Buffer.from(sent[0].raw,'base64url').toString('utf8');
assert.match(raw,/Content-Type: text\/html/);assert.match(raw,/To: test@example.invalid/);
assert.equal(Buffer.from(raw.split('\r\n\r\n')[1],'base64').toString('utf8'),'<p>Thank you, José</p>');
await assert.rejects(sendStudioEmail(b,{to:'bad\r\nBcc: other@example.invalid',subject:'x',body:'x'}));assert.equal(sent.length,1);
wrong=true;await assert.rejects(sendStudioEmail(b,{to:'test@example.invalid',subject:'x',body:'x'}));assert.equal(sent.length,1);
wrong=false;fail=true;await assert.rejects(sendStudioEmail(b,{to:'test@example.invalid',subject:'x',body:'x'}));
console.log('PASS Studio sender verification, external recipient, HTML and Unicode encoding, header injection guard, and visible provider failure; mocked Gmail only');
})().catch(e=>{console.error(e);process.exit(1)});
