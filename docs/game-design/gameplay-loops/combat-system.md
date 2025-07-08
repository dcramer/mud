# Combat System

This document details the combat mechanics, abilities, and tactical systems inspired by "He Who Fights With Monsters".

## Combat Overview

Combat is turn-based with simultaneous resolution, emphasizing strategy over reaction time. The system rewards understanding ability synergies, affliction stacking, and tactical positioning.

### Combat Flow
1. **Initiative Phase** - Determine action order based on Speed attribute
2. **Declaration Phase** - Players choose actions (can be simultaneous)
3. **Resolution Phase** - Actions resolve in initiative order
4. **Effect Phase** - Afflictions/boons tick, damage over time applies
5. **Recovery Phase** - Cooldowns advance, resources regenerate

## Ability System

### Ability Categories

#### Special Abilities
Direct personal abilities that define character playstyle.
- **Instant** - Resolve immediately (attacks, teleports)
- **Channeled** - Require multiple turns, can be interrupted
- **Toggle** - Ongoing effects that drain resources
- **Reactive** - Trigger in response to specific conditions

#### Spells
Magical effects requiring mana and often casting time.
- **Projectile** - Direct damage with travel time
- **Area Effect** - Hit multiple targets in a zone
- **Utility** - Non-damage effects (teleport, shield)
- **Ritual** - Powerful effects requiring preparation

#### Conjurations
Create items, weapons, or temporary constructs.
- **Weapons** - Summoned armaments with special properties
- **Items** - Consumables or temporary tools
- **Barriers** - Walls, shields, and obstacles
- **Constructs** - Animated servants or turrets

#### Familiars
Summoned or bonded creatures that assist in combat.
- **Combat** - Direct damage dealers
- **Support** - Healers and buffers
- **Utility** - Scouts and resource gatherers
- **Fusion** - Can merge with summoner for power

### Ability Ranks and Scaling

Each ability progresses through ranks with new effects:

**Iron Rank** - Base ability
- Example: "Leech Life" - Drain 20 HP, heal 10 HP

**Bronze Rank** - Enhanced effect
- "Leech Life" - Drain 30 HP, heal 20 HP, inflict [Blood Debt]

**Silver Rank** - Additional mechanic
- "Leech Life" - Also steals one beneficial effect from target

**Gold Rank** - Major upgrade
- "Leech Life" - Becomes AoE, spreads [Blood Debt] to nearby enemies

**Diamond Rank** - Transcendent power
- "Leech Life" - Ignores immunities, can drain life force directly

## Afflictions

Negative status effects that can be stacked and combined for devastating results.

### Common Afflictions

#### [Bleeding]
- **Type**: Wounding, Blood
- **Effect**: Ongoing damage, reduces healing received
- **Stacking**: Intensity (more damage per stack)
- **Removal**: Cannot be cleansed, removed by healing threshold

#### [Weakness of the Flesh]
- **Type**: Magic
- **Effect**: Negates immunities to disease and necrotic
- **Stacking**: Duration
- **Synergy**: Enables other afflictions to affect resistant enemies

#### [Harbinger of Doom]
- **Type**: Unholy
- **Effect**: Creates butterflies that spread afflictions
- **Stacking**: More butterflies per stack
- **Tactical**: Area denial and affliction spreading

#### [Rigor Mortis]
- **Type**: Unholy
- **Effect**: Reduces Speed and Recovery, deals necrotic damage
- **Stacking**: Intensity (stronger slow and damage)
- **Counter**: High Recovery attribute reduces duration

### Affliction Mechanics

#### Stacking Types
- **Intensity**: Each stack increases effect power
- **Duration**: Each stack extends the effect time
- **Instance**: Multiple separate instances of the effect

#### Resistance and Immunity
- Base resistance from Recovery attribute
- Racial resistances (e.g., Draconians resist fire)
- Ability-granted immunities can be bypassed by specific afflictions

## Boons

Positive effects that enhance combat capabilities.

### Common Boons

#### [Blood Frenzy]
- **Type**: Unholy
- **Effect**: +Speed and +Recovery attributes
- **Stacking**: Intensity (up to maximum threshold)
- **Source**: Blood essence abilities, vampiric effects

#### [Impervious]
- **Type**: Defense
- **Effect**: Increased resistance to non-physical damage
- **Duration**: Usually short, requires timing
- **Counter**: Physical damage or dispel effects

