# Coding Standards

**CRITICAL: This document defines MANDATORY standards following industry best practices for ECS and TypeScript development.**

## Overview

These standards ensure our codebase follows established **industry best practices** for:
- **Entity Component System (ECS)** architecture patterns
- **TypeScript** strict development practices 
- **Modern JavaScript/Node.js** conventions
- **Security-first** development practices

## 🔴 MANDATORY REQUIREMENTS

### 1. Test-Driven Development (TDD) is MANDATORY
- **TDD is required** for all testable code (everything except third-party integrations)
- **Write tests FIRST**: Define behavior through tests before implementation
- **Red-Green-Refactor cycle**: 
  1. Write failing test that defines desired behavior
  2. Write minimal code to make test pass
  3. Refactor while keeping tests green
- **90% minimum test coverage** (industry standard)
- **Unit tests**: Every public method and function
- **Integration tests**: System interactions and workflows
- **Error path testing**: All failure scenarios must be tested
- **No code merges without passing tests**

### 2. TypeScript Strict Mode (Industry Standard)
- **Strict mode enabled**: `"strict": true` in tsconfig.json
- **No `any` types**: Use proper typing or explicit `unknown`
- **Explicit return types**: All functions must declare return types
- **Null safety**: Proper handling of null/undefined with strict checks

### 3. ECS Architecture Compliance
- **Industry-standard ECS patterns**: Follow established ECS conventions
- **Component purity**: Components contain only data, no behavior
- **System isolation**: Systems communicate only through events
- **Entity composition**: Prefer composition over inheritance

## Industry-Standard Patterns

### TypeScript Best Practices

#### Naming Conventions (TypeScript/JavaScript Standard)
```typescript
// Variables and functions: camelCase
const playerHealth = 100;
const calculateDamage = (power: number) => power * 1.5;

// Classes and interfaces: PascalCase  
class MovementSystem { }
interface PlayerComponent { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_PLAYERS_PER_ROOM = 50;
const DEFAULT_HEALTH = 100;

// Files: kebab-case
// movement-system.ts, player-component.ts
```

#### Type Safety (TypeScript Best Practice)
```typescript
// ✅ Industry standard: Explicit types
interface GameResult<T> {
  success: boolean;
  data?: T;
  error?: GameError;
}

// ✅ Branded types for IDs (security best practice)
type PlayerId = string & { readonly brand: unique symbol };
type RoomId = string & { readonly brand: unique symbol };

// ✅ Discriminated unions (TypeScript best practice)
type GameEvent = 
  | { type: 'player:moved'; data: PlayerMovedData }
  | { type: 'combat:started'; data: CombatStartedData }
  | { type: 'ability:used'; data: AbilityUsedData };
```

### ECS Industry Standards

#### Component Definition (Standard ECS Pattern)
```typescript
// ✅ Industry standard: Pure data components
interface Component {
  readonly type: string;
}

interface LocationComponent extends Component {
  readonly type: 'location';
  roomId: string;
  coordinates?: { x: number; y: number; z: number };
}

// ❌ Anti-pattern: Components with behavior
interface BadComponent extends Component {
  type: 'bad';
  data: any;
  update(): void; // Components should not have behavior
}
```

#### System Implementation (Standard ECS Pattern)
```typescript
// ✅ Industry standard: Systems process entities with required components
abstract class BaseSystem {
  abstract readonly requiredComponents: readonly string[];
  
  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly eventEmitter: EventEmitter
  ) {}
  
  abstract update(entities: readonly Entity[], deltaTime: number): void;
  
  // Helper following ECS conventions
  protected getComponent<T extends Component>(
    entity: Entity, 
    type: string
  ): T | undefined {
    return entity.components.get(type) as T | undefined;
  }
}
```

#### Event-Driven Communication (ECS Best Practice)
```typescript
// ✅ Industry standard: Systems communicate through events
class MovementSystem extends BaseSystem {
  async moveEntity(entityId: string, direction: Direction): Promise<GameResult<void>> {
    // Perform movement logic
    const result = await this.executeMovement(entityId, direction);
    
    if (result.success) {
      // Emit event for other systems to react
      this.eventEmitter.emit('entity:moved', {
        entityId,
        from: result.data.from,
        to: result.data.to,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
}

// Other systems react to events, never direct calls
class CombatSystem extends BaseSystem {
  constructor(entityManager: EntityManager, eventEmitter: EventEmitter) {
    super(entityManager, eventEmitter);
    
    // React to movement events
    this.eventEmitter.on('entity:moved', this.onEntityMoved.bind(this));
  }
}
```

## Error Handling (Industry Standard)

### Result Pattern (Rust-inspired, widely adopted)
```typescript
// ✅ Industry standard Result pattern
interface GameResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: GameError;
}

class GameError extends Error {
  constructor(
    message: string,
    public readonly code: GameErrorCode,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GameError';
  }
}

// Helper functions (functional programming best practice)
const success = <T>(data: T): GameResult<T> => ({ success: true, data });
const failure = <T>(error: GameError): GameResult<T> => ({ success: false, error });
```

