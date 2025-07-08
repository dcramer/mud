# Commands Reference

This document provides a comprehensive list of all commands available to players, organized by category.

## Basic Commands

### Getting Help
- `help` - Display general help
- `help [topic]` - Get help on specific topic
- `help [command]` - Detailed command info
- `newbie` - New player guide
- `tutorial` - Start/resume tutorial
- `tips` - Random gameplay tips

### Communication
- `say [message]` - Talk to room
- `'[message]` - Shortcut for say
- `yell [message]` - Loud message (multiple rooms)
- `whisper [player] [message]` - Private in-room message
- `tell [player] [message]` - Private message anywhere
- `reply [message]` - Reply to last tell
- `chat [channel] [message]` - Channel communication
- `emote [action]` - Custom action
- `:[action]` - Shortcut for emote

### Information
- `look` or `l` - Examine current room
- `look [target]` - Examine specific target
- `examine [target]` or `ex` - Detailed examination
- `inventory` or `i` - Check inventory
- `equipment` or `eq` - View equipped items
- `score` - Character statistics
- `affects` - Active effects/buffs
- `time` - Game time and date
- `weather` - Current weather

## Movement Commands

### Basic Movement
- `north` or `n` - Move north
- `south` or `s` - Move south
- `east` or `e` - Move east  
- `west` or `w` - Move west
- `northeast` or `ne` - Move northeast
- `northwest` or `nw` - Move northwest
- `southeast` or `se` - Move southeast
- `southwest` or `sw` - Move southwest
- `up` or `u` - Move up
- `down` or `d` - Move down

### Special Movement
- `enter [portal/door]` - Enter location
- `exit` - Leave building/area
- `follow [target]` - Follow someone
- `lose [follower]` - Stop being followed
- `sneak [direction]` - Stealthy movement
- `flee` - Escape from combat
- `recall` - Return to bind point
- `swim [direction]` - Navigate water
- `climb [direction]` - Scale surfaces
- `fly` - Activate flight (if able)

## Combat Commands

### Basic Combat
- `kill [target]` or `k` - Attack target
- `cast [spell] [target]` - Use spell ability
- `use [ability] [target]` - Use special ability
- `flee` or `fl` - Attempt to escape
- `rescue [ally]` - Draw aggro from ally
- `assist [ally]` - Attack ally's target
- `stop` - Stop all actions

### Combat Information
- `consider [target]` or `con` - Evaluate opponent
- `scan` - Look for nearby enemies
- `health` - Party health status
- `target` - Show current target
- `combat` - Combat statistics

## Character Commands

### Character Info
- `score` - Full character sheet
- `attributes` or `attr` - View attributes
- `skills` - List all skills
- `abilities` - List essence abilities
- `reputation` or `rep` - Faction standings
- `achievements` or `ach` - View achievements
- `played` - Time played statistics

### Character Management
- `train [skill]` - Train skill (at trainer)
- `practice [ability]` - Practice ability
- `meditate` - Regenerate mana faster
- `rest` - Regenerate health faster
- `save` - Force save character
- `quit` - Exit game safely
- `delete` - Delete character (confirmation required)

## Item Commands

### Inventory Management
- `get [item]` - Pick up item
- `get all` - Pick up everything
- `drop [item]` - Drop item
- `put [item] [container]` - Store item
- `give [item] [target]` - Give to player/NPC

### Equipment
- `wear [item]` - Equip armor/accessory
- `wield [item]` - Equip weapon
- `hold [item]` - Hold in off-hand
- `remove [item]` - Unequip item
- `compare [item1] [item2]` - Compare stats

### Item Interaction
- `use [item]` - Activate item
- `eat [food]` - Consume food
- `drink [liquid]` - Drink potion/water
- `read [item]` - Read books/scrolls
- `combine [item1] [item2]` - Merge items

## Social Commands

### Grouping
- `party invite [player]` - Invite to party
- `party leave` - Leave current party
- `party kick [member]` - Remove member
- `party leader [member]` - Transfer leadership
- `party chat [message]` or `p` - Party communication
- `party status` - View party info

### Guild Commands
- `guild info` - Guild information
- `guild roster` - Member list
- `guild chat [message]` or `g` - Guild communication
- `guild invite [player]` - Invite member
- `guild promote/demote [member]` - Adjust rank
- `guild bank` - Access guild storage

