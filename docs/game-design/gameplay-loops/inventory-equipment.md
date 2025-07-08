# Inventory and Equipment System

This document details the inventory management, equipment, and item systems that form a core part of the RPG experience.

## Inventory System

### Storage Mechanics

#### Base Inventory
- **Starting Capacity**: 20 slots at character creation
- **Grid System**: Expandable slot-based inventory
- **Weight System**: Each item has weight, total capacity based on Power attribute
- **Maximum Capacity**: 100 slots (requires significant investment)
- **Sorting**: Auto-sort by type, quality, or custom arrangement
- **Search**: Filter and search functionality

#### Storage Types
1. **Personal Inventory** - Carried on character
2. **Bank Storage** - Safe storage in cities (200 slots)
3. **Guild Storage** - Shared guild resources
4. **Dimensional Storage** - Special items with expanded space
5. **Mount Storage** - Additional capacity on mounts

### Item Categories

#### Equipment
- **Weapons** - Main hand, off-hand, two-handed
- **Armor** - Head, chest, legs, feet, hands
- **Accessories** - Rings (2), amulet, trinkets (2)
- **Essence Items** - Enhance essence abilities
- **Consumables** - Potions, food, scrolls

#### Materials
- **Crafting Components** - Tiered by rank
- **Monster Parts** - Looted from creatures
- **Gathering Materials** - Herbs, ores, essences
- **Quest Items** - Protected, cannot be dropped
- **Currency Items** - Spirit coins, tokens

### Item Properties

#### Rarity System
1. **Common** (Gray) - Basic items, vendor trash
2. **Uncommon** (Green) - Minor bonuses
3. **Rare** (Blue) - Significant bonuses
4. **Epic** (Purple) - Major bonuses, unique effects
5. **Legendary** (Orange) - Powerful unique items
6. **Mythic** (Red) - World-changing items

#### Item Attributes
- **Base Stats** - Power, Speed, Spirit, Recovery bonuses
- **Special Properties** - Essence ability enhancements
- **Set Bonuses** - Bonuses for wearing multiple pieces
- **Rank Requirements** - Must meet rank to equip
- **Binding** - Bind on pickup/equip mechanics

### Equipment Slots

#### Combat Gear
- **Main Hand**: Primary weapon
- **Off Hand**: Shield, secondary weapon, focus
- **Ranged**: Bow, wand, thrown weapons

#### Armor Slots
- **Head**: Helmets, circlets, masks
- **Shoulders**: Pauldrons, mantles
- **Chest**: Robes, breastplates, vests
- **Hands**: Gloves, gauntlets
- **Legs**: Pants, greaves, skirts
- **Feet**: Boots, sandals, sabatons

#### Accessory Slots
- **Neck**: Amulets, necklaces
- **Ring 1 & 2**: Magical rings
- **Trinket 1 & 2**: Special items
- **Cape**: Cloaks, capes, mantles
- **Essence Focus**: Amplifies essence abilities

## Equipment System

### Stat Calculations

#### Primary Stats
Equipment directly modifies:
- Power (physical damage, carrying capacity)
- Speed (movement, dodge, initiative)
- Spirit (mana pool, spell power)
- Recovery (regeneration rates, debuff resistance)

#### Secondary Stats
Calculated from primary stats and equipment:
- **Attack Power**: Base + weapon damage + Power bonus
- **Spell Power**: Base + Spirit bonus + equipment bonuses
- **Defense**: Armor value + dodge chance
- **Critical Chance**: Base + equipment + essence bonuses
- **Resistances**: Elemental and damage type specific

### Equipment Quality

#### Condition System
- Items have durability (0-100%)
- Damage reduces effectiveness
- Repair at blacksmiths or with kits
- Broken items provide no benefits
- Some items self-repair (enchanted)

#### Enhancement System
- **Enchanting**: Add magical properties
- **Augmentation**: Socket gems or runes
- **Reforging**: Change stat distributions
- **Awakening**: Unlock hidden properties
- **Evolution**: Some items grow with use

### Special Equipment Types

#### Essence-Attuned Items
- Require specific essence to equip
- Enhance essence abilities
- May unlock new ability variants
- Often have thematic effects

#### Adaptive Equipment
- Stats change based on situation
- Grow stronger with character
- May have multiple forms
- Legendary items often adaptive

#### Set Items
- Bonus effects for multiple pieces
- Themed around specific builds
- Partial set bonuses available
- Visual effects when complete

## Item Management

### Inventory Actions

#### Basic Operations
- **Equip/Unequip**: Drag to equipment slots
- **Use**: Consumables, activatable items
- **Drop**: Remove from inventory (confirmation required)
- **Destroy**: Permanently remove item
- **Lock**: Prevent accidental actions

#### Advanced Operations
- **Compare**: Side-by-side stat comparison
- **Link**: Share item stats in chat
- **Mark**: Flag for selling/trading
- **Stack**: Combine stackable items
- **Split**: Divide stacks

### Trading and Exchange

#### Player Trading
- Secure trade window
- Both parties must confirm
- Trade history logged
- Item verification system
- Scam prevention measures

#### Vendor Interactions
- Buy/sell interfaces
- Buyback recent sales
- Repair services
- Special vendor currencies
- Regional price variations

