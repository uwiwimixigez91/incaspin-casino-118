(function(){"use strict";var PURSE_KEY="jadePurse";var START_COINS=1000;var STAKE_STEP=5;var STAKE_MAX=50000;var REEL_COUNT=3;var ROW_COUNT=3;var CENTER_ROW=1;var TICK_MS=80;var STOP_AT=[650,1000,1350];var RESPIN_MS=1150;var SYMBOLS=[{key:"tiger",glyph:"🐯",label:"Golden Tiger",pay:400,weight:4},{key:"koi",glyph:"🐟",label:"Koi Fish",pay:200,weight:5},{key:"coin",glyph:"🪙",label:"Gold Coin",pay:70,weight:10},{key:"cracker",glyph:"🧨",label:"Firecracker",pay:30,weight:14},{key:"orange",glyph:"🍊",label:"Lucky Orange",pay:10,weight:30},{key:"envelope",glyph:"🧧",label:"Red Envelope",pay:8,weight:37}];var TIGER=SYMBOLS[0];var WEIGHT_TOTAL=SYMBOLS.reduce(function(sum,s){return sum+s.weight;},0);var boardEl=document.getElementById("jade-board");var purseEl=document.getElementById("jade-purse");var refillEl=document.getElementById("jade-refill");var stakeEl=document.getElementById("jade-bet");var stakeDownEl=document.getElementById("jade-bet-down");var stakeUpEl=document.getElementById("jade-bet-up");var spinEl=document.getElementById("jade-spin");var oracleEl=document.getElementById("jade-oracle");var payStripEl=document.getElementById("jade-pay-strip");var cabinetEl=document.getElementById("jade-cabinet");if(!boardEl||!purseEl||!refillEl||!stakeEl||!stakeDownEl||!stakeUpEl||!spinEl||!oracleEl||!payStripEl){return;}
var state={coins:loadCoins(),spinning:false,stake:0,grid:[],respinUsed:false};var reels=[];var cells=[];var payChips={};var turning=[false,false,false];var tickTimer=null;var pendingTimers=[];function loadCoins(){var raw=null;try{raw=window.localStorage.getItem(PURSE_KEY);}catch(err){raw=null;}
if(raw===null||raw===""){return START_COINS;}
var value=Number(raw);if(!isFinite(value)||value<0){return START_COINS;}
return Math.round(value*100)/100;}
function saveCoins(){try{window.localStorage.setItem(PURSE_KEY,String(state.coins));}catch(err){return;}}
function showCoins(){var rounded=Math.round(state.coins*100)/100;purseEl.textContent=rounded===Math.floor(rounded)?String(rounded):rounded.toFixed(2);}
function tell(text,mood){oracleEl.textContent=text;oracleEl.classList.remove("jade-good","jade-bad");if(mood){oracleEl.classList.add(mood);}}
function drawSymbol(){var roll=Math.random()*WEIGHT_TOTAL;for(var i=0;i<SYMBOLS.length;i+=1){roll-=SYMBOLS[i].weight;if(roll<0){return SYMBOLS[i];}}
return SYMBOLS[SYMBOLS.length-1];}
function drawColumn(){var column=[];for(var row=0;row<ROW_COUNT;row+=1){column.push(drawSymbol());}
return column;}
function later(fn,ms){pendingTimers.push(window.setTimeout(fn,ms));}
function clearTimers(){for(var i=0;i<pendingTimers.length;i+=1){window.clearTimeout(pendingTimers[i]);}
pendingTimers=[];}
function buildBoard(){boardEl.innerHTML="";reels=[];cells=[];for(var col=0;col<REEL_COUNT;col+=1){var reel=document.createElement("div");reel.className="jade-reel-efde613c";var columnCells=[];for(var row=0;row<ROW_COUNT;row+=1){var cell=document.createElement("div");cell.className="jade-cell-efde613c";var glyph=document.createElement("span");glyph.className="jade-glyph-efde613c";glyph.textContent=drawSymbol().glyph;cell.appendChild(glyph);reel.appendChild(cell);columnCells.push(cell);}
boardEl.appendChild(reel);reels.push(reel);cells.push(columnCells);}}
function setCell(col,row,symbol){var glyph=cells[col][row].firstChild;glyph.textContent=symbol.glyph;}
function showColumn(col,column){for(var row=0;row<ROW_COUNT;row+=1){setCell(col,row,column[row]);}}
function scrambleColumn(col){for(var row=0;row<ROW_COUNT;row+=1){setCell(col,row,drawSymbol());}}
function clearMarks(){for(var col=0;col<REEL_COUNT;col+=1){reels[col].classList.remove("jade-shimmer","jade-turning");for(var row=0;row<ROW_COUNT;row+=1){cells[col][row].classList.remove("jade-hit-efde613c");}}
if(cabinetEl){cabinetEl.classList.remove("jade-blessed-efde613c");}
var keys=Object.keys(payChips);for(var i=0;i<keys.length;i+=1){payChips[keys[i]].classList.remove("jade-hit-efde613c");}}
function buildPayStrip(){payStripEl.innerHTML="";payChips={};for(var i=0;i<SYMBOLS.length;i+=1){var sym=SYMBOLS[i];var chip=document.createElement("li");chip.className="jade-pay-chip-efde613c";chip.title="Three "+sym.label+" on the middle line";var glyphs=document.createElement("span");glyphs.className="jade-pay-glyphs-efde613c";glyphs.textContent=sym.glyph+sym.glyph+sym.glyph;var pay=document.createElement("span");pay.className="jade-pay-x-efde613c";pay.textContent="×"+sym.pay;chip.appendChild(glyphs);chip.appendChild(pay);payStripEl.appendChild(chip);payChips[sym.key]=chip;}}
function startTicking(){if(tickTimer!==null){return;}
tickTimer=window.setInterval(function(){var busy=false;for(var col=0;col<REEL_COUNT;col+=1){if(turning[col]){scrambleColumn(col);busy=true;}}
if(!busy){window.clearInterval(tickTimer);tickTimer=null;}},TICK_MS);}
function setTurning(col,on){turning[col]=on;reels[col].classList.toggle("jade-turning",on);if(on){startTicking();}}
function lockControls(locked){spinEl.disabled=locked;refillEl.disabled=locked;stakeEl.disabled=locked;stakeDownEl.disabled=locked;stakeUpEl.disabled=locked;}
function readStake(){var value=Math.floor(Number(stakeEl.value));return isFinite(value)?value:0;}
function clampStake(){var value=readStake();if(value<1){value=1;}
if(value>STAKE_MAX){value=STAKE_MAX;}
stakeEl.value=String(value);}
function nudgeStake(delta){if(state.spinning){return;}
var value=readStake()+delta;if(value<1){value=1;}
if(value>STAKE_MAX){value=STAKE_MAX;}
stakeEl.value=String(value);}
function beginSpin(){if(state.spinning){return;}
clampStake();var stake=readStake();if(stake<1){tell("The stake has to be at least 1 coin.","jade-bad");return;}
if(stake>state.coins){tell("Not enough coins for that stake. Lower it or top up.","jade-bad");return;}
state.spinning=true;state.respinUsed=false;state.stake=stake;state.coins=Math.round((state.coins-stake)*100)/100;saveCoins();showCoins();clearMarks();clearTimers();lockControls(true);tell("The reels are turning…","");state.grid=[];for(var col=0;col<REEL_COUNT;col+=1){state.grid.push(drawColumn());setTurning(col,true);}
for(var i=0;i<REEL_COUNT;i+=1){later(makeStop(i),STOP_AT[i]);}
later(judgeRound,STOP_AT[REEL_COUNT-1]+250);}
function makeStop(col){return function(){setTurning(col,false);showColumn(col,state.grid[col]);};}
function centerRow(){var line=[];for(var col=0;col<REEL_COUNT;col+=1){line.push(state.grid[col][CENTER_ROW]);}
return line;}
function judgeRound(){var line=centerRow();if(line[0].key===line[1].key&&line[1].key===line[2].key){settleWin(line[0]);return;}
var tigers=0;for(var col=0;col<REEL_COUNT;col+=1){if(line[col].key===TIGER.key){tigers+=1;}}
if(tigers===2&&!state.respinUsed){goldenRespin();return;}
settleLoss();}
function goldenRespin(){state.respinUsed=true;var oddCol=0;for(var col=0;col<REEL_COUNT;col+=1){if(state.grid[col][CENTER_ROW].key!==TIGER.key){oddCol=col;}}
tell("Two golden tigers hold the line — free respin!","");reels[oddCol].classList.add("jade-shimmer-efde613c");setTurning(oddCol,true);later(function(){state.grid[oddCol]=drawColumn();setTurning(oddCol,false);reels[oddCol].classList.remove("jade-shimmer-efde613c");showColumn(oddCol,state.grid[oddCol]);later(judgeRound,220);},RESPIN_MS);}
function settleWin(symbol){var prize=Math.round(state.stake*symbol.pay*100)/100;state.coins=Math.round((state.coins+prize)*100)/100;saveCoins();showCoins();for(var col=0;col<REEL_COUNT;col+=1){cells[col][CENTER_ROW].classList.add("jade-hit-efde613c");}
if(payChips[symbol.key]){payChips[symbol.key].classList.add("jade-hit-efde613c");}
if(cabinetEl){cabinetEl.classList.add("jade-blessed-efde613c");}
var opening=state.respinUsed&&symbol.key===TIGER.key?"The respin sealed three tigers! ":"Three "+sym3(symbol)+" across the line! ";tell(opening+"You collect "+prize+" coins (×"+symbol.pay+").","jade-good");finishRound();}
function sym3(symbol){return symbol.label.toLowerCase()+" symbols";}
function settleLoss(){var partings=["No match on the lantern line this time.","The middle line stayed quiet. Another spin?","The tiger blinked — nothing lined up."];tell(partings[Math.floor(Math.random()*partings.length)],"jade-bad");finishRound();}
function finishRound(){state.spinning=false;lockControls(false);if(state.coins<1){tell("The purse is empty — press Top up to refill the practice coins.","jade-bad");}}
function refillPurse(){if(state.spinning){return;}
state.coins=START_COINS;saveCoins();showCoins();clearMarks();tell("Purse refilled to "+START_COINS+" practice coins.","");}
spinEl.addEventListener("click",beginSpin);refillEl.addEventListener("click",refillPurse);stakeDownEl.addEventListener("click",function(){nudgeStake(-STAKE_STEP);});stakeUpEl.addEventListener("click",function(){nudgeStake(STAKE_STEP);});stakeEl.addEventListener("change",clampStake);buildBoard();buildPayStrip();showCoins();if(state.coins<1){tell("The purse is empty — press Top up to refill the practice coins.","");}})();