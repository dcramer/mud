# Movement and Navigation System

This document details how players move through the world, explore areas, and navigate between locations.

## Basic Movement

### Cardinal Directions
- **Primary**: north (n), south (s), east (e), west (w)
- **Secondary**: northeast (ne), northwest (nw), southeast (se), southwest (sw)  
- **Vertical**: up (u), down (d)
- **Special**: in, out (for entering/exiting buildings)

### Movement Commands
```
> north
You walk north.
[The Adventurer's Plaza]
A bustling square filled with adventurers preparing for their journeys.
The Adventure Society building looms to the east, while shops line the 
western edge. A fountain bubbles in the center.
Exits: north, south, east, west

> n
You walk north.
[North Market Street]
```

### Movement Feedback
- Success: Room description appears
- Blocked: "You cannot go that direction."
- Locked: "The door is locked."
- Special: "You'll need to climb to go up there."
- Danger: "Are you sure? You sense danger to the north."

## Room System

### Room Components

#### Title and Description
- **Title**: Brief location identifier
- **Description**: Detailed atmospheric text
- **Dynamic Elements**: Weather, time of day
- **State Changes**: Reflect player actions
- **Hidden Details**: Revealed through examination

#### Exit Listing
```
Obvious exits: north, south, east
Hidden exits: (revealed through search)
Blocked exits: west (rubble), up (too high)
Special exits: portal (shimmering), gate (closed)
```

### Room Types

#### Standard Rooms
- Normal movement rules
- Clear exit indicators
- Standard vision range
- Typical descriptions

#### Special Rooms
- **Safe Zones**: No combat, guaranteed safety
- **Shops**: Special commands available
- **Banks**: Access storage
- **Temples**: Resurrection points
- **Guild Halls**: Member-only areas

#### Environmental Rooms
- **Underwater**: Breathing required
- **Darkness**: Light source needed
- **Extreme Heat/Cold**: Protection required
- **Magical**: Essence interactions
- **Unstable**: May change or collapse

## Navigation Tools

### Map System

#### Auto-Mapping
- Explored rooms recorded
- ASCII map display
- Zoom levels (room, area, region)
- Custom markers
- Shared party maps

#### Map Display
```
        [T]
         |
    [S]-[@]-[ ]
         |
        [ ]

@ = You  T = Temple  S = Shop
```

### Coordinate System
- Global coordinates (X, Y, Z)
- Regional naming (Greenstone-Plaza-001)
- Memorable landmarks
- Portal addresses
- Astral space identifiers

### Navigation Aids

#### Pathfinding
- `goto [location]` - Auto-walk to known location
- `path to [target]` - Show route
- `track [player/npc]` - Follow trails
- `recall` - Return to bind point
- `landmark` - Set custom waypoint

#### Transportation
- **Walking**: Default speed
- **Running**: Faster, uses stamina
- **Mounts**: Increased speed, special access
- **Portals**: Instant travel
- **Ships/Caravans**: Scheduled routes

## Exploration Mechanics

### Discovery System

#### First Discovery
- Bonus experience for new areas
- Automatic landmark recording
- Achievement progress
- Cartographer rewards
- Name on world map

#### Hidden Areas
- Secret rooms behind illusions
- Puzzle-locked chambers
- Rank-restricted zones
- Time-specific appearances
- Essence-revealed passages

### Search and Examination

#### Search Commands
- `look` - Basic room description
- `examine [object]` - Detailed inspection
- `search` - Find hidden items/exits
- `listen` - Audio clues
- `sense` - Magical detection

#### Discovery Triggers
- Skill checks (perception)
- Item requirements (keys)
- Essence abilities (detect magic)
- Time/weather conditions
- Quest states

## Movement Modifiers

### Speed Factors

#### Increasing Speed
- Speed attribute bonuses
- Swift essence abilities
- Mount usage
- Speed potions
- Clear roads

#### Decreasing Speed
- Encumbrance (inventory weight)
- Difficult terrain
- Weather conditions
- Injuries/afflictions
- Stealth mode

### Special Movement

#### Climbing
- Requires checks or equipment
- Vertical room connections
- Fall damage possible
- Rope/ladder placement
- Group assistance

#### Swimming
- Underwater navigation
- Breath management
- Current effects
- Aquatic mount benefits
- Treasure diving

#### Flying
- High-rank ability
- Mount-based flight
- Limited duration
- Aerial-only areas
- Weather interference

## Area Transitions

### Zone Boundaries

#### Seamless Transitions
- Walk between connected areas
- Loading handled invisibly
- Consistent world feel
- No artificial barriers

#### Gated Transitions
- Level requirements
- Quest prerequisites  
- Faction standing needed
- Time-locked areas
- Event-specific access

### Fast Travel

#### Portal Network
- Major city connections
- Discovered portals saved
- Resource cost (standard coins)
- Portal attunement required
- Emergency escape portals

#### Recall Points
- Bind at temples/inns
- Death respawn location
- Cooldown on use
- Multiple bind points (high rank)
- Guild hall recalls

## Hazardous Movement

### Environmental Dangers

#### Natural Hazards
- Cliff edges (fall risk)
- Quicksand (slow trap)
- Avalanche zones
- Flooding areas
- Extreme temperatures

#### Magical Hazards
- Teleportation traps
- Maze spells
- Dimensional rifts
- Gravity anomalies
- Time distortions

### Monster Territories

#### Aggression Zones
- Monster patrol areas
- Ambush points
- Territorial warnings
- Stealth importance
- Group recommended

#### Dynamic Spawns
- Time-based appearances
- Player traffic influence
- Rare spawn locations
- Event invasions
- Nest behaviors

## Group Movement

### Party Travel

#### Follow System
- `follow [leader]` - Auto-follow
- `stop following` - Independent movement
- Group teleportation
- Shared discoveries
- Split party warnings

#### Formation Movement
- Tactical positioning
- March order
- Scout ahead
- Rear guard
- Combat ready

### Caravan System

#### Escort Missions
- Protect NPC groups
- Speed limited by slowest
- Route planning important
- Ambush events
- Completion bonuses

## Advanced Navigation

### Astral Navigation

#### Dimensional Travel
- Astral space entry points
- Navigation differently
- Spatial distortions
- Reality anchors needed
- Exit complications

#### Planar Movement
- Elemental plane access
- Different physics rules
- Special requirements
- Limited duration
- Unique discoveries

### Tracking System

#### Following Trails
- Recent player paths
- Monster movements
- NPC patrol routes
- Age of tracks
- Weather effects

#### Ranger Abilities
- Enhanced tracking
- Predict movements
- Hidden trail finding
- Group tracking
- Counter-tracking

## Movement in Combat

### Tactical Movement
- Limited per turn
- Opportunity attacks
- Positioning importance
- Terrain advantages
- Escape mechanics

### Chase Scenes
- Multi-room pursuits
- Speed checks
- Obstacle navigation
- Stamina management
- Escape techniques

## Future Enhancements

### Planned Features
- Vehicle system
- Parkour mechanics
- Racial movement abilities
- Seasonal path changes
- Player-built roads

### Requested Features
- Zip lines
- Grappling hooks
- Teleportation networks
- Movement combos
- Environmental interactions