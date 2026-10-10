"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const Sim=require("../simulation.js");
function seeded(seed){
 let s=seed>>>0;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296};
}
function make(seed=1234,count=30){
 const rng=seeded(seed);
 const p=Array.from({length:count},(_,id)=>({id,name:"Resident "+id,alive:true,cursed:id<8,x:id%7,y:Math.floor(id/7),job:"shop assistant",
 caseEvent:{id:"case-"+id,actorId:id,otherId:(id+1)%count,place:"Market",action:"met another resident",minute:1050},
 memories:[],claimedPlace:"Market"}));
 const world=Sim.createWorld(p,rng);
 return {p,world,rng};
}
test("generated NPC identities have varied stable motivations and private demon traits",()=>{
 const {p}=make();
 assert.equal(p.filter(x=>x.cursed).length,8);
 assert.ok(new Set(p.map(x=>x.profile.need+"|"+x.profile.traits.join(","))).size>12);
 assert.equal(p.find(x=>!x.cursed).profile.demon,null);
 assert.ok(p.find(x=>x.cursed).profile.demon);
 assert.ok(p.every(x=>x.mind.memories&&x.mind.beliefs&&x.mind.relationships));
});
test("beliefs respond to witnessed events, not forbidden knowledge",()=>{
 const {p,world}=make();
 const observer=p[11],actor=p[0];
 observer.mind.beliefs={};
 const before=Sim.estimate(observer,actor.id);
 const e={id:"proof-one",actorId:actor.id,targetId:4,tick:9,kind:"follow",place:"Market",description:"followed a resident"};
 assert.equal(Sim.remember(observer,e,{score:22}),true);
 assert.equal(Sim.remember(observer,e,{score:22}),false);
 assert.equal(Sim.estimate(observer,actor.id),before+22);
 assert.ok(observer.mind.memories.some(x=>x.id===e.id));
});
test("public personality and dialogue do not expose hidden curse status",()=>{
 const {p,world}=make();
 for(const person of p){
   const serialized=JSON.stringify(Sim.publicProfile(person));
   assert.ok(!serialized.includes("demonCurse"));
   assert.ok(!serialized.includes('"cursed"'));
   for(const topic of ["plans","memory","trust","ordinary"]){
     const output=Sim.dialogue(person,topic,world);
     assert.equal(typeof output.line,"string");
     assert.ok(output.line.length>4);
   }
 }
});
test("actions are legal, grounded, and produce shared memories",()=>{
 const {p,world}=make();
 const npc=p[0];
 const plan=Sim.planFor(npc,p,world);
 assert.ok(p.some(x=>x.id===plan.targetId&&x.id!==npc.id));
 const before=world.events.length;
 const event=Sim.act(world,npc,p);
 assert.ok(event);
 assert.equal(world.events.length,before+1);
 assert.equal(event.actorId,npc.id);
 assert.equal(typeof event.place,"string");
 assert.ok(npc.mind.memories.some(e=>e.id===event.id));
});
test("simulated games with different seeds create different identities and plans",()=>{
 const a=make(101),b=make(102);
 const summarize=({p,world})=>{
   for(let i=0;i<6;i++)Sim.step(world,p,{x:0,y:0},2);
   return JSON.stringify({profiles:p.map(x=>x.profile),events:world.events});
 };
 assert.notEqual(summarize(a),summarize(b));
 assert.equal(summarize(make(101)),summarize(make(101)));
});
test("a demon's failed attack on a civilian kills the caster, not their allies",()=>{
 const {p,world}=make(44,20);
 const demon=p.find(x=>x.cursed),innocent=p.find(x=>!x.cursed);
 const friend=p.filter(x=>x.cursed&&x.id!==demon.id)[0];
 for(const x of p){x.mind.plan={type:"work",targetId:innocent.id,createdAt:0}}
 demon.mind.plan={type:"hunt",targetId:innocent.id,createdAt:0};
 // Force the attempt to occur by using a low random draw.
 world.rng=()=>0;
 const outcome=Sim.nightResolution(world,p);
 assert.ok(outcome.backfireIds.includes(demon.id));
 assert.equal(demon.alive,false);
 assert.equal(innocent.alive,false);
 assert.equal(friend.alive,true);
 assert.ok(outcome.incidents.some(e=>e.kind==="innocent_backfire"));
});
