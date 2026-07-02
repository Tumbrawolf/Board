import { GameEngine } from "./dist/engine/game.js";
import { BotDecisionProvider } from "./dist/engine/decisions.js";
const N = 5;
let wins = 0, crashes = 0;
for (let i = 0; i < N; i++) {
  try {
    const engine = new GameEngine(
      [{seatIndex:0,name:"Bot1",isBot:true},{seatIndex:1,name:"Bot2",isBot:true},{seatIndex:2,name:"Bot3",isBot:true},{seatIndex:3,name:"Bot4",isBot:true}],
      "Normal", new BotDecisionProvider(), ()=>{}, "full",
      {voteOfNoConfidence:false,tieredMissionDraw:false,commandersCall:false}
    );
    let going = true; while (going) going = await engine.runRound();
    if (engine.game.status === "won") wins++;
  } catch(e) { crashes++; console.error("crash:",e.message?.slice(0,120)); }
}
console.log(`n=${N} wins=${wins} (${Math.round(wins/N*100)}%) crashes=${crashes}`);
