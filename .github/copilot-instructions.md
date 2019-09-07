# Valkyrie Bootstrap Compiler - Copilot Instructions

## Project Overview

This is the **Valkyrie Bootstrap Compiler**, a self-hosting compiler for the Valkyrie programming language. The project is currently in the bootstrap phase, which means it compiles itself using a previous version of the compiler.

## Project Structure

- **`test/`** - Contains `.vk` test files. Run tests using `pnpm test`
- **`bootstrap/`** - Contains generated JavaScript files from the bootstrap process (binary-like files)
  - ⚠️ **DO NOT MODIFY** these files unless absolutely necessary - they are overwritten during each bootstrap
- **`library/`** - Contains the actual Valkyrie source code that you should modify
  - `ast/` - Abstract Syntax Tree definitions
  - `compiler/` - Core compiler logic (options, statistics, dependency analysis, namespace management)
  - `generation/` - Code generation modules
  - `lexer/` - Tokenization and lexical analysis
  - `parser/` - Parsing logic and expression handling
- **`dist/stage-0/`** - Bootstrap-generated files (created by `pnpm bootstrap`)

## Build and Test Commands

- **`pnpm bootstrap`** - Self-bootstrap the compiler (main build command)
- **`pnpm test`** - Run all tests and format code
- **`pnpm test --stage-0`** - Test stage-0 files when bootstrap fails
- **`pnpm compile`** - Compile Valkyrie files
- **`pnpm compile-dir`** - Compile entire directories
- **`pnpm fmt`** - Format JavaScript output files

## Valkyrie Language Syntax

The Valkyrie language is still in bootstrap phase - **avoid introducing complex syntax**.

### Key Syntax Rules:
- **Comments**: Use `#` for comments (not `//`)
- **Functions**: Use `micro` keyword instead of `function`
- **Namespaces**: Within the same namespace, `micro` and `class` are automatically shared (no `using` needed)

### Naming Conventions (Rust-style):
- **Classes, Traits**: `PascalCase`
- **Singletons**: `UPPER_SNAKE_CASE`
- **Functions (micro), Fields, Methods**: `snake_case`
- **Flags, Eidos**: `UPPER_SNAKE_CASE`

### Example Valkyrie Code:
```valkyrie
# This is a comment
namespace demo::showcase;

using math::utils::add;

# Demonstrate namespace and using mechanism
micro demonstrateNamespace() {
    console.log("Namespace demo starting...");
    
    # Create a simple calculator class
    let calc = new SimpleCalculator();
    let result = calc.calculate(10, 5);
    
    console.log("Calculation result: " + result);
    return result;
}

class SimpleCalculator {
    field = 42;
    
    micro calculate(self, a, b) {
        # In actual namespace implementation, this would call add function
        # Currently as demo, directly use addition
        return a + b;
    }
    
    micro getVersion(self) {
        return "1.0.0";
    }
}
```

### Important Syntax Notes:
- **Namespace Declaration**: `namespace package::compiler;` (use `::` for nested namespaces)
- **Using Statements**: `using package::parser::Node;` (import specific classes/functions)
- **Method Parameters**: Include `self` as first parameter for class methods
- **Field Declaration**: `field = 42;` (simple field assignment)
- **Constructor**: Use `constructor(param)` for class constructors
- **Object Creation**: `let obj = new ClassName();`

## Development Guidelines

### File Organization:
- **Keep logic separated** - don't put too much logic in a single Valkyrie file
- Use the namespace mechanism to organize code properly
- Each file should have a focused responsibility

### Memory Optimization:
- Use `--max-old-space-size=256` for quick detection of memory issues
- The bootstrap process can be memory-intensive

### Testing Strategy:
- All `.vk` files in `test/` directory are test cases
- Tests should cover both successful compilation and error cases
- Include tests for namespace integration, dependency analysis, and code generation

## Acceptance Criteria

For any changes to be considered complete:

1. **Bootstrap Success**: Run `pnpm bootstrap` **twice consecutively** - both must succeed
2. **Test Passing**: Run `pnpm test` - all tests must pass
3. **Syntax Compliance**: Fix any old syntax issues and ensure Valkyrie syntax compliance

## Common Tasks Suitable for Copilot

### ✅ Good Tasks:
- Fix compilation errors in Valkyrie source files (`.valkyrie` files in `library/`)
- Add new test cases for language features (`.vk` files in `test/`)
- Improve error messages in the compiler modules
- Optimize code generation logic in `library/generation/`
- Add new micro functions to existing namespaces
- Fix namespace resolution issues in `NamespaceManager.valkyrie`
- Improve dependency analysis in `DependencyAnalyzer.valkyrie`
- Add utility functions to existing modules
- Fix lexer token recognition issues
- Improve parser expression handling
- Add new AST node types
- Enhance JavaScript code generation
- Fix circular dependency detection
- Improve compiler statistics and options handling

### ❌ Tasks to Avoid:
- Major architectural changes to the bootstrap process
- Modifying generated JavaScript files in `bootstrap/` directory
- Complex cross-namespace refactoring without understanding dependencies
- Changes that require deep knowledge of the self-hosting process
- Modifying the core bootstrap logic without thorough testing
- Large-scale syntax changes that break existing tests

## Error Handling

When bootstrap fails:
1. Check `dist/stage-0/` for intermediate compilation results
2. Use `pnpm test --stage-0` to isolate stage-0 issues
3. Look for syntax errors in `.valkyrie` files
4. Check for circular dependencies between namespaces
5. Verify namespace declarations and imports

## Code Style

- Follow existing patterns in the codebase
- Use descriptive variable names following snake_case convention
- Add comments using `#` for complex logic
- Keep functions focused and small
- Maintain consistent indentation and formatting

## Dependencies

- The project uses Node.js and pnpm
- No external runtime dependencies (self-contained)
- Development dependencies are minimal by design
- The compiler generates standard JavaScript output

## Important Notes

- This is a **self-hosting compiler** - changes affect the compilation of the compiler itself
- Always test bootstrap process after making changes
- The project is designed to be minimal and focused during the bootstrap phase
- Generated JavaScript should be readable and debuggable