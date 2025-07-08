# Quest and Contract System

This document details the quest and contract mechanics inspired by the Adventure Society system in "He Who Fights With Monsters".

## Overview

The quest system provides structured objectives that drive player progression, tell stories, and reward exploration. Unlike traditional MMO quest hubs, our system emphasizes discovery, reputation, and meaningful choices.

## Contract Types

### Adventure Society Contracts

The primary quest system revolves around the Adventure Society notice board.

#### Monster Contracts
The bread and butter of adventuring work.

**Notice Format**:
```
[Bronze-2★] Marsh Hydra Menace
Target: Marsh Hydra (1)
Location: Eastern Wetlands, near old mill
Reward: 50 Bronze coins, Society points
Warning: Regeneration, multiple heads
Posted by: Greenstone Branch
```

**Difficulty Ratings**:
- **1★**: Below rank (training)
- **2★**: At rank (standard)
- **3★**: Above rank (challenging)
- **4★**: Elite (group recommended)
- **5★**: Extreme (multiple groups)

#### Collection Contracts
Gathering specific materials or items.

**Types**:
- Monster parts (cores, scales, venom)
- Rare herbs or minerals
- Magical components
- Lost artifacts
- Research specimens

#### Escort Contracts
Protecting NPCs or caravans.

**Variations**:
- Merchant caravans between cities
- Scholar expeditions to ruins
- Diplomatic missions
- Refugee evacuations
- Supply runs to outposts

#### Investigation Contracts
Solving mysteries and uncovering threats.

**Examples**:
- Missing person cases
- Strange phenomena reports
- Cult activity investigation
- Monster behavior anomalies
- Dimensional instabilities

#### Long Road Contracts
Extended missions requiring travel.

**Features**:
- Multiple objectives
- Story progression
- Regional exploration
- Higher rewards
- Reputation bonuses

### Faction Quests

Each major faction offers unique quest lines.

#### Magic Society
- Research expeditions
- Ritual component gathering
- Essence phenomena study
- Forbidden knowledge retrieval
- Magical disaster prevention

#### Church Quests
- Healing the afflicted
- Purging corrupted areas
- Religious pilgrimages
- Divine artifact recovery
- Heretic hunting

#### Trade Consortium
- Trade route establishment
- Market manipulation
- Competitor sabotage
- Resource monopolization
- Economic intelligence

#### The Cabal
- Assassination contracts
- Information theft
- Blackmail operations
- Power broker meetings
- Forbidden experiments

### Personal Quests

Unique to individual characters.

#### Origin Quests
Based on starting background:
- Noble: Reclaim family honor
- Criminal: Clear your name
- Scholar: Prove your theory
- Outworlder: Find way home

#### Essence Quests
Unlocked by specific essences:
- Dark: Embrace or resist corruption
- Life: Heal ancient wounds
- Death: Guide lost souls
- Knowledge: Uncover truths

#### Companion Quests
Generated for NPCs with high relationship:
- Rescue their family
- Fulfill their dreams
- Avenge their losses
- Share their burdens

### Dynamic Quests

Procedurally generated based on world state.

#### Event Response
- Monster surge defense
- Natural disaster relief
- Astral breach containment
- Festival preparations
- War effort support

#### Opportunity Quests
- Merchant needs escort NOW
- Rare creature sighting
- Dungeon discovered nearby
- NPC in immediate danger
- Time-limited resource

## Quest Mechanics

### Acquisition Methods

#### Notice Boards
- Located in every Adventure Society branch
- Updates every game day (every 4 real hours) with new contracts
- Filter by rank, type, difficulty
- Reserve contracts for later
- Party-wide acceptance

#### Direct Assignment
- NPCs approach high-reputation players
- Emergency broadcasts
- Chain quest continuations
- Faction leadership orders
- Divine mandates

#### Discovery
- Overhear conversations
- Find mysterious items
- Explore hidden areas
- Read ancient texts
- Witness events

### Progression Tracking

#### Quest Journal
```
[Active Quests]
├─ Marsh Hydra Menace (Bronze-2★)
│  ├─ □ Locate the hydra's lair
│  ├─ □ Defeat the marsh hydra
│  └─ □ Return proof to Society
├─ The Missing Apprentice (Personal)
│  ├─ ✓ Speak with Master Aldric
│  ├─ □ Search the old library
│  └─ □ Follow the essence trail
└─ Long Road: Eastern Troubles (Bronze-3★)
   ├─ ✓ Clear the bandit camp (3/3)
   ├─ □ Investigate the ruins
   └─ □ Report to Marshal Hayes
```

