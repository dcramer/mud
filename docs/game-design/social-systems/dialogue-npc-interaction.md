# Dialogue and NPC Interaction System

This document details the conversational mechanics, NPC behaviors, and interaction systems that bring the world to life.

## Dialogue System Overview

### Core Mechanics

#### Interaction Initiation
- **Proximity Trigger**: Approach within 2 spaces
- **Direct Address**: "talk to [NPC name]"
- **Contextual Prompts**: [Talk] appears when available
- **Greeting Behaviors**: NPCs may initiate
- **Busy States**: NPCs can be unavailable

#### Dialogue Interface
```
[Merchant Jane]: "Welcome to my shop! Are you looking for 
potions today, or perhaps some rare ingredients?"

1. "Show me your potions." [Trade]
2. "I'm looking for awakening stones." [Inquiry]
3. "Tell me about this town." [Lore]
4. "Have you heard any rumors?" [Gossip]
5. "Actually, nevermind." [Exit]

>
```

### Dialogue Types

#### Conversational Dialogue
- Free-flowing conversations
- Multiple topic branches
- Personality-driven responses
- Remembers previous interactions
- Contextual based on time/events

#### Transactional Dialogue
- Shop interfaces
- Service providers
- Quest turn-ins
- Skill trainers
- Fast, efficient interactions

#### Narrative Dialogue
- Story exposition
- Lore delivery
- Cutscene-style moments
- Dramatic conversations
- Choice consequences

## NPC Personality System

### Personality Components

#### Core Traits
Each NPC has values (-100 to +100) for:
- **Friendliness**: Hostile ↔ Welcoming
- **Honesty**: Deceptive ↔ Truthful
- **Patience**: Impatient ↔ Patient
- **Greed**: Generous ↔ Greedy
- **Courage**: Cowardly ↔ Brave

#### Behavioral Modifiers
- **Mood**: Current emotional state
- **Relationship**: Opinion of player
- **Faction Standing**: Organizational loyalty
- **Recent Events**: Contextual reactions
- **Personal Goals**: Hidden agendas

### Dynamic Responses

#### Personality-Based Variations
Same information delivered differently:

**Friendly Merchant**:
"Oh, you're looking for the dungeon? Please be careful! 
Head north through the forest, but pack extra potions!"

**Grumpy Merchant**:
"The dungeon? North. Through the forest. Try not to die 
and stink up the path for paying customers."

#### Relationship Evolution
- First meeting: Neutral/cautious
- Repeated interactions: Recognition
- Completed quests: Improved attitude
- Failed promises: Degraded trust
- Gift giving: Temporary boosts

## Dialogue Mechanics

### Choice System

#### Choice Types
1. **Information Seeking** - Learn about world/quests
2. **Negotiation** - Haggle prices, quest rewards
3. **Personality Display** - Show character traits
4. **Action Initiation** - Start quests/trades
5. **Relationship Building** - Personal connections

#### Choice Consequences
- **Immediate**: Instant response changes
- **Delayed**: Future interaction effects
- **Reputation**: Faction standing changes
- **Economic**: Price modifications
- **Narrative**: Story branches

### Skill Checks in Dialogue

#### Social Skills
- **Persuasion**: Convince NPCs
- **Intimidation**: Threaten for compliance
- **Deception**: Lie successfully
- **Insight**: Detect NPC lies
- **Charm**: Improve reactions

#### Skill Check Display
```
3. [Persuasion: 15] "Surely we can work out a better price?"
4. [Intimidation: 20] "You don't want me as an enemy..."
5. [Requires: Silver Tongue] "I have a proposition..."
```

### Memory System

#### Short-term Memory
- Current conversation topics
- Recent player actions
- Active emotional state
- Temporary opinion modifiers
- Session-specific details

#### Long-term Memory
- Player reputation
- Past quest outcomes
- Major decisions
- Gift history
- Betrayals/favors

## NPC Behavior Patterns

### Daily Routines

#### Schedule System
NPCs follow daily patterns:
- **Morning** (6:00-12:00): Open shops, begin work
- **Afternoon** (12:00-18:00): Peak activity
- **Evening** (18:00-22:00): Social time, taverns
- **Night** (22:00-6:00): Sleep, reduced availability

#### Dynamic Activities
- Merchants restock inventory
- Guards patrol routes
- Crafters work at stations
- Social NPCs visit taverns
- Children play games

### Contextual Behaviors

#### Environmental Reactions
- Rain: Seek shelter, complain
- Combat nearby: Flee or watch
- Festivals: Celebrate, special dialogue
- Disasters: Panic, seek help
- Night: Reduced visibility reactions

#### Event Responses
- Player achievements: Congratulations
- Local threats: Worried dialogue
- Economic changes: Price discussions
- Political events: Opinion sharing
- Seasonal changes: Appropriate reactions