### Friends
- `friend add [player]` - Add friend
- `friend remove [player]` - Remove friend
- `friend list` - Show friends list
- `friend note [player] [note]` - Add note
- `ignore [player]` - Block player
- `unignore [player]` - Unblock player

## Trading Commands

### Direct Trade
- `trade [player]` - Initiate trade
- `trade accept` - Accept trade
- `trade cancel` - Cancel trade
- `offer [item]` - Add item to trade
- `offer [amount] coins` - Add money

### Shopping
- `list` - View shop inventory
- `buy [item]` - Purchase item
- `sell [item]` - Sell to merchant
- `value [item]` - Check sell price
- `browse [category]` - Filter shop items

### Auction House
- `auction list` - View auctions
- `auction bid [id] [amount]` - Place bid
- `auction create [item] [price]` - Create auction
- `auction cancel [id]` - Cancel your auction
- `auction search [keywords]` - Search items

## Essence Commands

### Essence Management
- `essences` - View your essences
- `essence info [name]` - Essence details
- `awaken [stone]` - Use awakening stone
- `confluence` - View confluence options
- `ritual [type]` - Perform ritual

### Ability Usage
- `abilities` - List all abilities
- `ability [name]` - Ability details
- `cooldowns` or `cd` - View cooldowns
- `combo [ability1] [ability2]` - Chain abilities
- `cancel` - Cancel channeling

## World Commands

### Navigation
- `map` - Display area map
- `where` - Current location
- `area` - Area information
- `exits` - List available exits
- `track [target]` - Track movement
- `landmark` - Set waypoint

### Interaction
- `search` - Search area thoroughly
- `open [door/container]` - Open object
- `close [door/container]` - Close object
- `lock [door/container]` - Lock with key
- `unlock [door/container]` - Unlock with key
- `knock [door]` - Knock on door

## Crafting Commands

### General Crafting
- `craft` - Open crafting menu
- `recipe [name]` - View recipe
- `recipes` - List known recipes
- `craft [item]` - Create item
- `repair [item]` - Repair equipment
- `salvage [item]` - Break down item

### Specialized Crafting
- `brew [potion]` - Alchemy
- `enchant [item]` - Add enchantment
- `forge [item]` - Blacksmithing
- `inscribe [scroll]` - Create scrolls
- `transmute [item]` - Change materials

## System Commands

### Settings
- `settings` - View all settings
- `toggle [setting]` - Toggle on/off
- `color [scheme]` - Change colors
- `password` - Change password
- `email [address]` - Update email

### Display
- `clear` - Clear screen
- `brief` - Toggle brief mode
- `verbose` - Toggle verbose mode
- `compact` - Toggle compact mode
- `prompt [format]` - Customize prompt

### Technical
- `lag` - Check connection
- `uptime` - Server uptime
- `version` - Game version
- `bug [description]` - Report bug
- `idea [description]` - Submit idea
- `typo [description]` - Report typo

## Advanced Commands

### Roleplay
- `description [text]` - Set description
- `biography` - Edit biography
- `pose [text]` - Set room pose
- `mood [type]` - Set mood
- `language [name]` - Switch language

### PvP Commands
- `challenge [player]` - Duel request
- `accept` - Accept challenge
- `decline` - Decline challenge
- `yield` - Surrender in PvP
- `bounty [player]` - Check bounty

### Special Commands
- `mentor [player]` - Offer mentorship
- `pray` - Deity interaction
- `meditate on [essence]` - Essence mastery
- `dream` - Enter dream realm
- `ascend` - Rank advancement ritual

## Command Shortcuts

### Common Aliases
- `n/s/e/w` - Movement
- `l` - Look
- `i` - Inventory
- `eq` - Equipment
- `k` - Kill
- `'` - Say
- `:` - Emote
- `p` - Party chat
- `g` - Guild chat
- `ex` - Examine

### Custom Aliases
- `alias [name] [command]` - Create alias
- `alias list` - View aliases
- `unalias [name]` - Remove alias
- `macro [key] [commands]` - Create macro
- `unmacro [key]` - Remove macro

## Emergency Commands
- `help!` - Call for GM assistance
- `stuck` - Teleport if stuck
- `report [player]` - Report behavior
- `panic` - Emergency logout
- `resurrect` - Self-resurrect (if able)

## Notes
- Commands are not case-sensitive
- Most commands can be abbreviated
- Use quotes for multi-word targets
- Tab completion available
- Command history with arrow keys