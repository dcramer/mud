# Game Design Verification Guide

**IMPORTANT**: This guide MUST be referenced when creating or updating ANY game system. All new content must pass these verification checks.

## Core Vision Statement

We are creating a **creative, open-ended MUD** inspired by **"He Who Fights With Monsters"** that respects player intelligence, encourages emergent gameplay, and provides meaningful choices without hand-holding.

## Mandatory Verification Checklist

### ✓ 1. Creative Open-Ended Gameplay
Every system must support at least ONE of these:
- [ ] Multiple valid approaches to achieve goals
- [ ] Player-driven content or customization
- [ ] Emergent gameplay possibilities
- [ ] Non-linear progression options
- [ ] Creative problem-solving opportunities

**Examples**: 
- ✅ Housing system allows full customization
- ✅ Essence combinations create unique builds
- ❌ Linear quest with single solution

### ✓ 2. HWFWM Inspiration Alignment
New systems should incorporate HWFWM elements where appropriate:
- [ ] Consistent with established rank system (Normal → Diamond)
- [ ] Respects essence/ability framework (4 essences, 5 abilities each)
- [ ] Maintains tone of "dark powers used heroically"
- [ ] Includes appropriate power scaling
- [ ] References established lore (Adventure Society, astral spaces, etc.)

**Key HWFWM Elements to Consider**:
- Essences and awakening stones
- Rank-based progression
- Adventure Society contracts
- Ritual magic
- Astral spaces and dimensional travel
- Familiar bonds
- Affliction mechanics

### ✓ 3. Player Agency & Intelligence
Systems must:
- [ ] Avoid hand-holding or forced tutorials
- [ ] Provide meaningful choices with real consequences
- [ ] Allow players to fail and learn
- [ ] Respect player time and decisions
- [ ] Offer depth without mandatory complexity

**Red Flags**:
- ❌ "You must do X before Y"
- ❌ Single optimal path
- ❌ Excessive guidance or warnings
- ❌ Preventing "wrong" choices

### ✓ 4. MUD-Appropriate Design
All systems must work in text-based format:
- [ ] Clear text descriptions replace visuals
- [ ] Commands are intuitive and discoverable
- [ ] Information is accessible without UI
- [ ] Works with screen readers
- [ ] Respects MUD conventions

**Consider**:
- How will players interact via text?
- What commands make sense?
- Is spatial information clear?
- Can this be understood without graphics?

### ✓ 5. Interconnected Systems
New content should:
- [ ] Connect to at least 2 existing systems
- [ ] Not duplicate existing functionality
- [ ] Enhance rather than replace current features
- [ ] Create new synergies or combinations
- [ ] Maintain balance with other systems

**Ask**:
- How does this interact with combat?
- Does it affect progression?
- Can it combine with essences/abilities?
- Does it create new player goals?

### ✓ 6. Progression Philosophy
All progression must:
- [ ] Reward both active and idle play appropriately
- [ ] Provide clear goals without mandating paths
- [ ] Scale properly across ranks
- [ ] Avoid power creep or invalidating content
- [ ] Maintain "old-school difficulty"

**Balance**:
- Iron rank: Learning and foundation
- Bronze rank: Competency and options
- Silver rank: Mastery and influence
- Gold rank: Regional power
- Diamond rank: Approaching transcendent

### ✓ 7. Economic Impact
Consider:
- [ ] Resource sinks and faucets
- [ ] Impact on player economy
- [ ] Trading opportunities created
- [ ] Doesn't break existing economies
- [ ] Provides value at all wealth levels

### ✓ 8. Social Considerations
Systems should:
- [ ] Encourage positive player interaction
- [ ] Support both solo and group play
- [ ] Not force social gameplay
- [ ] Create opportunities for cooperation
- [ ] Allow competitive elements appropriately

## Standard Terminology

**ALWAYS USE**:
- Ranks (not levels): Normal, Iron, Bronze, Silver, Gold, Diamond
- Essences (not classes): Maximum 4 per character
- Abilities (not skills): Granted by essences
- Skills: Learned techniques separate from abilities
- Attributes: Power, Speed, Spirit, Recovery (not Might/Grace)
- Spirit Coins: Special currency (not regular coins)
- Regular Currency: Iron, Bronze, Silver, Gold, Platinum coins
- Health/Mana/Stamina (not HP/MP/SP)

## Documentation Standards

Every system document MUST include:

### 1. Overview Section
- Brief description of system purpose
- How it enhances creative gameplay
- HWFWM inspiration (if applicable)

### 2. Core Mechanics
- Detailed functionality
- Clear command structure
- Integration points with other systems

### 3. Progression Elements
- How players advance within system
- Rank-based scaling
- Idle vs active benefits

### 4. Balance Considerations
- Resource costs
- Power scaling
- Economic impact
- Time investment

### 5. Examples
- Concrete usage scenarios
- Command examples
- Edge case handling

## Integration Requirements

### Existing Systems to Consider
When adding new content, check integration with:
- **Combat System**: Abilities, afflictions, modifiers
- **Essence System**: Ability synergies, awakening stones
- **Progression System**: Rank requirements, advancement
- **Crafting System**: Materials, recipes, benefits
- **Social Systems**: Guilds, parties, trading
- **Housing System**: Storage, workshops, customization
- **Economic System**: Costs, rewards, trade
- **Quest System**: Contracts, rewards, requirements

### Procedural Generation
Where appropriate, include:
- What can be procedurally generated
- Parameters for generation
- Quality control measures
- Player influence on generation

## Red Lines - Never Do This

1. **Never** lock players into single paths
2. **Never** prevent experimentation or "wrong" choices
3. **Never** add systems that work in isolation
4. **Never** create "optimal" builds that invalidate others
5. **Never** add pure grinding without meaningful progression
6. **Never** implement pay-to-win mechanics
7. **Never** force social interaction
8. **Never** break MUD text-based conventions
9. **Never** invalidate player time investment
10. **Never** add systems that can't scale with ranks

## Quick Verification Questions

Before finalizing any system, ask:
1. Does this give players more creative options?
2. Is this true to HWFWM's spirit?
3. Can players approach this multiple ways?
4. Does it work in pure text?
5. How does it connect to existing systems?
6. Is it fun at all ranks?
7. Does it respect player intelligence?
8. Will it encourage emergent gameplay?

## Living Document Note

This guide should be updated when:
- Core vision needs clarification
- New standard terms are established
- Integration requirements change
- Lessons learned from system implementation

**Last Updated**: [Current Date]
**Version**: 1.0

---

**REMINDER**: Every system designer MUST read this guide before creating new content. Non-compliance risks breaking the coherent game design we've established.