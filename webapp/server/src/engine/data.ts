import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// webapp/server/src/engine -> repo root is 4 levels up.
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

function loadCsv(filename: string): Record<string, string>[] {
  const raw = readFileSync(path.join(REPO_ROOT, filename), "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true, bom: true });
}

export interface UnitCard {
  Type: string;
  Rank: string;
  Name: string;
  "Main Effect": string;
  "Bonus Effects": string;
  Damage: string;
  HP: string;
  "Organic Cost": string;
  "Tech Cost": string;
  "Alien Cost": string;
  "Organic Scout": string;
  "Tech Scout": string;
  "Alien Scout": string;
  Armor: string;
  Shields: string;
}

export interface EnemyCard {
  Name: string;
  Description: string;
  Type: string;
  Rank: string;
  Reveal: string;
  Passive: string;
  Damage: string;
  HP: string;
  Armor: string;
  Shields: string;
}

export interface GearCard {
  Name: string;
  "Rank Name": string;
  Type: string;
  Passive: string;
  Active: string;
  "Organic Cost": string;
  "Tech Cost": string;
  "Alien Cost": string;
  Damage: string;
  HP: string;
  Restrictions: string;
  Armor: string;
  Shields: string;
}

export interface CommandCard {
  Building: string;
  Name: string;
  "Passive Effect": string;
  "Active Effect": string;
  Organic: string;
  Tech: string;
  Alien: string;
}

export interface MissionCard {
  Name: string;
  "Player Rank": string;
  Requirement: string;
  Resource: string;
  Instant: string;
}

export interface EventCard {
  "Event name": string;
  "Round Effect": string;
  "Completion Condition": string;
  "Completion Reward": string;
  "Failure Penalty": string;
}

export interface SecretObjectiveCard {
  Alignment: string;
  Name: string;
  "Bonus Objective": string;
}

export interface TacticianCard {
  Name: string;
  Passives: string;
  Active: string;
  Resource: string;
}

export interface BossCard {
  Name: string;
  Damage: string;
  HP: string;
  Targeting: string;
  "Boss Passive": string;
  T1Boss: string;
  T2Boss: string;
  T3Boss: string;
  T4Boss: string;
  T5Boss: string;
}

export interface GameData {
  units: UnitCard[];
  enemies: EnemyCard[];
  gear: GearCard[];
  commandCards: CommandCard[];
  missions: MissionCard[];
  events: EventCard[];
  secretObjectives: SecretObjectiveCard[];
  tacticians: TacticianCard[];
  bosses: BossCard[];
}

let cached: GameData | null = null;

export function loadGameData(): GameData {
  if (cached) return cached;
  cached = {
    units: loadCsv("Unit Stats.csv") as unknown as UnitCard[],
    enemies: loadCsv("Enemy Stats.csv") as unknown as EnemyCard[],
    gear: loadCsv("Gear Stats.csv") as unknown as GearCard[],
    commandCards: loadCsv("Command Cards.csv") as unknown as CommandCard[],
    missions: loadCsv("Mission Cards.csv") as unknown as MissionCard[],
    events: loadCsv("Event cards.csv") as unknown as EventCard[],
    secretObjectives: loadCsv("Secret Objective Cards.csv") as unknown as SecretObjectiveCard[],
    tacticians: loadCsv("Tactician Cards.csv") as unknown as TacticianCard[],
    bosses: loadCsv("Boss Stats.csv") as unknown as BossCard[],
  };
  return cached;
}

export function toInt(x: string | number | undefined | null): number {
  if (x === undefined || x === null || String(x).trim() === "") return 0;
  return Math.trunc(Number(x));
}
