# Changelog

## [Unreleased]

### Changed
- **Better timestamp handling**: Switched from manual Unix timestamp conversion to Drizzle's built-in `timestamp` mode with `$defaultFn` and `$onUpdateFn` for automatic timestamp management
- **Cleaner module names**: Removed D1-specific suffixes from module names since we're using standard SQLite approach compatible with both D1 and better-sqlite3
  - `schema-d1.ts` → `schema.ts`
  - `test-setup-d1.ts` → `test-setup.ts`
  - `fixtures-d1.ts` → `fixtures.ts`
  - `d1-connection.ts` → `connection.ts`

### Fixed
- Repository methods now properly handle potential undefined returns from `.returning()` calls
- Type safety improvements for all database operations
- Consistent Date object handling throughout the application

### Benefits
- **Simplified code**: No more manual timestamp conversion in every repository method
- **Better type safety**: Date fields are properly typed as Date objects instead of numbers
- **Cleaner architecture**: Schema handles defaults automatically, repositories focus on business logic
- **Fewer bugs**: Automatic timestamp management reduces human error
- **Easier testing**: Work with JavaScript Date objects natively in tests