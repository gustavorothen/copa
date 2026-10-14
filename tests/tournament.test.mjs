import assert from 'node:assert/strict';
import {emptyState,schedule,recordScore,standings,qualify,winner,validateState,needsDraw,normalizeState,startMatch,stopMatch,lineups,setLineups,sharedPlayers,allMatches,demoState} from '../app/lib/tournament.ts';
function addDivision(s,sport,n=4){const size=sport==='volei'?6:2;const d=s.divisions[sport];d.teams=Array.from({length:n},(_,i)=>({id:`${sport}-t${i}`,name:`Time ${i}`,color:'#aa88cc',players:Array.from({length:size},(_,j)=>{const id=`${sport}-person-${i}-${j}`;s.people.push({id,name:`${sport} Pessoa ${i}-${j}`});return id;})}));d.started=true;d.matches=schedule(d.teams);return d;}
for(let n=4;n<=12;n++){const s=emptyState(),d=addDivision(s,'volei',n);assert.equal(d.matches.length,n*(n-1)/2);assert.equal(new Set(d.matches.map(m=>[m.a,m.b].sort().join(':'))).size,d.matches.length);for(const r of new Set(d.matches.map(m=>m.round))){const ids=d.matches.filter(m=>m.round===r).flatMap(m=>[...new Set([...lineups(d,m).a,...lineups(d,m).b])]);assert.equal(new Set(ids).size,ids.length);}validateState(s);}
const s=emptyState(),d=addDivision(s,'futevolei');d.teams[3].players[0]=d.teams[0].players[0];d.matches=schedule(d.teams);
for(const round of new Set(d.matches.map(m=>m.round))){const games=d.matches.filter(m=>m.round===round);const players=games.flatMap(m=>[...new Set([...lineups(d,m).a,...lineups(d,m).b])]);assert.equal(new Set(players).size,players.length,'shared player in concurrent group matches');}
const clash=d.matches.find(m=>sharedPlayers(d,m).length);assert.ok(clash);assert.throws(()=>startMatch(s,'futevolei',clash.id),/substituto/);assert.throws(()=>recordScore(d,clash.id,[21,10]),/substituto/);
const replacement={id:'substitute',name:'Pessoa substituta'};s.people.push(replacement);const chosen=lineups(d,clash);setLineups(d,clash.id,{a:chosen.a.map((id,i)=>i===0?replacement.id:id),b:[...chosen.b]});assert.equal(sharedPlayers(d,clash).length,0);assert.equal(d.teams[0].players[0],d.teams[3].players[0]);
for(const m of d.matches)recordScore(d,m.id,Number(m.a.slice(-1))<Number(m.b.slice(-1))?[21,10]:[10,21]);
assert.equal(standings(d)[0].wins,3);qualify(d);assert.deepEqual(d.semis.map(m=>[m.a,m.b]),[['futevolei-t0','futevolei-t2'],['futevolei-t1','futevolei-t3']]);validateState(s);
recordScore(d,'semi-1',[21,15]);recordScore(d,'semi-2',[10,21]);assert.equal(d.final.a,'futevolei-t0');assert.equal(d.final.b,'futevolei-t3');assert.throws(()=>startMatch(s,'futevolei','final'),/substituto/);assert.throws(()=>recordScore(d,'final',[21,10]),/substituto/);
const finalOriginal=lineups(d,d.final);setLineups(d,'final',{a:finalOriginal.a.map((id,i)=>i===0?'substitute':id),b:[...finalOriginal.b]});startMatch(s,'futevolei','final');validateState(s);recordScore(d,'final',[21,17]);assert.equal(winner(d.final),'futevolei-t0');assert.equal(d.final.playing,false);validateState(s);assert.equal(d.teams[0].players[0],d.teams[3].players[0]);
recordScore(d,'semi-1',[12,21]);assert.equal(d.final.score,null);validateState(s);
const cross=emptyState(),vd=addDivision(cross,'volei'),fd=addDivision(cross,'futevolei');fd.teams[0].players[0]=vd.teams[0].players[0];fd.matches=schedule(fd.teams);const vm=vd.matches.find(m=>m.a===vd.teams[0].id||m.b===vd.teams[0].id),fm=fd.matches.find(m=>m.a===fd.teams[0].id||m.b===fd.teams[0].id);startMatch(cross,'volei',vm.id);assert.throws(()=>startMatch(cross,'futevolei',fm.id),/Já estão em partida/);const forged=structuredClone(cross);allMatches(forged.divisions.futevolei).find(m=>m.id===fm.id).playing=true;assert.throws(()=>validateState(forged),/duas partidas/);stopMatch(vd,vm.id);startMatch(cross,'futevolei',fm.id);validateState(cross);
const bad=structuredClone(cross);bad.people.push({id:'another',name:bad.people[0].name.toUpperCase()});assert.throws(()=>validateState(bad),/uma vez/);
const dup=structuredClone(cross);dup.divisions.volei.teams[0].players[1]=dup.divisions.volei.teams[0].players[0];assert.throws(()=>validateState(dup),/sem repetir/);
const missing=structuredClone(cross);missing.people=missing.people.filter(p=>p.id!==vd.teams[0].players[0]);assert.throws(()=>validateState(missing),/pessoas cadastradas/);
const legacy=structuredClone(demoState());delete legacy.version;delete legacy.people;for(const sport of ['volei','futevolei'])for(const t of legacy.divisions[sport].teams)t.players=t.players.map((_,i)=>`${sport} ${t.id} Pessoa ${i}`);legacy.divisions.futevolei.teams[0].players[0]='João Silva';legacy.divisions.volei.teams[1].players[0]='JOAO SILVA';const oldScores=legacy.divisions.volei.matches.map(m=>m.score);const converted=normalizeState(legacy);assert.equal(converted.version,2);assert.equal(converted.divisions.futevolei.teams[0].players[0],converted.divisions.volei.teams[1].players[0]);assert.deepEqual(converted.divisions.volei.matches.map(m=>m.score),oldScores);validateState(converted,converted);assert.deepEqual(normalizeState(converted),converted);
const baseline=emptyState(),bd=addDivision(baseline,'futevolei');bd.teams[3].players[0]=bd.teams[0].players[0];bd.matches=schedule(bd.teams);const bm=bd.matches.find(m=>sharedPlayers(bd,m).length);bm.score=[21,15];assert.throws(()=>validateState(baseline),/substituto/);validateState(baseline,structuredClone(baseline));
for (const sport of ['volei', 'futevolei']) {
  const small = emptyState(), division = addDivision(small, sport);
  const max = sport === 'volei' ? 6 : 2;
  division.teams.forEach((team, i) => { team.players = team.players.slice(0, i % max + 1); });
  division.matches = schedule(division.teams);
  validateState(small);
  assert.equal(division.teams[0].players.length, 1);
  assert.deepEqual(normalizeState(small), small);
  const blankName = structuredClone(small);
  blankName.divisions[sport].teams[0].name = ' ';
  assert.throws(() => validateState(blankName), /nome do time/);
  const noPlayers = structuredClone(small);
  noPlayers.divisions[sport].teams[0].players = [];
  assert.throws(() => validateState(noPlayers), /pelo menos uma/);
  const match = division.matches.find(m => m.a === division.teams[0].id || m.b === division.teams[0].id);
  const chosen = structuredClone(lineups(division, match));
  const side = match.a === division.teams[0].id ? 'a' : 'b';
  small.people.push({ id: 'sub-' + sport, name: 'Substituto ' + sport });
  chosen[side][0] = 'sub-' + sport;
  setLineups(division, match.id, chosen);
  validateState(small);
  const wrongLineup = structuredClone(small);
  wrongLineup.divisions[sport].matches.find(m => m.id === match.id).lineups[side].push(division.teams[0].players[0]);
  assert.throws(() => validateState(wrongLineup), /quantidade/);
  startMatch(small, sport, match.id);
  validateState(small);
  stopMatch(division, match.id);
  for (const game of division.matches) recordScore(division, game.id, [21, 10]);
  if (needsDraw(division)) division.tieOrder = division.teams.map(t => t.id);
  qualify(division);
  for (const game of division.semis) recordScore(division, game.id, [21, 10]);
  recordScore(division, 'final', [21, 10]);
  validateState(small);
}
console.log('PASS: variable team sizes, name and one-player minimum, per-team substitute counts, people IDs, migration, round-robin pairs, semifinal rearrangement, final substitutes, cross-sport conflicts and score corrections.');