#### [Integrity]
- **Type**: Recovery
- **Effect**: Periodic health, stamina, and mana restoration
- **Stacking**: Multiple sources stack diminishingly
- **Synergy**: Multiplied by Recovery attribute

### Boon Application
- Self-targeted boons typically instant
- Ally boons may require line of sight
- Area boons affect all friendlies in range
- Some boons can be "stolen" by enemies

## Combat Positioning

### Range Bands
1. **Melee** - Adjacent, most abilities usable
2. **Close** - 1-2 spaces, projectiles and charges
3. **Medium** - 3-5 spaces, ranged attacks optimal
4. **Far** - 6+ spaces, limited options
5. **Extreme** - Sniping range, few abilities reach

### Terrain Effects
- **Difficult** - Costs extra movement
- **Hazardous** - Damages per turn
- **Obscuring** - Blocks line of sight
- **Elevated** - Range and damage bonuses
- **Sanctified/Corrupted** - Affects holy/unholy abilities

## Damage Types and Resistances

### Physical Damage
- **Slashing** - Causes bleeding, reduced by armor
- **Piercing** - Ignores portion of armor
- **Bludgeoning** - Can stun, full armor effect
- **Rending** - Combination physical, hard to resist

### Magical Damage
- **Fire** - Damage over time, spreads
- **Ice** - Slows, can freeze
- **Lightning** - Chains between targets
- **Necrotic** - Prevents healing, withers

### Exotic Damage
- **Holy** - Extra damage to unholy beings
- **Unholy** - Corrupts and weakens
- **Transcendent** - Ignores most resistances
- **Resonating Force** - Builds up over hits

## Tactical Considerations

### Action Economy
- Most characters get 1 action per turn
- Speed attribute can grant extra reactions
- Some abilities are "free actions"
- Cooldowns prevent ability spam

### Resource Management
- **Health** - Primary survival resource
- **Mana** - Fuels magical abilities
- **Stamina** - Physical abilities and movement
- **Essence** - Special resource for ultimate abilities

### Combo System
Certain ability combinations create enhanced effects:
- Wet + Lightning = Increased damage and stun
- Bleeding + Necrotic = [Festering Wound]
- Multiple Fire sources = [Conflagration]
- Holy + Healing = [Divine Restoration]

## Death and Recovery

### Unconscious State
- Reduced to 0 HP enters unconscious
- Allies have 3 rounds to stabilize
- Taking damage while unconscious risks permanent death
- Special abilities can instant-kill

### Death Penalties
- **Iron Rank**: Respawn at nearest temple, 10% durability loss
- **Bronze Rank**: 20% durability loss, 1 hour weakness
- **Silver Rank**: 30% durability loss, afflictions persist
- **Gold Rank**: Item loss possible, 24 hour weakness
- **Diamond Rank**: Permanent consequences possible

### Recovery Options
- Temple resurrection (costs standard coins based on rank)
- Player resurrection abilities (rare)
- Phylactery items (prevent death once)
- Divine intervention (special events)

## PvP Considerations

### Rank Restrictions
- Can only attack within 1 rank difference
- Higher rank has damage reduction vs lower
- Diamond ranks cannot attack below Gold

### PvP Zones
- **Safe Zones** - No PvP allowed
- **Contested** - Open PvP with rewards
- **Dueling Grounds** - Consensual PvP only
- **Guild Wars** - Faction-based combat

### Honor System
- Killing lower ranks reduces honor
- High honor unlocks special vendors
- Dishonorable players marked for bounties
- Honor affects NPC interactions

## Combat Modifiers

### Environmental Effects
- **Rain** - Reduces fire damage, enhances lightning
- **Darkness** - Reduces accuracy, enhances shadow abilities
- **Consecrated Ground** - Enhances holy, weakens unholy
- **Mana Storm** - Random magical surges

### Situational Bonuses
- **Flanking** - +20% damage when attacking from sides
- **Backstab** - Critical chance increase from behind
- **High Ground** - Range and accuracy bonuses
- **Ambush** - First strike advantage

## Advanced Combat Mechanics

### Essence Combinations
Different essence combinations create unique combat styles:
- Fire + Wind = AoE specialist
- Shadow + Death = Affliction master
- Shield + Life = Ultimate tank
- Sword + Swift = Precision striker

### Ultimate Abilities
Unlocked at Silver rank, one per essence:
- Long cooldowns (once per combat)
- Devastating effects
- Can turn the tide of battle
- Often have dramatic visual effects