#### Mail System
- Send items to other players
- COD (Cash on Delivery) options
- Attachment limits (5 items)
- 30-day storage
- Return to sender option

## Loot System

### Drop Mechanics

#### Loot Tables
- Monster-specific drops
- Rank-appropriate items
- Regional loot variations
- Rare spawn bonuses
- First-kill bonuses

#### Drop Rates
- Common: 80% chance
- Uncommon: 15% chance
- Rare: 4% chance
- Epic: 0.9% chance
- Legendary: 0.1% chance

#### Smart Loot
- Slight bias toward useful items
- Class-appropriate drops
- Bad luck protection
- Pity system for legendaries

### Loot Distribution

#### Solo Loot
- All drops go to player
- Instant looting option
- Area loot (loot all nearby)
- Auto-loot settings

#### Group Loot Options
1. **Free for All** - First to click
2. **Round Robin** - Rotating assignment
3. **Need/Greed** - Priority rolling
4. **Master Looter** - Leader distributes
5. **Personal Loot** - Individual drops

## Crafted Items

### Crafting Integration
- Crafted items can be superior
- Crafter's mark on items
- Custom naming options
- Quality variations
- Specialization bonuses

### Material Requirements
- Recipe-based crafting
- Quality affects outcome
- Rare materials for best items
- Essence-infused crafting
- Failed crafts return some materials

## Storage Management

### Organization Tools
- Custom bag labels
- Auto-deposit to bank
- Sorting preferences
- Quick-stack to nearby
- Search across all storage

### Inventory Expansion Methods

#### Rank Progression
Natural inventory growth through advancement:
- **Iron Rank**: Start with 20 slots
- **Bronze Rank**: +10 slots (30 total)
- **Silver Rank**: +10 slots (40 total)
- **Gold Rank**: +10 slots (50 total)
- **Diamond Rank**: +10 slots (60 total)

#### Essence Abilities
Specific essences grant storage bonuses:
- **Dimension Essence**: "Spatial Expansion" - +20 slots
- **Void Essence**: "Bottomless Pockets" - +15 slots
- **Magic Essence**: "Arcane Storage" - +10 slots
- **Earth Essence**: "Deep Pockets" - +10 slots
- **Any Confluence**: Minor expansion - +5 slots

#### Bags and Containers
Equipped bags add to base inventory:
- **Small Pouch**: +5 slots (Common)
- **Traveler's Pack**: +10 slots (Uncommon)
- **Adventurer's Backpack**: +15 slots (Rare)
- **Dimensional Bag**: +20 slots (Epic)
- **Void Storage Device**: +30 slots (Legendary)

Note: Only one bag can be equipped at a time

#### Ritual Magic
Permanent expansions through rituals:
- **Ritual of Holding**: +5 slots (Iron rank ritual)
- **Spatial Enlargement**: +10 slots (Bronze rank ritual)
- **Dimensional Pocket**: +15 slots (Silver rank ritual)
- **Void Attunement**: +20 slots (Gold rank ritual)

Rituals require rare materials and can only be performed once per rank

#### Special Achievements
Unlock slots through gameplay:
- **Pack Rat**: Loot 1,000 items - +5 slots
- **Collector**: Obtain 100 unique items - +5 slots
- **Treasure Hunter**: Find 50 rare items - +5 slots
- **Master Trader**: Complete 500 trades - +5 slots
- **Void Touched**: Survive the Void - +10 slots

#### Faction Rewards
High reputation unlocks benefits:
- **Adventure Society**: Honored - +5 slots
- **Trade Consortium**: Exalted - +10 slots
- **Magic Society**: Research partner - +5 slots

#### Temporary Expansions
Short-term storage boosts:
- **Merchant's Blessing**: +10 slots for 24 hours
- **Spatial Potion**: +20 slots for 1 hour
- **Festival Bonus**: +15 slots during events
- **Guild Perk**: +10 slots while guilded

### Storage Management Tips
- Maximum possible slots: ~100 (very rare)
- Average end-game inventory: 60-80 slots
- Plan expansion path based on playstyle
- Crafters need more slots than combat-focused
- Bank storage remains separate and larger

## Special Systems

### Transmogrification
- Change item appearance
- Keep original stats
- Unlock appearances permanently
- Costs based on item rank
- Some restrictions apply

### Item Collections
- Appearance library
- Achievement tracking
- Set completion bonuses
- Rare item exhibitions
- Account-wide unlocks

### Legendary Items
- Unique named items
- Lore and questlines
- Evolving properties
- Server-wide announcements
- Special visual effects

## Interface Integration

### Quick Access
- Hotkey items to action bar
- Quick-use consumables
- Equipment set swapping
- Favorite items marking
- Context-sensitive actions

### Visual Indicators
- Rarity color coding
- Durability warnings
- New item highlights
- Upgrade arrows
- Set piece indicators

## Future Considerations

### Planned Features
- Item dyes and customization
- Artifact weapon system
- Heirloom items (account-bound)
- Seasonal item events
- Player crafted legendaries

### Balance Considerations
- Item level squish options
- Catch-up gear mechanics
- Seasonal item rotation
- Power creep management
- Economic impact monitoring