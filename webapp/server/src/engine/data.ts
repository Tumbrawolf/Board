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

export interface GameData {
  units: UnitCard[];
  enemies: EnemyCard[];
  gear: GearCard[];
  commandCards: CommandCard[];
}

let cached: GameData | null = null;

export function loadGameData(): GameData {
  if (cached) return cached;
  cached = {
    units: loadCsv("Unit Stats.csv") as unknown as UnitCard[],
    enemies: loadCsv("Enemy Stats.csv") as unknown as EnemyCard[],
    gear: loadCsv("Gear Stats.csv") as unknown as GearCard[],
    commandCards: loadCsv("Command Cards.csv") as unknown as CommandCard[],
  };
  return cached;
}

export function toInt(x: string | number | undefined | null): number {
  if (x === undefined || x === null || String(x).trim() === "") return 0;
  return Math.trunc(Number(x));
}
