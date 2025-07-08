# Design Issues Tracker

This document tracks inconsistencies, missing documentation, and areas needing clarification in our game design.

## Critical Issues

### 1. Progression System Confusion
**Issue**: Mixed references to "levels" and "ranks" throughout documentation
- Character creation mentions "Level 5-10 range" for second essence
- All other docs use rank-based progression
- **Resolution Needed**: Confirm we're using ONLY rank-based progression, no traditional levels

### 2. Inventory System Conflict
**Issue**: Two different inventory systems described
- Grid-based: 50 slots (inventory-equipment.md)
- Starting: 20 slots (character-creation.md)
- Weight-based system also mentioned
- **Resolution Needed**: Choose one system or clarify how they work together

### 3. Transcendent Rank Missing
**Issue**: Inconsistent rank progression
- Core systems mentions Transcendent after Diamond
- Most docs stop at Diamond
- **Resolution Needed**: Decide if Transcendent is playable or NPC-only

## Major Missing Systems

### High Priority
1. **Magic/Ritual System** - How does ritual magic work?
2. **Quest System** - Core gameplay loop undefined
3. **Skill System** - Referenced but never detailed
4. **Command Reference** - Players need to know how to play

### Medium Priority
1. **Mount System** - Mentioned but not designed
2. **Housing System** - Referenced but not detailed
3. **Tutorial System** - Critical for new players
4. **Weather/Time System** - Day/night cycles mentioned

### Low Priority
1. **Pet System** - Could enhance gameplay
2. **Achievement Details** - Rewards and requirements
3. **Titles System** - Character customization
4. **Marriage/Social Systems** - Future feature

## Inconsistencies to Resolve

### Essence Acquisition Timeline
- **Problem**: When do players get essences 2, 3, and 4?
- **Current Info**: 
  - Character creation: 1st essence
  - "Level 5-10": 2nd essence (but we don't use levels?)
  - "Level 15-20": 3rd essence
  - Confluence: Automatic after 3rd
- **Needs**: Clear rank-based requirements

### Starting Resources
- **Character Creation**: 20 inventory slots
- **Inventory System**: 50 base slots
- **Spirit Coins**: Starting amount varies

### PvP Restrictions
- **Combat**: "within 1 rank difference"
- **Multiplayer**: "±1 rank" but mentions levels
- **Death**: Different rules for PvP deaths

### World Geography
- **Lore**: Floating continents in endless sky
- **World Systems**: Underwater metropolis, wastelands
- **Needs**: Clear map/region connections

## Economic Balance Issues

### Spirit Coin Costs
- Death penalties seem extreme:
  - Iron: 10 coins (reasonable)
  - Diamond: 1000 coins (excessive?)
- No pricing guidelines for items/services

### Crafting Economics
- Material costs undefined
- Crafting time vs buying unclear
- Market dynamics need details

## Combat Clarifications Needed

### Turn-Based Mechanics
- Initiative system undefined
- Action economy unclear
- Movement in combat vague

### Ability System
- Cooldowns mentioned but not detailed
- Resource costs (mana/stamina) inconsistent
- Combo system needs specific examples

## World Building Gaps

### Faction Territories
- Six major factions but no map
- Overlapping purposes (multiple churches)
- Territory control mechanics undefined

### Astral Spaces
- Entry/exit requirements vague
- Risk/reward balance undefined
- Procedural generation rules needed

### Time Systems
- Day/night effects mentioned
- Real-time vs game-time unclear
- Offline progression time scaling

## Documentation Priority Order

### Immediate (Blocks Development)
1. Resolve rank vs level progression
2. Define inventory system
3. Create command reference
4. Document skill system

### Short Term (Core Gameplay)
1. Detail magic/ritual system
2. Design quest system
3. Clarify essence acquisition
4. Fix PvP inconsistencies

### Medium Term (Full Experience)
1. Design mount system
2. Create housing system
3. Detail weather/time
4. Economic balance pass

### Long Term (Polish)
1. Achievement system
2. Pet system
3. Social features
4. Advanced crafting

## Action Items

1. **Hold design meeting** to resolve critical inconsistencies
2. **Assign ownership** for missing system documentation
3. **Create templates** for consistent documentation
4. **Establish terminology** (no mixing ranks/levels)
5. **Build style guide** for consistent writing

## Notes

- Consider creating a glossary document
- Need a "quick start" guide for new players
- Tutorial should introduce systems gradually
- Keep "He Who Fights With Monsters" inspiration but ensure our systems are coherent