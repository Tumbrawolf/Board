import csv, random, sys, collections, re

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 7
random.seed(SEED)

EFFECT_USES = collections.Counter()  # generic "fires at most N times per game" registry, keyed by card name

def can_use_effect(name, cap):
    return EFFECT_USES[name] < cap

def record_effect_use(name):
    EFFECT_USES[name] += 1

def to_int(x):
    if x is None or str(x).strip() == '':
        return 0
    return int(float(x))

REPO = r"c:\Users\kinne\Documents\GitHub\Board"

def load_csv(fn):
    with open(f"{REPO}\\{fn}", encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

units = load_csv('Unit Stats.csv')
enemies = load_csv('Enemy Stats.csv')
gear = load_csv('Gear Stats.csv')
missions = load_csv('Mission Cards.csv')
events = load_csv('Event cards.csv')
command_cards = load_csv('Command Cards.csv')
bosses = load_csv('Boss Stats.csv')
secret_objectives = load_csv('Secret Objective Cards.csv')
tactician_cards = load_csv('Tactician Cards.csv')

RANK_ORDER = ['Conscript','Private','Sergeant','Captain','Major','Colonel','Specialist','Brigadier']
RANK_NUM = {r: i+1 for i, r in enumerate(RANK_ORDER)}
ENEMY_RANK_ORDER = ['Fodder','Grunt','Core','Advanced','Elite','General','Conqueror']
ENEMY_RANK_NUM = {r: i+1 for i, r in enumerate(ENEMY_RANK_ORDER)}

LOCATIONS = ['Barracks','Armory','Medical Bay','Containment Block','Command','Battlefield']
UPGRADE_SLOT_CAP = {'Armory':1,'Medical Bay':2,'Command':2,'Battlefield':3,'Containment Block':3,'Barracks':4}

def enemy_rank_from_progress(ep):
    if ep <= 1: return 'Fodder'
    if ep <= 3: return 'Grunt'
    if ep <= 5: return 'Core'
    if ep <= 7: return 'Advanced'
    if ep == 8: return 'Elite'
    if ep == 9: return 'General'
    return 'Conqueror'

def boss_tier_from_progress(ep):
    if ep <= 1: return 1
    if ep <= 4: return 2
    if ep <= 6: return 3
    if ep <= 8: return 4
    return 5

HOARD_TABLE = {
    'Easy':   {'base':2, 'mid':3, 'late':3},
    'Normal': {'base':3, 'mid':4, 'late':5},
    'Hard':   {'base':4, 'mid':6, 'late':7},
}
def hoard_count(difficulty, player_progress):
    t = HOARD_TABLE[difficulty]
    if player_progress >= 8: return t['late']
    if player_progress >= 5: return t['mid']
    return t['base']

DIFFICULTY = 'Normal'
OVERRUN_START = {'Easy':15,'Normal':10,'Hard':5}

# ---------- Decks ----------
unit_deck = [u for u in units if 'Vehicle' not in u['Type'] and 'Mech' not in u['Type']]
unit_deck_locked = [u for u in units if 'Vehicle' in u['Type'] or 'Mech' in u['Type']]
random.shuffle(unit_deck)
random.shuffle(unit_deck_locked)

gear_deck = [g for g in gear if g['Type'] != 'Experimental']
gear_deck_locked = [g for g in gear if g['Type'] == 'Experimental']
random.shuffle(gear_deck)
random.shuffle(gear_deck_locked)

enemy_by_rank = {r: [e for e in enemies if e['Rank'] == r] for r in ENEMY_RANK_ORDER}
for r in enemy_by_rank:
    random.shuffle(enemy_by_rank[r])

mission_deck = list(missions); random.shuffle(mission_deck)
event_deck = list(events); random.shuffle(event_deck)
command_deck = list(command_cards); random.shuffle(command_deck)
secret_obj_deck = list(secret_objectives); random.shuffle(secret_obj_deck)
tactician_deck = list(tactician_cards); random.shuffle(tactician_deck)
boss_deck = list(bosses); random.shuffle(boss_deck)

PLAYER_NAMES = ['Alex','Bree','Cole','Dana']

class UnitInstance:
    """A specific owned unit. HP/Shields persist round to round (combat damage
    carries over) and only restore via an explicit heal effect, not automatically.
    Gear is equipped onto the specific unit, not the player, so it travels with
    that unit and is lost if the unit dies (matches Field Testing's "if it
    survives it keeps the item" framing)."""
    def __init__(self, card):
        self.card = card
        self.max_hp = to_int(card.get('HP')) or 1
        self.cur_hp = self.max_hp
        self.cur_shields = to_int(card.get('Shields'))
        self.equipped = []  # list of Gear card dicts
        self.charges = collections.Counter()

    @property
    def name(self):
        return self.card['Name']

    def equipped_bonus(self, stat):
        return sum(to_int(g.get(stat, 0)) for g in self.equipped)

class Player:
    def __init__(self, name):
        self.name = name
        self.rank = 1
        self.res = {'Organic':0,'Tech':0,'Alien':0}
        self.missions = []
        self.active = None
        self.reserve = []
        self.lane_enemy_active = None
        self.lane_enemy_reserve = []
        self.graveyard = []  # dead UnitInstances, most-recent-last
        self.hand = []  # personal hand of Command Cards, drawn from the single shared command_deck
        self.secret_objectives = []  # 2 dealt at setup, hidden personal win conditions
        self.tactician = None  # 1 dealt at setup, a fixed per-player role for the whole game
        self.gear_hand = []  # unequipped owned Gear, free to re-equip (e.g. salvaged off a retired unit)
        self.stats = collections.Counter()  # deaths, heals_given, overruns_suffered, donations_made,
                                             # promotions_received, gear_equipped, commander_rounds,
                                             # events_passed, events_failed, missions_completed, ...
        self.has_recon_satellite = False
        self.has_last_stand_beacon = False
        self.overrun_last_round = False

players = [Player(n) for n in PLAYER_NAMES]
leader = random.choice(players)
leader.rank = 2
print(f"Leader: {leader.name} (starts at Rank 2 / Private)")

COMMAND_HAND_SIZE = 3       # README #40: base hand size raised 2->3
COMMANDER_HAND_SIZE = 4     # README #40: commander's hand size raised 3->4

for p in players:
    p.res['Organic'] += 2  # README #36: starting Organic lever
    p.hand = [command_deck.pop() for _ in range(min(COMMAND_HAND_SIZE, len(command_deck)))]
    p.secret_objectives = [secret_obj_deck.pop() for _ in range(min(2, len(secret_obj_deck)))]
    if tactician_deck:
        p.tactician = tactician_deck.pop()
leader.hand += [command_deck.pop() for _ in range(min(2, len(command_deck)))]  # leader's one-time setup bonus

# Shared team-wide scout pool (README #35/#37/#42): any Scout-type unit a player would otherwise
# add to their own active/reserve is instead donated here for free, no worker required. One is
# assigned as the round's scout each round during Deployment (see Assign Scouts below).
team_scout_pool = []

commander_idx = players.index(leader)
player_progress = 0
enemy_progress = 0
overrun_tracker = OVERRUN_START[DIFFICULTY]
overrun_tracker_min = overrun_tracker
overrun_drops_by_commander = collections.Counter()
command_pool = {'Organic':0,'Tech':0,'Alien':0}
shop_units = []
shop_gear = []
vehicle_unlocked = False
mech_unlocked = False
experimental_unlocked = False
medbay_slots = 2
containment_slots = 0
contained_enemies = []  # list of Enemy Rank strings currently held in Containment cells
location_upgrades_built = {loc: [] for loc in LOCATIONS}
boss_active = None
boss_died_last_round = False

print(f"Difficulty: {DIFFICULTY} | Overrun Tracker starts at {overrun_tracker}/20\n")

def ensure_lowest_rank_unit(slot_list):
    """Mirrors 'Clearing the shop' at Cleanup: if no slot matches the lowest-rank player,
    swap one out so the shop is never a dead draft for them."""
    lowest_rank = min((p.rank for p in players), default=1)
    if not any(RANK_NUM[u['Rank']] == lowest_rank for u in slot_list):
        pool = [u for u in unit_deck if RANK_NUM[u['Rank']] == lowest_rank]
        if pool and slot_list:
            evicted = slot_list.pop(random.randrange(len(slot_list)))
            unit_deck.append(evicted)
            slot_list.append(random.choice(pool))

def ensure_lowest_rank_gear(slot_list):
    lowest_rank = min((p.rank for p in players), default=1)
    if not any(RANK_NUM[g['Rank Name']] == lowest_rank for g in slot_list):
        pool = [g for g in gear_deck if RANK_NUM[g['Rank Name']] == lowest_rank]
        if pool and slot_list:
            evicted = slot_list.pop(random.randrange(len(slot_list)))
            gear_deck.append(evicted)
            slot_list.append(random.choice(pool))

def refill_shop_unit(slot_list):
    while len(slot_list) < 4:
        if random.random() < 0.5:
            pool = [u for u in unit_deck if RANK_NUM[u['Rank']] <= 3]
        else:
            top_rank = max((p.rank for p in players), default=1)
            roll = random.randint(1, 8)
            target_rank = min(roll, top_rank)
            pool = [u for u in unit_deck if RANK_NUM[u['Rank']] == target_rank] or \
                   [u for u in unit_deck if RANK_NUM[u['Rank']] <= 3]
        if not pool:
            pool = unit_deck
        if not pool:
            break
        slot_list.append(random.choice(pool))

def refill_shop_gear(slot_list):
    while len(slot_list) < 2:
        if random.random() < 0.5:
            pool = [g for g in gear_deck if RANK_NUM[g['Rank Name']] <= 3]
        else:
            top_rank = max((p.rank for p in players), default=1)
            roll = random.randint(1, 8)
            target_rank = min(roll, top_rank)
            pool = [g for g in gear_deck if RANK_NUM[g['Rank Name']] == target_rank] or \
                   [g for g in gear_deck if RANK_NUM[g['Rank Name']] <= 3]
        if not pool:
            pool = gear_deck
        if not pool:
            break
        slot_list.append(random.choice(pool))

refill_shop_unit(shop_units)
refill_shop_gear(shop_gear)

print("=== SETUP COMPLETE ===")
for p in players:
    print(f"{p.name}: Rank {RANK_ORDER[p.rank-1]}")
print()

# ============== Combat helpers ==============
class Combatant:
    def __init__(self, card):
        self.name = card['Name']
        self.dmg = to_int(card.get('Damage'))
        self.hp = to_int(card.get('HP')) or 1
        self.cur_hp = self.hp
        self.armor = to_int(card.get('Armor'))
        self.cur_shields = to_int(card.get('Shields'))
        # Gear-driven combat modifiers, set by the Combat stage after construction from
        # whichever Gear is equipped (Ion Weapons, Plasma Weapons, Explosive Rounds, etc.)
        self.ignore_armor = False
        self.shield_multiplier = 1
        self.shred_armor = 0
        self.first_hit_prevented = False
        self.delete_on_kill = False
        self.attacks_first = False
        self.reflect_fraction = 0.0
        self.lifesteal_fraction = 0.0

GEAR_IGNORE_ARMOR = {'Ion Weapons', 'Nanite Tech', 'Magnetized Barrels', 'Toxin Rounds'}
GEAR_DOUBLE_VS_SHIELDS = {'Plasma Weapons'}
GEAR_SHRED_ARMOR = {'Explosive Rounds': 999, 'Chem Strike': 5}  # name -> max armor shredded on hit
GEAR_FIRST_HIT_FREE = {'Basic Camo', 'Smoke Pack', 'Shadow Tech', 'Exosuit'}
GEAR_DELETE_ON_KILL = {'Apocalypse Rounds', 'Black Iron'}

GEAR_RESERVE_HEAL = {
    'Basic Medkit': 2, 'Medkit': 3, 'Field Medkit': 4, 'Triage Pack': 5,
}
GEAR_PRECOMBAT_HEAL = {'Regen Plates': 4}
GEAR_PRECOMBAT_SHIELD = {'Shield Generator': 5}

def apply_precombat_gear(p):
    """Passives that resolve once, right before this lane's combat: reserve-unit healers,
    pre-round self-heal/shield, charge rolls, and the dice-roll defensive items."""
    active_unit = p.active
    all_units = (([p.active] if p.active else []) + list(p.reserve))
    for ui in list(p.reserve):
        for g in ui.equipped:
            amt = GEAR_RESERVE_HEAL.get(g.get('Name'))
            if amt and active_unit:
                healed = heal_unit(active_unit, amt)
                if healed:
                    p.stats['heals_given'] += 1
    for ui in all_units:
        for g in ui.equipped:
            name = g.get('Name')
            if name in GEAR_PRECOMBAT_HEAL:
                heal_unit(ui, GEAR_PRECOMBAT_HEAL[name])
            if name in GEAR_PRECOMBAT_SHIELD:
                ui.cur_shields += GEAR_PRECOMBAT_SHIELD[name]
            if name in ('XVL3', 'XVL33'):
                roll = random.randint(1, 6)
                ui.charges[name] = roll
                per_charge_dmg = 4 if name == 'XVL3' else 10
                per_charge_self = 2 if name == 'XVL3' else 5
                temp_buff(ui, Damage=roll * per_charge_dmg)
                ui.cur_hp = max(1, ui.cur_hp - roll * per_charge_self)
            if name == 'Holographic Decoys':
                ui.charges['Holographic Decoys'] = random.randint(1, 6)
            if name == 'Quantum Plates':
                roll = random.randint(1, 6)
                if roll in (2, 3):
                    temp_buff(ui, Armor=-4)
                elif roll in (4, 5):
                    temp_buff(ui, Armor=6)
                elif roll == 6:
                    ui.cur_hp = 0
            if name == 'Shield Projector':
                ui.cur_shields += 60
            if name == 'Slayer Suit':
                ui.cur_shields += 5
            if name == 'Exosuit':
                temp_buff(ui, Armor=3)

    # Active-effect activation: once per round per item, costs the item's Purchase Cost again
    # (Consumables are exempt and self-destruct on use instead). A few items' "Active" text
    # describes something already resolved as a precombat Passive roll above (XVL3/XVL33's
    # charge roll, Holographic Decoys consuming a charge automatically) -- excluded here so
    # their cost isn't paid twice for the same effect.
    PRECOMBAT_ONLY_ACTIVE = {'XVL3', 'XVL33', 'Holographic Decoys'}
    for ui in all_units:
        for g in list(ui.equipped):
            name = g.get('Name')
            if not g.get('Active', '').strip() or name in PRECOMBAT_ONLY_ACTIVE:
                continue
            if name == 'Emergency Extractor' and ui.cur_hp >= ui.max_hp // 2:
                continue  # only usable below half HP, per its own Passive text
            is_consumable = g.get('Type') == 'Consumable'
            if not is_consumable and not can_afford(p.res, g, GEAR_COST_KEYS):
                continue
            if not is_consumable:
                pay(p.res, g, GEAR_COST_KEYS)
            apply_gear_active(name, ui, p)
            if is_consumable:
                ui.equipped = [x for x in ui.equipped if x is not g]
            print(f"  {p.name} activates {ui.name}'s {name}" + (" (consumable)" if is_consumable else " (paid again)"))

UNIT_KEYWORD_RULES = [
    ('ignore_armor', ['ignores armor', 'ignore armor']),
    ('attacks_first', ['attacks 1st', 'attacks before enemies']),
    ('reflect_half', ['reflects half damage', 'reflect half']),
    ('reflect_retaliate', ['retaliate with 1/2 damage']),
    ('consecutive_damage', ['consecutive hits', 'hits against same target']),
    ('long_range', ['long range', 'target any lane', 'can target any lane']),
    ('lane_heal', ['vehicles and mechs in same lane', 'active vehicles and mechs']),
    ('shields_no_reserve', ['shields when no reserves']),
    ('attack_no_reserve', ['attack when no reserves']),
    ('explode_on_death', ['explodes on death', 'explodes for', 'death dealing']),
    ('delete_on_kill', ['delete units killed', 'delete enemies on kill', 'deletes enemies on kill']),
    ('execute_low_hp', ['execute', 'kills enemies under 1/4', 'under 1/4 health']),
    ('heal_on_kill', ['heal missing health', 'heals hp = attack on kill', 'health on kill']),
    ('shields_on_kill', ['gain shields on kill', 'shields on kill']),
    ('precombat_shield', ['shields before each combat round', 'gain 5 shields before']),
    ('precombat_heal', ['restores 4 hp before', 'restore 3 hp between']),
    ('once_per_combat_heal', ['once per combat: heal']),
    ('revive_once', ['revive once without gear']),
    ('boost_others_damage', ['boosts damage of other units']),
    ('resource_on_kill', ['grants +1 progress when killed']),
]
_UNIT_TAG_CACHE = {}

def classify_unit(card):
    name = card['Name']
    if name in _UNIT_TAG_CACHE:
        return _UNIT_TAG_CACHE[name]
    text = (card.get('Main Effect','') + ' ' + card.get('Bonus Effects','')).lower()
    tags = {tag for tag, subs in UNIT_KEYWORD_RULES if any(s in text for s in subs)}
    _UNIT_TAG_CACHE[name] = tags
    return tags

ENEMY_KEYWORD_RULES = [
    ('ignore_armor', ['ignores armor']),
    ('shred_armor_on_hit', ['shred', 'remove 1 armor each hit', 'remove an additional', 'removes all armor']),
    ('attacks_first', ['always hits 1st']),
    ('reflect_full', ['reflects damage']),
    ('reflect_on_armor', ['deals damage = armor when damaged']),
    ('lifesteal', ['has lifesteal']),
    ('heal_self_on_hit', ['heal active unit by this units attack', 'heals 10 on hit']),
    ('execute_low_hp', ['execute units under 1/4']),
    ('double_hp', ['double this units hp']),
    ('double_attack', ['double this units attack']),
    ('multistrike_2', ['hit twice', 'hits twice', 'attacks an additional time']),
    ('multistrike_4', ['hit all units 4 times', 'hits 4 times']),
    ('multistrike_6', ['attack 6 times']),
    ('gain_armor_on_hit', ['gains 2 armor on hit', 'gain 2 armor on hit']),
    ('takes_half_damage', ['takes half damage']),
]
_ENEMY_TAG_CACHE = {}

def classify_enemy(card):
    name = card['Name']
    if name in _ENEMY_TAG_CACHE:
        return _ENEMY_TAG_CACHE[name]
    text = (card.get('Passive','') or '').lower()
    tags = {tag for tag, subs in ENEMY_KEYWORD_RULES if any(s in text for s in subs)}
    _ENEMY_TAG_CACHE[name] = tags
    return tags

def apply_enemy_combat_mods(c, card):
    tags = classify_enemy(card)
    if 'ignore_armor' in tags:
        c.ignore_armor = True
    if 'shred_armor_on_hit' in tags:
        c.shred_armor = 3
    if 'attacks_first' in tags:
        c.attacks_first = True
    if 'reflect_full' in tags or 'reflect_on_armor' in tags:
        c.reflect_fraction = 1.0
    if 'lifesteal' in tags:
        c.lifesteal_fraction = 1.0
    if 'double_hp' in tags:
        c.hp *= 2; c.cur_hp = c.hp
    if 'double_attack' in tags:
        c.dmg *= 2
    if 'multistrike_2' in tags:
        c.dmg *= 2
    if 'multistrike_4' in tags:
        c.dmg *= 4
    if 'multistrike_6' in tags:
        c.dmg *= 6
    if 'takes_half_damage' in tags:
        c.armor += 999  # approximated as near-total damage reduction floor-clamped to 1 by compute_dealt's max(1,...)

def apply_enemy_reveal(card, p, all_players):
    """Reveal-column effects, applied once when this round's hoard is dealt. Most cards hit only
    their own lane (p); a 'all lanes'/'every lane'/'adjacent lane' card hits other lanes too --
    README #42's multi-lane damage cap: full damage to its own lane, half (rounded down, min 1)
    to every other lane it reaches, further softened by a built/activated Early Warning Network."""
    text = (card.get('Reveal','') or '')
    low = text.lower()
    base_dmg = None
    m = re.search(r'deal[s]? (\d+)x', low)
    if m:
        base_dmg = to_int(card.get('Damage')) * int(m.group(1))
    elif 'deal' in low and 'damage' in low:
        m = re.search(r'deal[s]? (\d+)', low)
        if m:
            base_dmg = int(m.group(1))
    if base_dmg is None:
        return  # self-buffs ('gain shield/armor') and non-damage effects (stun, move) have no
                # player-side HP change to apply here -- approximated via the card's own flat stats
    multilane = 'all lane' in low or 'every lane' in low or 'adjacent lane' in low
    adjacent_only = 'adjacent lane' in low and 'all lane' not in low and 'every lane' not in low
    ewn_built = any(c['Name'] == 'Early Warning Network' for c in location_upgrades_built['Battlefield'])
    targets = [p]
    if multilane:
        others = [q for q in all_players if q is not p]
        targets += (random.sample(others, min(1, len(others))) if adjacent_only else others)
    for target in targets:
        if not target.active:
            continue
        if target is p:
            dmg = base_dmg
        else:
            dmg = max(1, base_dmg // 2)  # multi-lane floor: half rounded down, minimum 1 always gets through
            if HALF_REVEAL_DAMAGE[0]:
                dmg = max(1, dmg // 2)
            elif ewn_built:
                dmg = max(1, dmg - 2)
        armor = to_int(target.active.card.get('Armor')) + target.active.equipped_bonus('Armor')
        target.active.cur_hp -= max(1, dmg - armor)

def apply_unit_combat_mods(c, ui):
    tags = classify_unit(ui.card)
    if 'ignore_armor' in tags:
        c.ignore_armor = True
    if 'attacks_first' in tags:
        c.attacks_first = True
    if 'reflect_half' in tags or 'reflect_retaliate' in tags:
        c.reflect_fraction = 0.5
    if 'consecutive_damage' in tags:
        c.dmg += ui.charges.get('consecutive_hits', 0)

def try_revive_once(p, ui):
    """'Revive once without Gear if no reserves in lane' (Rambo) -- a per-unit, once-per-game
    save distinct from Chronostasis (no item to destroy, just a built-in unit ability)."""
    tags = classify_unit(ui.card)
    if 'revive_once' in tags and not p.reserve and can_use_effect(f'revive-{id(ui)}', 1):
        record_effect_use(f'revive-{id(ui)}')
        ui.equipped = []
        ui.cur_hp = ui.max_hp
        print(f"  [Revive] {p.name}'s {ui.name} revives once (no gear) since the lane had no reserves")
        return True
    return False

def apply_explode_on_death(p, ui):
    tags = classify_unit(ui.card)
    if 'explode_on_death' in tags:
        dmg = to_int(ui.card.get('Damage')) * 3
        if boss_active:
            boss_active['hp_cur'] -= dmg
        elif p.lane_enemy_reserve:
            p.lane_enemy_reserve = [e for e in p.lane_enemy_reserve if to_int(e.get('HP')) > dmg]
        print(f"  [Explode] {p.name}'s {ui.name} explodes on death for {dmg}")

def apply_precombat_unit(p):
    """Unit-ability passives that resolve once before combat: lane-self-heals, no-reserve
    bonuses, resource generation, and building this round's consecutive-hit damage stack."""
    all_units = (([p.active] if p.active else []) + list(p.reserve))
    no_reserve = len(p.reserve) == 0
    for ui in all_units:
        tags = classify_unit(ui.card)
        if 'precombat_heal' in tags:
            heal_unit(ui, 4)
        if 'precombat_shield' in tags:
            ui.cur_shields += 5
        if 'lane_heal' in tags and ui is p.active:
            for other in p.reserve:
                heal_unit(other, 2)
        if 'shields_no_reserve' in tags and no_reserve and ui is p.active:
            ui.cur_shields += 20
        if 'attack_no_reserve' in tags and no_reserve and ui is p.active:
            temp_buff(ui, Damage=5)
        if 'resource_on_kill' in tags or 'boost_others_damage' in tags:
            pass  # 'boost others' needs a multi-unit-active model this sim doesn't have; no-op
        if ui is p.active:
            ui.charges['consecutive_hits'] = ui.charges.get('consecutive_hits', 0) + 1
        else:
            ui.charges['consecutive_hits'] = 0

def apply_gear_combat_mods(c, ui):
    names = {g['Name'] for g in ui.equipped if 'Name' in g}
    if names & GEAR_IGNORE_ARMOR:
        c.ignore_armor = True
    if names & GEAR_DOUBLE_VS_SHIELDS:
        c.shield_multiplier = 2
    for n, amt in GEAR_SHRED_ARMOR.items():
        if n in names:
            c.shred_armor = max(c.shred_armor, amt)
    if names & GEAR_FIRST_HIT_FREE:
        c.first_hit_prevented = True
    if names & GEAR_DELETE_ON_KILL:
        c.delete_on_kill = True
    if ui.charges.get('Holographic Decoys', 0) > 0:
        ui.charges['Holographic Decoys'] -= 1
        c.first_hit_prevented = True

def apply_event_round_effect(event):
    """Round Effect column -- ongoing for the round while this Event is active. Covers the
    mechanically tractable subset (resource conversions, flat boosts); board-wide stun/equip-type
    restrictions and location-disabling effects have no clean hook in this combat model yet."""
    name = event['Event name']
    if name == 'Cheap Knockoffs':
        for p in players:
            p.res['Tech'] += p.res['Organic'] + p.res['Alien']
            p.res['Organic'] = p.res['Alien'] = 0
    elif name == 'Food Shortage':
        for p in players:
            p.res['Organic'] += p.res['Tech'] + p.res['Alien']
            p.res['Tech'] = p.res['Alien'] = 0
    elif name == 'Tax Fault':
        for p in players:
            for r in ('Organic','Tech','Alien'):
                p.res[r] //= 2

def apply_event_resolution(event, passed, commander):
    """Completion Reward / Failure Penalty -- covers the clearest, most mechanically tractable
    effects; the underlying pass/fail roll stays the established flat 55% rate."""
    name = event['Event name']
    w = weakest_player()
    if passed:
        if name in ('Cheap Knockoffs', 'Food Shortage') or 'all players gain' in event.get('Completion Reward','').lower():
            txt = event.get('Completion Reward','').lower()
            m_n = re.search(r'gain (\d+)', txt)
            n = int(m_n.group(1)) if m_n else 1
            res = 'Tech' if 'tech' in txt else ('Organic' if 'organic' in txt else 'Alien')
            for p in players:
                p.res[res] += n
        elif name == 'Lead by example':
            for p in players:
                p.rank = min(len(RANK_ORDER), p.rank + 1)
        elif name == 'Chain of Command':
            promo = min(players, key=lambda p: p.rank)
            promo.rank = min(len(RANK_ORDER), promo.rank + 1)
        elif name in ('Command Requisition', 'Assigned Posts'):
            for _ in range(3):
                roll = random.randint(1, 6)
                res = ('Organic','Tech','Alien')[roll % 3]
                command_pool[res] += roll
        elif name == 'Stockpiled Reserves':
            pass  # covered generically by Mission's own Resource/Instant dispatch elsewhere
    else:
        if name == 'Lead by example':
            for p in players:
                p.rank = max(1, p.rank - 1)
        elif name == 'Chain of Command':
            demote = max(players, key=lambda p: p.rank)
            demote.rank = max(1, demote.rank - 1)
        elif name in ('Tax Fault', 'Cheap Knockoffs', 'Food Shortage') and w.res:
            pass  # cost-increase penalties have no shop-cost-modifier hook to apply against here

def secret_objective_met(so, p):
    """Checked once at game end. Uses the stats/state tracked through the round loop --
    falls back to False (not silently True) for anything without a clean tracked counter,
    since an unverifiable personal objective shouldn't be assumed complete."""
    name = so['Name']
    others = [q for q in players if q is not p]
    if name == 'Disruptor': return p.stats['events_failed'] >= 3
    if name == 'Slacker': return p.stats['missions_completed'] < 5
    if name == 'Corrupt Logistics': return False  # no gear-discard tracking exists
    if name == 'Martyr': return p.stats['deaths'] >= 20
    if name == 'Misdirector': return False  # "between these losses" sequencing not tracked
    if name == 'Butcher': return p.stats['heals_given'] == 0
    if name == 'Trojan': return (OVERRUN_START[DIFFICULTY] - overrun_tracker_min) >= 5
    if name == 'Usurper': return False  # no "steal Command" event exists in this sim's commander model
    if name == 'Dictator': return p.stats['commander_rounds'] >= 5
    if name == 'Ghost': return p.rank == min(q.rank for q in players)
    if name == 'Incompetence': return overrun_drops_by_commander.get(p.name, 0) >= 3
    if name == 'Problem Solver': return p.stats['events_passed'] >= 5
    if name == 'Adventurer': return p.stats['missions_completed'] >= 6
    if name == 'Armorer': return False  # "equip to allies' lanes" not distinguished from own-lane equips
    if name == 'Enforcer': return p.stats['kills'] >= 10
    if name == 'The Wall': return p.stats['overruns_suffered'] == 0
    if name == 'Medic': return p.stats['heals_given'] * 10 > 30  # approximating 10HP/heal-action
    if name == 'Stubborn': return (OVERRUN_START[DIFFICULTY] - overrun_tracker_min) <= 5
    if name == 'Conductor': return False
    if name == 'Leader': return p.stats['commander_rounds'] >= 5
    if name == 'Tactician': return False  # progress-while-commander not separately tracked
    if name == 'High Command': return p.rank == max(q.rank for q in players)
    if name == 'Decorated': return p.rank >= 5
    if name == 'Interdictor': return False
    if name == 'Hoarder': return p.res['Organic'] >= 40
    if name == 'Nerd': return p.res['Tech'] >= 40
    if name == 'Collector': return p.res['Alien'] >= 20
    if name == 'Chef': return p.stats['donations_made'] >= 10  # donations_made already tracks Organic-weighted totals approx
    if name == 'Technician': return p.stats['donations_made'] >= 10
    if name == 'Scientist': return p.stats['donations_made'] >= 5
    if name == 'Middleman': return min(q.rank for q in others or [p]) < p.rank < max(q.rank for q in others or [p])
    if name == 'Exporter': return p.stats['units_retired'] >= 5
    if name == 'Advisor': return p.stats['commander_rounds'] == 0
    if name == 'Hunter': return False
    if name == 'Architect': return sum(1 for loc in LOCATIONS if len(location_upgrades_built[loc]) >= UPGRADE_SLOT_CAP[loc]) >= 3
    if name == 'Minimalist': return sum(UPGRADE_SLOT_CAP[loc] - len(location_upgrades_built[loc]) for loc in LOCATIONS) >= 3
    if name == 'Survivor': return False  # consecutive-round survival not tracked per-unit
    if name == 'Deus Machina': return p.stats.get('secret_objective_complete') == 'Deus Machina'
    if name == 'AFK': return False
    if name == 'Leroy': return False
    if name == 'Kremlen': return False
    return False

def check_secret_objectives():
    print("\n=== Secret Objectives ===")
    for p in players:
        for so in p.secret_objectives:
            if secret_objective_met(so, p):
                print(f"  {p.name} completes [{so['Alignment']}] {so['Name']}")

def mission_requirement_met(m, p):
    """Keyword-match the Requirement text against tracked stats/state. Falls back to True
    (the prior behavior: any held mission is completable) for requirement text not recognized
    here -- this only ever ADDS gating, never removes the chance to complete a mission."""
    req = m.get('Requirement', '').lower()
    if 'donate' in req:
        return p.stats['donations_made'] >= 5
    if 'kill' in req:
        m_n = re.search(r'kill (\d+)', req)
        return p.stats['kills'] >= (int(m_n.group(1)) if m_n else 1)
    if 'heal' in req:
        return p.stats['heals_given'] >= 1
    if 'equip' in req:
        return p.stats['gear_equipped'] >= 1
    if 'overrun' in req:
        return p.stats['overruns_suffered'] >= 1
    if 'command has over' in req:
        m_n = re.search(r'over (\d+)', req)
        return sum(command_pool.values()) >= (int(m_n.group(1)) if m_n else 40)
    if 'own unit of rank' in req:
        owned = ([p.active] if p.active else []) + list(p.reserve)
        return any(True for ui in owned)  # any owned unit -- exact rank-text parsing not worth it here
    if 'fully upgrade' in req:
        for loc in LOCATIONS:
            if loc.lower() in req:
                return len(location_upgrades_built[loc]) >= UPGRADE_SLOT_CAP[loc]
    if 'deploy your worker to' in req:
        for loc in LOCATIONS:
            if loc.lower() in req:
                return loc in placements.get(p.name, [])
    return True

def apply_mission_reward(m, p):
    """Resource field ("Gain +N All resources" / "+N Organic" etc.) plus a small dispatch
    for the most common, mechanically clear Instant effects."""
    res_text = m.get('Resource', '')
    m_n = re.search(r'\+(\d+)', res_text)
    amt = int(m_n.group(1)) if m_n else 1
    if 'all resources' in res_text.lower():
        for r in ('Organic','Tech','Alien'):
            p.res[r] += amt
    elif 'organic' in res_text.lower():
        p.res['Organic'] += amt
    elif 'tech' in res_text.lower():
        p.res['Tech'] += amt
    elif 'alien' in res_text.lower():
        p.res['Alien'] += amt

    instant = m.get('Instant', '').lower()
    if 'each player gains' in instant:
        m_n2 = re.search(r'gains (\d+) (\w+)', instant)
        if m_n2:
            n, res = int(m_n2.group(1)), m_n2.group(2).capitalize()
            res = 'Organic' if res.startswith('Organ') else ('Tech' if res.startswith('Tech') else 'Alien')
            for q in players:
                q.res[res] += n
    elif 'add' in instant and 'command' in instant:
        m_n2 = re.search(r'add (\d+)', instant)
        if m_n2:
            n = int(m_n2.group(1))
            for r in ('Organic','Tech','Alien'):
                command_pool[r] += n
    elif 'free unit' in instant or 'next unit is free' in instant or 'next equip' in instant or 'next item is free' in instant or 'next gear item is free' in instant:
        p.res['Organic'] += 5; p.res['Tech'] += 5; p.res['Alien'] += 2  # flat approximation of a free purchase

def try_chronostasis_save(p, ui):
    """Chronostasis Passive: destroy the item to fully heal and remove the unit from this
    round's combat instead of dying. Called at every point a unit would otherwise die."""
    if any(g.get('Name') == 'Chronostasis' for g in ui.equipped) and can_use_effect(f'Chronostasis-{id(ui)}', 1):
        record_effect_use(f'Chronostasis-{id(ui)}')
        ui.equipped = [g for g in ui.equipped if g.get('Name') != 'Chronostasis']
        ui.cur_hp = ui.max_hp
        print(f"  [Chronostasis] {p.name}'s {ui.name} is saved from death and pulled out of this round's combat")
        return True
    return False

def apply_gear_active(name, ui, p):
    """Active Effects for equipped Gear -- usable once per round, costs the item's Purchase
    Cost again (handled by the caller) except Consumables, which are exempt and self-destruct."""
    w = weakest_player()
    other = next((q for q in players if q is not p), p)
    if name == 'Combat Stims':
        dmg = min(10, ui.cur_hp - 1) if ui.cur_hp > 1 else 0
        ui.cur_hp -= dmg
        temp_buff(ui, Damage=dmg * 2)
    elif name in ('Grenade Launcher', 'Scoped Weapons', 'Black Iron'):
        if w.lane_enemy_reserve:
            w.lane_enemy_reserve = w.lane_enemy_reserve[1:]
    elif name == 'Grenades':
        w.lane_enemy_reserve = [e for e in w.lane_enemy_reserve if to_int(e.get('HP')) > 5]
    elif name == 'Scouting Drones':
        p.res['Organic'] += 2; p.res['Tech'] += 2; p.res['Alien'] += 2
    elif name == 'Basic Exo':
        if ui in ([p.active] if p.active else []) + p.reserve:
            if p.active is ui: p.active = p.reserve[0] if p.reserve else None
            else: p.reserve.remove(ui)
            if p.active is None and p is not w: p.active = ui
            else: w.reserve.append(ui)
    elif name in ('Basic Medkit', 'Medkit', 'Field Medkit', 'Triage Pack'):
        targets = [u for u in (([w.active] if w.active else []) + list(w.reserve)) if u.cur_hp < u.max_hp]
        if targets:
            t = min(targets, key=lambda u: u.cur_hp - u.max_hp)
            if heal_unit(t, t.max_hp // 2 + 1):
                w.stats['heals_given'] += 1
    elif name in ('Landmines', 'Artillery Strike', 'Bomber Drone', 'Slayer Suit'):
        w.lane_enemy_reserve = [e for e in w.lane_enemy_reserve if to_int(e.get('HP')) > 10]
    elif name == 'Toxin Rounds':
        for q in players:
            q.lane_enemy_reserve = [e for e in q.lane_enemy_reserve if to_int(e.get('HP')) > q.rank * 3]
    elif name == 'Shield Pack':
        ui.cur_shields += 20
        ui.equipped = [g for g in ui.equipped if g.get('Name') != 'Shield Pack']
    elif name == 'Chem Strike':
        w.lane_enemy_reserve = [e for e in w.lane_enemy_reserve if to_int(e.get('HP')) > 10]
    elif name == 'Entrenchment':
        if w.active:
            temp_buff(w.active, Armor=5)
    elif name == 'Stun Grenades':
        target = max(players, key=lambda q: len(q.lane_enemy_reserve))
        if target.lane_enemy_reserve:
            target.lane_enemy_reserve = target.lane_enemy_reserve[1:]
    elif name == 'Deployable Sentry':
        if w.active:
            temp_buff(w.active, Damage=5)
    elif name == 'Heavy Sentry':
        if w.active:
            temp_buff(w.active, Damage=7)
    elif name == 'Reactive Plating':
        w.lane_enemy_reserve = [e for e in w.lane_enemy_reserve if to_int(e.get('HP')) > 15]
    elif name == 'Isolation Field':
        if w.lane_enemy_reserve:
            w.lane_enemy_reserve = w.lane_enemy_reserve[:1]
    elif name == 'Railgun Tech':
        cap = to_int(ui.card.get('Damage'))
        for q in players:
            q.lane_enemy_reserve = [e for e in q.lane_enemy_reserve if to_int(e.get('HP')) > cap]
    elif name == 'Regen Plates':
        heal_unit(ui)
    elif name == 'Repair Kit':
        candidates = [u for u in (([w.active] if w.active else []) + list(w.reserve))
                      if u.cur_hp < u.max_hp and ('Vehicle' in u.card.get('Type','') or 'Mech' in u.card.get('Type',''))]
        if candidates:
            t = min(candidates, key=lambda u: u.cur_hp - u.max_hp)
            if heal_unit(t, t.max_hp // 2):
                w.stats['heals_given'] += 1
    elif name == 'Stasis Suit':
        ui.equipped = [g for g in ui.equipped if g.get('Name') != 'Stasis Suit']
        p.res['Organic'] += 2
    elif name == 'Apocalypse Rounds':
        temp_buff(ui, Damage=to_int(ui.card.get('Damage')))
    elif name == 'Emergency Extractor':
        if ui.cur_hp < ui.max_hp // 2:
            owner_units = ([p.active] if p.active else []) + list(p.reserve)
            if ui in owner_units:
                if p.active is ui: p.active = p.reserve[0] if p.reserve else None
                elif ui in p.reserve: p.reserve.remove(ui)
                else: p.reserve = [u for u in p.reserve if u is not ui]
                p.gear_hand.extend(g for g in ui.equipped if 'Name' in g)  # real gear only, not temp_buff's synthetic stat dicts
    elif name == 'Nanite Tech':
        if w.active and w.active is not ui:
            owner_units = ([p.active] if p.active else []) + list(p.reserve)
            if ui in owner_units and 'Nanite Tech' in {g.get('Name') for g in ui.equipped}:
                ui.equipped = [g for g in ui.equipped if g.get('Name') != 'Nanite Tech']
                w.active.equipped.append({'Name': 'Nanite Tech', 'Damage': 0, 'HP': 0, 'Armor': 0, 'Shields': 0})
    elif name == 'Shield Generator':
        if w.active:
            w.active.cur_shields += 20
    elif name == 'Exosuit':
        if other.active and p.active and other.active is not p.active:
            p.active, other.active = other.active, p.active
    elif name == 'Quantum Plates':
        temp_buff(ui, Damage=1)
    elif name == 'Shadow Tech':
        if w.lane_enemy_reserve:
            w.lane_enemy_reserve = w.lane_enemy_reserve[1:]
    # Expanded Backpack, Resupply Drone, Smoke Launcher, Night Vision, Reanimator: no clean
    # mechanical hook (cooldown/scouting/status-effect subsystems don't exist yet) -- flavor no-ops.

def compute_dealt(attacker, defender):
    if attacker.dmg <= 0:
        return 0
    if defender.first_hit_prevented:
        defender.first_hit_prevented = False
        return 0
    effective_armor = 0 if attacker.ignore_armor else defender.armor
    if attacker.shred_armor and defender.armor > 0:
        shred = min(attacker.shred_armor, defender.armor)
        defender.armor -= shred
    dealt = max(1, attacker.dmg - effective_armor)
    if defender.cur_shields > 0:
        shield_dmg = dealt * attacker.shield_multiplier
        absorbed = min(defender.cur_shields, shield_dmg)
        defender.cur_shields -= absorbed
        dealt -= absorbed // attacker.shield_multiplier
    dealt = max(0, dealt)
    if defender.reflect_fraction:
        reflected = int(dealt * defender.reflect_fraction)
        attacker.cur_hp -= reflected
    if attacker.lifesteal_fraction:
        attacker.cur_hp = min(attacker.hp, attacker.cur_hp + int(dealt * attacker.lifesteal_fraction))
    return dealt

def resolve_lane_combat(player_combatants, enemy_combatants):
    """Default (README #33): the enemy's Active card deals damage first each exchange --
    resolving completely, including killing its target outright, before the player's unit ever
    responds -- unless that unit has .attacks_first (an "Attacks 1st" ability), which flips
    priority to the player instead."""
    pq = list(player_combatants)
    eq = list(enemy_combatants)
    while pq and eq:
        p, e = pq[0], eq[0]
        if getattr(p, 'attacks_first', False):
            e.cur_hp -= compute_dealt(p, e)
            if e.cur_hp <= 0:
                eq.pop(0)
                continue
            p.cur_hp -= compute_dealt(e, p)
        else:
            p.cur_hp -= compute_dealt(e, p)
            if p.cur_hp <= 0:
                pq.pop(0)
                continue
            e.cur_hp -= compute_dealt(p, e)
        if p.cur_hp <= 0:
            pq.pop(0)
        if e.cur_hp <= 0:
            eq.pop(0)
    overrun = len(eq) > 0
    return overrun, pq, eq

def can_afford(res, card, keys):
    return all(res[k.split(' ')[0]] >= to_int(card.get(k,0)) for k in keys)

def pay(res, card, keys):
    for k in keys:
        res[k.split(' ')[0]] -= to_int(card.get(k,0))

UNIT_COST_KEYS = ('Organic Cost','Tech Cost','Alien Cost')
GEAR_COST_KEYS = ('Organic Cost','Tech Cost','Alien Cost')

def tactician_discounted_cost(p, card, kind):
    """Returns a cost-adjusted copy of card for affordability/payment purposes -- covers the
    clearest, most mechanically tractable Tactician Resource effects (shop cost reductions).
    The remaining roles (The Tactician, Kingmaker, Jailer, Reclaimer, Pathfinder, Breaker,
    Bastion, Chessmaster, Quartermaster) have no clean hook in this economy/combat model yet."""
    t = p.tactician
    if not t:
        return card
    name = t['Name']
    c = dict(card)
    ctype = card.get('Type', '')
    rank = RANK_NUM.get(card.get('Rank') or card.get('Rank Name'), 0)
    if kind == 'gear':
        if name == 'The Gunsmith' and ctype == 'Weapon':
            c['Tech Cost'] = max(0, to_int(c.get('Tech Cost')) - 1)
        elif name == 'The Bulwark' and ctype == 'Armor':
            c['Tech Cost'] = max(0, to_int(c.get('Tech Cost')) - 1)
        elif name == 'The Engineer' and ctype == 'Utility':
            c['Tech Cost'] = max(0, to_int(c.get('Tech Cost')) - 2)
    elif kind == 'unit':
        if name == 'The Drillmaster' and rank < 5:
            c['Alien Cost'] = 0
        elif name == 'The Specialist' and rank > 4:
            c['Alien Cost'] = to_int(c.get('Alien Cost')) // 2
        elif name == 'The Driver' and 'Vehicle' in ctype:
            c['Tech Cost'] = to_int(c.get('Tech Cost')) // 2
            c['Organic Cost'] = to_int(c.get('Organic Cost')) // 2
        elif name == 'The Recruiter' and 'Infantry' in ctype:
            c['Organic Cost'] = to_int(c.get('Organic Cost')) // 2
        elif name == 'The Pilot' and 'Mech' in ctype:
            c['Tech Cost'] = to_int(c.get('Tech Cost')) // 2
    return c

def unit_power(u):
    """Power of a raw shop-card dict (not yet owned) -- used for shop comparisons."""
    return to_int(u.get('Damage',0)) + to_int(u.get('HP',0)) + 2*to_int(u.get('Armor',0)) + to_int(u.get('Shields',0))

def instance_power(ui):
    """Power of an owned UnitInstance -- reflects current (possibly damaged) HP/Shields plus equipped gear."""
    card = ui.card
    return (to_int(card.get('Damage',0)) + ui.equipped_bonus('Damage')
            + ui.cur_hp + 2*to_int(card.get('Armor',0)) + ui.equipped_bonus('Armor')
            + ui.cur_shields)

def heal_unit(ui, amount=None):
    """Restore HP (default: to full). The only way HP recovers -- it does not auto-reset each round."""
    if amount is None:
        healed = ui.max_hp - ui.cur_hp
        ui.cur_hp = ui.max_hp
    else:
        healed = min(amount, ui.max_hp - ui.cur_hp)
        ui.cur_hp += healed
    return healed

def reorder_active(p):
    """Reassign Units (Deployment Stage): always put the strongest unit Active."""
    p_units = ([p.active] if p.active else []) + list(p.reserve)
    if not p_units:
        return
    p_units.sort(key=instance_power, reverse=True)
    p.active = p_units[0]
    p.reserve = p_units[1:]

TARGET_RULES = {
    'Lowest HP': lambda pool: min(pool, key=lambda ui: ui.cur_hp),
    'Highest HP': lambda pool: max(pool, key=lambda ui: ui.cur_hp),
    'Lowest Rank': lambda pool: min(pool, key=lambda ui: RANK_NUM[ui.card['Rank']]),
    'Most Gear': lambda pool: max(pool, key=lambda ui: len(ui.equipped)),
    'Least Gear': lambda pool: min(pool, key=lambda ui: len(ui.equipped)),
    'Most Shields Lost': lambda pool: max(pool, key=lambda ui: to_int(ui.card.get('Shields')) - ui.cur_shields),
    'Most Armor Lost': lambda pool: max(pool, key=lambda ui: 0),  # armor isn't a depleting pool in this model
    'Roll Dice': lambda pool: random.choice(pool),
}

def pick_target(pool, rule):
    """Generic enemy/boss targeting resolver shared by Enemy Stats' and Boss Stats' Targeting columns."""
    pool = list(pool)
    if not pool:
        return None
    fn = TARGET_RULES.get(rule, random.choice)
    return fn(pool)

def on_reveal(enemy_card, p, all_players):
    """Dispatch hook for Enemy Stats' Reveal-column effects."""
    apply_enemy_reveal(enemy_card, p, all_players)

def apply_boss_passive(boss_active, target):
    """The Boss Passive column -- 'Passive is activated' at T1 means it's on for the boss's
    whole lifetime once spawned. Covers the mechanically tractable subset; the rest (graveyard
    merging, damage-spreading across the team, etc.) have no clean hook in this combat model."""
    name = boss_active['card']['Name']
    if name == 'Plasma Channeler' and target.active:
        target.active.cur_shields = 0
    elif name == 'Rust Elemental' and target.active:
        target.active.card = dict(target.active.card)  # avoid mutating the shared CSV row
    elif name == 'Plate Host':
        boss_active['armor_bonus'] = boss_active.get('armor_bonus', 0) or 1
    elif name == 'The Culling' and target.active:
        pass  # 'delete lower-rank units' has no rank-distinct enemy deletion to hook into here

def apply_boss_tier(boss_active, tier):
    """T1-T5 escalation. Tier is a LIVE lookup (recalculated every round), but each tier's
    stat boost is a one-time, permanent gain for that boss's lifetime once first reached --
    not reapplied every round it stays at that tier, which would runaway-stack '+5 Attack'."""
    reached = boss_active.setdefault('tier_reached', 0)
    if tier <= reached:
        return
    card = boss_active['card']
    for t in range(reached + 1, tier + 1):
        text = card.get(f'T{t}Boss', '') or ''
        for amt, stat in re.findall(r'\+(\d+)\s*(Attack|Health|Shields|Armor)', text):
            amt = int(amt)
            if stat == 'Attack':
                boss_active['dmg_bonus'] = boss_active.get('dmg_bonus', 0) + amt
            elif stat == 'Health':
                boss_active['hp_cur'] += amt
            elif stat == 'Shields':
                boss_active['shield_bonus'] = boss_active.get('shield_bonus', 0) + amt
            elif stat == 'Armor':
                boss_active['armor_bonus'] = boss_active.get('armor_bonus', 0) + amt
        if 'heals 5 health on kill' in text.lower():
            boss_active['heals_on_kill'] = 5
    boss_active['tier_reached'] = tier

def weakest_player(pool=None):
    pool = pool or players
    def lp(q):
        return sum(instance_power(u) for u in (([q.active] if q.active else []) + list(q.reserve)))
    return min(pool, key=lp)

def strongest_player(pool=None):
    pool = pool or players
    def lp(q):
        return sum(instance_power(u) for u in (([q.active] if q.active else []) + list(q.reserve)))
    return max(pool, key=lp)

TEMP_BUFFS = []   # (UnitInstance, buff_dict) -- stripped from .equipped at Cleanup
TEMP_UNITS = []   # (Player, UnitInstance) -- removed from active/reserve at Cleanup if still present

def temp_buff(ui, **stats):
    """Apply a one-round-only stat buff to a unit (Combat Stims, Barrier Systems, etc.) without
    mutating the shared CSV card dict -- a synthetic dict in .equipped, stripped at Cleanup."""
    buff = dict(stats)
    ui.equipped.append(buff)
    if 'HP' in stats:
        ui.max_hp += stats['HP']; ui.cur_hp += stats['HP']
    if 'Shields' in stats:
        ui.cur_shields += stats['Shields']
    TEMP_BUFFS.append((ui, buff))

def make_temp_card(name, damage=0, hp=1, armor=0, shields=0):
    return {'Name': name, 'Rank': 'Conscript', 'Damage': damage, 'HP': hp, 'Armor': armor, 'Shields': shields,
            'Organic Cost':0,'Tech Cost':0,'Alien Cost':0}

def add_temp_unit(p, ui):
    if p.active is None:
        p.active = ui
    else:
        p.reserve.append(ui)
    TEMP_UNITS.append((p, ui))

def clear_round_temp_state():
    for ui, buff in TEMP_BUFFS:
        if buff in ui.equipped:
            ui.equipped.remove(buff)
    TEMP_BUFFS.clear()
    for p, ui in TEMP_UNITS:
        if p.active is ui:
            p.active = p.reserve[0] if p.reserve else None
            p.reserve = p.reserve[1:] if len(p.reserve) > 1 else []
        elif ui in p.reserve:
            p.reserve.remove(ui)
    TEMP_UNITS.clear()

HOARD_REDUCTION = {}              # player -> int, consumed when hoards are dealt this round
HALF_OVERRUN_DAMAGE = [False]     # mutable single-slot flag (Forward Command)
HALF_REVEAL_DAMAGE = [False]      # mutable single-slot flag (Early Warning Network Active, README #42)
CANNOT_DIE = set()                # UnitInstance ids that survive at 1 HP instead of dying this round

def apply_command_active(name, card, commander, loc):
    """Active Effects for Barracks/Armory/Containment Block/Medical Bay/Command cards.
    Battlefield cards are handled separately (apply_battlefield_active) since they need
    enemy hoards to already be dealt."""
    global vehicle_unlocked, mech_unlocked, player_progress, enemy_progress
    w = weakest_player()
    if name in ('Mech Station', 'Vehicle Bay'):
        locked_pool = [u for u in unit_deck_locked if RANK_NUM[u['Rank']] <= commander.rank]
        if locked_pool:
            u = random.choice(locked_pool); unit_deck_locked.remove(u)
            add_temp_unit_perm(commander, UnitInstance(u))
    elif name == 'Additional Bedding':
        pool = [u for u in unit_deck if RANK_NUM[u['Rank']] <= commander.rank]
        if pool:
            u = random.choice(pool); unit_deck.remove(u)
            add_temp_unit_perm(commander, UnitInstance(u))
    elif name == 'Conscription':
        pool = [u for u in unit_deck if RANK_NUM[u['Rank']] == 1]
        if pool:
            u = random.choice(pool); unit_deck.remove(u)
            add_temp_unit_perm(w, UnitInstance(u))
    elif name == 'Rapid Deployment':
        w.res['Organic'] += 3; w.res['Tech'] += 3
    elif name in ('Advanced Mechanized', 'AI advancements', 'Gene Modding', 'Ammo Stockpiles'):
        commander.res['Tech'] += 5
    elif name == 'Combined Arms':
        vehicle_unlocked = mech_unlocked = True
    elif name == 'Flash Sale':
        commander.res['Tech'] += 5
    elif name == 'Mad Science':
        commander.res['Alien'] += 3
    elif name == 'Experimental Science':
        for p in players:
            p.res['Alien'] *= 2
    elif name == 'Ethics Committee':
        commander.res['Alien'] += 5
    elif name == 'Containment Protocol':
        pool = enemy_by_rank.get(diff_rank, [])
        if pool:
            e = random.choice(pool)
            # Captured enemies fight as a unit but don't have a player Rank -- tag with the
            # lowest player Rank so Rank-based logic (Retire from Duty, shop gating) stays valid.
            captured = dict(e); captured['Rank'] = 'Conscript'
            add_temp_unit_perm(commander, UnitInstance(captured))
    elif name == 'Garrison':
        for p in players:
            pool = [u for u in unit_deck if RANK_NUM[u['Rank']] <= p.rank]
            if pool:
                u = random.choice(pool)
                add_temp_unit(p, UnitInstance(u))
    elif name == 'Tag Team':
        for p in players:
            if p.reserve:
                p.active, p.reserve[0] = p.reserve[0], p.active
    elif name == 'Combat Stims':
        if commander.active:
            commander.active.cur_hp = max(1, commander.active.cur_hp - 2)
            temp_buff(commander.active, Damage=4)
    elif name == 'Extraction':
        command_pool['Organic'] += 2; command_pool['Tech'] += 2; command_pool['Alien'] += 2
    elif name == 'Countermeasures':
        pass  # no enemy-ability subsystem yet to suppress (Section 4)
    elif name == 'Exploitation':
        if commander.active:
            if boss_active:
                boss_active['hp_cur'] -= 15
            commander.graveyard.append(commander.active)
            commander.stats['deaths'] += 1
            commander.active = commander.reserve[0] if commander.reserve else None
            commander.reserve = commander.reserve[1:] if len(commander.reserve) > 1 else []
    elif name == 'Necromancy':
        if w.graveyard:
            ui = w.graveyard.pop()
            ui.cur_hp = ui.max_hp
            add_temp_unit_perm(w, ui)
    elif name == 'Donor Organs':
        target = max((([w.active] if w.active else []) + list(w.reserve)), key=lambda ui: ui.max_hp-ui.cur_hp, default=None)
        if target:
            heal_unit(target); w.stats['heals_given'] += 1
    elif name == 'Ashes to Ashes':
        if commander.reserve:
            u = min(commander.reserve, key=instance_power)
            commander.reserve.remove(u)
            commander.graveyard.append(u)
            commander.res['Organic'] += to_int(u.card.get('Organic Cost'))
    elif name in ('Share Rooms', 'Battle Medics', 'We can Rebuild them'):
        for p in players:
            for ui in (([p.active] if p.active else []) + list(p.reserve)):
                if heal_unit(ui):
                    p.stats['heals_given'] += 1
    elif name == 'Increased Budget':
        for p in players:
            for ui in (([p.active] if p.active else []) + list(p.reserve)):
                if heal_unit(ui, (ui.max_hp - ui.cur_hp)//2):
                    p.stats['heals_given'] += 1
    elif name == 'Work Order':
        for p in players:
            if p.active:
                command_pool['Tech'] += 1
    elif name == 'Orders from Above':
        commander.res['Organic'] += 3; commander.res['Tech'] += 3; commander.res['Alien'] += 3
    elif name == 'Income Tax':
        for p in players:
            for res in ('Organic','Tech','Alien'):
                half = p.res[res]//2
                p.res[res] -= half
                command_pool[res] += half
    elif name == 'Request Aid':
        for res in ('Organic','Tech','Alien'):
            half = commander.res[res]//2
            commander.res[res] -= half
            command_pool[res] += half
    elif name in ('Priority Operations', 'Priority Construction'):
        command_pool['Tech'] += 5
    elif name == 'Take Credit':
        if commander.rank < len(RANK_ORDER):
            commander.rank += 1
            commander.stats['promotions_received'] += 1
    elif name == 'Pull Rank':
        if shop_units and commander.rank > max(RANK_NUM[u['Rank']] for u in shop_units):
            cheapest = min(shop_units, key=lambda u: RANK_NUM[u['Rank']])
            shop_units.remove(cheapest); refill_shop_unit(shop_units)
            add_temp_unit_perm(commander, UnitInstance(cheapest))
    elif name == 'Leader Speech':
        player_progress = min(10, player_progress + 1)
    elif name == 'Nuke':
        target = max(players, key=lambda p: len(p.lane_enemy_reserve))
        target.lane_enemy_reserve = []
        for ui in (([target.active] if target.active else []) + list(target.reserve)):
            target.graveyard.append(ui); target.stats['deaths'] += 1
        target.active = None; target.reserve = []
    elif name == 'Promotion':
        others = [p for p in players if p is not commander]
        if others:
            target = min(others, key=lambda p: p.rank)
            if target.rank < len(RANK_ORDER):
                target.rank += 1
                target.stats['promotions_received'] += 1
    elif name == 'Reinforcements':
        top2 = sorted(shop_units, key=lambda u: RANK_NUM[u['Rank']], reverse=True)[:2]
        for u in top2:
            add_temp_unit(commander, UnitInstance(u))
    elif name == 'Perfect information':
        HOARD_REDUCTION['__global__'] = HOARD_REDUCTION.get('__global__', 0) + 1
    elif name == 'Field Testing':
        target = w.active
        if target and shop_gear:
            g = max(shop_gear, key=lambda g: RANK_NUM[g['Rank Name']])
            shop_gear.remove(g); refill_shop_gear(shop_gear)
            target.equipped.append(g)
            target.max_hp += to_int(g.get('HP')); target.cur_hp += to_int(g.get('HP'))
            target.cur_shields += to_int(g.get('Shields'))
            w.stats['gear_equipped'] += 1
    elif name == 'Collaboration':
        for res in ('Organic','Tech','Alien'):
            give = min(3, command_pool[res])
            command_pool[res] -= give
            w.res[res] += give
    elif name == 'Scouting update':
        commander.res['Organic'] += 3; commander.res['Tech'] += 3; commander.res['Alien'] += 3
    elif name == 'Forward Command':
        HALF_OVERRUN_DAMAGE[0] = True
    elif name == 'Eradicator Cannon':
        HOARD_REDUCTION[w.name] = HOARD_REDUCTION.get(w.name, 0) + 1
    elif name == 'Strategic Withdrawal':
        enemy_progress = max(0, enemy_progress - 3)
        player_progress = max(0, player_progress - 1)
        print(f"  [Strategic Withdrawal] {commander.name} plays it: EnemyProg -3 -> {enemy_progress}/10, PlayerProg -1 -> {player_progress}/10")

def apply_passive_unlock(name):
    """Side effects of permanently building a given card's Passive Effect as a location Upgrade."""
    global vehicle_unlocked, mech_unlocked, medbay_slots, containment_slots, experimental_unlocked
    if name == 'Vehicle Bay': vehicle_unlocked = True
    if name == 'Mech Station': mech_unlocked = True
    if name == 'Combined Arms': vehicle_unlocked = mech_unlocked = True
    if name == 'Share Rooms': medbay_slots = 4
    if name == 'Containment Protocol': containment_slots = 2
    if name == 'Experimental Science': experimental_unlocked = True

def add_temp_unit_perm(p, ui):
    """Permanent recruit (not removed at Cleanup) -- distinguish from add_temp_unit's 'until end of turn' cards."""
    if p.active is None:
        p.active = ui
    else:
        p.reserve.append(ui)

def apply_battlefield_active(name, commander):
    """Battlefield Active Effects -- run after Deployment deals hoards, since most of these
    target 'active enemies' or 'a lane' and need the hoard to already exist."""
    w = weakest_player()
    if name == 'Air Strike' or name == 'Land Mines':
        w.lane_enemy_reserve = [e for e in w.lane_enemy_reserve if to_int(e.get('HP')) > 10]
    elif name == 'Defense Turrets':
        w.lane_enemy_reserve = [e for e in w.lane_enemy_reserve if to_int(e.get('HP')) > 15]
    elif name == 'Chemical Warfare':
        w.lane_enemy_reserve = w.lane_enemy_reserve[:1]
    elif name == 'You Shall Not Pass':
        if w.active:
            temp_buff(w.active, Damage=w.active.cur_hp)
    elif name == 'Suppression':
        pass  # no enemy-ability subsystem yet to suppress (Section 4)
    elif name == 'Early Warning Network':
        HALF_REVEAL_DAMAGE[0] = True  # README #42: halves multi-lane Reveal/Passive damage this round
    elif name == 'Barrier Systems':
        if w.active:
            temp_buff(w.active, Shields=10)
    elif name == 'Final Stand':
        if w.active:
            CANNOT_DIE.add(id(w.active))
    elif name == 'Covering Fire':
        if w.reserve:
            w.active, w.reserve[0] = w.reserve[0], w.active
    elif name == 'Whites of their eyes':
        if w.active:
            temp_buff(w.active, Damage=to_int(w.active.card.get('Damage')))
    elif name == 'Punch Through':
        if boss_active:
            boss_active['hp_cur'] -= 5
    elif name == 'Tranq rounds':
        if w.active:
            temp_buff(w.active, Armor=4)
    elif name == 'Bunkers':
        pass  # no enemy-ability subsystem yet (Section 4)
    elif name == 'Security Drones':
        for i, p in enumerate(players):
            for _ in range(2):
                add_temp_unit_perm(p, UnitInstance(make_temp_card('Drone', damage=1, hp=1)))

print("=== BEGINNING GAME ===\n")

round_num = -1
MAX_ROUNDS = 40

while True:
    round_num += 1
    if round_num > MAX_ROUNDS:
        print(f"\n--- SAFETY CAP: stopping after {MAX_ROUNDS} rounds (no resolution) ---")
        break

    is_prep_round = (round_num == 0)  # README #32: Round 0 -- full Planning/Deployment, no enemies/Combat at all
    commander = players[commander_idx]
    print(f"\n========== ROUND {round_num}{' (PREP, no enemies)' if is_prep_round else ''} | "
          f"Commander: {commander.name} (Rk{commander.rank}) | "
          f"PlayerProg {player_progress}/10 | EnemyProg {enemy_progress}/10 | Overrun {overrun_tracker}/20 ==========")

    # ---------------- PLANNING ----------------
    diff_count = hoard_count(DIFFICULTY, player_progress)
    diff_rank = enemy_rank_from_progress(enemy_progress)
    HOARD_REDUCTION.clear()
    HALF_OVERRUN_DAMAGE[0] = False
    HALF_REVEAL_DAMAGE[0] = False
    CANNOT_DIE.clear()

    if is_prep_round:
        print("  [Round 0] Prep round -- no Boss check, no enemy hoard, no Combat Stage.")
    elif boss_active is None:
        if boss_died_last_round:
            boss_died_last_round = False
            print(f"  [Boss check] Grace period -- a Boss died last round, none can spawn this round.")
        else:
            roll = random.randint(1,10)
            if roll <= enemy_progress:
                if not boss_deck:
                    boss_deck = list(bosses); random.shuffle(boss_deck)
                card = boss_deck.pop()
                boss_active = {'card': card, 'hp_cur': int(card['HP'])}
                print(f"  [BOSS SPAWN] Rolled {roll} <= EnemyProg {enemy_progress} -> {card['Name']} appears!")
            else:
                print(f"  [Boss check] Rolled {roll} > EnemyProg {enemy_progress} -> no boss this round.")
    else:
        tier = boss_tier_from_progress(enemy_progress)
        apply_boss_tier(boss_active, tier)
        print(f"  [Boss active] {boss_active['card']['Name']} at T{tier}, HP {boss_active['hp_cur']}/{boss_active['card']['HP']}")

    for p in players:
        if len(p.missions) < 3 and mission_deck:
            candidates = [m for m in mission_deck if RANK_NUM[m['Player Rank']] <= p.rank + 1]
            if candidates:
                m = random.choice(candidates)
                mission_deck.remove(m)
                p.missions.append(m)

    # Commander draws 2 Events and chooses 1 to be active this round (README #32: skipped on
    # Round 0 -- there's no Combat Stage for a Round Effect to apply to, nothing to resolve later).
    active_event = None
    if not is_prep_round:
        if not event_deck:
            event_deck = list(events); random.shuffle(event_deck)
        drawn = [event_deck.pop() for _ in range(min(2, len(event_deck)))]
        active_event = random.choice(drawn) if drawn else None
        for e in drawn:
            if e is not active_event:
                event_deck.insert(0, e)
        if active_event:
            print(f"  [Event] Active this round: {active_event['Event name']} -- {active_event['Round Effect']}")
            apply_event_round_effect(active_event)

    # Each player has 2 Worker Tokens (3 once Rank 4/Captain+); commander gets +1 for the round --
    # a real, freely-placeable token like any other, not a forced Command placement.
    def worker_count(p):
        return 3 if p.rank >= 4 else 2
    remaining_workers = {p.name: worker_count(p) for p in players}
    remaining_workers[commander.name] += 1
    placements = {p.name: [] for p in players}

    # Pool every worker and assign by priority: Barracks (up to 2, both full income per the
    # 4-player rule), Command, Containment Block, Armory, Battlefield, then Medical Bay --
    # instead of the old 1-worker-per-location-only model.
    pool = []
    for p in players:
        pool.extend([p] * remaining_workers[p.name])
    random.shuffle(pool)
    priority = ['Barracks','Barracks','Command','Containment Block','Armory','Battlefield','Medical Bay']
    loc_workers = {loc: [] for loc in LOCATIONS}
    for i, p in enumerate(pool):
        loc = priority[i] if i < len(priority) else random.choice(LOCATIONS)
        loc_workers[loc].append(p)
        placements[p.name].append(loc)

    for loc, workers in loc_workers.items():
        for idx, p in enumerate(workers):
            full = idx < 2  # 4-player rule: first TWO workers at a shared location both earn full income
            if loc == 'Barracks':
                total_rank = sum(RANK_NUM[u['Rank']] for u in shop_units) + (4-len(shop_units))
                amt = total_rank if full else total_rank // 2
                p.res['Organic'] += amt
                p.res['Tech'] += amt // 2
            elif loc == 'Armory':
                total_rank = sum(RANK_NUM[g['Rank Name']] for g in shop_gear) + (2-len(shop_gear))
                amt = (total_rank * 2) if full else (total_rank * 2) // 2
                p.res['Tech'] += amt
                p.res['Organic'] += amt // 2
            elif loc == 'Medical Bay':
                p.res['Organic'] += (1 if full else 0)  # floor
                wounded = [ui for ui in (([p.active] if p.active else []) + list(p.reserve)) if ui.cur_hp < ui.max_hp]
                is_doctor = bool(p.tactician and p.tactician['Name'] == 'The Doctor')
                targets_per_worker = 2 if is_doctor else 1  # 'Medical bay heals double' when your workers are there
                for target in wounded[:targets_per_worker]:
                    healed = heal_unit(target)
                    if healed:
                        p.res['Organic'] += 2 + (p.rank if is_doctor else 0)  # 2 per slot healed, +Rank for The Doctor
                        p.stats['heals_given'] += 1
                        print(f"  {p.name} heals {target.name} at Medical Bay (+{healed} HP)")
            elif loc == 'Containment Block':
                contained_rank = sum(ENEMY_RANK_NUM[r] for r in contained_enemies)
                amt = (contained_rank + 1) if full else (contained_rank + 1) // 2
                p.res['Alien'] += amt
            elif loc == 'Battlefield':
                for res in ('Organic','Tech'):
                    command_pool[res] += (1 if full else 0)
                command_pool['Alien'] += (2 if full else 1)  # buffed: Alien's weakest base location, no upgrade required
            elif loc == 'Command':  # extra workers beyond the 1st: "resources of choice = Rank, per worker"
                p.res['Alien'] += (p.rank if full else p.rank // 2)

    ensure_lowest_rank_unit(shop_units)
    ensure_lowest_rank_gear(shop_gear)

    # Catch-up Resupply: a player whose lane was overrun LAST round gets a flat resource bonus this
    # round, enough to comfortably afford a low-rank unit (Conscript units cost ~1 Organic) -- a
    # self-correcting mechanic instead of relying on teammates noticing and donating.
    for p in players:
        if p.overrun_last_round:
            p.res['Organic'] += 3
            p.res['Tech'] += 3
            p.res['Alien'] += 2
            print(f"  [Catch-up Resupply] {p.name} (overrun last round) gets +3 Organic +3 Tech +2 Alien")

    # Retire from Duty: dump obsolete units (2+ ranks below current) back to the shop deck for a partial refund.
    # Excludes temp/synthetic cards (e.g. Security Drones' Drone tokens, made via make_temp_card)
    # -- they have no 'Type' or real cost fields, so they're not real shop-deck cards to recycle.
    for p in players:
        obsolete = [u for u in p.reserve if 'Type' in u.card and p.rank - RANK_NUM[u.card['Rank']] >= 2]
        for u in obsolete:
            p.reserve.remove(u)
            refund_keys = ['Organic Cost','Tech Cost','Alien Cost']
            biggest = max(refund_keys, key=lambda k: to_int(u.card.get(k,0)))
            p.res[biggest.split(' ')[0]] += to_int(u.card.get(biggest,0))
            unit_deck.append(u.card)
            p.gear_hand.extend(g for g in u.equipped if 'Rank Name' in g)  # real gear returns to hand; synthetic gear (e.g. Nanite Tech's transfer token) is dropped, it has no shop identity to re-equip
            p.stats['units_retired'] += 1
            print(f"  {p.name} retires {u.name} (Rank {u.card['Rank']}) for a partial refund"
                  + (f", {len(u.equipped)} gear item(s) returned to hand" if u.equipped else ""))

    for p in players:
        bought = 0
        while bought < 2:
            affordable = [u for u in shop_units if RANK_NUM[u['Rank']] <= p.rank
                          and can_afford(p.res, tactician_discounted_cost(p, u, 'unit'), UNIT_COST_KEYS)]
            if not affordable:
                break
            # Prioritize Saboteur Cell on sight -- it's the team's only unit-side Enemy Progress counterplay.
            sabo = next((u for u in affordable if u['Name'] == 'Saboteur Cell'), None)
            choice = sabo or max(affordable, key=lambda u: RANK_NUM[u['Rank']])
            pay(p.res, tactician_discounted_cost(p, choice, 'unit'), UNIT_COST_KEYS)
            shop_units.remove(choice)
            refill_shop_unit(shop_units)
            ui = UnitInstance(choice)
            if 'Scout' in choice.get('Type', ''):
                team_scout_pool.append(ui)  # Scout-type units occupy the shared scout slot, not a combat slot
                print(f"  {p.name} donates {ui.name} to the team scout pool")
            elif p.active is None:
                p.active = ui
            else:
                p.reserve.append(ui)
            bought += 1
        # README #38: equipping gear (including re-equipping it elsewhere) costs Tech = the gear's
        # own Rank number, paid each time, on top of the existing once-per-round Activation cost --
        # a deliberate partial reversal of the earlier "equipping is always free" rework, since that
        # left Tech with no real sink. If a player can't afford it, the item just stays in hand
        # unequipped rather than being lost.
        def equip_onto_active(p, g):
            cost = RANK_NUM.get(g.get('Rank Name'), 1)  # synthetic gear (e.g. Nanite Tech's transfer
                                                          # token) has no real Rank -- treat as cheapest
            if p.res['Tech'] < cost:
                p.gear_hand.append(g)
                print(f"  {p.name} can't afford {cost} Tech to equip {g['Name']} -- held in hand")
                return False
            p.res['Tech'] -= cost
            p.active.equipped.append(g)
            hp_bonus = to_int(g.get('HP', 0))
            p.active.max_hp += hp_bonus
            p.active.cur_hp += hp_bonus
            p.active.cur_shields += to_int(g.get('Shields', 0))
            p.stats['gear_equipped'] += 1
            if g['Name'] == 'Recon Satellite':
                p.has_recon_satellite = True
            if g['Name'] == 'Last Stand Beacon':
                p.has_last_stand_beacon = True
            print(f"  {p.name} equips {g['Name']} (Tech -{cost}) (Dmg+{to_int(g.get('Damage',0))} HP+{to_int(g.get('HP',0))} "
                  f"Arm+{to_int(g.get('Armor',0))} Shd+{to_int(g.get('Shields',0))})")
            return True

        # Re-equip from gear_hand first (e.g. salvaged off a retired unit) before spending resources
        # on new gear from the shop -- the item purchase itself is free, only the Tech equip cost applies.
        pending_hand = list(p.gear_hand)
        p.gear_hand = []
        for g in pending_hand:
            if p.active:
                equip_onto_active(p, g)
            else:
                p.gear_hand.append(g)
        # Gear: bought whenever affordable, accumulates on the PLAYER, applied to whichever unit is
        # active at combat time -- not baked into one unit dict.
        gear_bought_this_round = 0
        while p.active and gear_bought_this_round < 2:
            affordable_g = [g for g in shop_gear if RANK_NUM[g['Rank Name']] <= p.rank
                            and can_afford(p.res, tactician_discounted_cost(p, g, 'gear'), GEAR_COST_KEYS)]
            if not affordable_g:
                break
            # Prioritize the Overrun/Enemy-Progress counterplay Gear on sight, same reasoning as Saboteur Cell.
            priority_gear = next((g for g in affordable_g if g['Name'] in ('Recon Satellite','Last Stand Beacon')
                                   and not (g['Name']=='Recon Satellite' and p.has_recon_satellite)
                                   and not (g['Name']=='Last Stand Beacon' and p.has_last_stand_beacon)), None)
            g = priority_gear or max(affordable_g, key=lambda g: RANK_NUM[g['Rank Name']])
            pay(p.res, tactician_discounted_cost(p, g, 'gear'), GEAR_COST_KEYS)
            shop_gear.remove(g)
            refill_shop_gear(shop_gear)
            equip_onto_active(p, g)
            gear_bought_this_round += 1
        reorder_active(p)  # Reassign Units: always fight with the strongest unit Active

    commander.stats['commander_rounds'] += 1
    for p in players:
        if p is not commander:
            for res in ('Organic','Tech','Alien'):
                donate = p.res[res] // 3
                p.res[res] -= donate
                command_pool[res] += donate
                if donate:
                    p.stats['donations_made'] += donate

    EFFECT_CAPS = {'Strategic Withdrawal': 1}  # cards with a per-game use cap stated in their own text

    def eligible_activators():
        """Non-commander players who placed a worker at Command or Battlefield this round --
        the only ones allowed to activate a card's Active Effect besides the commander."""
        return [p for p in players if p is not commander
                and ('Command' in placements[p.name] or 'Battlefield' in placements[p.name])]

    def apply_effect(card, loc):
        if loc == 'Battlefield':
            apply_battlefield_active(card['Name'], commander)
        else:
            apply_command_active(card['Name'], card, commander, loc)

    def resolve_commander_hand(building_filter):
        """For each card in the commander's hand matching building_filter, they may build it
        (Passive, permanent, paid from the command pool) or activate it for free (Active, card
        returns to the bottom of the shared deck) -- never both on the same card. No worker needed."""
        for card in list(commander.hand):
            loc = card['Building']
            if not building_filter(loc) or not can_use_effect(card['Name'], EFFECT_CAPS.get(card['Name'], 10**9)):
                continue
            can_build = (card['Passive Effect'].strip()
                         and len(location_upgrades_built[loc]) < UPGRADE_SLOT_CAP[loc]
                         and all(command_pool[k] >= int(card[k] or 0) for k in ('Organic','Tech','Alien')))
            commander.hand.remove(card)
            if can_build:
                for k in ('Organic','Tech','Alien'):
                    command_pool[k] -= int(card[k] or 0)
                location_upgrades_built[loc].append(card)
                apply_passive_unlock(card['Name'])
                print(f"  [Upgrade built] {loc}: {card['Name']} (from {commander.name}'s hand)")
            else:
                record_effect_use(card['Name'])
                print(f"  [Active Effect] {loc}: {commander.name} activates {card['Name']} for free (commander) -> {card['Active Effect']}")
                apply_effect(card, loc)
                command_deck.insert(0, card)  # returns to the bottom of the deck

    def resolve_noncommander_hands(building_filter):
        """Eligible non-commanders may activate (never build) a card from their own hand, paying
        from their own resources first and drawing any shortfall from the command pool
        (auto-approved -- a real commander would rarely refuse a teammate using a card)."""
        for actor in eligible_activators():
            for card in list(actor.hand):
                loc = card['Building']
                if not building_filter(loc) or not can_use_effect(card['Name'], EFFECT_CAPS.get(card['Name'], 10**9)):
                    continue
                if not all(actor.res[res] + command_pool[res] >= int(card[res] or 0) for res in ('Organic','Tech','Alien')):
                    continue
                for res in ('Organic','Tech','Alien'):
                    cost = int(card[res] or 0)
                    from_self = min(actor.res[res], cost)
                    actor.res[res] -= from_self
                    command_pool[res] -= (cost - from_self)
                actor.hand.remove(card)
                record_effect_use(card['Name'])
                print(f"  [Active Effect] {loc}: {actor.name} (non-commander) activates {card['Name']} -> {card['Active Effect']}")
                apply_effect(card, loc)
                command_deck.insert(0, card)

    resolve_commander_hand(lambda loc: loc != 'Battlefield')
    resolve_noncommander_hands(lambda loc: loc != 'Battlefield')

    print(f"  Placements: {placements}")
    print(f"  Command pool: {command_pool}")

    if not is_prep_round:
        # ---------------- DEPLOYMENT ----------------
        # Assign Scouts (README #33/#35/#37/#42): the team's best scout-eligible unit (if any) in the
        # shared pool is assigned for free, no worker needed. Its Scout Value pays straight into the
        # command pool. Reveal count defaults to 2/round either way (#42, up from 1) -- an empty pool
        # still gets this baseline reveal, it just earns no income (#37). Named per-card bonuses called
        # out in the rules text stack on top.
        reveal_count = 2
        if team_scout_pool:
            scout = max(team_scout_pool, key=lambda u: sum(to_int(u.card.get(k, 0)) for k in
                        ('Organic Scout', 'Tech Scout', 'Alien Scout')))
            for res, key in (('Organic', 'Organic Scout'), ('Tech', 'Tech Scout'), ('Alien', 'Alien Scout')):
                command_pool[res] += to_int(scout.card.get(key, 0))
            if scout.name == 'Civilian Survivalist':
                reveal_count += 1
            if scout.name == '"Python"':
                reveal_count *= 2
            if scout.name == 'Saboteur Cell' and can_use_effect('Saboteur Cell', 3):
                enemy_progress = max(0, enemy_progress - 1)
                record_effect_use('Saboteur Cell')
                print(f"  [Saboteur Cell] scouting reduces Enemy Progress by 1 -> {enemy_progress}/10 (use {EFFECT_USES['Saboteur Cell']}/3)")
            print(f"  [Assign Scouts] {scout.name} scouts this round -- command pool +{scout.card.get('Organic Scout',0)}O"
                  f"/{scout.card.get('Tech Scout',0)}T/{scout.card.get('Alien Scout',0)}A, revealing {reveal_count} enemies")
        else:
            print(f"  [Assign Scouts] scout pool empty -- baseline reveal of {reveal_count} only, no income")

        # Deal this round's hoard: draw the FULL pool across every lane first, reveal reveal_count of
        # them, reshuffle, then split back out to lanes -- a scouted card isn't pre-assigned to any
        # particular lane (README #33's sequencing).
        print(f"  Enemy hoard this round: {diff_count}x {diff_rank} per lane")
        global_reduction = HOARD_REDUCTION.get('__global__', 0)
        full_pool = []
        per_player_counts = {}
        pool = enemy_by_rank[diff_rank]
        for p in players:
            count = max(0, diff_count - global_reduction - HOARD_REDUCTION.get(p.name, 0))
            per_player_counts[p.name] = count
            full_pool.extend(random.choice(pool) for _ in range(count)) if pool else None
        random.shuffle(full_pool)
        revealed = random.sample(full_pool, min(reveal_count, len(full_pool)))
        if revealed:
            print(f"  [Scouted] {', '.join(e['Name'] for e in revealed)}")
        idx = 0
        for p in players:
            n = per_player_counts[p.name]
            p.lane_enemy_reserve = full_pool[idx: idx + n]
            idx += n

        # Battlefield's Active Effects target enemy hoards / active units, so Battlefield-building
        # cards in hand are resolved here, after the hoard is dealt but BEFORE Reveal effects fire --
        # this lets Air Strike/Defense Turrets/Chemical Warfare trim the hoard before anything in it
        # gets a chance to reveal, and lets Early Warning Network's Active (half multi-lane Reveal
        # damage this round) take effect before the Reveal damage it's meant to soften actually lands.
        resolve_commander_hand(lambda loc: loc == 'Battlefield')
        resolve_noncommander_hands(lambda loc: loc == 'Battlefield')

        for p in players:
            for e in p.lane_enemy_reserve:
                on_reveal(e, p, players)  # dispatch hook for Enemy Stats' Reveal-column effects (Section 4)

        # ---------------- COMBAT ----------------
        overrun_lanes = 0
        overran_players = set()
        lanes_won = set()  # players whose lane actually fought and cleared this round (real combat win, not an idle lane)
        lanes_with_a_kill = []  # which players' lanes scored at least 1 kill this round -- feeds Containment storage RNG
        overrun_leftover_enemies = {}  # player -> surviving enemy Combatants, for Lane Reinforcement below
        for p in players:
            apply_precombat_gear(p)
            apply_precombat_unit(p)
            p_units = ([p.active] if p.active else []) + list(p.reserve)
            p_combatants = []
            for ui in p_units:
                c = Combatant(ui.card)
                c.dmg += ui.equipped_bonus('Damage')
                c.armor += ui.equipped_bonus('Armor')
                c.hp = ui.max_hp
                c.cur_hp = ui.cur_hp
                c.cur_shields = ui.cur_shields
                apply_gear_combat_mods(c, ui)
                apply_unit_combat_mods(c, ui)
                p_combatants.append(c)
            e_combatants = []
            for e in p.lane_enemy_reserve:
                ec = Combatant(e)
                apply_enemy_combat_mods(ec, e)
                e_combatants.append(ec)
            if not e_combatants:
                print(f"  {p.name}: no enemies this lane (clean).")
                continue
            overrun, p_surv, e_surv = resolve_lane_combat(p_combatants, e_combatants)
            kills_this_lane = len(e_combatants) - len(e_surv)
            if kills_this_lane > 0:
                lanes_with_a_kill.append(p)  # at least 1 enemy died in this lane this round
                p.stats['kills'] += kills_this_lane
            if overrun:
                overrun_lanes += 1
                overran_players.add(p)
                overrun_leftover_enemies[p] = e_surv
                p.stats['overruns_suffered'] += 1
                print(f"  {p.name}'s lane OVERRUN ({len(e_surv)} enemies still standing)")
            else:
                print(f"  {p.name}'s lane CLEARED ({len(p_surv)} units survived)")
                lanes_won.add(p)
            new_units = []
            for ui, c in zip(p_units, p_combatants):
                if c in p_surv:
                    ui.cur_hp = c.cur_hp
                    ui.cur_shields = c.cur_shields
                    new_units.append(ui)
                elif id(ui) in CANNOT_DIE:
                    ui.cur_hp = 1
                    new_units.append(ui)
                elif try_chronostasis_save(p, ui):
                    new_units.append(ui)
                elif try_revive_once(p, ui):
                    new_units.append(ui)
                else:
                    apply_explode_on_death(p, ui)
                    real_gear = [g for g in ui.equipped if 'Name' in g]  # excludes temp_buff's synthetic,
                    if real_gear:  # nameless stat-only dicts (Tranq rounds etc.), which aren't real items
                        # README #33: gear survives the unit's death, but only 1 item -- owner keeps the best one
                        kept = max(real_gear, key=lambda g: to_int(g.get('Damage',0)) + to_int(g.get('HP',0))
                                   + to_int(g.get('Armor',0)) + to_int(g.get('Shields',0)))
                        p.gear_hand.append(kept)  # the rest is lost for good
                    p.graveyard.append(ui)
                    p.stats['deaths'] += 1
            p.active = new_units[0] if new_units else None
            p.reserve = new_units[1:] if len(new_units) > 1 else []

        # Post-combat Lane Reinforcement (README #33): once every lane has resolved its own Combat
        # Cycle, a lane that fully cleared its enemies may send its survivors into a still-overrun
        # lane for one extra exchange against whatever enemies are left there -- this can rescue a
        # lane from an overrun, and resolves before the Overrunning Lanes check.
        for p in sorted(lanes_won, key=lambda q: -instance_power(q.active) if q.active else 0):
            if not overrun_leftover_enemies:
                break
            reinforcements = ([p.active] if p.active else []) + list(p.reserve)
            if not reinforcements:
                continue
            target = max(overrun_leftover_enemies, key=lambda q: sum(c.cur_hp for c in overrun_leftover_enemies[q]))
            r_combatants = []
            for ui in reinforcements:
                c = Combatant(ui.card)
                c.dmg += ui.equipped_bonus('Damage')
                c.armor += ui.equipped_bonus('Armor')
                c.hp = ui.max_hp
                c.cur_hp = ui.cur_hp
                c.cur_shields = ui.cur_shields
                apply_gear_combat_mods(c, ui)
                apply_unit_combat_mods(c, ui)
                r_combatants.append(c)
            overrun2, r_surv, e_surv2 = resolve_lane_combat(r_combatants, overrun_leftover_enemies[target])
            surviving_ids = set(id(c) for c in r_surv)
            new_reinforcements = []
            for ui, c in zip(reinforcements, r_combatants):
                if id(c) in surviving_ids:
                    ui.cur_hp = c.cur_hp
                    ui.cur_shields = c.cur_shields
                    new_reinforcements.append(ui)
                else:
                    p.graveyard.append(ui)
                    p.stats['deaths'] += 1
            p.active, p.reserve = None, []  # they've moved permanently into target's lane
            target.active = new_reinforcements[0] if new_reinforcements else target.active
            target.reserve = list(target.reserve) + new_reinforcements[1:]
            if not overrun2:
                print(f"  [Lane Reinforcement] {p.name}'s survivors save {target.name}'s lane!")
                overrun_lanes -= 1
                overran_players.discard(target)
                lanes_won.add(target)
                del overrun_leftover_enemies[target]
            else:
                overrun_leftover_enemies[target] = e_surv2
                print(f"  [Lane Reinforcement] {p.name}'s survivors reinforce {target.name}'s lane but it's still overrun")

        for p in players:
            p.overrun_last_round = p in overran_players

        # Redeploy: a player whose lane WON this round may send up to 1 spare reserve unit to
        # reinforce whichever teammate's lane is currently weakest, for next round's combat.
        # Real (permanent) transfer, not a loan -- decided after combat resolves, not before.
        for p in sorted(lanes_won, key=lambda p: -instance_power(p.reserve[0]) if p.reserve else 0):
            if not p.reserve:
                continue
            def lane_power(q):
                return sum(instance_power(u) for u in (([q.active] if q.active else []) + list(q.reserve)))
            weakest = min((q for q in players if q is not p), key=lane_power)
            if lane_power(weakest) < lane_power(p):
                spare = min(p.reserve, key=instance_power)
                p.reserve.remove(spare)
                if weakest.active is None:
                    weakest.active = spare
                else:
                    weakest.reserve.append(spare)
                print(f"  [Redeploy] {p.name}'s lane won -- sends {spare.name} to reinforce {weakest.name}")

        if boss_active:
            target = random.choice(players)
            apply_boss_passive(boss_active, target)
            boss_card = boss_active['card']
            boss_dmg = to_int(boss_card.get('Damage')) + boss_active.get('dmg_bonus', 0)
            if target.active:
                target_armor = to_int(target.active.card.get('Armor')) + target.active.equipped_bonus('Armor')
                dealt = max(1, boss_dmg - target_armor) if boss_dmg > 0 else 0
                target.active.cur_hp -= dealt
                print(f"  [BOSS] {boss_card['Name']} hits {target.name}'s lane for {dealt}")
                if target.active.cur_hp <= 0 and not try_chronostasis_save(target, target.active):
                    target.graveyard.append(target.active)
                    target.stats['deaths'] += 1
                    target.active = target.reserve[0] if target.reserve else None
                    target.reserve = target.reserve[1:] if len(target.reserve) > 1 else []
                    if boss_active.get('heals_on_kill'):
                        boss_active['hp_cur'] += boss_active['heals_on_kill']
            boss_armor = boss_active.get('armor_bonus', 0)
            for p in players:
                if not p.lane_enemy_reserve and p.active:
                    atk = to_int(p.active.card.get('Damage',0)) + p.active.equipped_bonus('Damage')
                    dealt = max(1, atk - boss_armor) if atk > 0 else 0
                    boss_active['hp_cur'] -= dealt
            if boss_active['hp_cur'] <= 0:
                print(f"  [BOSS DEFEATED] {boss_card['Name']} is dead!")
                boss_active = None
                boss_died_last_round = True

        # The Cell can only hold the FINAL enemy killed in a lane this round, and which lane that is
        # is itself random (lanes don't resolve in a fixed order at the table) -- so even though every
        # enemy in a given round's hoard shares the same Rank in this model, which lane's kill actually
        # gets offered to Containment is still an RNG draw, not a guaranteed pick.
        if lanes_with_a_kill and containment_slots > 0 and len(contained_enemies) < containment_slots:
            random.choice(lanes_with_a_kill)
            contained_enemies.append(diff_rank)
            print(f"  [Containment] stores a {diff_rank} ({len(contained_enemies)}/{containment_slots} cells filled)")

    else:
        overrun_lanes = 0
        print("  [Round 0] No enemies, no Combat Stage this round.")

    # ---------------- CLEANUP ----------------
    clear_round_temp_state()

    # Command Card hand refill: every player tops back up to their hand cap (2, or 3 for
    # whoever was commander this round) by drawing from the shared deck.
    for p in players:
        cap = COMMANDER_HAND_SIZE if p is commander else COMMAND_HAND_SIZE
        while len(p.hand) < cap and command_deck:
            p.hand.append(command_deck.pop())

    if overrun_lanes:
        dmg = overrun_lanes // 2 if HALF_OVERRUN_DAMAGE[0] else overrun_lanes
        dmg = max(dmg, 1 if overrun_lanes else 0)
        overrun_tracker -= dmg
        overrun_tracker_min = min(overrun_tracker_min, overrun_tracker)
        overrun_drops_by_commander[commander.name] += dmg
        print(f"  Overrun Tracker -{dmg} -> {overrun_tracker}/20")

    # Last Stand Beacon: only usable at EnemyProg>=8; AI plays it once the Overrun Tracker is
    # actually in danger of hitting 0, rather than burning it on the very first eligible round.
    if enemy_progress >= 8 and overrun_tracker <= 5:
        holder = next((p for p in players if p.has_last_stand_beacon), None)
        if holder:
            holder.has_last_stand_beacon = False
            player_progress = max(0, player_progress - 2)
            overrun_tracker = min(20, overrun_tracker + 5)
            print(f"  [Last Stand Beacon] {holder.name} sacrifices 2 Player Progress -> {player_progress}/10, restores Overrun Tracker +5 -> {overrun_tracker}/20")

    # README #34: the Overrun Tracker hitting 0 ends the game IMMEDIATELY -- no remaining Cleanup
    # sub-steps (Event Resolution, Promotions, Mission completion, Escalate) run once it happens,
    # even mid-Cleanup.
    if overrun_tracker <= 0:
        deus_holder = next((p for p in players if any(
            so['Name'] == 'Deus Machina' for so in p.secret_objectives) and can_use_effect('Deus Machina', 1)), None)
        if deus_holder:
            record_effect_use('Deus Machina')
            overrun_tracker = overrun_tracker + dmg  # restore to before this round's losses
            enemy_progress = max(0, enemy_progress - 1)
            deus_holder.stats['secret_objective_complete'] = 'Deus Machina'
            print(f"  [Deus Machina] {deus_holder.name}'s hidden objective triggers: Overrun Tracker restored to "
                  f"{overrun_tracker}/20, EnemyProg -1 -> {enemy_progress}/10. Their Secret Objective is now complete.")
        else:
            print(f"\n#### PLAYERS LOSE on Round {round_num}. Overrun Tracker hit 0. ####")
            break

    # README #32: Round 0's Cleanup skips Event Resolution and Promotions entirely -- nothing for
    # either to act on yet (no combat happened, no event consequence to check).
    if not is_prep_round:
        event_passed = random.random() < 0.55
        print(f"  Event {'PASSED' if event_passed else 'FAILED'}" + (f" ({active_event['Event name']})" if active_event else ""))
        for p in players:
            p.stats['events_passed' if event_passed else 'events_failed'] += 1
        if active_event:
            apply_event_resolution(active_event, event_passed, commander)

        if event_passed:
            eligible = [p for p in players if p.rank < commander.rank]
            if eligible:
                promo = min(eligible, key=lambda p: p.rank)
                promo.rank = min(len(RANK_ORDER), promo.rank + 1)
                promo.stats['promotions_received'] += 1
                print(f"  Promotion: {promo.name} -> Rank {RANK_ORDER[promo.rank-1]}")

    # Mission completion (the OTHER promotion path). Players are racing to rank up ASAP for
    # stronger units, so: always complete the best eligible promoting mission if one is held.
    for p in players:
        eligible_missions = [m for m in p.missions if RANK_NUM[m['Player Rank']] >= p.rank and mission_requirement_met(m, p)]
        if eligible_missions:
            m = max(eligible_missions, key=lambda m: RANK_NUM[m['Player Rank']])
            p.missions.remove(m)
            # README #36: a mission whose bracketed Rank is 3+ tiers above the completing player's
            # current Rank grants +2 total instead of the usual +1 (capped at +2).
            gain = 2 if RANK_NUM[m['Player Rank']] - p.rank >= 3 else 1
            p.rank = min(len(RANK_ORDER), p.rank + gain)
            p.stats['promotions_received'] += 1
            apply_mission_reward(m, p)
            print(f"  Mission complete: {p.name} finishes '{m['Name']}' (+{gain} Rank) -> Rank {RANK_ORDER[p.rank-1]}")
            p.stats['missions_completed'] += 1
            if p.has_recon_satellite and can_use_effect('Recon Satellite', 3):
                enemy_progress = max(0, enemy_progress - 1)
                record_effect_use('Recon Satellite')
                print(f"  [Recon Satellite] {p.name} reduces Enemy Progress by 1 -> {enemy_progress}/10 (use {EFFECT_USES['Recon Satellite']}/3)")

    if round_num > 1:
        enemy_progress = min(10, enemy_progress + 1)
        if overrun_lanes == 0:
            player_progress += 1
    print(f"  After Escalate: PlayerProg {player_progress}/10, EnemyProg {enemy_progress}/10")

    # Rank Trickle (README #41): every player gains +1 Rank automatically every 2 rounds (end of
    # Round 2, 4, 6...; Round 0 doesn't count toward this), capped at Brigadier, stacking with
    # whatever Missions/Promotions already granted this round.
    if round_num > 0 and round_num % 2 == 0:
        for p in players:
            if p.rank < len(RANK_ORDER):
                p.rank += 1
        print(f"  [Rank Trickle] Every player +1 Rank -> {[RANK_ORDER[p.rank-1] for p in players]}")

    commander_idx = (commander_idx + 1) % len(players)

    if player_progress >= 10:
        print(f"\n#### PLAYERS WIN on Round {round_num}! Player Progress reached 10. ####")
        break

print("\n=== GAME OVER ===")
print(f"Final: Round {round_num} | PlayerProg {player_progress}/10 | EnemyProg {enemy_progress}/10 | Overrun {overrun_tracker}/20")
for p in players:
    print(f"  {p.name}: Rank {RANK_ORDER[p.rank-1]}, missions held {len(p.missions)}")
check_secret_objectives()