### Input Validation (Security Best Practice)
```typescript
// ✅ Security industry standard: Validate all inputs
class InputValidator {
  private static readonly MAX_COMMAND_LENGTH = 255;
  private static readonly SAFE_CHARS = /^[a-zA-Z0-9\s\-_.,!?']+$/;
  
  static validateCommand(input: string): GameResult<string> {
    if (!input || typeof input !== 'string') {
      return failure(new GameError('Invalid input type', 'INVALID_INPUT'));
    }
    
    if (input.length > this.MAX_COMMAND_LENGTH) {
      return failure(new GameError('Input too long', 'INPUT_TOO_LONG'));
    }
    
    if (!this.SAFE_CHARS.test(input)) {
      return failure(new GameError('Invalid characters', 'INVALID_CHARACTERS'));
    }
    
    return success(input.trim());
  }
}
```

## Testing Standards (Industry Best Practice)

### Test-Driven Development Process
```typescript
// STEP 1: Write the test FIRST (Red phase)
describe('PlayerInventory', () => {
  it('should add item to inventory', () => {
    const inventory = new PlayerInventory(20); // max 20 slots
    const sword = { id: 'sword-1', name: 'Iron Sword' };
    
    const result = inventory.addItem(sword);
    
    expect(result.success).toBe(true);
    expect(inventory.getItem('sword-1')).toBe(sword);
  });
});

// STEP 2: Write minimal code to pass (Green phase)
class PlayerInventory {
  private items = new Map();
  constructor(private maxSlots: number) {}
  
  addItem(item) {
    this.items.set(item.id, item);
    return { success: true };
  }
  
  getItem(id) {
    return this.items.get(id);
  }
}

// STEP 3: Refactor with confidence (Refactor phase)
// Add types, validation, error handling while tests stay green
```

### What MUST Be Tested (TDD Required)
```typescript
// ✅ Game Logic - TDD Required
class CombatSystem {
  // Write test first, then implement
  calculateDamage(attacker: Entity, defender: Entity): number
}

// ✅ Business Rules - TDD Required  
class RankProgression {
  // Test defines rank requirements before implementation
  canAdvanceRank(player: Player): boolean
}

// ✅ Utilities - TDD Required
class DiceRoller {
  // Test probability distributions first
  roll(sides: number, count: number): number
}

// ❌ Third-Party Integration - Mock Instead
class DatabaseClient {
  // Don't test actual DB connection, use mocks
  async save(entity: Entity): Promise<void>
}
```

### Mocking Strategy (Industry Best Practice)

#### When to Use Vitest Mocks vs Dependency Injection

**Use Dependency Injection for:**
- **External services** (databases, APIs, file systems)
- **Cross-cutting concerns** (authentication, logging)
- **Stateful dependencies** (caches, connections)
- **Third-party libraries** that need abstraction (bcrypt, JWT)

```typescript
// ✅ Dependency injection for external services
interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

class PlayerRepository {
  constructor(
    private db: Database,
    private passwordHasher: PasswordHasher // Injected dependency
  ) {}
}

// In tests:
const mockPasswordHasher: PasswordHasher = {
  hash: vi.fn().mockResolvedValue('mocked_hash'),
  verify: vi.fn().mockResolvedValue(true)
};

const repository = new PlayerRepository(mockDb, mockPasswordHasher);
```

**Use Vitest Mocks for:**
- **Module imports** that can't be injected
- **Static methods and utilities**
- **Time-based functions** (Date.now, setTimeout)
- **Node.js built-ins** (fs, path, crypto)

```typescript
// ✅ Vitest mocks for modules
vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => mockDrizzleInstance)
}));

// ✅ Vitest mocks for time
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-01'));

// ✅ Vitest mocks for Node built-ins
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('file contents')
}));
```

#### Mock Implementation Guidelines

```typescript
// ✅ CORRECT: Type-safe mock with proper interface
const createMockRepository = (): PlayerRepository => ({
  findById: vi.fn(),
  findByUsername: vi.fn(),
  create: vi.fn(),
  updateLastLogin: vi.fn(),
  exists: vi.fn(),
  validateCredentials: vi.fn()
});

// ❌ WRONG: Using 'as any' without proper typing
const mockRepo = {
  someMethod: vi.fn()
} as any; // Avoid this!

// ✅ CORRECT: Clear mock setup in tests
describe('PlayerService', () => {
  let service: PlayerService;
  let mockRepo: PlayerRepository;
  
  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new PlayerService(mockRepo);
    vi.clearAllMocks(); // Clear mock history
  });
  
  it('should authenticate player', async () => {
    // Arrange
    vi.mocked(mockRepo.validateCredentials).mockResolvedValue({
      success: true,
      data: mockPlayer
    });
    
    // Act & Assert
    const result = await service.authenticate('user', 'pass');
    expect(result.success).toBe(true);
  });
});
```

