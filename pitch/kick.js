(function(){"use strict";var STORE_KEY="goalBonus";var OPENING_CREDITS=1000;var STREAK_STEP=1.85;var READ_CHANCE=0.36;var MAX_KICKS=10;var STAKE_STEP=5;var STAKE_CAP=50000;var FLIGHT_MS=650;var SETTLE_MS=1250;var ZONES=["tl","tr","c","bl","br"];var DIVE_ODDS={tl:0.18,tr:0.18,c:0.28,bl:0.18,br:0.18};var ZONE_POINT={tl:{x:170,y:150},tr:{x:470,y:150},c:{x:320,y:240},bl:{x:170,y:300},br:{x:470,y:300}};var DIVE_TILT={tl:-55,tr:55,c:0,bl:-75,br:75};var BALL_HOME={x:320,y:404};var KEEPER_REACH={x:320,y:260};var creditEl=document.getElementById("goal-credit");var refillBtn=document.getElementById("goal-refill");var betField=document.getElementById("goal-bet");var betDown=document.getElementById("goal-bet-down");var betUp=document.getElementById("goal-bet-up");var kickoffBtn=document.getElementById("goal-kickoff");var bankBtn=document.getElementById("goal-bank");var callEl=document.getElementById("goal-call");var multEl=document.getElementById("goal-mult");var potEl=document.getElementById("goal-pot");var tallyEl=document.getElementById("goal-tally");var keeperEl=document.getElementById("goal-keeper");var ballEl=document.getElementById("goal-ball");var netEl=document.getElementById("goal-net");var targetBtns=[].slice.call(document.querySelectorAll(".goal-target-e4479461"));if(!creditEl||!refillBtn||!betField||!kickoffBtn||!bankBtn||!callEl||!multEl||!potEl||!tallyEl||!keeperEl||!ballEl||targetBtns.length!==5){return;}
var state={credits:loadCredits(),phase:"idle",stake:0,mult:1,goals:0,kicks:0,slots:[]};function loadCredits(){var raw=null;try{raw=window.localStorage.getItem(STORE_KEY);}catch(err){raw=null;}
if(raw===null||raw===""){return OPENING_CREDITS;}
var num=Number(raw);if(!isFinite(num)||num<0){return OPENING_CREDITS;}
return toCents(num);}
function saveCredits(){try{window.localStorage.setItem(STORE_KEY,String(state.credits));}catch(err){return;}}
function toCents(value){return Math.round(value*100)/100;}
function asMoney(value){var num=toCents(value);if(num===Math.floor(num)){return String(num);}
return num.toFixed(2);}
function showCredits(){creditEl.textContent=asMoney(state.credits);}
function announce(text,mood){callEl.textContent=text;callEl.classList.remove("is-cheer","is-groan");if(mood){callEl.classList.add(mood);}}
function showMeters(){multEl.textContent="×"+state.mult.toFixed(2);if(state.phase==="idle"){potEl.textContent="—";}else{potEl.textContent=asMoney(state.stake*state.mult);}}
function buildTally(){tallyEl.innerHTML="";state.slots=[];for(var i=0;i<MAX_KICKS;i+=1){var slot=document.createElement("li");slot.className="goal-tally-slot-e4479461";slot.setAttribute("aria-label","Kick "+(i+1)+": pending");tallyEl.appendChild(slot);state.slots.push(slot);}}
function markTally(index,scored){var slot=state.slots[index];if(!slot){return;}
slot.textContent=scored?"⚽":"✕";slot.classList.add(scored?"is-goal":"is-save");slot.setAttribute("aria-label","Kick "+(index+1)+": "+(scored?"goal":"saved"));}
function readStake(){var num=Math.floor(Number(betField.value));return isFinite(num)?num:0;}
function clampStake(){var num=readStake();if(num<1){num=1;}
if(num>STAKE_CAP){num=STAKE_CAP;}
betField.value=String(num);}
function nudgeStake(delta){if(state.phase!=="idle"){return;}
var num=readStake()+delta;if(num<1){num=1;}
if(num>STAKE_CAP){num=STAKE_CAP;}
betField.value=String(num);}
function applyPhase(){var idle=state.phase==="idle";var aiming=state.phase==="aim";betField.disabled=!idle;betDown.disabled=!idle;betUp.disabled=!idle;refillBtn.disabled=!idle;kickoffBtn.disabled=!idle;bankBtn.disabled=!(aiming&&state.goals>0);for(var i=0;i<targetBtns.length;i+=1){targetBtns[i].disabled=!aiming;}}
function flyBall(zone){var pt=ZONE_POINT[zone];var dx=pt.x-BALL_HOME.x;var dy=pt.y-BALL_HOME.y;ballEl.style.transform="translate("+dx+"px, "+dy+"px) scale(0.62)";}
function diveKeeper(zone){var pt=ZONE_POINT[zone];var dx=pt.x-KEEPER_REACH.x;var dy=pt.y-KEEPER_REACH.y;if(dy>0){dy=dy*0.55;}
if(zone==="c"){dx=0;dy=-16;}
keeperEl.style.transform="translate("+dx+"px, "+dy+"px) rotate("+
DIVE_TILT[zone]+"deg)";}
function reboundBall(zone){var pt=ZONE_POINT[zone];var dx=(pt.x-BALL_HOME.x)*0.4;ballEl.style.transform="translate("+dx+"px, -26px) scale(0.85)";}
function bulgeNet(){if(!netEl){return;}
netEl.classList.remove("is-bulge-e4479461");void netEl.getBoundingClientRect();netEl.classList.add("is-bulge-e4479461");}
function snapHome(){ballEl.classList.add("goal-snap-e4479461");keeperEl.classList.add("goal-snap-e4479461");ballEl.style.transform="";keeperEl.style.transform="";void ballEl.getBoundingClientRect();ballEl.classList.remove("goal-snap-e4479461");keeperEl.classList.remove("goal-snap-e4479461");}
function pickDive(shot){if(Math.random()<READ_CHANCE){return shot;}
var roll=Math.random();var acc=0;for(var i=0;i<ZONES.length;i+=1){acc+=DIVE_ODDS[ZONES[i]];if(roll<acc){return ZONES[i];}}
return"c";}
function stepUp(){if(state.phase!=="idle"){return;}
clampStake();var stake=readStake();if(stake<1){announce("The minimum stake is 1 credit.","is-groan");return;}
if(stake>state.credits){announce("Not enough credits for that stake — lower it "+"or press Refill.","is-groan");return;}
state.stake=stake;state.credits=toCents(state.credits-stake);saveCredits();showCredits();state.mult=1;state.goals=0;state.kicks=0;buildTally();state.phase="aim";applyPhase();showMeters();announce("Kick 1 of "+MAX_KICKS+" — pick a spot in the "+"goal.","");}
function takeKick(zone){if(state.phase!=="aim"){return;}
state.phase="flight";applyPhase();var dive=pickDive(zone);var scored=dive!==zone;flyBall(zone);diveKeeper(dive);window.setTimeout(function(){settleKick(zone,dive,scored);},FLIGHT_MS);}
function settleKick(zone,dive,scored){var index=state.kicks;state.kicks+=1;markTally(index,scored);if(scored){state.goals+=1;state.mult=state.mult*STREAK_STEP;bulgeNet();showMeters();if(state.kicks>=MAX_KICKS){announce("Ten from ten! Banking your win automatically.","is-cheer");window.setTimeout(function(){snapHome();bankWin(true);},SETTLE_MS-FLIGHT_MS);return;}
announce("GOAL! Streak ×"+state.mult.toFixed(2)+" — shoot again or take the win.","is-cheer");}else{reboundBall(zone);showMeters();announce("Saved! The keeper read it — the streak and "+"your "+asMoney(state.stake)+" stake are gone.","is-groan");}
window.setTimeout(function(){snapHome();if(scored){state.phase="aim";applyPhase();}else{endSeries();}},SETTLE_MS-FLIGHT_MS);}
function bankWin(auto){if(state.goals<1){return;}
var prize=toCents(state.stake*state.mult);state.credits=toCents(state.credits+prize);saveCredits();showCredits();if(!auto){announce("You banked "+asMoney(prize)+" credits at ×"+
state.mult.toFixed(2)+". Step up again?","is-cheer");}else{announce("Series complete — "+asMoney(prize)+" credits banked at ×"+state.mult.toFixed(2)+".","is-cheer");}
endSeries();}
function endSeries(){state.phase="idle";state.mult=1;state.goals=0;applyPhase();showMeters();if(state.credits<1){announce("The purse is empty — press Refill to restock "+"the practice credits.","is-groan");}}
function restock(){if(state.phase!=="idle"){return;}
state.credits=OPENING_CREDITS;saveCredits();showCredits();announce("Practice purse restocked to "+OPENING_CREDITS+" credits.","");}
kickoffBtn.addEventListener("click",stepUp);bankBtn.addEventListener("click",function(){if(state.phase==="aim"){bankWin(false);}});refillBtn.addEventListener("click",restock);betDown.addEventListener("click",function(){nudgeStake(-STAKE_STEP);});betUp.addEventListener("click",function(){nudgeStake(STAKE_STEP);});betField.addEventListener("change",clampStake);targetBtns.forEach(function(btn){btn.addEventListener("click",function(){var zone=btn.getAttribute("data-zone");if(ZONE_POINT[zone]){takeKick(zone);}});});buildTally();showCredits();showMeters();applyPhase();if(state.credits<1){announce("The purse is empty — press Refill to restock the "+"practice credits.","");}})();