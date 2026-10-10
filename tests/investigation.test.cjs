"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

function loadGame(){
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match,"inline game script exists");
 const ctx={fillRect(){},strokeRect(){},fillText(){},beginPath(){},arc(){},stroke(){},createRadialGradient(){return{addColorStop(){}}}};
 const nodes=new Map();
 function node(id){
  if(!nodes.has(id))nodes.set(id,{id,textContent:"",innerHTML:"",disabled:false,className:"",style:{},classList:{add(){},remove(){},contains(){return true}},getContext(){return ctx},querySelectorAll(){return[]},addEventListener(){}});
  return nodes.get(id);
 }
 const context={document:{getElementById:node},window:{addEventListener(){}},console};
 vm.createContext(context);
 vm.runInContext(match[1],context,{timeout:1500});
 function run(expr){return vm.runInContext(expr,context,{timeout:1500})}
 return {run,node};
}

test("population has 1 player, 19 cursed NPCs and 80 civilians",()=>{
 const {run}=loadGame();
 assert.equal(run("S.people.length"),99);
 assert.equal(run("S.people.filter(p=>p.cursed).length"),19);
 assert.equal(run("S.events.length"),99);
});

test("a nearby witness reports a persistent event belonging to a real suspect",()=>{
 const {run}=loadGame();
 const result=run(`(()=>{
  const candidate=S.people.find(p=>p.cursed);
  const witness=S.people.find(p=>!p.cursed&&p.memories[0]===candidate.caseEvent);
  S.player={x:witness.x,y:witness.y};S.selected=witness.id;act("talk");
  return {near:dist(witness,{x:11,y:8})<=3,
          evidence:(S.notes[candidate.id]||[]).find(n=>n.kind==="witness"),
          event:candidate.caseEvent,name:candidate.name};
 })()`);
 assert.ok(result.near);
 assert.ok(result.evidence);
 assert.match(result.evidence.text,new RegExp(result.name));
 assert.ok(result.evidence.text.includes(result.event.place));
});

test("verifying a disputed alibi creates a sourced contradiction",()=>{
 const {run,node}=loadGame();
 const result=run(`(()=>{
  const p=S.people.find(p=>p.cursed);
  S.player={x:p.x,y:p.y};S.selected=p.id;
  p.claimedPlace=venues.find(v=>v.name!==p.caseEvent.place).name;
  act("talk");act("talk");act("investigate");
  return (S.notes[p.id]||[]).map(e=>e.kind);
 })()`);
 assert.ok(result.includes("claim"));
 assert.ok(result.includes("record"));
 assert.ok(result.includes("conflict"));
 assert.ok(node("notes").innerHTML.includes("VERIFIED RECORD"));
 assert.ok(node("notes").innerHTML.includes("CONTRADICTION"));
});

test("The Confession needs different actions, not repeated talk alone",()=>{
 const {run}=loadGame();
 const result=run(`(()=>{
  S.curse=curses.find(c=>c.id==="confession");
  const p=S.people.find(p=>p.cursed);S.player={x:p.x,y:p.y};S.selected=p.id;
  assign();act("talk");act("talk");const afterTalk=p.progress;
  act("investigate");return {afterTalk,afterBoth:p.progress};
 })()`);
 assert.equal(result.afterTalk,1);
 assert.equal(result.afterBoth,2);
});

test("all resident names are unique, natural, and stable across investigation",()=>{
 const {run}=loadGame();
 const result=run(`(()=>{
  const people=S.people;
  const original=people.map(p=>({id:p.id,name:p.name}));
  const first=people.find(p=>p.cursed);
  S.player={x:first.x,y:first.y};S.selected=first.id;
  act("talk");act("talk");act("investigate");
  return {
   population:original.length,
   unique:new Set(original.map(p=>p.name)).size,
   numbered:original.filter(p=>/ \\d+$/.test(p.name)).map(p=>p.name),
   unchanged:original.every(({id,name})=>S.people.find(p=>p.id===id).name===name),
   cited:(S.notes[first.id]||[]).some(e=>e.text.includes(first.name))
  };
 })()`);
 assert.equal(result.population,99);
 assert.equal(result.unique,99);
 assert.equal(result.numbered.length,0);
 assert.equal(result.unchanged,true);
 assert.equal(result.cited,true);
});
