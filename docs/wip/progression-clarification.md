# Progression System Clarification

This document clarifies our progression system to resolve inconsistencies across documentation.

## Official Progression System

**We use RANKS, not levels.** Any reference to "levels" in documentation should be updated.

### Rank Progression
1. **Normal** - No essences
2. **Iron** - Has essences, starting rank
3. **Bronze** - First advancement
4. **Silver** - Mid-tier power
5. **Gold** - High-tier power
6. **Diamond** - Peak mortal power
7. **Transcendent** - NPC-only, divine tier (gods, ancient beings, world bosses)

### Essence Acquisition Schedule

Based on rank, not arbitrary levels:

#### First Essence
- **When**: Character creation
- **How**: Choose from starter pool
- **Cost**: Free

#### Second Essence
- **When**: Mid to Late Iron rank
- **Requirements**: 
  - Complete 25 Adventure Society contracts
  - Reach 50% progress to Bronze
  - Have 50 Iron spirit coins
- **How**: Quest reward, purchase, or rare drop

#### Third Essence
- **When**: Early Bronze rank
- **Requirements**:
  - Achieve Bronze rank in at least 5 abilities
  - Complete Bronze advancement quest
  - Have 100 Bronze spirit coins
- **How**: Quest reward, special vendor, or astral space

#### Fourth Essence (Confluence)
- **When**: Automatically upon acquiring third essence
- **How**: Determined by combination of first three
- **Cost**: None (automatic)

### Progression Metrics

Instead of experience points or levels, we track:
- **Ability Advancement**: Each ability progresses individually
- **Contracts Completed**: Adventure Society reputation
- **Time Investment**: Passive training hours
- **Resource Accumulation**: Spirit coins and materials
- **Achievement Points**: Milestone completion

### Why Ranks, Not Levels

1. **Lore Consistency**: Matches source material inspiration
2. **Power Scaling**: Clear power tiers rather than incremental
3. **Meaningful Progression**: Each rank is transformative
4. **Social Structure**: Rank determines social standing
5. **Simplified Balance**: Easier to balance 6 ranks than 100 levels

## Implementation Notes

### UI Display
```
[Iron Rank Adventurer]
Progress to Bronze: ████████░░ 80%
Abilities at Bronze: 12/20
Contracts Completed: 47
```

### Not This
```
Level 15 Iron Rank ❌
Iron Rank (Level 1-20) ❌
Exp: 15,420/20,000 ❌
```

### Database Structure
- Store rank as enum (0-6)
- Track progress as percentage to next
- Individual ability ranks stored separately
- No "experience" or "level" fields

## Migration from Old Docs

All documentation should be updated to:
1. Remove any mention of "levels"
2. Replace with appropriate rank references
3. Use "progress" instead of "experience"
4. Clarify rank-based requirements

This is our canonical progression system.