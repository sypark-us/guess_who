/* CURSED 100 — deterministic NPC minds and social simulation.
 * World truths are separate from NPC beliefs. No network or language-model calls.
 * This module is available to browsers as CursedSim and to Node.js tests.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.CursedSim=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const HUMAN_TRAITS=["protective","ambitious","curious","cautious","sociable","secretive","generous","stubborn","pragmatic","anxious"];
 const HUMAN_NEEDS=["protect family","keep a stable job","pay a personal debt","find a missing friend","repair a friendship","earn public respect","hide an embarrassing secret","save money to leave the city"];
 const FEARS=["being abandoned","losing their job","public humiliation","being followed","losing control","betrayal"];
 const DEMON_TRAITS=["patient","proud","deceptive","reckless","territorial","calculating","paranoid","opportunistic"];
 const VOICES={
   cautious:["I need to be careful about that.","I would rather verify it first."],
   curious:["That's worth asking about.","There must be another explanation."],
   sociable:["Maybe we can help each other.","I might know someone you should talk to."],
   secretive:["I'd rather not say everything just yet.","Some things are safer left unsaid."],
   stubborn:["I know what I saw.","I'm not changing my mind so easily."],
   anxious:["I don't want to get involved.","This is getting dangerous."],
   protective:["People could get hurt.","Promise you'll be careful."],
   ambitious:["Information has a price.","An opportunity like this shouldn't be wasted."],
   generous:["I can try to help.","Perhaps we can figure it out together."],
   pragmatic:["Show me the evidence.","Let's focus on what we can confirm."]
 };
 function choose(rng,a){return a[Math.floor(rng()*a.length)]}
 function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
 function personality(rng,cursed){
   let t=choose(rng,HUMAN_TRAITS),t2=choose(rng,HUMAN_TRAITS.filter(x=>x!==t));
   return {traits:[t,t2],need:choose(rng,HUMAN_NEEDS),fear:choose(rng,FEARS),
      risk:Math.round(rng()*100),empathy:Math.round(rng()*100),
      honesty:Math.round(rng()*100),curiosity:Math.round(rng()*100),
      demon:cursed?{trait:choose(rng,DEMON_TRAITS),appetite:Math.round(35+rng()*65),sense:1,intelligence:1,charisma:1}:null};
 }
 function remember(npc,event,belief){
   if(!npc.mind)return false;
   if(npc.mind.memories.some(m=>m.id===event.id))return false;
   npc.mind.memories.push({id:event.id,tick:event.tick||0,kind:event.kind,targetId:event.targetId,actorId:event.actorId,place:event.place,description:event.description,source:event.source||"observed"});
   if(npc.mind.memories.length>35)npc.mind.memories.shift();
   if(belief&&Number.isInteger(event.actorId)&&event.actorId!==npc.id){
     const prior=npc.mind.beliefs[event.actorId]||{score:0,seen:0};
     prior.score=clamp(prior.score+(belief.score||0),-100,100);prior.seen+=1;
     npc.mind.beliefs[event.actorId]=prior;
   }
   return true;
 }
 function trust(npc,otherId,delta){
   let old=npc.mind.relationships[otherId]||0;
   npc.mind.relationships[otherId]=clamp(old+delta,-100,100);
 }
 function createWorld(people,rng){
   // The simulation sees each actor's own curse and personality. Plans must never
   // inspect someone else's hidden cursed flag: only belief scores and memories.
   const world={tick:0,seq:0,events:[],rivals:[],rng};
   for(const npc of people){
     npc.profile=personality(rng,npc.cursed);
     npc.mind={memories:[],beliefs:{},relationships:{},goal:"maintain ordinary life",plan:null,stubbornness:Math.round(rng()*100)};
     npc.demonCurse=npc.cursed?choose(rng,["echo","witness","confession"]):null;
     npc.mind.secret=npc.profile.need;
     npc.mind.alibiReason=npc.claimedPlace===npc.caseEvent?.place?"ordinary routine":choose(rng,["protect a friend","hide a private meeting","avoid unwanted attention"]);
   }
   for(const npc of people){
     const others=people.filter(x=>x.id!==npc.id);
     for(let i=0;i<2;i++){
       const friend=choose(rng,others);
       trust(npc,friend.id,Math.round(15+rng()*45));
       trust(friend,npc.id,Math.round(10+rng()*30));
     }
     // Only remembered acts and testimony shape beliefs, with misleading signals
     // deliberately possible for both civilians and the possessed.
     if(npc.memories){
       for(const e of npc.memories.slice(0,3)){
         const suspicion=/private|followed|secret|schedule|sealed/.test(e.action)?18:3;
         remember(npc,{id:e.id,kind:"witness",actorId:e.actorId,targetId:e.otherId,place:e.place,tick:0,description:e.action,source:"personal recollection"},{score:suspicion});
       }
     }
   }
   return world;
 }
 function estimate(npc,targetId){return npc.mind.beliefs[targetId]?.score||0}
 function publicProfile(npc){return {traits:npc.profile.traits.slice(),need:npc.profile.need,fear:npc.profile.fear,job:npc.job,voice:npc.profile.traits[0]}}
 function planFor(npc,people,world){
   if(!npc.alive)return null;
   const candidates=people.filter(x=>x.alive&&x.id!==npc.id);
   if(!candidates.length)return null;
   const r=world.rng, profile=npc.profile;
   // Without cursed knowledge, NPCs rank candidates using testimony,
   // existing ties, proximity and temperament. Apparent evidence may mislead.
   const scored=candidates.map(other=>{
     const suspicion=estimate(npc,other.id),relationship=npc.mind.relationships[other.id]||0;
     return {other,score:suspicion*.72-relationship*.33+(other.id%7)*.1+
       (profile.risk>70?3:0)+(Math.abs(other.x-npc.x)+Math.abs(other.y-npc.y)<5?8:0)};
   }).sort((a,b)=>b.score-a.score);
   const top=scored[0],suspicion=top?.score||0;
   let type;
   if(npc.cursed){
     const demon=npc.profile.demon;
     if(suspicion>25 && (profile.risk>40 || demon.trait==="reckless"))type="hunt";
     else if(demon.trait==="deceptive"&&r()<.45)type="mislead";
     else if(profile.curiosity>45||demon.trait==="calculating")type="investigate";
     else type=r()<.45?"follow":"negotiate";
   }else{
     if(suspicion>30&&profile.risk<45)type="warn";
     else if(profile.curiosity>65)type="investigate";
     else type=profile.traits.includes("sociable")?"socialize":"work";
   }
   const targetId=top.other.id;
   const plan={type,targetId,createdAt:world.tick,reason:explainPlan(npc,type,top.other,suspicion)};
   npc.mind.plan=plan;npc.mind.goal=type==="hunt"?"eliminate a suspected rival":type==="work"?"keep up with ordinary obligations":type==="investigate"?"verify a suspicious report":type==="warn"?"protect someone from harm":type==="mislead"?"redirect unwanted attention":"build or exploit a relationship";
   return plan;
 }
 function explainPlan(npc,type,subject,suspicion){
   const base=type==="hunt"?"believes this person may be a rival":type==="investigate"?"wants to verify inconsistent information":type==="mislead"?"wants to divert suspicion":type==="warn"?"believes this person could be dangerous":type==="follow"?"wants to learn this person's routine":type==="socialize"?"wants to maintain social ties":type==="work"?"needs a stable income":"hopes to secure another person's trust";
   return base+(suspicion>30?" (strong suspicion)":" (limited evidence)");
 }
 function sceneFor(npc,people){const t=people.find(p=>p.id===npc.mind.plan?.targetId);return t?t.name:"another resident"}
 function act(world,npc,people){
   if(!npc.alive)return null;
   const plan=npc.mind.plan||planFor(npc,people,world);
   if(!plan)return null;
   const subject=people.find(p=>p.id===plan.targetId);
   if(!subject||!subject.alive){npc.mind.plan=null;return null}
   const place=(typeof npc.caseEvent?.place==="string"?npc.caseEvent.place:"the street");
   const descriptions={
     investigate:"asked a shopkeeper about "+subject.name+"'s movements",
     follow:"followed "+subject.name+" from a distance",
     negotiate:"asked "+subject.name+" to meet for a private conversation",
     hunt:"tried to corner "+subject.name+" in conversation",
     mislead:"spread a misleading rumor about "+subject.name,
     warn:"warned "+subject.name+" to avoid the night streets",
     socialize:"invited "+subject.name+" to share a meal",
     work:"returned to an ordinary work shift near "+place
   };
   const event={id:"sim-"+(++world.seq),tick:world.tick,night:null,
      actorId:npc.id,targetId:subject.id,kind:plan.type,
      place,description:descriptions[plan.type],source:"simulated action"};
   world.events.push(event);
   if(world.events.length>600)world.events.shift();
   remember(npc,event);
   // Only people at the scene gain firsthand information. No global knowledge.
   const witnesses=people.filter(x=>x.alive&&x.id!==npc.id&&Math.abs(x.x-npc.x)+Math.abs(x.y-npc.y)<=3).slice(0,4);
   for(const observer of witnesses){
      remember(observer,event,{score:plan.type==="hunt"?25:plan.type==="mislead"?17:plan.type==="follow"?14:plan.type==="investigate"?5:-2});
      if(plan.type==="mislead")trust(observer,npc.id,-4);
   }
   if(plan.type==="negotiate"||plan.type==="socialize")trust(npc,subject.id,3);
   if(plan.type==="warn")trust(subject,npc.id,3);
   npc.mind.plan=null;
   return event;
 }
 function step(world,people,player,minutes){
   const incidents=[];
   // At most a handful act in a tick; simulation complexity is bounded.
   world.tick+=Math.max(1,minutes||1);
   const living=people.filter(p=>p.alive);
   const actors=[];
   for(let k=0;k<Math.min(3,living.length);k++){
     const actor=choose(world.rng,living);if(!actors.includes(actor))actors.push(actor);
   }
   for(const npc of actors){
     if(!npc.mind.plan||world.tick-npc.mind.plan.createdAt>8)planFor(npc,people,world);
     const e=act(world,npc,people);
     if(e&&Math.abs(npc.x-player.x)+Math.abs(npc.y-player.y)<=4)incidents.push(e);
   }
   return incidents;
 }
 function dialogue(npc,topic,world){
   // Dialogue only has access to a character's own profile and memories.
   // Do not leak npc.cursed, npc.demonCurse, or another character's secrets.
   const p=npc.profile,mem=npc.mind.memories,primary=p.traits[0];
   let lines=[],claim=null;
   if(topic==="plans"){
     const type=npc.mind.plan?.type;
     if(type==="work")lines=["I have a shift to finish. I can't linger here."];
     else if(type==="investigate")lines=["I'm checking someone's story, but I won't name them yet."];
     else if(type==="warn")lines=["Someone around here may be in danger."];
     else if(type==="negotiate"||type==="socialize")lines=["I'm trying to speak to someone before morning."];
     else if(type==="hunt"||type==="mislead")lines=["I have business to settle before dawn.","I'd prefer to keep my plans private."];
     else lines=["I have things on my mind tonight."];
   }else if(topic==="memory"){
     const e=mem.filter(e=>e.actorId!==npc.id&&e.description).slice(-1)[0];
     lines=e?["I remember "+e.description+" near "+e.place+"."]:["I haven't seen anything I can verify yet."];
   }else if(topic==="trust"){
     lines= p.empathy>65?["You can ask me, but please be careful who you trust."]:
       p.honesty<35?["People say all kinds of things. It's hard to know the truth."]:
       ["I don't trust rumors without evidence."];
   }else lines=VOICES[primary]||VOICES.pragmatic;
   const line=lines[Math.floor(world.rng()*lines.length)];
   return {line,topic,voice:primary,claim};
 }
 function nightResolution(world,people,options){
   // Rival resolution is an explicit logged sequence; no invisible mass deaths.
   // Existing strict nightly hunger deadline is represented by failed hunts.
   const survivors=people.filter(x=>x.alive&&x.cursed);
   const involved=new Set(),incidents=[],killers=new Set(),targeted=new Set();
   const ordered=survivors.slice().sort((a,b)=>estimate(b,b.mind.plan?.targetId)-estimate(a,a.mind.plan?.targetId));
   for(const attacker of ordered){
     if(!attacker.alive||killers.has(attacker.id))continue;
     let plan=attacker.mind.plan;
     if(!plan||plan.type!=="hunt")plan=planFor(attacker,people,world);
     const target=people.find(x=>x.id===plan?.targetId&&x.alive);
     if(!target||target.id===attacker.id||world.rng()>.37)continue;
     // Some attempted curses fail through resistance/avoidance; no new death.
     const e={id:"night-"+(++world.seq),tick:world.tick,actorId:attacker.id,targetId:target.id,
       kind:target.cursed?"demon_kill":"innocent_backfire",
       place:target.caseEvent?.place||"unknown",description:target.cursed?
       attacker.name+" eliminated "+target.name+" under uncertain circumstances.":
       attacker.name+" attacked innocent "+target.name+" and was consumed by the curse."};
     attacker.alive=target.cursed;
     target.alive=false;incidents.push(e);world.events.push(e);
     if(target.cursed){killers.add(attacker.id);attacker.profile.demon.sense=Math.min(5,attacker.profile.demon.sense+1)}
     else involved.add(attacker.id);
     targeted.add(target.id);
   }
   return {incidents,killerIds:[...killers],backfireIds:[...involved],victimIds:[...targeted]};
 }
 return {HUMAN_TRAITS,DEMON_TRAITS,createWorld,remember,trust,estimate,publicProfile,planFor,act,step,dialogue,nightResolution};
});
