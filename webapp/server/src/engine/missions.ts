import { toInt, type MissionCard } from "./data.js";
import { LOCATIONS, RANK_NUM, UPGRADE_SLOT_CAP, type Location } from "./constants.js";
import type { GamePlayer, GameState, UnitInstance } from "./types.js";
import { addTempUnitPerm, grantShields, makeUnitInstance, unitsOf } from "./state.js";

/** Keyword-match the Requirement text against tracked stats/state. Falls back to True (any held
 * mission is completable) for requirement text not recognized here -- this only ever ADDS
 * gating, never removes the chance to complete a mission. Ported from sim.py's
 * mission_requirement_met and extended with additional hooks wired in the web engine. */
export function missionRequirementMet(
  game: GameState,
  m: MissionCard,
  p: GamePlayer,
  placementsThisRound: Record<number, Location[]>
): boolean {
  const req = (m.Requirement ?? "").toLowerCase();

  // Donate N of a specific resource / of each resource to Command
  if (req.includes("donate")) {
    if (req.includes("of each resource")) {
      const match = /donate (\d+) of each/.exec(req);
      const n = match ? Number(match[1]) : 5;
      return p.stats.donationsMade.Organic >= n && p.stats.donationsMade.Tech >= n && p.stats.donationsMade.Alien >= n;
    } else if (req.includes("organic")) {
      const match = /donate (\d+)/.exec(req);
      return p.stats.donationsMade.Organic >= (match ? Number(match[1]) : 5);
    } else if (req.includes("tech")) {
      const match = /donate (\d+)/.exec(req);
      return p.stats.donationsMade.Tech >= (match ? Number(match[1]) : 5);
    } else if (req.includes("alien")) {
      const match = /donate (\d+)/.exec(req);
      return p.stats.donationsMade.Alien >= (match ? Number(match[1]) : 5);
    }
    return p.stats.donationsMade.Organic + p.stats.donationsMade.Tech + p.stats.donationsMade.Alien >= 5;
  }

  // Kill N enemies (covers "Kill 1 enemy", "Kill 4 enemies without losing a friendly unit", etc.)
  if (req.startsWith("kill")) {
    const match = /kill (\d+)/.exec(req);
    return p.stats.kills >= (match ? Number(match[1]) : 1);
  }

  // Heal N damage during combat (approximated using healsGiven * 10 HP per heal action)
  if (req.includes("heal") && req.includes("damage during combat")) {
    const match = /heal (\d+)/.exec(req);
    const n = match ? Number(match[1]) : 10;
    return p.stats.healsGiven * 10 >= n;
  }

  // Equip a unit / Fully Equip
  if (req.startsWith("fully equip")) {
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    if (req.includes("4 units")) return allUnits.filter((u) => u.equipped.length >= 3).length >= 4;
    if (req.includes("2 units")) return allUnits.filter((u) => u.equipped.length >= 3).length >= 2;
    return allUnits.some((u) => u.equipped.length >= 3);
  }
  if (req.includes("equip a unit") || req.startsWith("equip")) return p.stats.gearEquipped >= 1;

  // Overrun checks (per-player, or team-wide for multi-lane variants)
  if (req.includes("have all lanes overrun")) return game.players.every((q) => q.stats.overrunsSuffered >= 1);
  if (req.includes("have 2 lanes overrun")) return game.players.filter((q) => q.stats.overrunsSuffered >= 1).length >= 2;
  if (req.includes("have a lane overrun") || (req.includes("overrun") && !req.includes("lanes"))) {
    return p.stats.overrunsSuffered >= 1;
  }

  // Command pool size
  if (req.includes("command has over")) {
    const match = /over (\d+)/.exec(req);
    const threshold = match ? Number(match[1]) : 40;
    return game.commandPool.Organic + game.commandPool.Tech + game.commandPool.Alien >= threshold;
  }

  // Own unit of rank N (improves the prior "any unit" fallback to check the actual rank)
  if (req.includes("own unit of rank")) {
    const rankMatch = /rank (\d+)/.exec(req);
    const targetRank = rankMatch ? Number(rankMatch[1]) : 1;
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    return allUnits.some((u) => RANK_NUM[u.card.Rank] >= targetRank);
  }

  // Fully upgrade a location
  if (req.includes("fully upgrade")) {
    for (const loc of LOCATIONS) {
      if (req.includes(loc.toLowerCase())) {
        return game.locationUpgradesBuilt[loc].length >= UPGRADE_SLOT_CAP[loc];
      }
    }
  }

  // Deploy your worker to a specific location this round
  if (req.includes("deploy your worker to")) {
    for (const loc of LOCATIONS) {
      if (req.includes(loc.toLowerCase())) {
        return (placementsThisRound[p.seatIndex] ?? []).includes(loc);
      }
    }
  }

  // Ability activations this round
  if (req.includes("activate 1 ability in each lane")) {
    return game.players.every((q) => (game.activationsThisRound.get(q.seatIndex) ?? 0) >= 1);
  }
  if (req.includes("activate") && req.includes("abilities in 1 lane")) {
    const match = /activate (\d+)/.exec(req);
    return (game.activationsThisRound.get(p.seatIndex) ?? 0) >= (match ? Number(match[1]) : 5);
  }
  if (req.includes("activate an ability")) {
    return (game.activationsThisRound.get(p.seatIndex) ?? 0) >= 1;
  }

  // Event pass/fail
  if (req.includes("complete event")) return p.stats.eventsPassed >= 1;
  if (req.includes("fail event")) return p.stats.eventsFailed >= 1;

  // Retire requirements
  if (req.includes("retire a unit")) {
    // Specific retire conditions (tracked via auto-retire and Honorable Discharge paths)
    return p.stats.unitsRetired >= 1;
  }

  // Ability prevention
  if (req.includes("prevent enemy ability")) return p.stats.abilitiesDenied >= 1;
  if (req.includes("prevent") && req.includes("abilities in 1 turn")) {
    const match = /(\d+) abilities/.exec(req);
    return p.stats.maxAbilitiesDeniedInRound >= (match ? Number(match[1]) : 4);
  }

  // Commander role
  if (req.includes("take commander role")) return p.stats.commanderRounds >= 1;
  if (req.includes("hold commander")) {
    const match = /(\d+) turns?/.exec(req);
    return p.stats.commanderRounds >= (match ? Number(match[1]) : 2);
  }

  // Progress thresholds
  if (req.includes("enemy progress over")) {
    const match = /over (\d+)/.exec(req);
    return game.enemyProgress >= (match ? Number(match[1]) : 5);
  }
  if (req.includes("be over") && req.includes("progress")) {
    const match = /over (\d+)/.exec(req);
    return game.playerProgress >= (match ? Number(match[1]) : 5);
  }

  // Enemies have activated N abilities total this game
  if (req.includes("enemies activate")) {
    const match = /activate (\d+)/.exec(req);
    return game.enemyAbilitiesActivated >= (match ? Number(match[1]) : 5);
  }

  // Fill lane with a single unit type
  if (req.includes("fill a lane with only")) {
    const type = req.includes("infantry") ? "Infantry" : req.includes("mech") ? "Mech" : "Vehicle";
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    return allUnits.length >= 3 && allUnits.every((u) => (u.card.Type as string).includes(type));
  }

  // Fill Med Bay
  if (req.includes("fill medbay") || req.includes("fill med bay")) {
    return p.medBayUnits.length >= 2;
  }

  // Fill Containment Block
  if (req.includes("fill containment")) {
    return game.containmentSlotsCap > 0 && game.containedEnemyPool.length >= game.containmentSlotsCap;
  }

  // Own more of one unit type than the others combined
  if (req.includes("own more")) {
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    const count = (t: string) => allUnits.filter((u) => (u.card.Type as string).includes(t)).length;
    if (req.includes("infantry than")) return count("Infantry") > count("Mech") + count("Vehicle");
    if (req.includes("mechs than")) return count("Mech") > count("Infantry") + count("Vehicle");
    if (req.includes("vehicles than")) return count("Vehicle") > count("Infantry") + count("Mech");
  }

  // All unit types represented across active lanes
  if (req.includes("have every unit type active")) {
    const types = new Set(game.players.flatMap((q) => (q.active ? [(q.active.card.Type as string)] : [])));
    return types.has("Infantry") && types.has("Mech") && types.has("Vehicle");
  }

  // Unit with more Shield than HP
  if (req.includes("unit with more shield than hp")) {
    const allUnits = [...(p.active ? [p.active] : []), ...p.reserve];
    return allUnits.some((u) => u.curShields > u.curHp);
  }

  // Win a round without losing units
  if (req.includes("win a round without losing units")) {
    return p.stats.roundsWithoutUnitLoss >= 1;
  }

  // Return N [resource] to supply (resource-sacrifice missions: player must have the resources)
  if (req.includes("return") && req.includes("to supply")) {
    const eachMatch = /return (\d+) of each/.exec(req);
    if (eachMatch) {
      const n = Number(eachMatch[1]);
      return p.res.Organic >= n && p.res.Tech >= n && p.res.Alien >= n;
    }
    const match = /return (\d+)/.exec(req);
    const n = match ? Number(match[1]) : 1;
    if (req.includes("organic")) return p.res.Organic >= n;
    if (req.includes("tech")) return p.res.Tech >= n;
    if (req.includes("alien")) return p.res.Alien >= n;
  }

  return true;
}