### Test Structure
```typescript
// ✅ Industry standard: AAA pattern (Arrange, Act, Assert)
describe('MovementSystem', () => {
  let system: MovementSystem;
  let mockEntityManager: EntityManager;
  
  beforeEach(() => {
    // Arrange
    mockEntityManager = createMockEntityManager();
    system = new MovementSystem(mockEntityManager, new EventEmitter());
  });
  
  it('should move entity to valid room', async () => {
    // Arrange
    const entity = createMockEntity({ id: 'player1' });
    const targetRoom = createMockRoom({ id: 'room2' });
    
    // Act
    const result = await system.moveEntity('player1', Direction.North);
    
    // Assert
    expect(result.success).toBe(true);
    expect(entity.getComponent('location').roomId).toBe('room2');
  });
});
```

### Mock Utilities (Testing Best Practice)
```typescript
// ✅ Factory pattern for test data
export const TestFactories = {
  createMockEntity: (overrides: Partial<Entity> = {}): Entity => ({
    id: 'mock-entity',
    components: new Map(),
    ...overrides
  }),
  
  createMockPlayer: (overrides: Partial<Player> = {}): Player => ({
    id: 'mock-player',
    name: 'TestPlayer',
    rank: Rank.Iron,
    ...overrides
  })
};

// ✅ Mock service factories
export const createMockPasswordHasher = (): PasswordHasher => ({
  hash: vi.fn().mockImplementation(async (password) => `hashed_${password}`),
  verify: vi.fn().mockImplementation(async (password, hash) => hash === `hashed_${password}`)
});

export const createMockDatabase = () => ({
  query: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn()
});
```

## Performance Standards (Node.js Best Practices)

### Async Patterns
```typescript
// ✅ Industry standard: Proper async/await usage
async function processPlayerActions(players: readonly Player[]): Promise<void> {
  // Parallel processing when possible
  await Promise.all(
    players.map(player => this.processPlayerAction(player))
  );
}

// ✅ Sequential when operations depend on each other
async function executePlayerTurn(player: Player, action: Action): Promise<GameResult<void>> {
  const validation = await this.validateAction(player, action);
  if (!validation.success) return validation;
  
  const execution = await this.executeAction(player, action);
  if (!execution.success) return execution;
  
  return this.processAfterEffects(player, execution.data);
}
```

### Memory Management
```typescript
// ✅ Industry standard: Proper resource cleanup
class SystemManager {
  private readonly systems: System[] = [];
  
  addSystem(system: System): void {
    this.systems.push(system);
  }
  
  async shutdown(): Promise<void> {
    // Clean up resources following Node.js best practices
    await Promise.all(
      this.systems.map(system => system.dispose?.())
    );
    this.systems.length = 0;
  }
}
```

## Security Standards (Industry Best Practice)

### Input Sanitization
```typescript
// ✅ Security best practice: Never trust user input
class SecurityManager {
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>"&]/g, '') // XSS prevention
      .trim()
      .substring(0, 255); // DoS prevention
  }
  
  // ❌ NEVER: Dynamic code execution
  // eval(userInput) - FORBIDDEN
  // new Function(userInput) - FORBIDDEN
  // import(userInput) - FORBIDDEN
}
```

## Development Workflow (Industry Standard)

### Git Workflow
```bash
# Branch naming
feature/player-movement-system
bugfix/combat-cooldown-issue  
refactor/improve-error-handling

# Commit format (Conventional Commits standard)
feat: add player movement system with collision detection
fix: resolve combat cooldown calculation error
refactor: improve error handling patterns
test: add unit tests for movement system
```

### Pre-commit Requirements
```bash
# Must pass before any commit
pnpm run typecheck  # TypeScript compilation
pnpm run lint       # ESLint + Prettier
pnpm run test       # All tests pass
pnpm run test:coverage # 90% coverage minimum
```

## Quality Gates (Industry Standard)

### Definition of Done
A feature is complete when:
1. **Functionality**: Meets requirements and passes acceptance criteria
2. **Code Quality**: Follows all standards in this document
3. **Testing**: 90%+ coverage with all test types
4. **Documentation**: Public APIs documented with JSDoc
5. **Review**: Approved by at least one other developer
6. **Security**: Passes security scan and review
7. **Performance**: Meets performance requirements

### Code Review Checklist
- [ ] Follows ECS architecture patterns
- [ ] Uses TypeScript strict mode correctly
- [ ] Has comprehensive tests with good coverage
- [ ] Follows security best practices
- [ ] Has proper error handling with Result pattern
- [ ] Uses industry-standard naming conventions
- [ ] No performance anti-patterns

---

**These standards are based on established industry practices for TypeScript, ECS architecture, and secure Node.js development. Compliance is mandatory for all code.**