## Quest Dialogue Integration

### Quest Offering

#### Quest Introduction
```
[Captain Morris]: "You look capable. We've been having 
trouble with bandits on the eastern road. The last three 
caravans never made it through. Interested in helping?"

1. "Tell me more about these bandits." [Information]
2. "What's the pay?" [Negotiation]
3. "I'll handle it." [Accept]
4. "Not interested." [Decline]
```

#### Progressive Disclosure
- Basic information first
- Details upon inquiry
- Hidden objectives revealed
- Bonus conditions mentioned
- Warnings given appropriately

### Quest Progress Dialogue

#### Status Updates
- **Not Started**: Initial offering
- **In Progress**: Encouragement/reminders
- **Partially Complete**: Acknowledge progress
- **Complete**: Congratulations, rewards
- **Failed**: Disappointment, consequences

#### Dynamic Quest Dialogue
- Adapts to player actions
- Reflects partial completion
- Offers hints if struggling
- Provides alternative solutions
- Remembers player promises

## Special Dialogue Systems

### Faction Representatives

#### Faction-Specific Dialogue
- Formal greetings for members
- Hostile responses to enemies
- Recruitment pitches for neutral
- Secret information for trusted
- Faction quest opportunities

#### Rank Recognition
```
[Magic Society Librarian]: "Ah, Apprentice [Name]! The 
restricted section is still off-limits, but perhaps 
when you achieve Journeyman rank..."
```

### Merchant Dialogues

#### Trading Integration
- Browse inventory naturally
- Haggling mini-game
- Special stock mentions
- Bulk purchase discounts
- Custom order placement

#### Economic Awareness
- React to market changes
- Mention supply issues
- Competitor references
- Regional price variations
- Exclusive deal offers

### Information Brokers

#### Rumor System
- Procedurally generated rumors
- Mix of true/false information
- Quest hints embedded
- World event updates
- Player achievement gossip

#### Information Trading
- Sell information to NPCs
- Buy exclusive intelligence
- Trade secrets between factions
- Blackmail opportunities
- Spy network access

## Advanced Interaction Features

### Group Conversations

#### Multi-NPC Dialogues
- NPCs interact with each other
- Player moderates discussions
- Group decision making
- Faction representatives debate
- Social dynamics visible

#### Crowd Reactions
- Background NPC chatter
- Collective responses
- Mob mentality options
- Public speaking opportunities
- Reputation effects amplified

### Emotional States

#### Emotion Display
```
[Grieving Widow] *tears streaming*: "They took him... 
those monsters took my husband. Please, you must help!"
```

#### Emotion-Driven Options
- Comfort the distressed
- Exploit emotional vulnerability
- Remain professionally distant
- Share similar experiences
- Offer practical help

### Language System

#### Language Barriers
- Some NPCs speak different languages
- Partial understanding possible
- Language learning opportunities
- Translator NPCs available
- Magical translation items

#### Dialect Variations
- Regional speech patterns
- Class-based vocabulary
- Educational differences
- Cultural expressions
- Slang and idioms

## NPC Interaction Commands

### Basic Commands
- `talk to [npc]` - Initiate dialogue
- `say [message]` - Speak to room
- `whisper [npc] [message]` - Private message
- `greet [npc]` - Formal greeting
- `farewell` - End conversation

### Advanced Commands
- `persuade [npc]` - Attempt persuasion
- `intimidate [npc]` - Try intimidation
- `charm [npc]` - Use charm
- `bribe [npc] [amount]` - Offer money
- `gift [npc] [item]` - Give items

### Emotive Commands
- `bow to [npc]` - Show respect
- `threaten [npc]` - Display hostility
- `compliment [npc]` - Flattery
- `insult [npc]` - Provoke
- `comfort [npc]` - Show empathy

## Dialogue Customization

### Player Options

#### Dialogue Preferences
- Verbose/concise modes
- Skip familiar dialogue
- Highlight new options
- Show skill requirements
- Display relationship status

#### Accessibility Features
- Text size options
- Color coding choices
- Screen reader support
- Dialogue history log
- Pause conversation option

### Roleplaying Support

#### Custom Responses
- Type custom dialogue
- Emote during conversation
- Character voice consistency
- Personality expression
- Background influence

#### Dialogue Stance
Players can set their default approach:
- Friendly
- Professional
- Aggressive
- Mysterious
- Humorous

## Future Enhancements

### Planned Features
- Voice acting for major NPCs
- Branching storyline impacts
- NPC relationship trees
- Dynamic faction politics
- Procedural quest generation

### AI Integration
- GPT-powered dynamic responses
- Contextual conversation generation
- Personality-consistent dialogue
- Emergent storylines
- Natural language processing