/** Resource field ("Gain +N All resources" / "+N Organic" etc.) plus dispatch for Instant effects.
 * Extended from sim.py's apply_mission_reward with additional stateless/low-complexity hooks. */
export function applyMissionReward(game: GameState, m: MissionCard, p: GamePlayer) {
  // Deduct "Return N X to supply" cost when the mission requirement is of that type.
  const req = (m.Requirement ?? "").toLowerCase();
  if (req.includes("return") && req.includes("to supply")) {
    const eachMatch = /return (\d+) of each/.exec(req);
    if (eachMatch) {
      const n = Number(eachMatch[1]);
      p.res.Organic = Math.max(0, p.res.Organic - n);
      p.res.Tech = Math.max(0, p.res.Tech - n);
      p.res.Alien = Math.max(0, p.res.Alien - n);
    } else {
      const match = /return (\d+)/.exec(req);
      const n = match ? Number(match[1]) : 1;
      if (req.includes("organic")) p.res.Organic = Math.max(0, p.res.Organic - n);
      else if (req.includes("tech")) p.res.Tech = Math.max(0, p.res.Tech - n);
      else if (req.includes("alien")) p.res.Alien = Math.max(0, p.res.Alien - n);
    }
  }

  const resText = m.Resource ?? "";
  const amtMatch = /\+(\d+)/.exec(resText);
  const amt = amtMatch ? Number(amtMatch[1]) : 1;
  const lowerRes = resText.toLowerCase();
  if (lowerRes.includes("all resources")) {
    p.res.Organic += amt;
    p.res.Tech += amt;
    p.res.Alien += amt;
  } else if (lowerRes.includes("organic")) {
    p.res.Organic += amt;
  } else if (lowerRes.includes("tech")) {
    p.res.Tech += amt;
  } else if (lowerRes.includes("alien")) {
    p.res.Alien += amt;
  }

  const instant = (m.Instant ?? "").toLowerCase();

  // Each player gains N resource
  if (instant.startsWith("each player gains")) {
    const match = /gains (\d+) (\w+)/.exec(instant);
    if (match) {
      const n = Number(match[1]);
      const word = match[2];
      const res = word.startsWith("organ") ? "Organic" : word.startsWith("tech") ? "Tech" : "Alien";
      for (const q of game.players) q.res[res as "Organic" | "Tech" | "Alien"] += n;
    }
    return;
  }

  // All players promote (rank up)
  if (instant.includes("all players promote")) {
    for (const q of game.players) {
      q.rank = Math.min(8, q.rank + 1);
      q.stats.promotionsReceived += 1;
    }
    return;
  }

  // Add N resources to command pool — handles specific resource and "of each resource" variants
  if (instant.includes("add") && instant.includes("command")) {
    const eachMatch = /add (\d+) of each/.exec(instant);
    if (eachMatch) {
      const n = Number(eachMatch[1]);
      game.commandPool.Organic += n;
      game.commandPool.Tech += n;
      game.commandPool.Alien += n;
    } else {
      const match = /add (\d+) (\w+)/.exec(instant);
      if (match) {
        const n = Number(match[1]);
        const word = match[2];
        const res = word.startsWith("organ") ? "Organic" : word.startsWith("tech") ? "Tech" : "Alien";
        game.commandPool[res as "Organic" | "Tech" | "Alien"] += n;
      }
    }
    return;
  }

  // Block the next N enemy abilities (grants reveal-prevention charges)
  if (instant.startsWith("block the next")) {
    const match = /block the next (\d+)/.exec(instant);
    game.revealPreventionCharges += match ? Number(match[1]) : 1;
    return;
  }

  // Reduce Enemy Progress by N
  if (instant.startsWith("reduce enemy progress")) {
    const match = /by (\d+)/.exec(instant);
    game.enemyProgress = Math.max(0, game.enemyProgress - (match ? Number(match[1]) : 1));
    return;
  }

  // Gain a Rank (personal promotion)
  if (instant.includes("gain a rank")) {
    p.rank = Math.min(8, p.rank + 1);
    p.stats.promotionsReceived += 1;
    return;
  }

  // Gain 1 Progress (team player-progress bar)
  if (instant.includes("gain 1 progress")) {
    game.playerProgress = Math.min(10, game.playerProgress + 1);
    return;
  }

  // Heal all units across all lanes and Med Bay to full HP
  if (instant.startsWith("heal all units")) {
    for (const q of game.players) {
      if (q.active) q.active.curHp = q.active.maxHp;
      for (const u of q.reserve) u.curHp = u.maxHp;
      for (const u of q.medBayUnits) u.curHp = u.maxHp;
    }
    return;
  }

  // Target player gains N resource (approximated: completing player gains it since no mid-flow UI)
  if (instant.startsWith("target player gains")) {
    const match = /gains (\d+) (\w+)/.exec(instant);
    if (match) {
      const n = Number(match[1]);
      const word = match[2];
      const res = word.startsWith("organ") ? "Organic" : word.startsWith("tech") ? "Tech" : "Alien";
      p.res[res as "Organic" | "Tech" | "Alien"] += n;
    }
    return;
  }

  // Gain N resources, split any way you choose (approximated: distribute as evenly as possible)
  if (instant.includes("gain") && instant.includes("resources") && instant.includes("split")) {
    const match = /gain (\d+) resources/.exec(instant);
    const n = match ? Number(match[1]) : 5;
    const each = Math.floor(n / 3);
    const rem = n - 3 * each;
    p.res.Organic += each + rem;
    p.res.Tech += each;
    p.res.Alien += each;
    return;
  }

  // Refresh ability cooldowns this round (clears abilityUsesThisRound so all abilities can
  // be reused). "Refresh target/up to N" is approximated as a full clear since targeting UI
  // isn't available at mission-reward time.
  if (
    instant.startsWith("refresh") ||
    (instant.startsWith("reset") && instant.includes("cooldown"))
  ) {
    game.abilityUsesThisRound.clear();
    return;
  }

  // Draw N new command cards and add to hand (the "free to use" bonus is not tracked —
  // player gets the cards and pays normal activation cost).
  if (instant.startsWith("draw") && instant.includes("command card")) {
    const match = /draw (\d+)/.exec(instant);
    const n = match ? Number(match[1]) : 1;
    for (let i = 0; i < n && game.commandDeck.length; i++) p.hand.push(game.commandDeck.pop()!);
    return;
  }

  // Worker Detail: "Your 1st worker at X counts as 2 each round"
  if (instant.includes("counts as 2 each round")) {
    const locMatch = /your 1st worker at ([\w\s]+?) counts/i.exec(instant);
    if (locMatch) {
      const raw = locMatch[1].trim();
      const loc = LOCATIONS.find((l) => l.toLowerCase() === raw.toLowerCase()) ?? raw;
      p.workerDoubleLocations.add(loc);
    }
    return;
  }

  // Deal N less enemies next combat (Breach / Collapse / Total Breakdown)
  if (instant.startsWith("deal") && instant.includes("less enemies")) {
    const match = /deal (\d+) less/.exec(instant);
    game.hoardReductionNextCombat += match ? Number(match[1]) : 2;
    return;
  }

  // Combat Medic I–IV: "Target Unit gains Shields = [Missing|Max|2x Max|3x Max] Health"
  if (instant.startsWith("target unit gains shields =")) {
    const allUnits: UnitInstance[] = [];
    for (const q of game.players) allUnits.push(...unitsOf(q));
    if (!allUnits.length) return;
    const target = allUnits.reduce((a, b) => (a.maxHp - a.curHp >= b.maxHp - b.curHp ? a : b));
    const ownerP = game.players.find((q) => unitsOf(q).includes(target))!;
    let shields = 0;
    if (instant.includes("3x max health")) shields = target.maxHp * 3;
    else if (instant.includes("2x max health")) shields = target.maxHp * 2;
    else if (instant.includes("missing health")) shields = target.maxHp - target.curHp;
    else if (instant.includes("max health")) shields = target.maxHp;
    grantShields(target, shields, ownerP);
    return;
  }

  // Shield Bearer: "Double Shield on unit"
  if (instant.startsWith("double shield on unit")) {
    const allUnits: UnitInstance[] = [];
    for (const q of game.players) allUnits.push(...unitsOf(q));
    const target = allUnits.reduce((a, b) => (b.curShields > a.curShields ? b : a));
    const ownerP = game.players.find((q) => unitsOf(q).includes(target));
    if (target && ownerP) grantShields(target, target.curShields, ownerP);
    return;
  }

  // Combined Arms: "All units gain +1 armor"
  if (instant.startsWith("all units gain +1 armor")) {
    for (const q of game.players) {
      for (const ui of unitsOf(q)) {
        (ui.equipped as any[]).push({ Name: "__armor_bonus__", Damage: 0, HP: 0, Armor: 1, Shields: 0 });
      }
    }
    return;
  }

  // Boots on the Ground: "Your Infantry have +1 Attack and +3 HP per rank"
  if (instant.includes("infantry have +1 attack") && instant.includes("hp per rank")) {
    for (const ui of unitsOf(p)) {
      const type = ((ui.card as any).Type ?? "").toLowerCase();
      if (!type.startsWith("infantry")) continue;
      const rank = RANK_NUM[(ui.card as any).Rank ?? "Conscript"] ?? 1;
      (ui.equipped as any[]).push({ Name: "__boots_bonus__", Damage: rank, HP: 0, Armor: 0, Shields: 0 });
      ui.maxHp += rank * 3;
      ui.curHp = Math.min(ui.curHp + rank * 3, ui.maxHp);
    }
    return;
  }

  // Steel Wall: "Your Mech have +3 Attack per rank"
  if (instant.includes("mech have +3 attack per rank")) {
    for (const ui of unitsOf(p)) {
      const type = ((ui.card as any).Type ?? "").toLowerCase();
      if (!type.startsWith("mech")) continue;
      const rank = RANK_NUM[(ui.card as any).Rank ?? "Conscript"] ?? 1;
      (ui.equipped as any[]).push({ Name: "__steel_wall_bonus__", Damage: rank * 3, HP: 0, Armor: 0, Shields: 0 });
    }
    return;
  }

  // Armored Convoy: "Your Vehicles have +1 armor per rank"
  if (instant.includes("vehicles have +1 armor per rank")) {
    for (const ui of unitsOf(p)) {
      const type = ((ui.card as any).Type ?? "").toLowerCase();
      if (!type.startsWith("vehicle")) continue;
      const rank = RANK_NUM[(ui.card as any).Rank ?? "Conscript"] ?? 1;
      (ui.equipped as any[]).push({ Name: "__convoy_bonus__", Damage: 0, HP: 0, Armor: rank, Shields: 0 });
    }
    return;
  }

  // Sundering Blow: "Remove all Armor and shields from target"
  if (instant.startsWith("remove all armor and shields")) {
    game.sunderedLaneSeat = p.seatIndex;
    return;
  }

  // Total Suppression: "Stun all lanes" (enemy actives stunned next combat)
  if (instant.startsWith("stun all lanes")) {
    for (const q of game.players) game.missionEnemyStunSeats.add(q.seatIndex);
    return;
  }

  // Shock and Awe: "Stun target enemy"
  if (instant.startsWith("stun target enemy")) {
    game.missionEnemyStunSeats.add(p.seatIndex);
    return;
  }

  // Mission Success: "Prevent the Round Debuff of event this round"
  if (instant.startsWith("prevent the round debuff")) {
    game.missionEventFailurePrevented = true;
    return;
  }

  // Mission Failure: "Prevent your next event failure"
  if (instant.startsWith("prevent your next event failure")) {
    game.missionEventFailurePrevented = true;
    return;
  }

  // Steady Hand: "Prevent the next time you would lose commander role"
  if (instant.startsWith("prevent the next time you would lose commander")) {
    game.steadyHandSeats.add(p.seatIndex);
    return;
  }

  // Command Central: "You can play command cards when not the commander"
  if (instant.startsWith("you can play command cards when not the commander")) {
    game.commandCentralSeats.add(p.seatIndex);
    return;
  }

  // Assume Command: "You count as 1 Rank higher when commander"
  if (instant.startsWith("you count as 1 rank higher")) {
    game.assumeCommandBonusSeats.add(p.seatIndex);
    return;
  }

  // Secure the Specimens: "Gain Alien per turn = Rank of contained units"
  if (instant.startsWith("gain alien per turn")) {
    game.secureSpecimensSeats.add(p.seatIndex);
    return;
  }

  // Medical Emergency: "Units can now stack in med bay upto 3 per space"
  if (instant.startsWith("units can now stack in med bay")) {
    game.medBaySlotCapOverride = 3;
    return;
  }

  // Armed and Ready: "Your next Equip during combat is free"
  if (instant.startsWith("your next equip during combat is free")) {
    game.armedAndReadySeats.add(p.seatIndex);
    return;
  }

  // War Hero: "Your next Retire is returned to hand..., Fully heal all units when you do"
  if (instant.startsWith("your next retire is returned to hand") && instant.includes("fully heal")) {
    game.warHeroSeats.add(p.seatIndex);
    return;
  }

  // Honorable Discharge: "Your next Retire is returned to hand, you can play this unit to any lane"
  if (instant.startsWith("your next retire is returned to hand")) {
    game.honorableDischargeSeats.add(p.seatIndex);
    return;
  }

  // Crushing Advance: "Trample damage can chain multiple times"
  if (instant.startsWith("trample damage can chain")) {
    game.crushingAdvanceSeats.add(p.seatIndex);
    return;
  }

  // Impenetrable: "Reflect Damage = Armor"
  if (instant.startsWith("reflect damage = armor")) {
    game.impenetrableSeats.add(p.seatIndex);
    return;
  }

  // Flawless Assault: "Units lost this round are returned to the deck"
  if (instant.startsWith("units lost this round are returned to the deck")) {
    game.flawlessAssaultSeats.add(p.seatIndex);
    return;
  }

  // Strategic Recall: "All deaths next round are retired"
  if (instant.startsWith("all deaths next round are retired")) {
    game.strategicRecallActive = true;
    return;
  }

  // Total Shutdown / Absolute Lockdown: "Deal N damage when preventing an ability"
  if (instant.startsWith("deal") && instant.includes("damage when preventing")) {
    const match = /deal (\d+) damage/.exec(instant);
    game.abilityDenialDamage += match ? Number(match[1]) : 4;
    return;
  }

  // Battlefield Dominance: "all of Your attacks hit 1st this round"
  if (instant.startsWith("all of your attacks hit 1st")) {
    game.battlefieldDominanceSeats.add(p.seatIndex);
    return;
  }

  // First Blood: "You may delete a rank 1 unit you own and take a Rank 2 unit from the shop"
  if (instant.startsWith("you may delete a rank 1 unit")) {
    const rank1 = unitsOf(p).find((ui) => (RANK_NUM[(ui.card as any).Rank ?? ""] ?? 0) === 1);
    if (rank1) {
      if (p.active === rank1) p.active = p.reserve.shift() ?? null;
      else p.reserve = p.reserve.filter((u) => u !== rank1);
      const rank2idx = game.shopUnits.findIndex((c) => (RANK_NUM[c.Rank ?? ""] ?? 0) === 2);
      if (rank2idx !== -1) {
        const card = game.shopUnits.splice(rank2idx, 1)[0];
        addTempUnitPerm(p, makeUnitInstance(card));
      }
    }
    return;
  }

  // Infantry Doctrine: "Recruit all infantry from the store upto 1 rank higher than your current"
  if (instant.startsWith("recruit all infantry from the store")) {
    const rankCap = p.rank + 1;
    const infantry = game.shopUnits.filter((c) => {
      const type = ((c as any).Type ?? "").toLowerCase();
      return type.startsWith("infantry") && (RANK_NUM[c.Rank ?? ""] ?? 0) <= rankCap;
    });
    for (const card of infantry) {
      game.shopUnits.splice(game.shopUnits.indexOf(card), 1);
      addTempUnitPerm(p, makeUnitInstance(card));
    }
    return;
  }

  // Just a flesh wound: "Double Retired units stats, return it to the lane it was retired from"
  if (instant.startsWith("double retired units stats") || instant.startsWith("double retired unit")) {
    const target = p.benchedUnits[p.benchedUnits.length - 1];
    if (target) {
      p.benchedUnits.pop();
      const dmg = toInt(target.card.Damage);
      (target.equipped as any[]).push({ Name: "__flesh_wound_bonus__", Damage: dmg, HP: 0, Armor: 0, Shields: 0 });
      target.maxHp *= 2;
      target.curHp = target.maxHp;
      addTempUnitPerm(p, target);
    }
    return;
  }

  // Free unit/gear purchase (persistent per-round or next-purchase effects — approximated as
  // a flat resource grant at completion time, same as sim.py).
  if (
    instant.includes("free unit") ||
    instant.includes("next unit is free") ||
    instant.includes("next 2 units are free") ||
    instant.includes("free equip") ||
    instant.includes("next equip") ||
    instant.includes("next item is free") ||
    instant.includes("next gear item is free") ||
    instant.includes("rank 1 units are free") ||
    instant.includes("mech half price") ||
    instant.includes("vehicles half price") ||
    (instant.includes("rank") && instant.includes("unit is free"))
  ) {
    p.res.Organic += 5;
    p.res.Tech += 5;
    p.res.Alien += 2;
  }
}