#### Objective Types
- **Kill**: Eliminate specific targets
- **Collect**: Gather items/resources
- **Deliver**: Transport goods/messages
- **Discover**: Find locations/information
- **Survive**: Endure for duration
- **Interact**: Talk to NPCs
- **Craft**: Create specific items
- **Escort**: Protect targets

### Reward Systems

#### Standard Rewards
- Spirit coins (rank appropriate)
- Adventure Society points
- Faction reputation
- Experience for abilities
- Random loot chances

#### Special Rewards
- Awakening stones (rare)
- Essence items (very rare)
- Unique equipment
- Titles and achievements
- Access to restricted areas

#### Bonus Objectives
Optional goals for extra rewards:
- Complete under time limit
- No deaths during quest
- Discover all secrets
- Perfect stealth approach
- Diplomatic resolution

### Failure Conditions

#### Contract Failure
- Target escapes/despawns
- Time limit exceeded
- Protected NPC dies
- Player gives up
- Objective becomes impossible

#### Consequences
- No rewards
- Reputation loss
- Society standing decrease
- NPC relationship damage
- Story branches close

## Adventure Society Ranking

### Adventurer Stars
Personal rating within rank:
- **0★**: Probationary member
- **1★**: Basic member
- **2★**: Proven adventurer
- **3★**: Respected member
- **4★**: Elite adventurer
- **5★**: Legendary hero

### Advancement Requirements
Stars earned through:
- Completing contracts
- Perfect completions
- Difficulty bonuses
- Peer recommendations
- Special achievements

### Benefits by Stars
- **1★**: Access to notice board
- **2★**: Priority contracts
- **3★**: Restricted contracts
- **4★**: Leadership roles
- **5★**: Custom contracts

## Quest Generation

### Procedural Elements

#### Dynamic Objectives
Based on:
- Local monster populations
- Resource availability
- NPC needs
- Player actions
- World events

#### Contextual Variations
Same quest type, different flavor:
- Kill wolves → Avenge shepherd
- Kill wolves → Protect ecosystem
- Kill wolves → Gather pelts
- Kill wolves → Study behavior

#### Scaling Difficulty
Adjusts to:
- Party size
- Average rank
- Player reputation
- Previous performance
- World difficulty

### AI-Generated Content

#### NPC Motivations
AI creates:
- Personal backstories
- Quest reasoning
- Emotional stakes
- Hidden agendas
- Future consequences

#### Dynamic Dialogue
- Contextual responses
- Remember past quests
- React to reputation
- Personalized rewards
- Unique voice

## Special Quest Types

### Epic Quest Chains

#### The Labyrinth Conspiracy
20+ quest storyline:
1. Strange disappearances
2. Cult investigation
3. Ancient map pieces
4. Dimensional keys
5. Final confrontation

#### Rewards
- Legendary equipment set
- Unique essence ability
- World-changing outcome
- Server-wide recognition

### Raid Contracts

#### World Bosses
- Require 10+ players
- Multiple phases
- Environmental hazards
- Time pressure
- Server-first rewards

### Competitive Contracts

#### Race Contracts
- Multiple parties compete
- First to complete wins
- Sabotage allowed
- Betting system
- Leaderboards

## Integration Systems

### Party Quests
- Shared objectives
- Role-specific tasks
- Synchronized goals
- Group rewards
- Social bonds

### Guild Contracts
- Large-scale objectives
- Resource gathering
- Territory control
- Reputation building
- Economic goals

### Cross-Faction
- Conflicting objectives
- Moral choices
- Multiple solutions
- Faction war impact
- Permanent consequences

## Commands

### Quest Commands
- `quest log` - View active quests
- `quest info [name]` - Detailed view
- `quest abandon [name]` - Give up
- `quest share [name]` - Share with party
- `quest track [name]` - Set active

### Contract Commands
- `contract board` - View available
- `contract filter [type]` - Sort options
- `contract accept [id]` - Take contract
- `contract reserve [id]` - Hold for later
- `contract history` - Past contracts

## Future Expansions

### Planned Features
- Player-created contracts
- Bounty hunting system
- Time-travel quests
- Moral reputation
- Quest editor tools

### Potential Systems
- Nemesis generation
- Living quest chains
- Economic quests
- Political intrigue
- Divine missions