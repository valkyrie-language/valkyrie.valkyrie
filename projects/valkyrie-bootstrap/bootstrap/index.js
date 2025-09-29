// using ;
// using ;
// using ;
// using ;
class package__analyzer__Analyzer {
    constructor() {
        this.symbol_table = new package__analyzer__SymbolTable();
        this.type_checker = new package__analyzer__TypeChecker();
    }

    analyze(ast) {
        this.symbol_table.enter_scope("global");
        this.visit_node(ast);
        this.type_checker.check_symbol_table(this.symbol_table);
        return this.symbol_table;
    }

    get_type_errors() {
        return this.type_checker.get_errors();
    }

    get_type_warnings() {
        return this.type_checker.get_warnings();
    }

    has_type_errors() {
        return this.type_checker.has_errors();
    }

    visit_node(node) {
        if (!node) {
            return;
        }
        if (node.type === "ClassStatement") {
            this.visit_class_statement(node);
        } else if (node.type === "FunctionStatement") {
            this.visit_function_statement(node);
        } else if (node.type === "LetStatement") {
            this.visit_let_statement(node);
        } else if (node.type === "Identifier") {
            this.visit_identifier(node);
        } else if (node.type === "MicroCall") {
            this.visit_micro_call(node);
        } else if (node.type === "NamespaceStatement") {
            this.visit_namespace_statement(node);
        } else if (node.type === "UsingStatement") {
            this.visit_using_statement(node);
        } else {
            this.visit_generic_node(node);
        }
        if (node.children) {
            let i = 0;
            while (i < node.children.length) {
                this.visit_node(node.children[i]);
                i = i + 1;
            }
        }
    }

    visit_class_statement(node) {
        let symbol = package__analyzer__Symbol.from_node(node, "class");
        symbol.is_exported = true;
        this.symbol_table.add_symbol(symbol);
        if (symbol.name) {
            this.symbol_table.enter_scope(symbol.name);
        }
    }

    visit_function_statement(node) {
        let symbol = package__analyzer__Symbol.from_node(node, "function");
        symbol.is_exported = true;
        this.symbol_table.add_symbol(symbol);
        if (symbol.name) {
            this.symbol_table.enter_scope(symbol.name);
        }
    }

    visit_let_statement(node) {
        let symbol = package__analyzer__Symbol.from_node(node, "variable");
        symbol.is_mutable = true;
        this.symbol_table.add_symbol(symbol);
    }

    visit_identifier(node) {
        let symbol = package__analyzer__Symbol.from_node(node, "identifier");
        if (node.namepath && node.namepath.length > 1) {
            let current_namespace = this.symbol_table.get_current_namespace();
            if (current_namespace) {
                let is_in_namespace = true;
                let i = 0;
                while (i < current_namespace.length) {
                    if (
                        i >= node.namepath.length ||
                        node.namepath[i] != current_namespace[i]
                    ) {
                        is_in_namespace = false;
                        break;
                    }
                    i = i + 1;
                }
                if (is_in_namespace) {
                    symbol.namespace_path = current_namespace;
                    symbol.resolved_name =
                        node.namepath[node.namepath.length - 1];
                    symbol.full_namepath = node.namepath;
                }
            }
        }
        let existing = this.symbol_table.find_symbol(symbol.name);
        if (existing) {
            existing.references.push(symbol);
        } else {
            this.symbol_table.add_symbol(symbol);
        }
    }

    visit_micro_call(node) {
        let symbol = package__analyzer__Symbol.from_node(node, "micro_call");
        this.symbol_table.add_symbol(symbol);
    }

    visit_namespace_statement(node) {
        let symbol = package__analyzer__Symbol.from_node(node, "namespace");
        this.symbol_table.add_symbol(symbol);
        if (symbol.name) {
            this.symbol_table.enter_scope(symbol.name);
        }
    }

    visit_using_statement(node) {
        let symbol = package__analyzer__Symbol.from_node(node, "using");
        this.symbol_table.add_symbol(symbol);
    }

    visit_generic_node(node) {
        let symbol = package__analyzer__Symbol.from_node(node, "generic");
        if (symbol.name) {
            this.symbol_table.add_symbol(symbol);
        }
    }
}
// using ;
// using ;
class package__analyzer__Symbol {
    constructor(node, symbol_type) {
        this.node = node;
        this.symbol_type = symbol_type;
        this.name = false;
        this.value = false;
        this.data_type = false;
        this.scope = false;
        this.source_span = false;
        this.is_mutable = false;
        this.is_exported = false;
        this.references = [];
        this.namespace_path = [];
        this.resolved_name = false;
        this.full_namepath = [];
    }

    static from_node(node, symbol_type) {
        let symbol = new package__analyzer__Symbol(node, symbol_type);
        return symbol;
    }

    create_source_span(file_name) {
        if (this.node && this.node.has_valid_position()) {
            let end_line = this.node.line;
            let end_column = this.node.column + this.node.length;
            return new package__generation__SourceSpan(
                file_name,
                this.node.line,
                this.node.column,
                end_line,
                end_column
            );
        }
        return false;
    }

    has_valid_source_position() {
        return this.node && this.node.has_valid_position();
    }
}
// using ;
class package__analyzer__SymbolTable {
    constructor() {
        this.symbols = {};
        this.scopes = [];
        this.current_scope = false;
    }

    enter_scope(scope_name) {
        let scope = {
            name: scope_name,
            symbols: {},
            parent: this.current_scope,
        };
        this.scopes.push(scope);
        this.current_scope = scope;
    }

    exit_scope() {
        if (this.scopes.length > 0) {
            this.scopes.pop();
            if (this.scopes.length > 0) {
                this.current_scope = this.scopes[this.scopes.length - 1];
            } else {
                this.current_scope = false;
            }
        }
    }

    add_symbol(symbol) {
        if (this.current_scope && symbol.name) {
            this.current_scope.symbols[symbol.name] = symbol;
            symbol.scope = this.current_scope;
        }
        if (symbol.name) {
            this.symbols[symbol.name] = symbol;
        }
    }

    find_symbol(name) {
        let scope = this.current_scope;
        while (scope) {
            if (scope.symbols[name]) {
                return scope.symbols[name];
            }
            scope = scope.parent;
        }
        if (this.symbols[name]) {
            return this.symbols[name];
        }
        return false;
    }

    get_current_scope_symbols() {
        if (this.current_scope) {
            return this.current_scope.symbols;
        }
        return {};
    }

    get_all_symbols() {
        return this.symbols;
    }

    get_current_namespace() {
        if (!this.current_scope) {
            return [];
        }
        let namespace = [];
        let scope = this.current_scope;
        while (scope && scope.name != "global") {
            namespace.unshift(scope.name);
            scope = scope.parent;
        }
        return namespace;
    }
}
class package__analyzer__Type {
    constructor(name) {
        this.name = name;
        this.is_primitive = false;
        this.is_nullable = false;
        this.is_array = false;
        this.is_flags = false;
        this.is_eidos = false;
        this.element_type = false;
        this.properties = {};
        this.members = {};
    }

    static create_primitive(type_name) {
        let ty = new package__analyzer__Type(type_name);
        ty.is_primitive = true;
        return ty;
    }

    static create_array(element_type) {
        let ty = new package__analyzer__Type(element_type.name + "[]");
        ty.is_array = true;
        ty.element_type = element_type;
        return ty;
    }

    static create_nullable(base_type) {
        let ty = new package__analyzer__Type(base_type.name + "?");
        ty.is_nullable = true;
        ty.element_type = base_type;
        return ty;
    }

    static create_flags(type_name, members) {
        let ty = new package__analyzer__Type(type_name);
        ty.is_flags = true;
        ty.members = members;
        return ty;
    }

    static create_eidos(type_name, members) {
        let ty = new package__analyzer__Type(type_name);
        ty.is_eidos = true;
        ty.members = members;
        return ty;
    }

    is_compatible_with(other) {
        if (this.name == other.name) {
            return true;
        }
        if (other.is_nullable && this.element_type) {
            return this.is_compatible_with(other.element_type);
        }
        if (this.is_array && other.is_array) {
            if (this.element_type && other.element_type) {
                return this.element_type.is_compatible_with(other.element_type);
            }
        }
        return false;
    }

    to_string() {
        return this.name;
    }
}
class package__analyzer__TypeFactory {
    constructor() {
        this.builtin_types = {};
        this.setup_builtin_types();
    }

    setup_builtin_types() {
        this.builtin_types["bool"] =
            package__analyzer__Type.create_primitive("bool");
        this.builtin_types["i32"] =
            package__analyzer__Type.create_primitive("i32");
        this.builtin_types["i64"] =
            package__analyzer__Type.create_primitive("i64");
        this.builtin_types["f32"] =
            package__analyzer__Type.create_primitive("f32");
        this.builtin_types["f64"] =
            package__analyzer__Type.create_primitive("f64");
        this.builtin_types["String"] =
            package__analyzer__Type.create_primitive("String");
        this.builtin_types["Object"] =
            package__analyzer__Type.create_primitive("Object");
        this.builtin_types["void"] =
            package__analyzer__Type.create_primitive("void");
        this.builtin_types["unknown"] =
            package__analyzer__Type.create_primitive("unknown");
        this.builtin_types["any"] =
            package__analyzer__Type.create_primitive("any");
    }

    get_builtin_type(name) {
        if (this.builtin_types[name]) {
            return this.builtin_types[name];
        }
        return this.builtin_types["unknown"];
    }

    is_builtin_type(name) {
        return this.builtin_types[name] != false;
    }

    infer_from_literal(value) {
        if (value == "true" || value == "false") {
            return this.builtin_types["bool"];
        }
        if (this.is_integer_literal(value)) {
            return this.builtin_types["i32"];
        }
        if (this.is_float_literal(value)) {
            return this.builtin_types["f64"];
        }
        if (this.is_string_literal(value)) {
            return this.builtin_types["String"];
        }
        return this.builtin_types["unknown"];
    }

    is_integer_literal(value) {
        return true;
    }

    is_float_literal(value) {
        return true;
    }

    is_string_literal(value) {
        return true;
    }
}
// using ;
// using ;
// using ;
// using ;
// using ;
class package__analyzer__TypeChecker {
    constructor() {
        this.type_factory = new package__analyzer__TypeFactory();
        this.errors = [];
        this.warnings = [];
    }

    check_symbol_table(symbol_table) {
        this.errors = [];
        this.warnings = [];
        let all_symbols = symbol_table.get_all_symbols();
        this.check_symbols(all_symbols);
    }

    check_symbols(symbols) {}

    check_symbol_type(symbol) {
        if (!symbol) {
            return;
        }
        if (symbol.symbol_type == "variable") {
            this.check_variable_type(symbol);
        } else if (symbol.symbol_type == "function") {
            this.check_function_type(symbol);
        } else if (symbol.symbol_type == "class") {
            this.check_class_type(symbol);
        } else if (symbol.symbol_type == "micro_call") {
            this.check_micro_call_type(symbol);
        } else if (symbol.symbol_type == "flags") {
            this.check_flags_type(symbol);
        } else if (symbol.symbol_type == "eidos") {
            this.check_eidos_type(symbol);
        } else if (symbol.symbol_type == "static_access") {
            this.check_static_access_type(symbol);
        }
    }

    check_variable_type(symbol) {
        if (!symbol.data_type && symbol.value) {
            symbol.data_type = this.type_factory.infer_from_literal(
                symbol.value
            );
        }
        if (!symbol.data_type) {
            symbol.data_type = this.type_factory.get_builtin_type("unknown");
            this.add_warning("Variable '" + symbol.name + "' has unknown type");
        }
    }

    check_function_type(symbol) {
        if (!symbol.data_type) {
            symbol.data_type = this.type_factory.get_builtin_type("void");
        }
    }

    check_class_type(symbol) {
        if (!symbol.data_type) {
            let class_type = new package__analyzer__Type(symbol.name);
            symbol.data_type = class_type;
        }
    }

    check_micro_call_type(symbol) {
        if (!symbol.data_type) {
            symbol.data_type = this.type_factory.get_builtin_type("unknown");
        }
    }

    check_flags_type(symbol) {
        let flags_type = this.type_factory.create_flags(symbol.name);
        if (symbol.members) {
            let i = 0;
            while (i < symbol.members.length) {
                let member = symbol.members[i];
                if (member.value && !this.is_integer_value(member.value)) {
                    this.add_error(
                        "Flags member '" +
                            member.name +
                            "' must have integer value"
                    );
                }
                i = i + 1;
            }
        }
        symbol.data_type = flags_type;
    }

    check_eidos_type(symbol) {
        let eidos_type = this.type_factory.create_eidos(symbol.name);
        if (symbol.members) {
            let i = 0;
            while (i < symbol.members.length) {
                let member = symbol.members[i];
                if (member.value && !this.is_integer_value(member.value)) {
                    this.add_error(
                        "Eidos member '" +
                            member.name +
                            "' must have integer value"
                    );
                }
                i = i + 1;
            }
        }
        symbol.data_type = eidos_type;
    }

    check_static_access_type(symbol) {
        let left_type = symbol.left_type;
        let member_name = symbol.member_name;
        if (!left_type) {
            this.add_error("Cannot resolve type for static access");
            return;
        }
        if (left_type.is_flags || left_type.is_eidos) {
            if (!left_type.members || !left_type.members[member_name]) {
                this.add_error(
                    "Member '" +
                        member_name +
                        "' not found in " +
                        left_type.name
                );
                return;
            }
            symbol.data_type = this.type_factory.get_builtin_type("i32");
        } else {
            this.add_error(
                "Static access (::) can only be used with flags or eidos types"
            );
        }
    }

    is_integer_value(value) {
        return typeof value == "number" && value % 1 == 0;
    }

    check_type_compatibility(expected, actual, context) {
        if (!expected || !actual) {
            return false;
        }
        if (expected.is_compatible_with(actual)) {
            return true;
        }
        let error_msg =
            "Type mismatch in " +
            context +
            ": expected " +
            expected.to_string() +
            ", got " +
            actual.to_string();
        this.add_error(error_msg);
        return false;
    }

    add_error(message) {
        this.errors.push(message);
    }

    add_warning(message) {
        this.warnings.push(message);
    }

    get_errors() {
        return this.errors;
    }

    get_warnings() {
        return this.warnings;
    }

    has_errors() {
        return this.errors.length > 0;
    }

    has_warnings() {
        return this.warnings.length > 0;
    }
}
class package__ast__IdentifierNode {
    constructor() {
        this.type = "Identifier";
        this.name = "";
    }
}
class package__ast__NamepathNode {
    constructor() {
        this.type = "NamePath";
        this.name = "";
        this.name_path = [];
    }
}
// using ;
// using ;
// using ;
class package__compiler__Compiler {
    constructor(options) {
        this.options = options || new package__compiler__CompilerOptions();
        this.diagnostics = new package__compiler__CompilerDiagnostics();
    }
}
export function package__compiler__compile_with_compiler(compiler, files) {
    compiler.diagnostics.clear_diagnostics();
    let asts = {};
    let file_paths = Object.keys(files);
    let ast_index = 0;
    while (ast_index < file_paths.length) {
        let path = file_paths[ast_index];
        let source_text = files[path];
        let lexer = new package__lexer__ValkyrieLexer(source_text);
        let tokens = lexer.tokenize();
        if (compiler.diagnostics.has_errors()) {
            ast_index = ast_index + 1;
            continue;
        }
        let parser = new package__parser__ValkyrieParser(compiler.options);
        let program = parser.parse(tokens);
        if (program.type == "ParseError") {
            compiler.diagnostics.add_error(
                path + " " + program.message,
                program.line,
                program.column
            );
        } else {
            asts[path] = program;
        }
        ast_index = ast_index + 1;
    }
    let namespace_groups = {};
    let ast_paths = Object.keys(asts);
    let path_index = 0;
    console.log("Total AST files:", ast_paths.length);
    while (path_index < ast_paths.length) {
        let file_path = ast_paths[path_index];
        let program = asts[file_path];
        if (program && program.statements && program.statements.length > 0) {
            let current_namespace = [];
            let current_body = [];
            let stmt_index = 0;
            while (stmt_index < program.statements.length) {
                let statement = program.statements[stmt_index];
                if (statement && statement.type == "NamespaceStatement") {
                    if (current_namespace.length > 0) {
                        let path_key =
                            package__compiler__make_namespace_key(
                                current_namespace
                            );
                        let group = namespace_groups[path_key];
                        if (!group) {
                            group = new package__compiler__NamespaceGroup(
                                current_namespace
                            );
                            namespace_groups[path_key] = group;
                        }
                        let namespace_node = {};
                        namespace_node["type"] = "NamespaceStatement";
                        namespace_node["file"] = file_path;
                        namespace_node["path"] = current_namespace;
                        namespace_node["is_main_namespace"] = false;
                        namespace_node["body"] = current_body;
                        group.add_namespace(namespace_node);
                        current_namespace = [];
                        current_body = [];
                    }
                    current_namespace = [];
                    if (
                        statement.path &&
                        statement.path.name_path &&
                        statement.path.name_path.length > 0
                    ) {
                        let name_index = 0;
                        while (name_index < statement.path.name_path.length) {
                            let identifier =
                                statement.path.name_path[name_index];
                            if (identifier && identifier.name) {
                                current_namespace.push(identifier.name);
                            }
                            name_index = name_index + 1;
                        }
                    }
                } else {
                    current_body.push(statement);
                }
                stmt_index = stmt_index + 1;
            }
            if (current_namespace.length > 0) {
                let path_key =
                    package__compiler__make_namespace_key(current_namespace);
                let group = namespace_groups[path_key];
                if (!group) {
                    group = new package__compiler__NamespaceGroup(
                        current_namespace
                    );
                    namespace_groups[path_key] = group;
                }
                let namespace_node = {};
                namespace_node["type"] = "NamespaceStatement";
                namespace_node["file"] = file_path;
                namespace_node["path"] = current_namespace;
                namespace_node["is_main_namespace"] = false;
                namespace_node["body"] = current_body;
                group.add_namespace(namespace_node);
            }
        } else {
            console.log("No statements found in program");
        }
        path_index = path_index + 1;
    }
    console.log("Found namespace groups:", Object.keys(namespace_groups));
    let global_symbol_table = {};
    let namespace_keys = Object.keys(namespace_groups);
    let key_index = 0;
    while (key_index < namespace_keys.length) {
        let namespace_key = namespace_keys[key_index];
        let group = namespace_groups[namespace_key];
        group.collect_declarations();
        let decl_index = 0;
        while (decl_index < group.declarations.length) {
            let declaration = group.declarations[decl_index];
            let unique_name = group.generate_unique_name(
                declaration,
                group.path
            );
            if (unique_name != "") {
                global_symbol_table[unique_name] = declaration;
            }
            decl_index = decl_index + 1;
        }
        key_index = key_index + 1;
    }
    key_index = 0;
    while (key_index < namespace_keys.length) {
        let namespace_key = namespace_keys[key_index];
        let group = namespace_groups[namespace_key];
        group.global_symbol_table = global_symbol_table;
        group.resolve();
        key_index = key_index + 1;
    }
    console.log("=== 第四阶段: AST整合和代码生成 ===");
    let combined_ast = {};
    combined_ast["type"] = "Program";
    combined_ast.body = [];
    combined_ast.declarations = [];
    combined_ast.statements = [];
    let group_keys = Object.keys(namespace_groups);
    let group_index = 0;
    while (group_index < group_keys.length) {
        let namespace_key = group_keys[group_index];
        let group = namespace_groups[namespace_key];
        let decl_index = 0;
        while (decl_index < group.declarations.length) {
            let declaration = group.declarations[decl_index];
            combined_ast.declarations.push(declaration);
            decl_index = decl_index + 1;
        }
        let ns_index = 0;
        while (ns_index < group.namespaces.length) {
            let namespace = group.namespaces[ns_index];
            let stmt_index = 0;
            while (stmt_index < namespace.body.length) {
                let statement = namespace.body[stmt_index];
                combined_ast.body.push(statement);
                combined_ast.statements.push(statement);
                stmt_index = stmt_index + 1;
            }
            ns_index = ns_index + 1;
        }
        group_index = group_index + 1;
    }
    let code_generator = new package__generation__JsCodeGeneration(
        "  ",
        compiler.options
    );
    let generated_code = code_generator.generate(combined_ast);
    console.log("=== 代码生成完成 ===");
    return {
        success: !compiler.diagnostics.has_errors(),
        diagnostics: compiler.diagnostics.get_all_diagnostics(),
        code: generated_code,
    };
}
export function package__compiler__make_namespace_key(namespace_path) {
    if (namespace_path.length == 0) {
        return "";
    }
    return namespace_path.join("__");
}
// using ;
class package__compiler__CompilerDiagnostics {
    constructor() {
        this.diagnostics = [];
    }

    get_all_diagnostics() {
        let result = [];
        let i = 0;
        while (i < this.diagnostics.length) {
            result.push(this.diagnostics[i]);
            i = i + 1;
        }
        return result;
    }

    add_error(message, line, column) {
        this.diagnostics.push({
            level: package__compiler__DiagnosticLevel.ERROR,
            message: message,
            line: line,
            column: column,
        });
    }

    add_warning(message, line, column) {
        this.diagnostics.push({
            level: package__compiler__DiagnosticLevel.WARNING,
            message: message,
            line: line,
            column: column,
        });
    }

    has_errors() {
        let i = 0;
        while (i < this.diagnostics.length) {
            if (
                this.diagnostics[i].level ==
                package__compiler__DiagnosticLevel.ERROR
            ) {
                return true;
            }
            i = i + 1;
        }
        return false;
    }

    has_warnings() {
        let i = 0;
        while (i < this.diagnostics.length) {
            if (
                this.diagnostics[i].level ==
                package__compiler__DiagnosticLevel.WARNING
            ) {
                return true;
            }
            i = i + 1;
        }
        return false;
    }

    clear_diagnostics() {
        this.diagnostics = [];
    }
}
const package__compiler__LintLevel = {
    ALLOWED: 0,
    WARNING: 1,
    DISABLE: 2,
};
Object.freeze(package__compiler__LintLevel);
const package__compiler__DiagnosticLevel = {
    ERROR: 0,
    WARNING: 1,
};
Object.freeze(package__compiler__DiagnosticLevel);
const package__compiler__CompileMode = {
    STANDARD: 0,
    REPL: 1,
};
Object.freeze(package__compiler__CompileMode);
const package__compiler__OutputFormat = {
    JS: 0,
};
Object.freeze(package__compiler__OutputFormat);
class package__compiler__CompilerOptions {
    constructor(output_format, enable_source_map, enable_optimization, mode) {
        this.output_format =
            output_format || package__compiler__OutputFormat.JS;
        this.source_map = enable_source_map || false;
        this.enable_source_map = enable_source_map || false;
        this.enable_optimization = enable_optimization || false;
        this.mode = mode || package__compiler__CompileMode.STANDARD;
        this.implicit_member_call = package__compiler__LintLevel.WARNING;
    }
}
class package__compiler__CompilerStatistics {
    constructor() {
        self.output_size = undefined;
        this.tokens_count = 0;
        this.ast_nodes_count = 0;
        this.compilation_time = 0;
        this.output_size = 0;
    }
}
// using ;
// using ;
// using ;
class package__compiler__DependencyAnalyzer {
    constructor() {
        this.dependencies = {};
        this.reverse_dependencies = {};
    }

    topological_sort(file_contents) {
        let file_names = Object.keys(file_contents);
        let visited = {};
        let sorted = [];
        let i = 0;
        while (i < file_names.length) {
            visited[file_names[i]] = false;
            i = i + 1;
        }
        let j = 0;
        while (j < file_names.length) {
            this.simple_dfs_visit(file_names[j], visited, sorted);
            j = j + 1;
        }
        return { sorted: sorted, error: null };
    }

    simple_dfs_visit(file_path, visited, sorted) {
        if (visited[file_path]) {
            return;
        }
        visited[file_path] = true;
        let dependencies = this.dependencies[file_path];
        if (dependencies != null) {
            let i = 0;
            while (i < dependencies.length) {
                this.simple_dfs_visit(dependencies[i], visited, sorted);
                i = i + 1;
            }
        }
        sorted.push(file_path);
    }
}
class package__compiler__NamespaceGroup {
    constructor(path) {
        this.path = path;
        this.namespaces = [];
        this.declarations = [];
        this.unique_names = {};
    }

    add_namespace(part) {
        this.namespaces.push(part);
    }

    collect_declarations() {
        this.declarations = [];
        let ns_index = 0;
        while (ns_index < this.namespaces.length) {
            let namespace = this.namespaces[ns_index];
            if (namespace.body && namespace.body.length > 0) {
                let stmt_index = 0;
                while (stmt_index < namespace.body.length) {
                    let statement = namespace.body[stmt_index];
                    this.add_declaration(statement);
                    stmt_index = stmt_index + 1;
                }
            }
            ns_index = ns_index + 1;
        }
    }

    add_declaration(declaration) {
        if (declaration && declaration.type) {
            let valid_types = Array();
            valid_types.push("UsingStatement");
            valid_types.push("ClassDeclaration");
            valid_types.push("MicroDeclaration");
            valid_types.push("SingletonDeclaration");
            valid_types.push("EidosDeclaration");
            valid_types.push("FlagsDeclaration");
            valid_types.push("TraitDeclaration");
            let is_valid = false;
            let type_index = 0;
            while (type_index < valid_types.length) {
                if (valid_types[type_index] == declaration.type) {
                    is_valid = true;
                    break;
                }
                type_index = type_index + 1;
            }
            if (is_valid) {
                this.declarations.push(declaration);
            }
        }
    }

    generate_unique_name(declaration, namespace_path) {
        if (
            declaration.type == "UsingStatement" &&
            declaration.path &&
            declaration.path.name_path
        ) {
            let fqn_parts = [];
            let name_index = 0;
            while (name_index < declaration.path.name_path.length) {
                let identifier = declaration.path.name_path[name_index];
                if (identifier && identifier.name) {
                    fqn_parts.push(identifier.name);
                }
                name_index = name_index + 1;
            }
            return fqn_parts.join("__");
        }
        let base_name = "";
        if (declaration.name) {
            base_name = declaration.name;
        }
        if (base_name == "") {
            return "";
        }
        let full_path = namespace_path.slice();
        full_path.push(base_name);
        return full_path.join("__");
    }

    resolve() {
        this.collect_declarations();
        let decl_index = 0;
        while (decl_index < this.declarations.length) {
            let declaration = this.declarations[decl_index];
            let unique_name = this.generate_unique_name(declaration, this.path);
            if (unique_name != "") {
                this.unique_names[unique_name] = declaration;
                declaration.unique_name = unique_name;
            }
            decl_index = decl_index + 1;
        }
        let ns_index = 0;
        while (ns_index < this.namespaces.length) {
            let namespace = this.namespaces[ns_index];
            if (namespace.body && namespace.body.length > 0) {
                let stmt_index = 0;
                while (stmt_index < namespace.body.length) {
                    let statement = namespace.body[stmt_index];
                    this.resolve_statement(statement);
                    stmt_index = stmt_index + 1;
                }
            }
            ns_index = ns_index + 1;
        }
    }

    resolve_statement(statement) {
        if (!statement) {
            return;
        }
        if (statement.type === "UsingStatement") {
            return;
        } else if (statement.type === "ClassDeclaration") {
            statement.unique_name = this.resolve_unique_name(statement.name);
            let member_index = 0;
            while (member_index < statement.members.length) {
                let member = statement.members[member_index];
                this.resolve_statement(member);
                member_index = member_index + 1;
            }
        } else if (statement.type === "Property") {
        } else if (statement.type === "MicroDeclaration") {
            statement.unique_name = this.resolve_unique_name(statement.name);
            this.resolve_statement(statement.body);
        } else if (statement.type === "SingletonDeclaration") {
            this.resolve_expression(statement.initializer);
        } else if (statement.type === "EidosDeclaration") {
            statement.unique_name = this.resolve_unique_name(statement.name);
        } else if (statement.type === "ConstructorStatement") {
            this.resolve_statement(statement.body);
        } else if (statement.type === "MemberStatement") {
            this.resolve_statement(statement.body);
        } else if (statement.type === "ReturnStatement") {
            this.resolve_expression(statement.value);
        } else if (statement.type === "LetStatement") {
            this.resolve_expression(statement.value);
        } else if (statement.type === "WhileStatement") {
            this.resolve_expression(statement.condition);
            this.resolve_statement(statement.body);
        } else if (statement.type === "IfStatement") {
            this.resolve_expression(statement.condition);
            this.resolve_statement(statement.thenBranch);
            this.resolve_statement(statement.elseBranch);
        } else if (statement.type === "Block") {
            let stmt = 0;
            while (stmt < statement.statements.length) {
                let stmt_node = statement.statements[stmt];
                this.resolve_statement(stmt_node);
                stmt = stmt + 1;
            }
        } else if (statement.type === "ExpressionStatement") {
            this.resolve_expression(statement.expression);
        } else {
            console.log(
                "Unsolved statement type:",
                JSON.stringify(statement.type)
            );
        }
    }

    resolve_expression(expression) {
        if (!expression) {
            return;
        }
        if (expression.type === "String") {
        } else if (expression.type === "Number") {
        } else if (expression.type === "Boolean") {
        } else if (expression.type === "ThisExpression") {
        } else if (expression.type === "Assignment") {
            this.resolve_expression(expression.left);
            this.resolve_expression(expression.right);
        } else if (expression.type === "BinaryOp") {
            this.resolve_expression(expression.left);
            this.resolve_expression(expression.right);
        } else if (expression.type === "UnaryOp") {
            this.resolve_expression(expression.operand);
        } else if (expression.type === "PropertyAccess") {
            this.resolve_expression(expression.object);
        } else if (expression.type === "MicroCall") {
            this.resolve_expression(expression.callee);
            let args = 0;
            while (args < expression.arguments.length) {
                let stmt_node = expression.arguments[args];
                this.resolve_expression(stmt_node);
                args = args + 1;
            }
        } else if (expression.type === "String") {
            console.log("String:", expression);
        } else if (expression.type === "ArrayLiteral") {
            let args = 0;
            while (args < expression.elements.length) {
                let stmt_node = expression.elements[args];
                this.resolve_expression(stmt_node);
                args = args + 1;
            }
        } else if (expression.type === "ArrayAccess") {
            this.resolve_expression(expression.object);
            this.resolve_expression(expression.index);
        } else if (expression.type === "PropertyAccess") {
            console.log("PropertyAccess:", expression);
        } else if (expression.type === "ObjectLiteral") {
            let prop_index = 0;
            while (prop_index < expression.properties.length) {
                let prop = expression.properties[prop_index];
                this.resolve_expression(prop.value);
                prop_index = prop_index + 1;
            }
        } else if (expression.type === "Property") {
            console.log("Property:", expression);
        } else if (expression.type === "PropertyAccess") {
            console.log("PropertyAccess:", expression);
        } else if (expression.type === "MatchExpression") {
            let case_index = 0;
            while (case_index < expression.branches.length) {
                let case_stmt = expression.branches[case_index];
                this.resolve_expression(case_stmt.expression);
                this.resolve_statement(case_stmt.body);
                case_index = case_index + 1;
            }
        } else if (expression.type === "CaseBranch") {
            console.log("CaseBranch:", expression);
        } else if (expression.type === "NewExpression") {
            this.resolve_expression(expression.className);
            let args = 0;
            while (args < expression.arguments.length) {
                let stmt_node = expression.arguments[args];
                this.resolve_expression(stmt_node);
                args = args + 1;
            }
        } else if (expression.type === "MemberExpression") {
            this.resolve_expression(expression.object);
            this.resolve_expression(expression.property);
        } else if (expression.type === "CallExpression") {
            this.resolve_expression(expression.callee);
            if (expression.arguments && expression.arguments.length > 0) {
                let arg_index = 0;
                while (arg_index < expression.arguments.length) {
                    this.resolve_expression(expression.arguments[arg_index]);
                    arg_index = arg_index + 1;
                }
            }
        } else if (expression.type === "AnonymousFunction") {
            this.resolve_statement(expression.body);
        } else if (expression.type === "NamePath") {
            let identifier_name = expression.name_path[0].name;
            expression.unique_name = this.resolve_unique_name(identifier_name);
        } else if (expression.type === "Block") {
            console.trace("Block:", expression);
        } else {
            console.log(
                "Unsolved expression type:",
                JSON.stringify(expression.type)
            );
        }
    }

    resolve_unique_name(name) {
        let unique_names = Object.keys(this.unique_names);
        let name_index = 0;
        while (name_index < unique_names.length) {
            let unique_name = unique_names[name_index];
            let parts = unique_name.split("__");
            let last_part = parts[parts.length - 1];
            if (last_part == name) {
                return unique_name;
            }
            name_index = name_index + 1;
        }
        return name;
    }
}
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
class package__compiler__ScopeManager {
    constructor(source) {
        this.namespaces = {};
        this.usings = {};
        this.current_namespace = [];
        this.current_file = "";
        this.symbol_table = {};
    }

    query_namepath_in_using(file, namepath) {
        if (
            !this.usings ||
            !this.usings[file] ||
            this.usings[file].length == 0
        ) {
            return null;
        }
        let u = 0;
        while (u < this.usings[file].length) {
            let using_import = this.usings[file][u];
            if (using_import.path && using_import.path.length > 0) {
                let last_part = using_import.path[using_import.path.length - 1];
                if (last_part == namepath[0]) {
                    let full_path = using_import.path.concat(namepath.slice(1));
                    return package__generation__join_name_path(full_path, "_");
                }
            }
            u = u + 1;
        }
        return null;
    }

    resolve_namepath_in_statement(
        stmt,
        function_statements,
        variable_statements,
        class_statements,
        options,
        diagnostics
    ) {
        if (stmt == null) {
            return stmt;
        }
        let resolved_stmt = Object.assign({}, stmt);
        if (stmt.type === "LetStatement") {
            resolved_stmt.value = this.resolve_namepath_in_expression(
                stmt.value,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_stmt;
        } else if (stmt.type === "ReturnStatement") {
            resolved_stmt.argument = this.resolve_namepath_in_expression(
                stmt.argument,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_stmt;
        } else if (stmt.type === "ExpressionStatement") {
            resolved_stmt.expression = this.resolve_namepath_in_expression(
                stmt.expression,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_stmt;
        } else if (stmt.type === "IfStatement") {
            resolved_stmt.condition = this.resolve_namepath_in_expression(
                stmt.condition,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            resolved_stmt.consequent = this.resolve_namepath_in_statement(
                stmt.consequent,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            if (stmt.alternate != null) {
                resolved_stmt.alternate = this.resolve_namepath_in_statement(
                    stmt.alternate,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options,
                    diagnostics
                );
            }
            return resolved_stmt;
        } else if (stmt.type === "WhileStatement") {
            resolved_stmt.condition = this.resolve_namepath_in_expression(
                stmt.condition,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            resolved_stmt.body = this.resolve_namepath_in_statement(
                stmt.body,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_stmt;
        } else if (stmt.type === "UntilStatement") {
            resolved_stmt.condition = this.resolve_namepath_in_expression(
                stmt.condition,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            resolved_stmt.body = this.resolve_namepath_in_statement(
                stmt.body,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_stmt;
        } else if (stmt.type === "Block") {
            let resolved_body = [];
            let i = 0;
            while (i < stmt.statements.length) {
                resolved_body.push(
                    this.resolve_namepath_in_statement(
                        stmt.statements[i],
                        function_statements,
                        variable_statements,
                        class_statements,
                        options,
                        diagnostics
                    )
                );
                i = i + 1;
            }
            resolved_stmt.body = resolved_body;
            return resolved_stmt;
        } else if (stmt.type === "FlagsDeclaration") {
        } else if (stmt.type === "EidosDeclaration") {
            let resolved_members = [];
            let i = 0;
            while (i < stmt.members.length) {
                let member = stmt.members[i];
                let resolved_member = Object.assign({}, member);
                resolved_member.value = this.resolve_namepath_in_expression(
                    member.value,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options,
                    diagnostics
                );
                resolved_members.push(resolved_member);
                i = i + 1;
            }
            resolved_stmt.members = resolved_members;
            return resolved_stmt;
        } else if (stmt.type === "MicroDeclaration") {
            resolved_stmt.body = this.resolve_namepath_in_statement(
                stmt.body,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_stmt;
        } else if (stmt.type === "ClassDeclaration") {
            let resolved_class_members = [];
            let i = 0;
            while (i < stmt.members.length) {
                let member = stmt.members[i];
                let resolved_member = Object.assign({}, member);
                if (member.body != null) {
                    resolved_member.body = this.resolve_namepath_in_statement(
                        member.body,
                        function_statements,
                        variable_statements,
                        class_statements,
                        options,
                        diagnostics
                    );
                }
                resolved_class_members.push(resolved_member);
                i = i + 1;
            }
            resolved_stmt.members = resolved_class_members;
            console.log(
                "ClassDeclaration: after processing members, name is still:",
                resolved_stmt.name
            );
            return resolved_stmt;
        } else {
            return resolved_stmt;
        }
    }

    resolve_namepath_using_imports(expr) {
        if (expr && expr.type != "NamePath") {
            return expr;
        }
        let simple_identifier = expr.name_path[0].name;
        if (
            this.usings &&
            this.usings[this.current_file] &&
            this.usings[this.current_file].length > 0
        ) {
            let u = 0;
            while (u < this.usings[this.current_file].length) {
                let using_import = this.usings[this.current_file][u];
                if (using_import.path && using_import.path.length > 0) {
                    let last_part =
                        using_import.path[using_import.path.length - 1];
                    if (last_part == simple_identifier) {
                        let resolved_expr = Object.assign({}, expr);
                        resolved_expr.name_path = using_import.path.map(
                            function (part) {
                                return { type: "Identifier", name: part };
                            }
                        );
                        resolved_expr.unique_name =
                            package__generation__join_name_path(
                                using_import.path,
                                "_"
                            );
                        if (expr.has_valid_position()) {
                            resolved_expr.source_file = this.current_file;
                            resolved_expr.source_line = expr.line;
                            resolved_expr.source_column = expr.column;
                            resolved_expr.source_offset = expr.offset;
                            resolved_expr.source_length = expr.length;
                        }
                        return resolved_expr;
                    }
                }
                u = u + 1;
            }
        }
        if (expr.name_path && expr.name_path.length > 1) {
            let class_name = expr.name_path[0].name;
            let member_name = expr.name_path[1].name;
        }
        return expr;
    }

    resolve_namepath_in_expression(
        expr,
        function_statements,
        variable_statements,
        class_statements,
        options,
        diagnostics
    ) {
        if (expr == null) {
            return expr;
        }
        if (expr.type == "StaticMemberAccess") {
            let objectName = expr.object;
            let memberName = expr.member;
            let i = 0;
            while (i < class_statements.length) {
                let class_stmt = class_statements[i];
                if (
                    (class_stmt.type == "EidosDeclaration" ||
                        class_stmt.type == "FlagsDeclaration") &&
                    class_stmt.name == objectName
                ) {
                    let resolved_expr = Object.assign({}, expr);
                    if (class_stmt.unique_name != null) {
                        resolved_expr.object = class_stmt.unique_name;
                    } else {
                        resolved_expr.object = class_stmt.name;
                    }
                    resolved_expr.is_eidos = true;
                    if (expr.has_valid_position()) {
                        resolved_expr.source_file = this.current_file;
                        resolved_expr.source_line = expr.line;
                        resolved_expr.source_column = expr.column;
                        resolved_expr.source_offset = expr.offset;
                        resolved_expr.source_length = expr.length;
                    }
                    return resolved_expr;
                }
                i = i + 1;
            }
            return expr;
        }
        if (expr.type == "NamePath") {
            if (expr.name_path && expr.name_path.length > 1) {
                let class_name = expr.name_path[0].name;
                let member_name = expr.name_path[1].name;
                let i = 0;
                while (i < class_statements.length) {
                    let class_stmt = class_statements[i];
                    if (
                        (class_stmt.type == "EidosDeclaration" ||
                            class_stmt.type == "FlagsDeclaration") &&
                        class_stmt.name == class_name
                    ) {
                        let resolved_expr = Object.assign({}, expr);
                        if (class_stmt.unique_name != null) {
                            resolved_expr.name_path[0].name =
                                class_stmt.unique_name;
                            resolved_expr.unique_name =
                                class_stmt.unique_name + "_" + member_name;
                        } else {
                            resolved_expr.name_path[0].name = class_stmt.name;
                            resolved_expr.unique_name =
                                class_stmt.name + "_" + member_name;
                        }
                        resolved_expr.is_eidos = true;
                        if (expr.has_valid_position()) {
                            resolved_expr.source_file = this.current_file;
                            resolved_expr.source_line = expr.line;
                            resolved_expr.source_column = expr.column;
                            resolved_expr.source_offset = expr.offset;
                            resolved_expr.source_length = expr.length;
                        }
                        return resolved_expr;
                    }
                    i = i + 1;
                }
            }
            return this.resolve_namepath_using_imports(expr);
        }
        if (expr.type == "BinaryOp") {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.left = this.resolve_namepath_in_expression(
                expr.left,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            resolved_expr.right = this.resolve_namepath_in_expression(
                expr.right,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_expr;
        }
        if (expr.type == "Assignment") {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.left = this.resolve_namepath_in_expression(
                expr.left,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            resolved_expr.right = this.resolve_namepath_in_expression(
                expr.right,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_expr;
        }
        if (
            expr.type == "TypeCheck" ||
            expr.type == "OptionalTypeCheck" ||
            expr.type == "TypeCast" ||
            expr.type == "OptionalTypeCast"
        ) {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.expression = this.resolve_namepath_in_expression(
                expr.expression,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_expr;
        }
        if (expr.type == "NewExpression") {
            let resolved_expr = Object.assign({}, expr);
            let resolved_className = this.resolve_namepath_using_imports(
                expr.className
            );
            if (resolved_className && resolved_className.unique_name) {
                resolved_expr.className = resolved_className;
            } else {
                resolved_expr.className = expr.className;
            }
            let resolved_args = [];
            let k = 0;
            while (k < expr.arguments.length) {
                resolved_args.push(
                    this.resolve_namepath_in_expression(
                        expr.arguments[k],
                        function_statements,
                        variable_statements,
                        class_statements,
                        options,
                        diagnostics
                    )
                );
                k = k + 1;
            }
            resolved_expr.arguments = resolved_args;
            return resolved_expr;
        }
        if (expr.type == "AwaitExpression" || expr.type == "UnaryOp") {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.operand = this.resolve_namepath_in_expression(
                expr.operand,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_expr;
        }
        if (expr.type == "PropertyAccess") {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.object = this.resolve_namepath_in_expression(
                expr.object,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_expr;
        }
        if (
            expr.type == "StaticMethodCall" ||
            expr.type == "StaticPropertyAccess"
        ) {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.className = this.resolve_namepath_in_expression(
                expr.className,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            if (expr.namespacePath && expr.namespacePath.length > 0) {
                let resolved_namespace_path = [];
                let i = 0;
                while (i < expr.namespacePath.length) {
                    let path_element = expr.namespacePath[i];
                    let resolved_element = path_element;
                    let found = false;
                    let j = 0;
                    while (j < variable_statements.length) {
                        if (variable_statements[j].name == path_element) {
                            if (variable_statements[j].unique_name != null) {
                                resolved_element =
                                    variable_statements[j].unique_name;
                            } else {
                                resolved_element = variable_statements[j].name;
                            }
                            found = true;
                            break;
                        }
                        j = j + 1;
                    }
                    if (!found) {
                        let k = 0;
                        while (k < function_statements.length) {
                            if (function_statements[k].name == path_element) {
                                if (
                                    function_statements[k].unique_name != null
                                ) {
                                    resolved_element =
                                        function_statements[k].unique_name;
                                } else {
                                    resolved_element =
                                        function_statements[k].name;
                                }
                                found = true;
                                break;
                            }
                            k = k + 1;
                        }
                    }
                    if (!found) {
                        let l = 0;
                        while (l < class_statements.length) {
                            if (class_statements[l].name == path_element) {
                                if (class_statements[l].unique_name != null) {
                                    resolved_element =
                                        class_statements[l].unique_name;
                                } else {
                                    resolved_element = class_statements[l].name;
                                }
                                found = true;
                                break;
                            }
                            l = l + 1;
                        }
                    }
                    resolved_namespace_path.push(resolved_element);
                    i = i + 1;
                }
                resolved_expr.namespacePath = resolved_namespace_path;
            }
            let resolved_args = [];
            let k = 0;
            while (k < expr.arguments.length) {
                resolved_args.push(
                    this.resolve_namepath_in_expression(
                        expr.arguments[k],
                        function_statements,
                        variable_statements,
                        class_statements,
                        options,
                        diagnostics
                    )
                );
                k = k + 1;
            }
            resolved_expr.arguments = resolved_args;
            return resolved_expr;
        }
        if (expr.type == "ArrayAccess") {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.object = this.resolve_namepath_in_expression(
                expr.object,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            resolved_expr.index = this.resolve_namepath_in_expression(
                expr.index,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_expr;
        }
        if (expr.type == "ObjectLiteral") {
            let resolved_expr = Object.assign({}, expr);
            let resolved_properties = [];
            let i = 0;
            while (i < expr.properties.length) {
                let prop = expr.properties[i];
                let resolved_prop = Object.assign({}, prop);
                resolved_prop.value = this.resolve_namepath_in_expression(
                    prop.value,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options,
                    diagnostics
                );
                resolved_properties.push(resolved_prop);
                i = i + 1;
            }
            resolved_expr.properties = resolved_properties;
            return resolved_expr;
        }
        if (expr.type == "ArrayLiteral") {
            let resolved_expr = Object.assign({}, expr);
            let resolved_elements = [];
            let i = 0;
            while (i < expr.elements.length) {
                resolved_elements.push(
                    this.resolve_namepath_in_expression(
                        expr.elements[i],
                        function_statements,
                        variable_statements,
                        class_statements,
                        options,
                        diagnostics
                    )
                );
                i = i + 1;
            }
            resolved_expr.elements = resolved_elements;
            return resolved_expr;
        }
        if (expr.type == "DefaultValue") {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.value = this.resolve_namepath_in_expression(
                expr.value,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            return resolved_expr;
        }
        if (expr.type == "MatchExpression") {
            let resolved_expr = Object.assign({}, expr);
            resolved_expr.expression = this.resolve_namepath_in_expression(
                expr.expression,
                function_statements,
                variable_statements,
                class_statements,
                options,
                diagnostics
            );
            let resolved_arms = [];
            let i = 0;
            while (i < expr.branches.length) {
                let arm = expr.branches[i];
                let resolved_arm = Object.assign({}, arm);
                resolved_arm.pattern = this.resolve_namepath_in_expression(
                    arm.pattern,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options,
                    diagnostics
                );
                resolved_arm.body = this.resolve_namepath_in_expression(
                    arm.body,
                    function_statements,
                    variable_statements,
                    class_statements,
                    options,
                    diagnostics
                );
                resolved_arms.push(resolved_arm);
                i = i + 1;
            }
            resolved_expr.branches = resolved_arms;
            return resolved_expr;
        }
        return expr;
    }

    get_fully_qualified_name(name, source_namespace) {
        if (source_namespace == null || source_namespace.length == 0) {
            return name;
        }
        let last_element = source_namespace[source_namespace.length - 1];
        if (last_element == "!") {
            if (source_namespace.length == 1) {
                return name;
            }
            let namespace_path = source_namespace.slice(
                0,
                source_namespace.length - 1
            );
            return (
                package__generation__join_name_path(namespace_path, "_") +
                "_" +
                name
            );
        }
        return (
            package__generation__join_name_path(source_namespace, "_") +
            "_" +
            name
        );
    }

    add_symbol_to_namespace(namespace, name, type, node, file_name) {
        let namespace_key = package__generation__join_name_path(namespace, "_");
        if (this.namespaces[namespace_key] == null) {
            this.namespaces[namespace_key] = {};
        }
        this.namespaces[namespace_key][name] = {
            type: type,
            node: node,
            file: file_name,
        };
    }

    add_using_import(using_path, is_global) {
        if (this.usings[this.current_file] == null) {
            this.usings[this.current_file] = [];
        }
        this.usings[this.current_file].push({
            path: using_path,
            is_global: is_global,
        });
    }

    get_symbol_from_namespace(namespace, name) {
        let namespace_key = package__generation__join_name_path(namespace, "_");
        if (
            this.namespaces[namespace_key] != null &&
            this.namespaces[namespace_key][name] != null
        ) {
            return this.namespaces[namespace_key][name];
        }
        return null;
    }

    clear_diagnostics() {
        this.diagnostics = new package__compiler__CompilerDiagnostics();
    }

    add_error(message, line, column, file) {
        this.diagnostics.add_error(message, line, column, file);
    }

    add_warning(message, line, column, file) {
        this.diagnostics.add_warning(message, line, column, file);
    }

    add_info(message, line, column, file) {
        this.diagnostics.add_info(message, line, column, file);
    }

    has_errors() {
        return this.diagnostics.has_errors();
    }

    get_all_diagnostics() {
        return this.diagnostics.get_all_diagnostics();
    }
}
export function package__compiler__is_main_namespace(namespace_path) {
    if (namespace_path == null) {
        return false;
    }
    return namespace_path.endsWith("!");
}
export function package__compiler__is_main_namespace_array(namespace_array) {
    if (namespace_array == null || namespace_array.length == 0) {
        return false;
    }
    return namespace_array[namespace_array.length - 1] == "!";
}
export function package__compiler__get_main_namespace_name(namespace_path) {
    if (package__compiler__is_main_namespace(namespace_path)) {
        return namespace_path.substring(0, namespace_path.length - 1);
    }
    return namespace_path;
}
export function package__compiler__validate_namespace_rules(ast, mode) {
    let has_namespace = false;
    let has_main_namespace = false;
    let i = 0;
    while (i < ast.statements.length) {
        let stmt = ast.statements[i];
        if (stmt.type == "NamespaceStatement") {
            has_namespace = true;
            if (stmt.is_main_namespace) {
                has_main_namespace = true;
            }
        }
        i = i + 1;
    }
    if (mode == "standard" && !has_namespace) {
        return {
            success: false,
            error: "Standard mode requires at least one namespace declaration",
        };
    }
    if (mode == "standard" && !has_main_namespace) {
        return {
            success: false,
            error: "Standard mode requires exactly one main namespace (ending with !)",
        };
    }
    return { success: true, error: null };
}
export function package__compiler__find_namespace_provider(
    namespace_path,
    file_contents
) {
    let file_names = Object.keys(file_contents);
    let i = 0;
    while (i < file_names.length) {
        let file_name = file_names[i];
        let content = file_contents[file_name];
        if (content.indexOf("namespace " + namespace_path) >= 0) {
            return file_name;
        }
        i = i + 1;
    }
    return null;
}
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
export function package__compiler__create_error(message, line, column) {
    return {
        type: "CompilerError",
        message: message,
        line: line,
        column: column,
    };
}
export function package__compiler__create_warning(message, line, column) {
    return {
        type: "CompilerWarning",
        message: message,
        line: line,
        column: column,
    };
}
export function package__compiler__count_ast_nodes(node) {
    if (node == null) {
        return 0;
    }
    let count = 1;
    if (node.statements != null) {
        let i = 0;
        while (i < node.statements.length) {
            count =
                count + package__compiler__count_ast_nodes(node.statements[i]);
            i = i + 1;
        }
    }
    if (node.body != null) {
        count = count + package__compiler__count_ast_nodes(node.body);
    }
    if (node.left != null) {
        count = count + package__compiler__count_ast_nodes(node.left);
    }
    if (node.right != null) {
        count = count + package__compiler__count_ast_nodes(node.right);
    }
    if (node.expression != null) {
        count = count + package__compiler__count_ast_nodes(node.expression);
    }
    if (node.condition != null) {
        count = count + package__compiler__count_ast_nodes(node.condition);
    }
    if (node.thenBranch != null) {
        count = count + package__compiler__count_ast_nodes(node.thenBranch);
    }
    if (node.elseBranch != null) {
        count = count + package__compiler__count_ast_nodes(node.elseBranch);
    }
    return count;
}
export function package__compiler__validate_syntax(source) {
    let lexer = new package__lexer__ValkyrieLexer(source);
    let tokens = lexer.tokenize();
    if (tokens.length == 0) {
        return { valid: false, error: "Lexical analysis failed" };
    }
    let ast = package__parser__parse(tokens);
    if (ast.type == "" || ast.type == "ParseError") {
        return { valid: false, error: "Syntax analysis failed" };
    }
    return { valid: true, error: null };
}
export function package__compiler__join_path(path_array, separator) {
    if (path_array == null || path_array.length == 0) {
        return "";
    }
    let result = path_array[0];
    let i = 1;
    while (i < path_array.length) {
        result = result + separator + path_array[i];
        i = i + 1;
    }
    return result;
}
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
// using ;
export function package__compiler__compile_asts(file_contents, mode) {
    return package__compiler__compile_asts_with_options(
        file_contents,
        mode,
        null
    );
}
export function package__compiler__generate_single_js(file_contents) {
    return package__compiler__compile_asts(file_contents, "repl");
}
export function package__compiler__generate_single_js_standard(file_contents) {
    return package__compiler__compile_asts(file_contents, "standard");
}
export function package__compiler__generate_single_js_with_options(
    file_contents,
    options
) {
    return package__compiler__compile_asts_with_options(
        file_contents,
        "repl",
        options
    );
}
export function package__compiler__generate_single_js_standard_with_options(
    file_contents,
    options
) {
    return package__compiler__compile_asts_with_options(
        file_contents,
        "standard",
        options
    );
}
export function package__compiler__compile_text(source_text) {
    let file_contents = { "main.valkyrie": source_text };
    return package__compiler__compile_asts(file_contents, "repl");
}
export function package__compiler__compile_text_with_options(
    source_text,
    options
) {
    let file_contents = { "main.valkyrie": source_text };
    return package__compiler__compile_asts_with_options(
        file_contents,
        "repl",
        options
    );
}
export function package__compiler__compile_asts_with_options(
    file_contents,
    mode,
    options
) {
    if (options == null) {
        options = new package__compiler__CompilerOptions(
            "js",
            false,
            false,
            mode || "repl"
        );
    } else if (options.mode == null) {
        options.mode = mode || "repl";
    }
    let compiler = new package__compiler__Compiler(options);
    return package__compiler__compile_with_compiler(compiler, file_contents);
}
// using ;
// using ;
// using ;
// using ;
// using ;
class package__generation__JsCodeGeneration {
    constructor(indent_text, options) {
        this.buffer = "";
        this.indent_level = 0;
        this.indent_text = indent_text;
        if (indent_text == false) {
            this.indent_text = "    ";
        }
        this.options = options;
        if (options && options.source_map) {
            this.source_map_builder =
                new package__generation__SourceMapBuilder();
            this.js_mapping = new package__generation__JsSourceMapping(
                this.source_map_builder
            );
        } else {
            this.source_map_builder = false;
            this.js_mapping = false;
        }
        this.source_files = {};
    }

    indent() {
        this.indent_level = this.indent_level + 1;
    }

    dedent() {
        if (this.indent_level > 0) {
            this.indent_level = this.indent_level - 1;
        }
    }

    write(text) {
        this.buffer = this.buffer + text;
        if (this.js_mapping) {
            let i = 0;
            let newline_count = 0;
            while (i < text.length) {
                if (text[i] == "\n") {
                    newline_count = newline_count + 1;
                }
                i = i + 1;
            }
            if (newline_count > 0) {
                this.js_mapping.current_line =
                    this.js_mapping.current_line + newline_count;
                this.js_mapping.current_column = 0;
            } else {
                this.js_mapping.current_column =
                    this.js_mapping.current_column + text.length;
            }
        }
    }

    write_line(text) {
        let current_indent = "";
        let i = 0;
        while (i < this.indent_level) {
            current_indent = current_indent + this.indent_text;
            i = i + 1;
        }
        let full_line = current_indent + text + "\n";
        this.buffer = this.buffer + full_line;
        if (this.js_mapping) {
            let i = 0;
            let newline_count = 0;
            while (i < full_line.length) {
                if (full_line[i] == "\n") {
                    newline_count = newline_count + 1;
                }
                i = i + 1;
            }
            if (newline_count > 0) {
                this.js_mapping.current_line =
                    this.js_mapping.current_line + newline_count;
                this.js_mapping.current_column = 0;
            } else {
                this.js_mapping.current_column =
                    this.js_mapping.current_column + full_line.length;
            }
        }
    }

    write_with_mapping(text, source_span) {
        this.buffer = this.buffer + text;
        if (this.js_mapping) {
            if (source_span) {
                this.js_mapping.generate_with_mapping(text, source_span, 0);
            } else {
                this.js_mapping.generate_with_mapping(text, false, 0);
            }
        }
    }

    create_source_span_from_node(node, file_name) {
        if (node && node.has_valid_position()) {
            let end_line = node.line;
            let end_column = node.column + node.length;
            return new package__generation__SourceSpan(
                file_name,
                node.line,
                node.column,
                end_line,
                end_column
            );
        } else {
            return false;
        }
    }

    write_identifier(identifier, source_span, source_index) {
        if (this.js_mapping && source_span && source_span.is_valid()) {
            this.js_mapping.update_position(
                this.js_mapping.current_line,
                this.js_mapping.current_column + this.buffer.length
            );
            this.js_mapping.source_map_builder.add_span_mapping(
                this.js_mapping.current_line,
                this.js_mapping.current_column,
                source_span,
                source_index
            );
            this.buffer = this.buffer + identifier;
            this.js_mapping.current_column =
                this.js_mapping.current_column + identifier.length;
        } else {
            this.buffer = this.buffer + identifier;
        }
    }

    to_string() {
        return this.buffer;
    }

    get_source_map() {
        if (this.source_map_builder) {
            return this.source_map_builder.build();
        }
        return false;
    }

    replace_all(str, search, replace) {
        let result = "";
        let i = 0;
        while (i < str.length) {
            if (str[i] == search) {
                result = result + replace;
                i = i + search.length;
            } else {
                result = result + str[i];
                i = i + 1;
            }
        }
        return result;
    }

    generate_flags_declaration(node) {
        let flagsName = node.unique_name || node.name;
        let members = node.members;
        let result = "const " + flagsName + " = {\n";
        let i = 0;
        while (i < members.length) {
            let member = members[i];
            if (i > 0) {
                result = result + ",\n";
            }
            result =
                result +
                "  " +
                member.name +
                ": " +
                this.generate_expression(member.value);
            i = i + 1;
        }
        result = result + "\n};\n";
        result = result + "Object.freeze(" + flagsName + ");";
        return result;
    }

    generate_eidos_declaration(node) {
        let eidosName = node.unique_name;
        let members = node.members;
        let result = "const " + eidosName + " = {\n";
        let i = 0;
        while (i < members.length) {
            let member = members[i];
            if (i > 0) {
                result = result + ",\n";
            }
            result =
                result +
                "  " +
                member.name +
                ": " +
                this.generate_expression(member.value);
            i = i + 1;
        }
        result = result + "\n};\n";
        result = result + "Object.freeze(" + eidosName + ");";
        return result;
    }

    generate_expression(node) {
        if (node.type === "Number") {
            return this.generate_number_expression(node);
        } else if (node.type === "String") {
            return this.generate_string_expression(node);
        } else if (node.type === "Boolean") {
            return this.generate_boolean_expression(node);
        } else if (node.type === "NamePath") {
            return this.generate_namepath_expression(node);
        } else if (node.type === "BinaryOp") {
            return this.generate_binary_op_expression(node);
        } else if (node.type === "Assignment") {
            return this.generate_assignment_expression(node);
        } else if (node.type === "TypeCheck") {
            return this.generate_type_check_expression(node);
        } else if (node.type === "OptionalTypeCheck") {
            return this.generate_optional_type_check_expression(node);
        } else if (node.type === "TypeCast") {
            return this.generate_type_cast_expression(node);
        } else if (node.type === "OptionalTypeCast") {
            return this.generate_optional_type_cast_expression(node);
        } else if (node.type === "MicroCall") {
            return this.generate_micro_call_expression(node);
        } else if (node.type === "AnonymousFunction") {
            return this.generate_anonymous_function_expression(node);
        } else if (node.type === "NewExpression") {
            return this.generate_new_expression(node);
        } else if (node.type === "AwaitExpression") {
            return this.generate_await_expression(node);
        } else if (node.type === "PropertyAccess") {
            return this.generate_property_access_expression(node);
        } else if (node.type === "StaticMethodCall") {
            return this.generate_static_method_call_expression(node);
        } else if (node.type === "StaticPropertyAccess") {
            return this.generate_static_property_access_expression(node);
        } else if (node.type === "StaticMemberAccess") {
            return this.generate_static_member_access_expression(node);
        } else if (node.type === "ArrayAccess") {
            return this.generate_array_access_expression(node);
        } else if (node.type === "ObjectLiteral") {
            return this.generate_object_literal_expression(node);
        } else if (node.type === "ArrayLiteral") {
            return this.generate_array_literal_expression(node);
        } else if (node.type === "UnaryOp") {
            return this.generate_unary_op_expression(node);
        } else if (node.type === "ThisExpression") {
            return this.generate_this_expression(node);
        } else if (node.type === "DefaultValue") {
            return this.generate_default_value_expression(node);
        } else if (node.type === "MatchExpression") {
            return this.generate_match_expression(node);
        } else {
            return "/* Unknown expression: " + node.type + " */";
        }
    }

    generate_number_expression(node) {
        return node.value;
    }

    generate_string_expression(node) {
        let escaped = node.value;
        escaped = this.replace_all(escaped, "\\", "\\\\");
        escaped = this.replace_all(escaped, '"', '\\"');
        escaped = this.replace_all(escaped, "\n", "\\n");
        escaped = this.replace_all(escaped, "\r", "\\r");
        escaped = this.replace_all(escaped, "\t", "\\t");
        return '"' + escaped + '"';
    }

    generate_boolean_expression(node) {
        return node.value;
    }

    generate_namepath_expression(node) {
        let name_index = 0;
        let identifier_name = "";
        while (name_index < node.name_path.length) {
            if (name_index == 0) {
                identifier_name =
                    node.unique_name || node.name_path[name_index].name;
            } else {
                identifier_name =
                    identifier_name + "." + node.name_path[name_index].name;
            }
            name_index = name_index + 1;
        }
        return identifier_name;
    }

    generate_binary_op_expression(node) {
        let left = this.generate_expression(node.left);
        let right = this.generate_expression(node.right);
        let result = "(";
        result = result + left;
        result = result + " ";
        result = result + node.operator;
        result = result + " ";
        result = result + right;
        result = result + ")";
        return result;
    }

    generate_assignment_expression(node) {
        let left = this.generate_expression(node.left);
        let right = this.generate_expression(node.right);
        return left + " = " + right;
    }

    generate_type_check_expression(node) {
        let expr = this.generate_expression(node.expression);
        let pattern = this.generate_pattern_expression(node.pattern);
        return "(" + expr + " instanceof " + pattern + ")";
    }

    generate_optional_type_check_expression(node) {
        let expr = this.generate_expression(node.expression);
        let pattern = this.generate_pattern_expression(node.pattern);
        return (
            "(function() { try { return " +
            expr +
            " instanceof " +
            pattern +
            "; } catch(e) { return false; } })()"
        );
    }

    generate_type_cast_expression(node) {
        let expr = this.generate_expression(node.expression);
        let targetType = this.generate_type_expression(node.targetType);
        return "(" + expr + ")";
    }

    generate_optional_type_cast_expression(node) {
        let expr = this.generate_expression(node.expression);
        let targetType = this.generate_type_expression(node.targetType);
        return (
            "(function() { try { return (" +
            expr +
            "); } catch(e) { return null; } })()"
        );
    }

    generate_micro_call_expression(node) {
        let callee = this.generate_expression(node.callee);
        let args = "";
        let i = 0;
        while (i < node.arguments.length) {
            if (i > 0) {
                args = args + ", ";
            }
            args = args + this.generate_expression(node.arguments[i]);
            i = i + 1;
        }
        if (node.closure) {
            let closureParams = "";
            let calleeStr = "";
            if (node.callee && node.callee.name) {
                calleeStr = node.callee.name;
            } else {
                calleeStr = callee;
            }
            if (calleeStr == "forEach") {
                closureParams = "item";
            }
            let closureBody = "";
            if (node.closure) {
                closureBody = this.generate_statement(node.closure);
            }
            if (args.length > 0) {
                args = args + ", ";
            }
            args = args + "function(" + closureParams + ") " + closureBody;
        }
        return callee + "(" + args + ")";
    }

    generate_anonymous_function_expression(node) {
        let params = "";
        let i = 0;
        while (i < node.parameters.length) {
            if (i > 0) {
                params = params + ", ";
            }
            let param = node.parameters[i];
            if (param) {
                if (param.name) {
                    params = params + param.name;
                } else {
                    params = params + "param" + i;
                }
            } else {
                params = params + "param" + i;
            }
            i = i + 1;
        }
        let body = "";
        if (node.body) {
            body = this.generate_statement(node.body);
        }
        return "function(" + params + ") " + body;
    }

    generate_new_expression(node) {
        let args = "";
        let i = 0;
        while (i < node.arguments.length) {
            if (i > 0) {
                args = args + ", ";
            }
            args = args + this.generate_expression(node.arguments[i]);
            i = i + 1;
        }
        return "new " + node.className.unique_name + "(" + args + ")";
    }

    generate_await_expression(node) {
        let argument = this.generate_expression(node.argument);
        return "await " + argument;
    }

    generate_property_access_expression(node) {
        if (node.object.type) {
            let obj = this.generate_expression(node.object);
            return obj + "." + node.property;
        } else {
            return node.object + "." + node.property;
        }
    }

    generate_static_method_call_expression(node) {
        let className = "";
        if (node.namespacePath) {
            if (node.namespacePath.length >= 2) {
                className = node.namespacePath[node.namespacePath.length - 2];
            } else {
                className = node.namespacePath[0];
            }
        } else if (node.className.type) {
            className = this.generate_expression(node.className);
        } else {
            className = node.className;
        }
        let args = "";
        let i = 0;
        while (i < node.arguments.length) {
            if (i > 0) {
                args = args + ", ";
            }
            args = args + this.generate_expression(node.arguments[i]);
            i = i + 1;
        }
        return className + "." + node.methodName + "(" + args + ")";
    }

    generate_static_property_access_expression(node) {
        let className = "";
        if (node.namespacePath) {
            if (node.namespacePath.length >= 2) {
                className = node.namespacePath[node.namespacePath.length - 2];
            } else {
                className = node.namespacePath[0];
            }
        } else if (node.className.type) {
            className = this.generate_expression(node.className);
        } else {
            className = node.className;
        }
        return className + "." + node.property;
    }

    generate_static_member_access_expression(node) {
        let objectName = "";
        let memberName = node.member;
        if (node.namespacePath && node.namespacePath.length > 0) {
            objectName = node.namespacePath[node.namespacePath.length - 1];
        } else if (
            node.object &&
            node.object.name_path &&
            node.object.name_path.length > 0
        ) {
            objectName = this.join_name_path(node.object.name_path, "_");
        } else if (node.object && node.object.name) {
            objectName = node.object.name;
        } else if (node.object && typeof node.object == "string") {
            objectName = node.object;
        } else {
            objectName = "UnknownObject";
        }
        if (node.is_eidos) {
            return '"' + memberName + '"';
        }
        return objectName + "." + memberName;
    }

    generate_array_access_expression(node) {
        let obj = "";
        if (node.object.type) {
            obj = this.generate_expression(node.object);
        } else {
            obj = node.object;
        }
        let index = this.generate_expression(node.index);
        return obj + "[" + index + "]";
    }

    generate_object_literal_expression(node) {
        if (node.properties.length == 0) {
            return "{}";
        }
        let result = "{";
        let i = 0;
        while (i < node.properties.length) {
            let prop = node.properties[i];
            if (i > 0) {
                result = result + ", ";
            }
            result =
                result +
                '"' +
                prop.key +
                '": ' +
                this.generate_expression(prop.value);
            i = i + 1;
        }
        result = result + "}";
        return result;
    }

    generate_array_literal_expression(node) {
        return "[]";
    }

    generate_unary_op_expression(node) {
        let operand = this.generate_expression(node.operand);
        return node.operator + operand;
    }

    generate_this_expression(node) {
        return "this";
    }

    generate_default_value_expression(node) {
        return "undefined";
    }

    generate_statement(node) {
        if (node.type === "LetStatement") {
            return this.generate_let_statement(node);
        } else if (node.type === "NamespaceStatement") {
            return this.generate_namespace_statement(node);
        } else if (node.type === "UsingStatement") {
            return this.generate_using_statement(node);
        } else if (node.type === "JSAttributeStatement") {
            return this.generate_js_attribute_statement(node);
        } else if (node.type === "ImportJsStatement") {
            return this.generate_import_js_statement(node);
        } else if (node.type === "MicroDeclaration") {
            return this.generate_micro_declaration(node);
        } else if (node.type === "MemberStatement") {
            return this.generate_member_statement(node);
        } else if (node.type === "IfStatement") {
            return this.generate_if_statement(node);
        } else if (node.type === "WhileStatement") {
            return this.generate_while_statement(node);
        } else if (node.type === "UntilStatement") {
            return this.generate_until_statement(node);
        } else if (node.type === "ReturnStatement") {
            return this.generate_return_statement(node);
        } else if (node.type === "Block") {
            return this.generate_block_statement(node);
        } else if (node.type === "ExpressionStatement") {
            return this.generate_expression_statement(node);
        } else if (node.type === "ClassDeclaration") {
            return this.generate_class_declaration(node);
        } else if (node.type === "TraitDeclaration") {
            return this.generate_trait_declaration(node);
        } else if (node.type === "SingletonDeclaration") {
            return this.generate_singleton_declaration(node);
        } else if (node.type === "FlagsDeclaration") {
            return this.generate_flags_declaration(node);
        } else if (node.type === "EidosDeclaration") {
            return this.generate_eidos_declaration(node);
        } else {
            return "/* Unknown statement: " + node.type + " */";
        }
    }

    generate_let_statement(node) {
        let value = this.generate_expression(node.value);
        return "let " + node.name + " = " + value + ";";
    }

    generate_namespace_statement(node) {
        let namespacePath = this.join_name_path(node.path, "_");
        if (node.is_main_namespace) {
            return "// namespace! " + namespacePath + ";";
        } else {
            return "// namespace " + namespacePath + ";";
        }
    }

    generate_using_statement(node) {
        return (
            "// using " +
            package__generation__join_name_path(node.path, "__") +
            ";"
        );
    }

    generate_js_attribute_statement(node) {
        let cleanImportName = this.replace_all(node.importName, "-", "_");
        cleanImportName = this.replace_all(cleanImportName, ".", "_");
        cleanImportName = this.replace_all(cleanImportName, "/", "_");
        let unique_name = node.functionName + "_" + cleanImportName;
        let importStatement =
            "import { " +
            node.importName +
            " as " +
            unique_name +
            ' } from "' +
            node.modulePath +
            '";';
        let params = "";
        let i = 0;
        while (i < node.parameters.length) {
            if (i > 0) {
                params = params + ", ";
            }
            params = params + node.parameters[i];
            i = i + 1;
        }
        let functionDef =
            "export function " + node.functionName + "(" + params + ") {\n";
        functionDef =
            functionDef + "  return " + unique_name + "(" + params + ");\n";
        functionDef = functionDef + "}";
        return importStatement + "\n" + functionDef;
    }

    generate_import_js_statement(node) {
        return (
            "import { " +
            node.importName +
            " as " +
            node.localName +
            ' } from "' +
            node.module +
            '";'
        );
    }

    generate_micro_declaration(node) {
        let params = "";
        let i = 0;
        while (i < node.parameters.length) {
            if (i > 0) {
                params = params + ", ";
            }
            let param = node.parameters[i];
            if (param && param.name) {
                params = params + param.name;
            } else {
                params = params + param;
            }
            i = i + 1;
        }
        let body = this.generate_statement(node.body);
        let functionName = node.unique_name;
        return "export function " + functionName + "(" + params + ") " + body;
    }

    generate_member_statement(node) {
        let params = "";
        let i = 0;
        while (i < node.parameters.length) {
            if (i > 0) {
                params = params + ", ";
            }
            let param = node.parameters[i];
            if (param && param.name) {
                params = params + param.name;
            } else {
                params = params + param;
            }
            i = i + 1;
        }
        let body = this.generate_statement(node.body);
        return "function " + node.name + "(" + params + ") " + body;
    }

    generate_if_statement(node) {
        let condition = this.generate_expression(node.condition);
        let thenBranch = this.generate_statement(node.thenBranch);
        let result = "if (" + condition + ") " + thenBranch;
        if (node.elseBranch && node.elseBranch.type) {
            let elseBranch = this.generate_statement(node.elseBranch);
            result = result + " else " + elseBranch;
        }
        return result;
    }

    generate_while_statement(node) {
        let condition = this.generate_expression(node.condition);
        let body = this.generate_statement(node.body);
        return "while (" + condition + ") " + body;
    }

    generate_until_statement(node) {
        let condition = this.generate_expression(node.condition);
        let body = this.generate_statement(node.body);
        return "while (!(" + condition + ")) " + body;
    }

    generate_return_statement(node) {
        if (node.value && node.value.type) {
            let value = this.generate_expression(node.value);
            return "return " + value + ";";
        } else {
            return "return;";
        }
    }

    generate_block_statement(node) {
        let statements = "";
        let i = 0;
        while (i < node.statements.length) {
            let stmt = this.generate_statement(node.statements[i]);
            if (i > 0) {
                statements = statements + "\n";
            }
            statements = statements + stmt;
            i = i + 1;
        }
        return "{\n" + statements + "\n}";
    }

    generate_expression_statement(node) {
        return this.generate_expression(node.expression) + ";";
    }

    generate_class_declaration(node) {
        let className = node.unique_name;
        let superClass = node.superClass;
        let members = node.members;
        let result = "class " + className;
        if (superClass) {
            result = result + " extends " + superClass;
        }
        result = result + " {\n";
        let hasExplicitConstructor = false;
        let explicitConstructor = null;
        let fieldInits = "";
        let i = 0;
        while (i < members.length) {
            let member = members[i];
            if (member.type == "ConstructorStatement") {
                hasExplicitConstructor = true;
                explicitConstructor = member;
            } else if (member.type == "Property") {
                if (member.initializer && member.initializer.type) {
                    let initValue = this.generate_expression(
                        member.initializer
                    );
                    fieldInits =
                        fieldInits +
                        "    self." +
                        member.name +
                        " = " +
                        initValue +
                        ";\n";
                } else {
                    fieldInits =
                        fieldInits +
                        "    self." +
                        member.name +
                        " = undefined;\n";
                }
            }
            i = i + 1;
        }
        if (hasExplicitConstructor) {
            let params = "";
            let j = 0;
            while (j < explicitConstructor.parameters.length) {
                if (j > 0) {
                    params = params + ", ";
                }
                let param = explicitConstructor.parameters[j];
                if (param && param.name) {
                    params = params + param.name;
                } else {
                    params = params + param;
                }
                j = j + 1;
            }
            result = result + "  constructor(" + params + ") {\n";
            if (superClass) {
                result = result + "    super();\n";
            }
            result = result + fieldInits;
            let ctorBody = this.generate_statement(explicitConstructor.body);
            if (ctorBody.startsWith("{\n") && ctorBody.endsWith("\n}")) {
                ctorBody = ctorBody.substring(2, ctorBody.length - 2);
            }
            result = result + ctorBody;
            result = result + "  }\n\n";
        } else if (fieldInits != "") {
            result = result + "  constructor() {\n";
            if (superClass) {
                result = result + "    super();\n";
            }
            result = result + fieldInits;
            result = result + "  }\n\n";
        }
        i = 0;
        while (i < members.length) {
            let member = members[i];
            if (member.type == "MemberStatement") {
                let methodName = member.name;
                let params = "";
                let j = 0;
                let paramCount = 0;
                while (j < member.parameters.length) {
                    let param = member.parameters[j];
                    let paramName = "";
                    if (param && param.name) {
                        paramName = param.name;
                    } else {
                        paramName = param;
                    }
                    if (paramName != "self") {
                        if (paramCount > 0) {
                            params = params + ", ";
                        }
                        params = params + paramName;
                        paramCount = paramCount + 1;
                    }
                    j = j + 1;
                }
                let body = this.generate_statement(member.body);
                if (member.isInstanceMethod) {
                    result =
                        result +
                        "  " +
                        methodName +
                        "(" +
                        params +
                        ") " +
                        body +
                        "\n\n";
                } else {
                    result =
                        result +
                        "  static " +
                        methodName +
                        "(" +
                        params +
                        ") " +
                        body +
                        "\n\n";
                }
            }
            i = i + 1;
        }
        result = result + "}";
        return result;
    }

    generate_trait_declaration(node) {
        let traitName = node.name;
        return (
            "/* Trait " +
            traitName +
            " - placeholder for future implementation */"
        );
    }

    generate_singleton_declaration(node) {
        let singletonName = node.name;
        let superClass = node.superClass;
        let members = node.members;
        let result = "const " + singletonName + " = (function() {\n";
        result = result + "  let instance = null;\n";
        result = result + "  \n";
        result = result + "  class " + singletonName + "Class";
        if (superClass) {
            result = result + " extends " + superClass;
        }
        result = result + " {\n";
        let hasExplicitConstructor = false;
        let explicitConstructor = null;
        let fieldInits = "";
        let i = 0;
        while (i < members.length) {
            let member = members[i];
            if (member.type == "ConstructorStatement") {
                hasExplicitConstructor = true;
                explicitConstructor = member;
            } else if (member.type == "Property") {
                if (member.initializer && member.initializer.type) {
                    let initValue = this.generate_expression(
                        member.initializer
                    );
                    fieldInits =
                        fieldInits +
                        "      this." +
                        member.name +
                        " = " +
                        initValue +
                        ";\n";
                } else {
                    fieldInits =
                        fieldInits +
                        "      this." +
                        member.name +
                        " = undefined;\n";
                }
            }
            i = i + 1;
        }
        if (hasExplicitConstructor) {
            let params = "";
            let j = 0;
            while (j < explicitConstructor.parameters.length) {
                if (j > 0) {
                    params = params + ", ";
                }
                let param = explicitConstructor.parameters[j];
                if (param && param.name) {
                    params = params + param.name;
                } else {
                    params = params + param;
                }
                j = j + 1;
            }
            result = result + "    constructor(" + params + ") {\n";
            if (superClass) {
                result = result + "      super();\n";
            }
            result = result + fieldInits;
            let ctorBody = this.generate_statement(explicitConstructor.body);
            if (ctorBody.startsWith("{\n") && ctorBody.endsWith("\n}")) {
                ctorBody = ctorBody.substring(2, ctorBody.length - 2);
                ctorBody = ctorBody.replace("\n", "\n      ");
            }
            result = result + "      " + ctorBody;
            result = result + "    }\n\n";
        } else if (fieldInits != "") {
            result = result + "    constructor() {\n";
            if (superClass) {
                result = result + "      super();\n";
            }
            result = result + fieldInits;
            result = result + "    }\n\n";
        }
        i = 0;
        while (i < members.length) {
            let member = members[i];
            if (member.type == "MemberStatement") {
                let methodName = member.name;
                let params = "";
                let j = 0;
                let paramCount = 0;
                while (j < member.parameters.length) {
                    let param = member.parameters[j];
                    let paramName = "";
                    if (param && param.name) {
                        paramName = param.name;
                    } else {
                        paramName = param;
                    }
                    if (paramName != "self") {
                        if (paramCount > 0) {
                            params = params + ", ";
                        }
                        params = params + paramName;
                        paramCount = paramCount + 1;
                    }
                    j = j + 1;
                }
                let body = this.generate_statement(member.body);
                if (member.isInstanceMethod) {
                    result =
                        result +
                        "    " +
                        methodName +
                        "(" +
                        params +
                        ") " +
                        body +
                        "\n\n";
                } else {
                    result =
                        result +
                        "    static " +
                        methodName +
                        "(" +
                        params +
                        ") " +
                        body +
                        "\n\n";
                }
            }
            i = i + 1;
        }
        result = result + "  }\n";
        result = result + "  \n";
        result = result + "  return function() {\n";
        result = result + "    if (instance === null) {\n";
        result =
            result + "      instance = new " + singletonName + "Class();\n";
        result = result + "    }\n";
        result = result + "    return instance;\n";
        result = result + "  };\n";
        result = result + "})();";
        return result;
    }

    generate(ast) {
        if (ast.type == "Program") {
            let i = 0;
            while (i < ast.statements.length) {
                let stmt = ast.statements[i];
                let stmt_code = this.generate_statement(stmt);
                let has_position = false;
                if (stmt.has_valid_position) {
                    has_position = stmt.has_valid_position();
                } else {
                    has_position = stmt.line && stmt.column;
                }
                if (has_position && stmt.source_file) {
                    let source_span = new package__generation__SourceSpan();
                    source_span.file_name = stmt.source_file;
                    source_span.start_line = stmt.source_line || stmt.line;
                    source_span.start_column =
                        stmt.source_column || stmt.column;
                    source_span.end_line = stmt.source_line || stmt.line;
                    source_span.end_column =
                        (stmt.source_column || stmt.column) +
                        (stmt.source_length || stmt.length || 1);
                    this.write_line_with_mapping(stmt_code, source_span, 0);
                } else {
                    this.write_line(stmt_code);
                }
                i = i + 1;
            }
            return this.to_string();
        }
        if (ast.type == "ParseError") {
            return (
                "// Parse Error: " +
                ast.message +
                " at line " +
                ast.line +
                ", column " +
                ast.column
            );
        }
        return this.generate_statement(ast);
    }

    generate_pattern_expression(pattern_node) {
        if (!pattern_node) {
            return "Object";
        }
        if (pattern_node.type == "TypeIdentifier") {
            return '"' + pattern_node.name + '"';
        }
        if (pattern_node.type == "Identifier") {
            return '"' + pattern_node.name + '"';
        }
        if (pattern_node.type == "StringLiteral") {
            return '"' + pattern_node.value + '"';
        }
        if (pattern_node.type == "NumberLiteral") {
            return pattern_node.value;
        }
        if (pattern_node.type == "BooleanLiteral") {
            return pattern_node.value;
        }
        if (pattern_node.type == "StaticMemberAccess") {
            return pattern_node.object + "." + pattern_node.member;
        }
        return "Object";
    }

    generate_type_expression(type_node) {
        if (!type_node) {
            return "Object";
        }
        if (type_node.type === "TypeIdentifier") {
            return type_node.name;
        } else if (type_node.type === "Identifier") {
            return type_node.name;
        } else if (type_node.type === "ArrayType") {
            return "Array";
        } else if (type_node.type === "FunctionType") {
            return "Function";
        } else if (type_node.type === "GenericType") {
            return this.generate_type_expression(type_node.base);
        } else if (type_node.type === "TupleType") {
            return "Array";
        } else if (type_node.type === "ObjectType") {
            return "Object";
        } else if (type_node.type === "UnionType") {
            return "Object";
        } else if (type_node.type === "IntersectionType") {
            return "Object";
        } else {
            return "Object";
        }
    }

    generate_match_expression(node) {
        let result = "";
        let i = 0;
        let is_first_when = true;
        while (i < node.branches.length) {
            let branch = node.branches[i];
            if (branch.type === "WhenBranch") {
                let condition = this.generate_expression(branch.condition);
                if (is_first_when) {
                    result = result + "if (" + condition + ") {\n";
                    is_first_when = false;
                } else {
                    result = result + " else if (" + condition + ") {\n";
                }
                result =
                    result + this.generate_branch_statements(branch.statements);
                result = result + "}";
            } else if (branch.type === "ElseBranch") {
                result = result + " else {\n";
                result =
                    result + this.generate_branch_statements(branch.statements);
                result = result + "}";
            } else if (branch.type === "CaseBranch") {
                let pattern_value = this.generate_pattern_expression(
                    branch.pattern
                );
                let match_value = this.generate_expression(node.expression);
                if (branch.pattern && branch.pattern.type == "Identifier") {
                    if (is_first_when) {
                        result =
                            result +
                            "if (" +
                            match_value +
                            " === " +
                            branch.pattern.name +
                            ") {\n";
                        is_first_when = false;
                    } else {
                        result =
                            result +
                            " else if (" +
                            match_value +
                            " === " +
                            branch.pattern.name +
                            ") {\n";
                    }
                } else {
                    if (is_first_when) {
                        result =
                            result +
                            "if (" +
                            match_value +
                            " === " +
                            pattern_value +
                            ") {\n";
                        is_first_when = false;
                    } else {
                        result =
                            result +
                            " else if (" +
                            match_value +
                            " === " +
                            pattern_value +
                            ") {\n";
                    }
                }
                result =
                    result + this.generate_branch_statements(branch.statements);
                result = result + "}";
            } else if (branch.type === "TypeBranch") {
                result = result + "// TODO: Type branch not implemented yet\n";
            } else {
                result =
                    result + "// Unknown branch type: " + branch.type + "\n";
            }
            i = i + 1;
        }
        return result;
    }

    generate_branch_statements(statements) {
        let result = "";
        let i = 0;
        while (i < statements.length) {
            let stmt = this.generate_statement(statements[i]);
            result = result + stmt + "\n";
            i = i + 1;
        }
        return result;
    }

    write_line_with_mapping(text, span, source_index) {
        let current_indent = "";
        let i = 0;
        while (i < this.indent_level) {
            current_indent = current_indent + this.indent_text;
            i = i + 1;
        }
        if (this.js_mapping && span) {
            this.buffer = this.buffer + current_indent;
            this.buffer =
                this.buffer +
                this.js_mapping.generate_with_mapping(text, span, source_index);
            this.buffer = this.buffer + this.js_mapping.generate_newline();
        } else {
            this.buffer = this.buffer + current_indent + text + "\n";
        }
    }
}
export function package__generation__join_name_path(names, separator) {
    let result = "";
    let i = 0;
    while (i < names.length) {
        if (i > 0) {
            result = result + separator;
        }
        result = result + names[i];
        i = i + 1;
    }
    return result;
}
export function package__generation__add_source_file(self, file_name, content) {
    if (this.source_map_builder) {
        if (!this.source_files[file_name]) {
            this.source_files[file_name] = this.source_map_builder.add_source(
                file_name,
                content
            );
        }
        return this.source_files[file_name];
    }
    return 0;
}
class package__generation__JsSourceMapping {
    constructor(source_map_builder) {
        this.source_map_builder = source_map_builder;
        this.current_line = 1;
        this.current_column = 0;
    }

    update_position(line, column) {
        this.current_line = line;
        this.current_column = column;
    }

    map_segment(source_index) {
        if (this.source_map_builder) {
            this.source_map_builder.add_mapping(
                this.current_line,
                this.current_column,
                source_index,
                this.current_line,
                this.current_column,
                false
            );
        }
    }

    generate_with_mapping(code, source_span, source_index) {
        if (source_span && source_span.is_valid()) {
            this.source_map_builder.add_span_mapping(
                this.current_line,
                this.current_column,
                source_span,
                source_index
            );
        }
        let i = 0;
        let newline_count = 0;
        while (i < code.length) {
            if (code[i] == "\n") {
                newline_count = newline_count + 1;
            }
            i = i + 1;
        }
        if (newline_count > 0) {
            this.current_line = this.current_line + newline_count;
            this.current_column = 0;
        } else {
            this.current_column = this.current_column + code.length;
        }
        return code;
    }

    generate_newline() {
        this.current_line = this.current_line + 1;
        this.current_column = 0;
        return "\n";
    }

    generate_indent(level) {
        let indent = "";
        let i = 0;
        while (i < level) {
            indent = indent + "    ";
            i = i + 1;
        }
        this.current_column = this.current_column + indent.length;
        return indent;
    }
}
class package__generation__SourceMap {
    constructor() {
        this.version = 3;
        this.sources = [];
        this.sources_content = [];
        this.names = [];
        this.mappings = "";
        this.file = "";
    }

    add_source(file_name, content) {
        return 0;
    }

    add_name(name) {
        return 0;
    }

    set_file(file_name) {
        this.file = file_name;
    }

    set_mappings(mappings) {
        this.mappings = mappings;
    }

    to_json() {
        return (
            '{"version":' +
            this.version +
            ',"sources":[],"sourcesContent":[],"names":[],"mappings":"' +
            this.mappings +
            '","file":"' +
            this.file +
            '"}'
        );
    }
}
// using ;
class package__generation__SourceMapBuilder {
    constructor() {
        this.source_map = new package__generation__SourceMap();
        this.mappings = [];
        this.current_generated_line = 1;
        this.current_generated_column = 0;
    }

    add_source(file_name, content) {
        return this.source_map.add_source(file_name, content);
    }

    add_name(name) {
        return this.source_map.add_name(name);
    }

    set_file(file_name) {
        this.source_map.set_file(file_name);
    }

    add_mapping(
        generated_line,
        generated_column,
        source_index,
        original_line,
        original_column,
        name_index
    ) {
        let mapping = {
            generated_line: generated_line,
            generated_column: generated_column,
            source_index: source_index,
            original_line: original_line,
            original_column: original_column,
            name_index: name_index,
        };
        this.mappings.push(mapping);
    }

    add_span_mapping(
        generated_line,
        generated_column,
        source_span,
        source_index
    ) {
        if (source_span && source_span.is_valid()) {
            this.add_mapping(
                generated_line,
                generated_column,
                source_index,
                source_span.start_line,
                source_span.start_column,
                false
            );
        }
    }

    build() {
        let mappings_str = this.encode_mappings();
        this.source_map.set_mappings(mappings_str);
        return this.source_map;
    }

    encode_mappings() {
        if (this.mappings.length == 0) {
            return "";
        }
        let result = "";
        let i = 0;
        while (i < this.mappings.length) {
            let mapping = this.mappings[i];
            if (i > 0) {
                result = result + ",";
            }
            result =
                result +
                mapping.generated_column +
                "," +
                mapping.source_index +
                "," +
                mapping.original_line +
                "," +
                mapping.original_column;
            i = i + 1;
        }
        return result;
    }
}
class package__generation__SourceSpan {
    constructor(file_name, start_line, start_column, end_line, end_column) {
        this.file_name = file_name;
        if (file_name == false) {
            this.file_name = "";
        }
        this.start_line = start_line;
        if (start_line == false) {
            this.start_line = 1;
        }
        this.start_column = start_column;
        if (start_column == false) {
            this.start_column = 1;
        }
        this.end_line = end_line;
        if (end_line == false) {
            this.end_line = 1;
        }
        this.end_column = end_column;
        if (end_column == false) {
            this.end_column = 1;
        }
    }

    is_valid() {
        if (this.start_line > 0) {
            if (this.start_column > 0) {
                if (this.end_line >= this.start_line) {
                    if (this.end_line > this.start_line) {
                        return true;
                    } else {
                        return this.end_column >= this.start_column;
                    }
                }
            }
        }
        return false;
    }

    to_string() {
        return (
            this.file_name +
            ":" +
            this.start_line +
            ":" +
            this.start_column +
            "-" +
            this.end_line +
            ":" +
            this.end_column
        );
    }
}
// using ;
// using ;
// using ;
// using ;
// using ;
class package__generation__SymbolBasedGenerator {
    constructor() {
        this.analyzer = new package__analyzer__Analyzer();
        this.js_generator = new package__generation__JsCodeGeneration();
        this.symbol_table = false;
    }

    generate(ast, source_file) {
        this.symbol_table = this.analyzer.analyze(ast);
        return this.generate_from_symbols(ast, source_file);
    }

    generate_from_symbols(node, source_file) {
        let enhanced_node = this.enhance_node_with_symbol_info(node);
        return this.js_generator.generate(enhanced_node, source_file);
    }

    enhance_node_with_symbol_info(node) {
        if (!node) {
            return node;
        }
        let enhanced = this.create_enhanced_node(node);
        let symbol = this.find_symbol_for_node(node);
        if (symbol) {
            enhanced.name = symbol.name;
            enhanced.value = symbol.value;
            enhanced.symbol_type = symbol.symbol_type;
        }
        if (node.children) {
            enhanced.children = [];
            let i = 0;
            while (i < node.children.length) {
                enhanced.children.push(
                    this.enhance_node_with_symbol_info(node.children[i])
                );
                i = i + 1;
            }
        }
        return enhanced;
    }

    create_enhanced_node(node) {
        let enhanced = {};
        enhanced.type = node.type;
        enhanced.offset = node.offset;
        enhanced.length = node.length;
        enhanced.line = node.line;
        enhanced.column = node.column;
        enhanced.get_source_position = node.get_source_position;
        enhanced.has_valid_position = node.has_valid_position;
        if (node.left) {
            enhanced.left = this.enhance_node_with_symbol_info(node.left);
        }
        if (node.right) {
            enhanced.right = this.enhance_node_with_symbol_info(node.right);
        }
        if (node.operator) {
            enhanced.operator = node.operator;
        }
        if (node.arguments) {
            enhanced.arguments = [];
            let i = 0;
            while (i < node.arguments.length) {
                enhanced.arguments.push(
                    this.enhance_node_with_symbol_info(node.arguments[i])
                );
                i = i + 1;
            }
        }
        if (node.body) {
            enhanced.body = this.enhance_node_with_symbol_info(node.body);
        }
        if (node.className) {
            enhanced.className = node.className;
        }
        if (node.methodName) {
            enhanced.methodName = node.methodName;
        }
        if (node.property) {
            enhanced.property = node.property;
        }
        if (node.object) {
            enhanced.object = this.enhance_node_with_symbol_info(node.object);
        }
        if (node.index) {
            enhanced.index = this.enhance_node_with_symbol_info(node.index);
        }
        if (node.properties) {
            enhanced.properties = [];
            let i = 0;
            while (i < node.properties.length) {
                enhanced.properties.push(node.properties[i]);
                i = i + 1;
            }
        }
        return enhanced;
    }

    find_symbol_for_node(node) {
        if (!this.symbol_table) {
            return false;
        }
        let all_symbols = this.symbol_table.get_all_symbols();
        return false;
    }
}
// using ;
// using ;
// using ;
// using ;
// using ;
class package__lexer__Token {
    constructor(typing, value, line, column, offset, length) {
        this.type = typing;
        this.value = value;
        this.line = line;
        this.column = column;
        this.offset = offset;
        this.length = length;
        if (offset == false) {
            this.offset = 0;
        }
        if (length == false) {
            this.length = 0;
        }
    }

    get_end_offset() {
        return this.offset + this.length;
    }
}
class package__lexer__ValkyrieLexer {
    constructor(source) {
        this.source = source;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.current_char = "";
        if (source.length > 0) {
            this.current_char = source.charAt(0);
        }
    }

    advance() {
        if (this.current_char == "\n") {
            this.line = this.line + 1;
            this.column = 1;
        } else {
            this.column = this.column + 1;
        }
        this.position = this.position + 1;
        if (this.position >= this.source.length) {
            this.current_char = "";
        } else {
            this.current_char = this.source.charAt(this.position);
        }
    }

    skip_whitespace() {
        while (
            this.current_char != "" &&
            package__lexer__is_whitespace(this.current_char)
        ) {
            this.advance();
        }
    }

    read_number() {
        let result = "";
        while (
            this.current_char != "" &&
            package__lexer__is_digit(this.current_char)
        ) {
            result = result + this.current_char;
            this.advance();
        }
        return result;
    }

    read_identifier() {
        let result = "";
        while (
            this.current_char != "" &&
            package__lexer__is_alpha_numeric(this.current_char)
        ) {
            result = result + this.current_char;
            this.advance();
        }
        return result;
    }

    read_raw_identifier() {
        let result = "";
        this.advance();
        while (this.current_char != "" && this.current_char != "`") {
            result = result + this.current_char;
            this.advance();
        }
        if (this.current_char == "`") {
            this.advance();
        }
        return result;
    }

    read_string() {
        let result = "";
        this.advance();
        while (this.current_char != "" && this.current_char != '"') {
            if (this.current_char == "\\") {
                this.advance();
                if (this.current_char == "n") {
                    result = result + "\n";
                } else {
                    if (this.current_char == "t") {
                        result = result + "\t";
                    } else {
                        if (this.current_char == "r") {
                            result = result + "\r";
                        } else {
                            if (this.current_char == '"') {
                                result = result + '"';
                            } else {
                                if (this.current_char == "\\") {
                                    result = result + "\\";
                                } else {
                                    result = result + "\\" + this.current_char;
                                }
                            }
                        }
                    }
                }
            } else {
                result = result + this.current_char;
            }
            this.advance();
        }
        if (this.current_char == '"') {
            this.advance();
        }
        return result;
    }

    skip_comment() {
        while (this.current_char != "" && this.current_char != "\n") {
            this.advance();
        }
    }

    next_token() {
        while (this.current_char != "") {
            if (package__lexer__is_whitespace(this.current_char)) {
                this.skip_whitespace();
                continue;
            }
            if (this.current_char == "#") {
                this.skip_comment();
                continue;
            } else if (this.current_char == "⍝") {
                this.skip_comment();
                continue;
            }
            let line = this.line;
            let column = this.column;
            if (package__lexer__is_alpha(this.current_char)) {
                let value = this.read_identifier();
                let tokenType = package__lexer__get_keyword_type(value);
                return new package__lexer__Token(
                    tokenType,
                    value,
                    line,
                    column
                );
            }
            if (package__lexer__is_digit(this.current_char)) {
                let value = this.read_number();
                return new package__lexer__Token("NUMBER", value, line, column);
            }
            if (this.current_char == '"') {
                let value = this.read_string();
                return new package__lexer__Token("STRING", value, line, column);
            }
            if (this.current_char == "`") {
                let value = this.read_raw_identifier();
                return new package__lexer__Token(
                    "SYMBOL_RAW",
                    value,
                    line,
                    column
                );
            }
            let ch = this.current_char;
            this.advance();
            if (ch == "{") {
                return new package__lexer__Token("LBRACE", ch, line, column);
            }
            if (ch == "}") {
                return new package__lexer__Token("RBRACE", ch, line, column);
            }
            if (ch == "(") {
                return new package__lexer__Token("LPAREN", ch, line, column);
            }
            if (ch == ")") {
                return new package__lexer__Token("RPAREN", ch, line, column);
            }
            if (ch == "[") {
                return new package__lexer__Token("LBRACKET", ch, line, column);
            }
            if (ch == "]") {
                return new package__lexer__Token("RBRACKET", ch, line, column);
            }
            if (ch == ";") {
                return new package__lexer__Token("SEMICOLON", ch, line, column);
            }
            if (ch == ",") {
                return new package__lexer__Token("COMMA", ch, line, column);
            }
            if (ch == ":") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == ":"
                ) {
                    this.advance();
                    return new package__lexer__Token(
                        "DOUBLE_COLON",
                        "::",
                        line,
                        column
                    );
                }
                return new package__lexer__Token("COLON", ch, line, column);
            }
            if (ch == "=") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "="
                ) {
                    this.advance();
                    return new package__lexer__Token("EQ", "==", line, column);
                }
                return new package__lexer__Token("ASSIGN", ch, line, column);
            }
            if (ch == "+") {
                return new package__lexer__Token("PLUS", ch, line, column);
            }
            if (ch == "-") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == ">"
                ) {
                    this.advance();
                    return new package__lexer__Token(
                        "ARROW",
                        "->",
                        line,
                        column
                    );
                }
                return new package__lexer__Token("MINUS", ch, line, column);
            }
            if (ch == "*") {
                return new package__lexer__Token("MULTIPLY", ch, line, column);
            }
            if (ch == "/") {
                return new package__lexer__Token("DIVIDE", ch, line, column);
            }
            if (ch == "%") {
                return new package__lexer__Token("MODULO", ch, line, column);
            }
            if (ch == "&") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "&"
                ) {
                    this.advance();
                    return new package__lexer__Token("AND", "&&", line, column);
                }
                return new package__lexer__Token("AMPERSAND", ch, line, column);
            }
            if (ch == "|") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "|"
                ) {
                    this.advance();
                    return new package__lexer__Token("OR", "||", line, column);
                }
                return new package__lexer__Token("PIPE", ch, line, column);
            }
            if (ch == ">") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "="
                ) {
                    this.advance();
                    return new package__lexer__Token("GTE", ">=", line, column);
                }
                return new package__lexer__Token("GT", ch, line, column);
            }
            if (ch == "<") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "="
                ) {
                    this.advance();
                    return new package__lexer__Token("LTE", "<=", line, column);
                }
                return new package__lexer__Token("LT", ch, line, column);
            }
            if (ch == "!") {
                if (
                    this.position < this.source.length &&
                    this.source.charAt(this.position) == "="
                ) {
                    this.advance();
                    return new package__lexer__Token("NE", "!=", line, column);
                }
                return new package__lexer__Token("BANG", ch, line, column);
            }
            if (ch == "?") {
                return new package__lexer__Token("QUESTION", ch, line, column);
            }
            if (ch == ".") {
                return new package__lexer__Token("DOT", ch, line, column);
            }
            if (ch == "↯") {
                return new package__lexer__Token("ATTRIBUTE", ch, line, column);
            }
            return new package__lexer__Token(
                "ERROR",
                "Unknown character: " + ch,
                line,
                column
            );
        }
        return new package__lexer__Token("EOF", "", this.line, this.column);
    }

    tokenize() {
        let tokens = [];
        while (true) {
            let token = this.next_token();
            tokens.push(token);
            if (token.type == "EOF") {
                break;
            }
        }
        return tokens;
    }
}
export function package__lexer__is_whitespace(ch) {
    return ch == " " || ch == "\t" || ch == "\n" || ch == "\r";
}
export function package__lexer__is_alpha_numeric(ch) {
    return package__lexer__is_alpha(ch) || package__lexer__is_digit(ch);
}
export function package__lexer__is_alpha(ch) {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch == "_";
}
export function package__lexer__is_digit(ch) {
    return ch >= "0" && ch <= "9";
}
export function package__lexer__get_keyword_type(value) {
    if (value === "micro") {
        return "MICRO";
    } else if (value === "let") {
        return "LET";
    } else if (value === "if") {
        return "IF";
    } else if (value === "else") {
        return "ELSE";
    } else if (value === "while") {
        return "WHILE";
    } else if (value === "until") {
        return "UNTIL";
    } else if (value === "return") {
        return "RETURN";
    } else if (value === "true") {
        return "BOOLEAN";
    } else if (value === "false") {
        return "BOOLEAN";
    } else if (value === "namespace") {
        return "NAMESPACE";
    } else if (value === "using") {
        return "USING";
    } else if (value === "class") {
        return "CLASS";
    } else if (value === "singleton") {
        return "SINGLETON";
    } else if (value === "trait") {
        return "TRAIT";
    } else if (value === "constructor") {
        return "CONSTRUCTOR";
    } else if (value === "self") {
        return "SELF";
    } else if (value === "extends") {
        return "EXTENDS";
    } else if (value === "implements") {
        return "IMPLEMENTS";
    } else if (value === "new") {
        return "NEW";
    } else if (value === "default") {
        return "DEFAULT";
    } else if (value === "await") {
        return "AWAIT";
    } else if (value === "is") {
        return "IS";
    } else if (value === "as") {
        return "AS";
    } else if (value === "match") {
        return "MATCH";
    } else if (value === "when") {
        return "WHEN";
    } else if (value === "case") {
        return "CASE";
    } else if (value === "type") {
        return "TYPE";
    } else if (value === "flags") {
        return "FLAGS";
    } else if (value === "eidos") {
        return "EIDOS";
    } else {
        return "SYMBOL_XID";
    }
}
// using ;
// using ;
// using ;
class package__optimizer__Optimizer {
    constructor() {
        this.pipeline = new package__optimizer__TransformPipeline();
        this.setup_default_transforms();
    }

    setup_default_transforms() {
        let constant_folding =
            new package__optimizer__transforms__ConstantFoldingTransform();
        this.pipeline.add_transform(constant_folding);
    }

    optimize(symbol_table) {
        return this.pipeline.run_transforms(symbol_table);
    }

    add_transform(transform) {
        this.pipeline.add_transform(transform);
    }

    get_transform_count() {
        return this.pipeline.get_transform_count();
    }

    clear_transforms() {
        this.pipeline.clear_transforms();
    }
}
// using ;
class package__optimizer__Transform {
    constructor(name) {
        this.name = name;
    }

    get_name() {
        return this.name;
    }

    set_name(name) {
        this.name = name;
    }
}
// using ;
class package__optimizer__TransformPipeline {
    constructor() {
        this.transforms = [];
    }

    add_transform(transform) {
        this.transforms.push(transform);
    }

    run(symbol_table) {
        let current_table = symbol_table;
        let i = 0;
        while (i < this.transforms.length) {
            let transform = this.transforms[i];
            if (transform.should_apply(current_table)) {
                current_table = transform.transform(current_table);
            }
            i = i + 1;
        }
        return current_table;
    }

    get_transform_count() {
        return this.transforms.length;
    }

    clear() {
        this.transforms = [];
    }
}
// using ;
// using ;
class package__optimizer__transforms__ConstantFoldingTransform {
    constructor() {
        this.base_transform = new package__optimizer__Transform(
            "ConstantFolding"
        );
    }

    transform(symbol_table) {
        let new_table = this.clone_symbol_table(symbol_table);
        this.fold_constants_in_table(new_table);
        return new_table;
    }

    fold_constants_in_table(symbol_table) {}

    clone_symbol_table(original) {
        let new_table = new package__analyzer__SymbolTable();
        return new_table;
    }

    should_apply(symbol_table) {
        return true;
    }

    get_name() {
        return this.base_transform.get_name();
    }
}
class package__parser__Node {
    constructor(typing, offset, length, line, column) {
        this.type = typing;
        this.offset = offset;
        this.length = length;
        this.line = line;
        this.column = column;
        if (offset == false) {
            this.offset = 0;
        }
        if (length == false) {
            this.length = 0;
        }
        if (line == false) {
            this.line = 1;
        }
        if (column == false) {
            this.column = 1;
        }
    }

    get_source_position() {
        let position = {};
        position.offset = this.offset;
        position.length = this.length;
        position.line = this.line;
        position.column = this.column;
        return position;
    }

    has_valid_position() {
        return (
            this.offset >= 0 &&
            this.length > 0 &&
            this.line > 0 &&
            this.column > 0
        );
    }
}
// using ;
class package__parser__NodeMetadata {
    constructor() {
        this.node_names = {};
        this.node_values = {};
        this.node_properties = {};
    }

    set_node_name(node, name) {
        let node_id = this.get_node_id(node);
        this.node_names[node_id] = name;
    }

    get_node_name(node) {
        let node_id = this.get_node_id(node);
        if (this.node_names[node_id]) {
            return this.node_names[node_id];
        }
        return false;
    }

    set_node_value(node, value) {
        let node_id = this.get_node_id(node);
        this.node_values[node_id] = value;
    }

    get_node_value(node) {
        let node_id = this.get_node_id(node);
        if (this.node_values[node_id]) {
            return this.node_values[node_id];
        }
        return false;
    }

    set_node_property(node, key, value) {
        let node_id = this.get_node_id(node);
        if (!this.node_properties[node_id]) {
            this.node_properties[node_id] = {};
        }
        this.node_properties[node_id][key] = value;
    }

    get_node_property(node, key) {
        let node_id = this.get_node_id(node);
        if (
            this.node_properties[node_id] &&
            this.node_properties[node_id][key]
        ) {
            return this.node_properties[node_id][key];
        }
        return false;
    }

    get_node_id(node) {
        return (
            node.type +
            "_" +
            node.offset +
            "_" +
            node.length +
            "_" +
            node.line +
            "_" +
            node.column
        );
    }

    clear() {
        this.node_names = {};
        this.node_values = {};
        this.node_properties = {};
    }
}
export function package__parser__parse_pattern_expression(parser) {
    let token = parser.current_token;
    if (token.type == "SYMBOL_XID") {
        let name = token.value;
        parser.advance();
        if (parser.current_token.type == "DOUBLE_COLON") {
            parser.advance();
            if (parser.current_token.type == "SYMBOL_XID") {
                let member_name = parser.current_token.value;
                parser.advance();
                let node = parser.make_node("StaticMemberAccess");
                node.object = name;
                node.member = member_name;
                return node;
            } else {
                let error = {};
                error.type = "ParseError";
                error.message =
                    "Expected member name after '::' but got " +
                    parser.current_token.type;
                error.line = parser.current_token.line;
                error.column = parser.current_token.column;
                return error;
            }
        } else {
            let node = parser.make_node("TypeIdentifier");
            node.name = name;
            return node;
        }
    } else if (token.type == "STRING") {
        parser.advance();
        let node = parser.make_node("StringLiteral");
        node.value = token.value;
        return node;
    } else if (token.type == "NUMBER") {
        parser.advance();
        let node = parser.make_node("NumberLiteral");
        node.value = token.value;
        return node;
    } else if (token.type == "BOOLEAN") {
        parser.advance();
        let node = parser.make_node("BooleanLiteral");
        node.value = token.value;
        return node;
    } else if (
        token.type == "KEYWORD" &&
        (token.value == "true" || token.value == "false")
    ) {
        parser.advance();
        let node = parser.make_node("BooleanLiteral");
        node.value = token.value;
        return node;
    } else {
        let error = {};
        error.type = "ParseError";
        error.message =
            "Expected identifier or literal in pattern expression but got " +
            token.type;
        error.line = token.line;
        error.column = token.column;
        return error;
    }
}
// using ;
// using ;
// using ;
// using ;
export function package__parser__getOperatorPrecedence(tokenType) {
    if (tokenType === "ASSIGN") {
        return 1;
    } else if (tokenType === "OR") {
        return 2;
    } else if (tokenType === "AND") {
        return 3;
    } else if (tokenType === "EQ") {
        return 4;
    } else if (tokenType === "NE") {
        return 4;
    } else if (tokenType === "GT") {
        return 5;
    } else if (tokenType === "LT") {
        return 5;
    } else if (tokenType === "GTE") {
        return 5;
    } else if (tokenType === "LTE") {
        return 5;
    } else if (tokenType === "IS") {
        return 5;
    } else if (tokenType === "AS") {
        return 5;
    } else if (tokenType === "PIPE") {
        return 6;
    } else if (tokenType === "AMPERSAND") {
        return 6;
    } else if (tokenType === "PLUS") {
        return 7;
    } else if (tokenType === "MINUS") {
        return 7;
    } else if (tokenType === "MULTIPLY") {
        return 8;
    } else if (tokenType === "DIVIDE") {
        return 8;
    } else if (tokenType === "MODULO") {
        return 8;
    } else {
        return -1;
    }
}
export function package__parser__isRightAssociative(tokenType) {
    return tokenType == "ASSIGN";
}
export function package__parser__parseExpressionWithPrecedence(
    parser,
    minPrecedence,
    inline
) {
    let left = package__parser__parseUnaryExpression(parser, inline);
    if (left && left.type == "ParseError") {
        return left;
    }
    while (true) {
        let precedence = package__parser__getOperatorPrecedence(
            parser.current_token.type
        );
        if (precedence < minPrecedence) {
            break;
        }
        let op = parser.current_token.value;
        let tokenType = parser.current_token.type;
        parser.advance();
        let nextMinPrecedence = precedence;
        if (package__parser__isRightAssociative(tokenType)) {
        } else {
            nextMinPrecedence = precedence + 1;
        }
        let right = {};
        if (tokenType == "IS") {
            let isOptional = false;
            if (parser.current_token.type == "QUESTION") {
                isOptional = true;
                parser.advance();
            }
            right = package__parser__parse_pattern_expression(parser);
            if (isOptional) {
                let node = parser.make_node("OptionalTypeCheck");
                node.expression = left;
                node.pattern = right;
                left = node;
            } else {
                let node = parser.make_node("TypeCheck");
                node.expression = left;
                node.pattern = right;
                left = node;
            }
        } else if (tokenType == "AS") {
            let isOptional = false;
            if (parser.current_token.type == "QUESTION") {
                isOptional = true;
                parser.advance();
            }
            right = package__parser__parseTypeExpression(parser);
            if (isOptional) {
                let node = parser.make_node("OptionalTypeCast");
                node.expression = left;
                node.targetType = right;
                left = node;
            } else {
                let node = parser.make_node("TypeCast");
                node.expression = left;
                node.targetType = right;
                left = node;
            }
        } else {
            right = package__parser__parseExpressionWithPrecedence(
                parser,
                nextMinPrecedence,
                inline
            );
            if (right && right.type == "ParseError") {
                return right;
            }
            if (tokenType == "ASSIGN") {
                let node = parser.make_node("Assignment");
                node.left = left;
                node.right = right;
                left = node;
            } else {
                let node = parser.make_node("BinaryOp");
                node.left = left;
                node.operator = op;
                node.right = right;
                left = node;
            }
        }
    }
    return left;
}
export function package__parser__parseExpression(parser) {
    return package__parser__parseExpressionWithPrecedence(parser, 0, false);
}
export function package__parser__parseInlineExpression(parser) {
    return package__parser__parseExpressionWithPrecedence(parser, 0, true);
}
export function package__parser__parseUnaryExpression(parser, inline) {
    if (
        parser.current_token.type == "BANG" ||
        parser.current_token.type == "MINUS"
    ) {
        let op = parser.current_token.value;
        parser.advance();
        let operand = package__parser__parseUnaryExpression(parser, inline);
        if (operand && operand.type == "ParseError") {
            return operand;
        }
        let node = parser.make_node("UnaryOp");
        node.operator = op;
        node.operand = operand;
        return node;
    }
    return package__parser__parsePostfixExpression(parser, inline);
}
export function package__parser__parse_new_expression(parser, inline) {
    parser.advance();
    let className = parser.parse_name_path(true);
    let lparen = parser.expect("LPAREN");
    if (lparen.type == "ParseError") {
        return lparen;
    }
    let args = [];
    if (parser.current_token.type != "RPAREN") {
        let arg = package__parser__parseExpressionWithPrecedence(
            parser,
            0,
            inline
        );
        if (arg.type == "ParseError") {
            return arg;
        }
        args.push(arg);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            arg = package__parser__parseExpressionWithPrecedence(
                parser,
                0,
                inline
            );
            if (arg.type == "ParseError") {
                return arg;
            }
            args.push(arg);
        }
    }
    let rparen = parser.expect("RPAREN");
    if (rparen.type == "ParseError") {
        return rparen;
    }
    let node = parser.make_node("NewExpression");
    node.className = className;
    node.arguments = args;
    return node;
}
export function package__parser__parsePostfixExpression(parser, inline) {
    let expr = package__parser__parse_term_expression_atomic(parser, inline);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    while (true) {
        if (parser.current_token.type == "LPAREN") {
            let nextIndex = parser.position + 1;
            let hasTrailingClosure = false;
            parser.advance();
            let args = [];
            if (parser.current_token.type != "RPAREN") {
                let arg = package__parser__parseExpressionWithPrecedence(
                    parser,
                    0,
                    inline
                );
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                args.push(arg);
                while (parser.current_token.type == "COMMA") {
                    parser.advance();
                    arg = package__parser__parseExpressionWithPrecedence(
                        parser,
                        0,
                        inline
                    );
                    if (arg && arg.type == "ParseError") {
                        return arg;
                    }
                    args.push(arg);
                }
            }
            let rparen = parser.expect("RPAREN");
            if (rparen && rparen.type == "ParseError") {
                return rparen;
            }
            let closure = null;
            if (parser.current_token.type == "LBRACE" && !inline) {
                closure = package__parser__parse_function_block(parser);
                if (closure && closure.type == "ParseError") {
                    return closure;
                }
                hasTrailingClosure = true;
            }
            let callNode = parser.make_node("MicroCall");
            callNode.callee = expr;
            callNode.arguments = args;
            if (hasTrailingClosure) {
                callNode.closure = closure;
            }
            expr = callNode;
        } else if (parser.current_token.type == "DOT") {
            parser.advance();
            if (parser.current_token.type == "AWAIT") {
                parser.advance();
                let awaitNode = parser.make_node("AwaitExpression");
                awaitNode.argument = expr;
                expr = awaitNode;
            } else {
                let property = parser.parse_identifier();
                if (property && property.type == "ParseError") {
                    return property;
                }
                let accessNode = parser.make_node("PropertyAccess");
                accessNode.object = expr;
                accessNode.property = property.value;
                expr = accessNode;
            }
        } else if (parser.current_token.type == "DOUBLE_COLON") {
            parser.advance();
            let methodName = parser.parse_identifier();
            if (methodName && methodName.type == "ParseError") {
                return methodName;
            }
            let namespacePath = [];
            namespacePath.push(methodName.value);
            while (parser.current_token.type == "DOUBLE_COLON") {
                parser.advance();
                let nextName = parser.parse_identifier();
                if (nextName && nextName.type == "ParseError") {
                    return nextName;
                }
                namespacePath.push(nextName.value);
            }
            if (parser.current_token.type == "LPAREN") {
                parser.advance();
                let args = [];
                if (parser.current_token.type != "RPAREN") {
                    let arg = package__parser__parseExpressionWithPrecedence(
                        parser,
                        0,
                        inline
                    );
                    if (arg && arg.type == "ParseError") {
                        return arg;
                    }
                    args.push(arg);
                    while (parser.current_token.type == "COMMA") {
                        parser.advance();
                        arg = package__parser__parseExpressionWithPrecedence(
                            parser,
                            0,
                            inline
                        );
                        if (arg && arg.type == "ParseError") {
                            return arg;
                        }
                        args.push(arg);
                    }
                }
                let rparen = parser.expect("RPAREN");
                if (rparen && rparen.type == "ParseError") {
                    return rparen;
                }
                let staticCallNode = parser.make_node("StaticMethodCall");
                staticCallNode.namespacePath = namespacePath;
                staticCallNode.methodName =
                    namespacePath[namespacePath.length - 1];
                staticCallNode.className =
                    namespacePath[namespacePath.length - 2];
                staticCallNode.arguments = args;
                expr = staticCallNode;
            } else {
                let staticAccessNode = parser.make_node("StaticPropertyAccess");
                staticAccessNode.namespacePath = namespacePath;
                staticAccessNode.property =
                    namespacePath[namespacePath.length - 1];
                staticAccessNode.className =
                    namespacePath[namespacePath.length - 2];
                expr = staticAccessNode;
            }
        } else if (parser.current_token.type == "LBRACKET") {
            parser.advance();
            let index = package__parser__parseExpressionWithPrecedence(
                parser,
                0,
                inline
            );
            if (index && index.type == "ParseError") {
                return index;
            }
            let rbracket = parser.expect("RBRACKET");
            if (rbracket && rbracket.type == "ParseError") {
                return rbracket;
            }
            let accessNode = parser.make_node("ArrayAccess");
            accessNode.object = expr;
            accessNode.index = index;
            expr = accessNode;
        } else {
            break;
        }
    }
    return expr;
}
export function package__parser__parse_micro_anonymous(parser, name) {
    let closure = package__parser__parse_function_block(parser);
    if (closure && closure.type == "ParseError") {
        return closure;
    }
    let callNode = parser.make_node("MicroCall");
    let identifierNode = parser.make_node("Identifier");
    identifierNode.name = name;
    callNode.callee = identifierNode;
    callNode.arguments = [];
    callNode.closure = closure;
    return callNode;
}
export function package__parser__parse_term_expression_atomic(parser, inline) {
    if (parser.current_token.type == "NUMBER") {
        let value = parser.current_token.value;
        parser.advance();
        let node = parser.make_node("Number");
        node.value = value;
        return node;
    }
    if (parser.current_token.type == "STRING") {
        let value = parser.current_token.value;
        parser.advance();
        let node = parser.make_node("String");
        node.value = value;
        return node;
    }
    if (parser.current_token.type == "MATCH") {
        return package__parser__parseMatchExpression(parser, inline);
    }
    if (parser.current_token.type == "BOOLEAN") {
        let value = parser.current_token.value;
        parser.advance();
        let node = parser.make_node("Boolean");
        node.value = value;
        return node;
    }
    if (
        parser.current_token.type == "SYMBOL_XID" ||
        parser.current_token.type == "SYMBOL_RAW"
    ) {
        return parser.parse_name_path(false);
    }
    if (parser.current_token.type == "MICRO") {
        parser.advance();
        let lparen = parser.expect("LPAREN");
        if (lparen.type == "ParseError") {
            return lparen;
        }
        let params = package__parser__parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen.type == "ParseError") {
            return rparen;
        }
        let body = package__parser__parse_function_block(parser);
        if (body && body.type == "ParseError") {
            return body;
        }
        let node = parser.make_node("AnonymousFunction");
        node.parameters = params;
        node.body = body;
        return node;
    }
    if (parser.current_token.type == "SELF") {
        let nextIndex = parser.position + 1;
        if (
            nextIndex < parser.tokens.length &&
            parser.tokens[nextIndex].type == "DOUBLE_COLON"
        ) {
            let name = "Self";
            parser.advance();
            let node = parser.make_node("Identifier");
            node.name = name;
            return node;
        } else {
            parser.advance();
            let node = parser.make_node("ThisExpression");
            return node;
        }
    }
    if (parser.current_token.type == "NEW") {
        return package__parser__parse_new_expression(parser, true);
    }
    if (parser.current_token.type == "LPAREN") {
        parser.advance();
        let expr = package__parser__parseExpressionWithPrecedence(
            parser,
            0,
            inline
        );
        if (expr && expr.type == "ParseError") {
            return expr;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        return expr;
    }
    if (parser.current_token.type == "LBRACKET") {
        parser.advance();
        let node = parser.make_node("ArrayLiteral");
        node.elements = [];
        if (parser.current_token.type != "RBRACKET") {
            let element = package__parser__parseExpressionWithPrecedence(
                parser,
                0,
                inline
            );
            if (element && element.type == "ParseError") {
                return element;
            }
            node.elements.push(element);
            while (parser.current_token.type == "COMMA") {
                parser.advance();
                element = package__parser__parseExpressionWithPrecedence(
                    parser,
                    0,
                    inline
                );
                if (element && element.type == "ParseError") {
                    return element;
                }
                node.elements.push(element);
            }
        }
        let rbracket = parser.expect("RBRACKET");
        if (rbracket && rbracket.type == "ParseError") {
            return rbracket;
        }
        return node;
    }
    if (parser.current_token.type == "LBRACE" && !inline) {
        parser.advance();
        let node = parser.make_node("ObjectLiteral");
        node.properties = [];
        if (parser.current_token.type != "RBRACE") {
            while (
                parser.current_token.type == "SYMBOL_XID" ||
                parser.current_token.type == "STRING"
            ) {
                let key = parser.current_token.value;
                parser.advance();
                let colon = parser.expect("COLON");
                if (colon && colon.type == "ParseError") {
                    return colon;
                }
                let value = package__parser__parseExpressionWithPrecedence(
                    parser,
                    0,
                    inline
                );
                if (value && value.type == "ParseError") {
                    return value;
                }
                let propertyNode = parser.make_node("Property");
                propertyNode.key = key;
                propertyNode.value = value;
                node.properties.push(propertyNode);
                if (parser.current_token.type == "COMMA") {
                    parser.advance();
                } else {
                    break;
                }
            }
        }
        let rbrace = parser.expect("RBRACE");
        if (rbrace && rbrace.type == "ParseError") {
            return rbrace;
        }
        return node;
    }
    let error = {};
    error.type = "ParseError";
    error.message = "Expected expression but got " + parser.current_token.type;
    error.line = parser.current_token.line;
    error.column = parser.current_token.column;
    return error;
}
export function package__parser__parseMatchExpression(parser, inline) {
    parser.advance();
    let expr = package__parser__parseInlineExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    let lbrace = parser.expect("LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    let branches = [];
    while (parser.current_token.type != "RBRACE") {
        let branch = package__parser__parseMatchBranch(parser);
        if (branch && branch.type == "ParseError") {
            return branch;
        }
        branches.push(branch);
    }
    let rbrace = parser.expect("RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    let node = parser.make_node("MatchExpression");
    node.expression = expr;
    node.branches = branches;
    return node;
}
export function package__parser__parseMatchBranch(parser) {
    let branchType = parser.current_token.type;
    if (branchType == "WHEN") {
        return package__parser__parseWhenBranch(parser);
    } else if (branchType == "CASE") {
        return package__parser__parseCaseBranch(parser);
    } else if (branchType == "TYPE") {
        return package__parser__parseTypeBranch(parser);
    } else if (branchType == "ELSE") {
        return package__parser__parseElseBranch(parser);
    } else {
        let error = {};
        error.type = "ParseError";
        error.message =
            "Expected when, case, type, or else in match branch but got " +
            branchType;
        error.line = parser.current_token.line;
        error.column = parser.current_token.column;
        return error;
    }
}
export function package__parser__parseWhenBranch(parser) {
    parser.advance();
    let condition = package__parser__parseExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let colon = parser.expect("COLON");
    if (colon && colon.type == "ParseError") {
        return colon;
    }
    let statements = package__parser__parseMatchBranchStatements(parser);
    if (statements && statements.type == "ParseError") {
        return statements;
    }
    let node = parser.make_node("WhenBranch");
    node.condition = condition;
    node.statements = statements;
    return node;
}
export function package__parser__parseCaseBranch(parser) {
    parser.advance();
    let pattern = package__parser__parse_pattern_expression(parser);
    if (pattern.type == "ParseError") {
        return pattern;
    }
    let colon = parser.expect("COLON");
    if (colon && colon.type == "ParseError") {
        return colon;
    }
    let statements = package__parser__parseMatchBranchStatements(parser);
    if (statements && statements.type == "ParseError") {
        return statements;
    }
    let node = parser.make_node("CaseBranch");
    node.pattern = pattern;
    node.statements = statements;
    return node;
}
export function package__parser__parseTypeBranch(parser) {
    parser.advance();
    let typeName = parser.parse_identifier_in("Branches");
    if (typeName.type == "ParseError") {
        return typeName;
    }
    let colon = parser.expect("COLON");
    if (colon && colon.type == "ParseError") {
        return colon;
    }
    let statements = package__parser__parseMatchBranchStatements(parser);
    if (statements && statements.type == "ParseError") {
        return statements;
    }
    let node = parser.make_node("TypeBranch");
    node.typeName = typeName.value;
    node.statements = statements;
    return node;
}
export function package__parser__parseElseBranch(parser) {
    parser.advance();
    let colon = parser.expect("COLON");
    if (colon && colon.type == "ParseError") {
        return colon;
    }
    let statements = package__parser__parseMatchBranchStatements(parser);
    if (statements && statements.type == "ParseError") {
        return statements;
    }
    let node = parser.make_node("ElseBranch");
    node.statements = statements;
    return node;
}
export function package__parser__parseMatchBranchStatements(parser) {
    let statements = [];
    while (
        parser.current_token.type != "WHEN" &&
        parser.current_token.type != "CASE" &&
        parser.current_token.type != "TYPE" &&
        parser.current_token.type != "ELSE" &&
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        let stmt = package__parser__parseStatement(parser);
        if (stmt && stmt.type == "ParseError") {
            return stmt;
        }
        statements.push(stmt);
    }
    return statements;
}
export function package__parser__parseTermParameters(parser) {
    let params = [];
    if (parser.current_token.type != "RPAREN") {
        let param = package__parser__parseTypedParameter(parser);
        if (param && param.type == "ParseError") {
            return param;
        }
        params.push(param);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            param = package__parser__parseTypedParameter(parser);
            if (param && param.type == "ParseError") {
                return param;
            }
            params.push(param);
        }
    }
    return params;
}
export function package__parser__parseTypedParameter(parser) {
    let paramName = null;
    if (parser.current_token.type == "SYMBOL_XID") {
        paramName = parser.parse_identifier();
    } else if (parser.current_token.type == "SELF") {
        paramName = parser.expect("SELF");
    } else {
        paramName = parser.parse_identifier();
    }
    if (paramName && paramName.type == "ParseError") {
        return paramName;
    }
    let node = parser.make_node("Parameter");
    node.name = paramName.value;
    node.typeAnnotation = null;
    node.defaultValue = null;
    if (parser.current_token.type == "COLON") {
        parser.advance();
        let typeExpr = package__parser__parseTypeExpression(parser);
        if (typeExpr && typeExpr.type == "ParseError") {
            return typeExpr;
        }
        node.typeAnnotation = typeExpr;
    }
    if (parser.current_token.type == "ASSIGN") {
        parser.advance();
        let defaultExpr = package__parser__parseExpression(parser);
        if (defaultExpr && defaultExpr.type == "ParseError") {
            return defaultExpr;
        }
        node.defaultValue = defaultExpr;
    }
    return node;
}
// using ;
// using ;
export function package__parser__getTypeOperatorPrecedence(tokenType) {
    if (tokenType == "ARROW") {
        return 1;
    }
    if (tokenType == "PIPE") {
        return 2;
    }
    if (tokenType == "AMPERSAND") {
        return 3;
    }
    if (tokenType == "PLUS") {
        return 4;
    }
    if (tokenType == "MINUS") {
        return 4;
    }
    return -1;
}
export function package__parser__isTypeRightAssociative(tokenType) {
    return tokenType == "ARROW";
}
export function package__parser__parseTypeExpressionWithPrecedence(
    parser,
    minPrecedence
) {
    let left = package__parser__parseUnaryTypeExpression(parser);
    if (left && left.type == "ParseError") {
        return left;
    }
    while (true) {
        let precedence = package__parser__getTypeOperatorPrecedence(
            parser.current_token.type
        );
        if (precedence < minPrecedence) {
            break;
        }
        let op = parser.current_token.value;
        let tokenType = parser.current_token.type;
        parser.advance();
        let nextMinPrecedence = precedence;
        if (package__parser__isTypeRightAssociative(tokenType)) {
        } else {
            nextMinPrecedence = precedence + 1;
        }
        let right = package__parser__parseTypeExpressionWithPrecedence(
            parser,
            nextMinPrecedence
        );
        if (right && right.type == "ParseError") {
            return right;
        }
        if (tokenType == "ARROW") {
            let node = parser.make_node("FunctionType");
            node.parameterType = left;
            node.returnType = right;
            left = node;
        } else if (tokenType == "PIPE") {
            let node = parser.make_node("UnionType");
            node.left = left;
            node.right = right;
            left = node;
        } else if (tokenType == "AMPERSAND") {
            let node = parser.make_node("IntersectionType");
            node.left = left;
            node.right = right;
            left = node;
        } else {
            let node = parser.make_node("BinaryTypeOp");
            node.left = left;
            node.operator = op;
            node.right = right;
            left = node;
        }
    }
    return left;
}
export function package__parser__parseTypeExpression(parser) {
    return package__parser__parseTypeExpressionWithPrecedence(parser, 0);
}
export function package__parser__parseUnaryTypeExpression(parser) {
    if (
        parser.current_token.type == "PLUS" ||
        parser.current_token.type == "MINUS"
    ) {
        let op = parser.current_token.value;
        parser.advance();
        let operand = package__parser__parseUnaryTypeExpression(parser);
        if (operand && operand.type == "ParseError") {
            return operand;
        }
        let node = parser.make_node("VarianceType");
        node.variance = op;
        node.operand = operand;
        return node;
    }
    return package__parser__parsePostfixTypeExpression(parser);
}
export function package__parser__parsePostfixTypeExpression(parser) {
    let expr = package__parser__parseAtomicTypeExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    while (true) {
        if (parser.current_token.type == "QUESTION") {
            parser.advance();
            let node = parser.make_node("NullableType");
            node.baseType = expr;
            expr = node;
        } else if (parser.current_token.type == "BANG") {
            parser.advance();
            let node = parser.make_node("NonNullType");
            node.baseType = expr;
            expr = node;
        } else if (parser.current_token.type == "LT") {
            parser.advance();
            let typeArgs = [];
            if (parser.current_token.type != "GT") {
                let arg = package__parser__parseTypeExpression(parser);
                if (arg && arg.type == "ParseError") {
                    return arg;
                }
                typeArgs.push(arg);
                while (parser.current_token.type == "COMMA") {
                    parser.advance();
                    arg = package__parser__parseTypeExpression(parser);
                    if (arg && arg.type == "ParseError") {
                        return arg;
                    }
                    typeArgs.push(arg);
                }
            }
            let gt = parser.expect("GT");
            if (gt && gt.type == "ParseError") {
                return gt;
            }
            let node = parser.make_node("GenericType");
            node.baseType = expr;
            node.typeArguments = typeArgs;
            expr = node;
        } else if (parser.current_token.type == "LBRACKET") {
            parser.advance();
            let rbracket = parser.expect("RBRACKET");
            if (rbracket && rbracket.type == "ParseError") {
                return rbracket;
            }
            let node = parser.make_node("ArrayType");
            node.elementType = expr;
            expr = node;
        } else {
            break;
        }
    }
    return expr;
}
export function package__parser__parseAtomicTypeExpression(parser) {
    if (parser.current_token.type == "SYMBOL_XID") {
        let name = parser.current_token.value;
        parser.advance();
        let node = parser.make_node("TypeIdentifier");
        node.name = name;
        return node;
    }
    if (parser.current_token.type == "LPAREN") {
        parser.advance();
        let expr = package__parser__parseTypeExpression(parser);
        if (expr && expr.type == "ParseError") {
            return expr;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        return expr;
    }
    if (parser.current_token.type == "LPAREN") {
        parser.advance();
        let elements = [];
        if (parser.current_token.type != "RPAREN") {
            let element = package__parser__parseTypeExpression(parser);
            if (element && element.type == "ParseError") {
                return element;
            }
            elements.push(element);
            while (parser.current_token.type == "COMMA") {
                parser.advance();
                element = package__parser__parseTypeExpression(parser);
                if (element && element.type == "ParseError") {
                    return element;
                }
                elements.push(element);
            }
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        if (elements.length == 1) {
            return elements[0];
        } else {
            let node = parser.make_node("TupleType");
            node.elements = elements;
            return node;
        }
    }
    if (parser.current_token.type == "LBRACE") {
        parser.advance();
        let properties = [];
        if (parser.current_token.type != "RBRACE") {
            while (
                parser.current_token.type == "SYMBOL_XID" ||
                parser.current_token.type == "STRING"
            ) {
                let key = parser.current_token.value;
                parser.advance();
                let colon = parser.expect("COLON");
                if (colon && colon.type == "ParseError") {
                    return colon;
                }
                let valueType = package__parser__parseTypeExpression(parser);
                if (valueType && valueType.type == "ParseError") {
                    return valueType;
                }
                let propertyNode = parser.make_node("TypeProperty");
                propertyNode.key = key;
                propertyNode.valueType = valueType;
                properties.push(propertyNode);
                if (parser.current_token.type == "COMMA") {
                    parser.advance();
                } else {
                    break;
                }
            }
        }
        let rbrace = parser.expect("RBRACE");
        if (rbrace && rbrace.type == "ParseError") {
            return rbrace;
        }
        let node = parser.make_node("ObjectType");
        node.properties = properties;
        return node;
    }
    if (parser.current_token.type == "STRING") {
        let value = parser.current_token.value;
        parser.advance();
        let node = parser.make_node("LiteralType");
        node.value = value;
        node.literalType = "string";
        return node;
    }
    if (parser.current_token.type == "NUMBER") {
        let value = parser.current_token.value;
        parser.advance();
        let node = parser.make_node("LiteralType");
        node.value = value;
        node.literalType = "number";
        return node;
    }
    if (parser.current_token.type == "BOOLEAN") {
        let value = parser.current_token.value;
        parser.advance();
        let node = parser.make_node("LiteralType");
        node.value = value;
        node.literalType = "boolean";
        return node;
    }
    let error = {};
    error.type = "ParseError";
    error.message =
        "Expected type expression but got " + parser.current_token.type;
    error.line = parser.current_token.line;
    error.column = parser.current_token.column;
    return error;
}
export function package__parser__parseTypedParameters(parser) {
    let params = [];
    if (parser.current_token.type != "RPAREN") {
        let param = package__parser__parseTypedParameter(parser);
        if (param && param.type == "ParseError") {
            return param;
        }
        params.push(param);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            param = package__parser__parseTypedParameter(parser);
            if (param && param.type == "ParseError") {
                return param;
            }
            params.push(param);
        }
    }
    return params;
}
export function package__parser__parseTypeHint(parser) {
    if (parser.currentToken.type == "Colon") {
        parser.advance();
        return parser.parseTypeExpression();
    }
    return null;
}
export function package__parser__parseReturnType(parser) {
    if (parser.currentToken.type == "Arrow") {
        parser.advance();
        return this.parseTypeExpression();
    }
    return null;
}
export function package__parser__parseEffectType(parser) {
    if (parser.currentToken.type == "Slash") {
        parser.advance();
        return parser.parseTypeExpression();
    }
    return null;
}
class package__parser__ValkyrieParser {
    constructor(options) {}

    advance() {
        this.position = this.position + 1;
        if (this.position < this.tokens.length) {
            this.current_token = this.tokens[this.position];
        } else {
            this.current_token = {};
            this.current_token.type = "EOF";
        }
    }

    expect(tokenType) {
        if (this.current_token.type != tokenType) {
            let error = {};
            error.type = "ParseError";
            error.message =
                "Expected " + tokenType + " but got " + this.current_token.type;
            error.line = this.current_token.line;
            error.column = this.current_token.column;
            return error;
        }
        let token = this.current_token;
        this.advance();
        return token;
    }

    make_node(node_type) {
        return new package__parser__Node(
            node_type,
            this.current_token.offset,
            this.current_token.length,
            this.current_token.line,
            this.current_token.column
        );
    }

    parse(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.current_token = tokens[0];
        return package__parser__parse_program(this);
    }

    parse_identifier() {
        if (
            this.current_token.type == "SYMBOL_XID" ||
            this.current_token.type == "SYMBOL_RAW"
        ) {
            let token = this.current_token;
            this.advance();
            return token;
        }
        let error = {};
        error.type = "ParseError";
        error.message =
            "Expected identifier but got " + this.current_token.type;
        error.line = this.current_token.line;
        error.column = this.current_token.column;
        return error;
    }

    parse_identifier_in(context) {
        if (
            this.current_token["type"] == "SYMBOL_XID" ||
            this.current_token["type"] == "SYMBOL_RAW"
        ) {
            let token = this.current_token;
            this.advance();
            return token;
        }
        if (context == "Branches") {
            if (
                this.current_token["type"] == "TYPE" ||
                this.current_token["type"] == "CASE" ||
                this.current_token["type"] == "WHEN" ||
                this.current_token["type"] == "ELSE"
            ) {
                let token = this.current_token;
                this.advance();
                return token;
            }
        }
        let error = {};
        error["type"] = "ParseError";
        error.message =
            "Expected identifier in context " +
            context +
            " but got " +
            this.current_token["type"];
        error.line = this.current_token.line;
        error.column = this.current_token.column;
        return error;
    }

    parse_name_path(free_mode) {
        let first_identifier = this.parse_identifier();
        if (first_identifier.type == "ParseError") {
            return first_identifier;
        }
        let names = [];
        let firstNode = this.make_node("Identifier");
        firstNode.name = first_identifier.value;
        names.push(firstNode);
        while (this.current_token.type == "DOUBLE_COLON") {
            this.advance();
            if (
                this.current_token.type != "SYMBOL_XID" &&
                this.current_token.type != "SYMBOL_RAW"
            ) {
                let error = {};
                error.type = "ParseError";
                error.message = "Expected identifier after '::'";
                error.line = this.current_token.line;
                error.column = this.current_token.column;
                return error;
            }
            let nextName = this.current_token.value;
            this.advance();
            let nextIdentifier = this.make_node("Identifier");
            nextIdentifier.name = nextName;
            names.push(nextIdentifier);
        }
        let namepath = this.make_node("NamePath");
        namepath.name_path = names;
        return namepath;
    }

    eat_semicolon() {
        if (this.current_token.type == "SEMICOLON") {
            this.advance();
        }
    }
}
// using ;
// using ;
// using ;
export function package__parser__parseStatement(parser) {
    if (parser.current_token.type == "EOF") {
        let error = {};
        error.type = "ParseError";
        error.message = "Unexpected EOF in statement";
        error.line = parser.current_token.line;
        error.column = parser.current_token.column;
        return error;
    }
    if (parser.current_token.type == "NAMESPACE") {
        return package__parser__parse_namespace_statement(parser);
    }
    if (parser.current_token.type == "USING") {
        return package__parser__parse_using_statement(parser);
    }
    if (parser.current_token.type == "ATTRIBUTE") {
        return package__parser__parseAttributeStatement(parser);
    }
    if (parser.current_token.type == "CLASS") {
        return package__parser__parseClassDeclaration(parser);
    }
    if (parser.current_token.type == "SINGLETON") {
        return package__parser__parseSingletonDeclaration(parser);
    }
    if (parser.current_token.type == "TRAIT") {
        return package__parser__parseTraitDeclaration(parser);
    }
    if (parser.current_token.type == "FLAGS") {
        return package__parser__parseFlagsDeclaration(parser);
    }
    if (parser.current_token.type == "EIDOS") {
        return package__parser__parseEidosDeclaration(parser);
    }
    if (parser.current_token.type == "LET") {
        return package__parser__parseLetStatement(parser);
    }
    if (parser.current_token.type == "MICRO") {
        let nextIndex = parser.position + 1;
        if (
            nextIndex < parser.tokens.length &&
            parser.tokens[nextIndex].type == "SYMBOL_XID"
        ) {
            let afterNameIndex = nextIndex + 1;
            if (
                afterNameIndex < parser.tokens.length &&
                parser.tokens[afterNameIndex].type == "LPAREN"
            ) {
                return package__parser__parseMicroFunctionDeclaration(parser);
            }
        }
        return package__parser__parse_function_declaration(parser);
    }
    if (parser.current_token.type == "IF") {
        return package__parser__parseIfStatement(parser);
    }
    if (parser.current_token.type == "WHILE") {
        return package__parser__parseWhileStatement(parser);
    }
    if (parser.current_token.type == "UNTIL") {
        return package__parser__parseUntilStatement(parser);
    }
    if (parser.current_token.type == "RETURN") {
        return package__parser__parseReturnStatement(parser);
    }
    if (parser.current_token.type == "LBRACE") {
        return package__parser__parse_function_block(parser);
    }
    let expr = package__parser__parseExpression(parser);
    if (expr && expr.type == "ParseError") {
        return expr;
    }
    let semicolon = parser.expect("SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    let stmt = parser.make_node("ExpressionStatement");
    stmt.expression = expr;
    return stmt;
}
export function package__parser__parseLetStatement(parser) {
    parser.advance();
    let name = parser.parse_identifier();
    if (name && name.type == "ParseError") {
        return name;
    }
    let assignToken = parser.expect("ASSIGN");
    if (assignToken && assignToken.type == "ParseError") {
        return assignToken;
    }
    let value = package__parser__parseExpression(parser);
    if (value && value.type == "ParseError") {
        return value;
    }
    let semicolon = parser.expect("SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    let node = parser.make_node("LetStatement");
    node.name = name.value;
    node.value = value;
    return node;
}
export function package__parser__parse_namespace_statement(parser) {
    parser.advance();
    let is_main_namespace = false;
    if (parser.current_token.type == "BANG") {
        parser.advance();
        is_main_namespace = true;
    }
    let names = parser.parse_name_path(true);
    let node = parser.make_node("NamespaceStatement");
    node.path = names;
    node.is_main_namespace = is_main_namespace;
    parser.eat_semicolon();
    return node;
}
export function package__parser__parse_using_statement(parser) {
    parser.advance();
    let path = parser.parse_name_path(true);
    let node = parser.make_node("UsingStatement");
    node.path = path;
    parser.eat_semicolon();
    return node;
}
export function package__parser__parseAttributeStatement(parser) {
    parser.advance();
    let jsToken = parser.parse_identifier();
    if (jsToken.type == "ParseError") {
        return jsToken;
    }
    if (jsToken.value != "js") {
        let error = {};
        error.type = "ParseError";
        error.message = "Expected 'js' after ↯";
        error.line = jsToken.line;
        error.column = jsToken.column;
        return error;
    }
    let lparen = parser.expect("LPAREN");
    if (lparen.type == "ParseError") {
        return lparen;
    }
    let modulePath = parser.expect("STRING");
    if (modulePath.type == "ParseError") {
        return modulePath;
    }
    let comma = parser.expect("COMMA");
    if (comma.type == "ParseError") {
        return comma;
    }
    let importName = parser.expect("STRING");
    if (importName.type == "ParseError") {
        return importName;
    }
    let rparen = parser.expect("RPAREN");
    if (rparen.type == "ParseError") {
        return rparen;
    }
    let microToken = parser.expect("MICRO");
    if (microToken.type == "ParseError") {
        return microToken;
    }
    let functionName = parser.parse_identifier();
    if (functionName.type == "ParseError") {
        return functionName;
    }
    let paramLparen = parser.expect("LPAREN");
    if (paramLparen.type == "ParseError") {
        return paramLparen;
    }
    let parameters = [];
    if (parser.current_token.type != "RPAREN") {
        let param = parser.parse_identifier();
        if (param.type == "ParseError") {
            return param;
        }
        parameters.push(param.value);
        while (parser.current_token.type == "COMMA") {
            parser.advance();
            param = parser.parse_identifier();
            if (param.type == "ParseError") {
                return param;
            }
            parameters.push(param.value);
        }
    }
    let paramRparen = parser.expect("RPAREN");
    if (paramRparen.type == "ParseError") {
        return paramRparen;
    }
    let body = package__parser__parseStatement(parser);
    if (body.type == "ParseError") {
        return body;
    }
    let node = parser.make_node("JSAttributeStatement");
    node.modulePath = modulePath.value;
    node.importName = importName.value;
    node.functionName = functionName.value;
    node.parameters = parameters;
    node.body = body;
    return node;
}
export function package__parser__parseMicroFunctionDeclaration(parser) {
    parser.advance();
    let name = parser.parse_identifier();
    if (name && name.type == "ParseError") {
        return name;
    }
    let lparen = parser.expect("LPAREN");
    if (lparen && lparen.type == "ParseError") {
        return lparen;
    }
    let params = package__parser__parseTermParameters(parser);
    if (params && params.type == "ParseError") {
        return params;
    }
    let rparen = parser.expect("RPAREN");
    if (rparen && rparen.type == "ParseError") {
        return rparen;
    }
    let returnType = null;
    if (parser.current_token.type == "ARROW") {
        parser.advance();
        returnType = package__parser__parseTypeExpression(parser);
        if (returnType && returnType.type == "ParseError") {
            return returnType;
        }
    }
    let effectType = null;
    if (parser.current_token.type == "DIVIDE") {
        parser.advance();
        effectType = package__parser__parseTypeExpression(parser);
        if (effectType && effectType.type == "ParseError") {
            return effectType;
        }
    }
    let body = package__parser__parse_function_block(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = parser.make_node("MicroDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.returnType = returnType;
    node.effectType = effectType;
    node.body = body;
    return node;
}
export function package__parser__parse_keyword(
    parser,
    expected_keyword,
    node_type
) {
    parser.advance();
    let name = parser.parse_identifier();
    if (name && name.type == "ParseError") {
        return name;
    }
    let node = new package__parser__Node(node_type);
    node.name = name.value;
    node.superClass = null;
    node.members = [];
    return node;
}
export function package__parser__parse_inheritor(parser, node) {
    if (parser.current_token.type == "EXTENDS") {
        parser.advance();
        let superName = parser.parse_identifier();
        if (superName && superName.type == "ParseError") {
            return superName;
        }
        node.superClass = superName.value;
    }
    return node;
}
export function package__parser__parse_implements(parser, node) {
    return node;
}
export function package__parser__parse_object_body(parser, node) {
    let lbrace = parser.expect("LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        if (parser.current_token.type == "SEMICOLON") {
            parser.advance();
            continue;
        }
        let member = package__parser__parseClassMember(parser);
        if (member && member.type != "ParseError") {
            node.members.push(member);
        } else if (member && member.type == "ParseError") {
            return member;
        }
    }
    let rbrace = parser.expect("RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    return node;
}
export function package__parser__parseClassDeclaration(parser) {
    let node = package__parser__parse_keyword(
        parser,
        "class",
        "ClassDeclaration"
    );
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_inheritor(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_implements(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_object_body(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    return node;
}
export function package__parser__parseSingletonDeclaration(parser) {
    let node = package__parser__parse_keyword(
        parser,
        "singleton",
        "SingletonDeclaration"
    );
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_inheritor(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_implements(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_object_body(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    return node;
}
export function package__parser__parseTraitDeclaration(parser) {
    let node = package__parser__parse_keyword(
        parser,
        "trait",
        "TraitDeclaration"
    );
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_inheritor(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_implements(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    node = package__parser__parse_object_body(parser, node);
    if (node && node.type == "ParseError") {
        return node;
    }
    return node;
}
export function package__parser__parseClassMember(parser) {
    if (parser.current_token.type == "CONSTRUCTOR") {
        parser.advance();
        let lparen = parser.expect("LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let params = package__parser__parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let body = package__parser__parse_function_block(parser);
        if (body && body.type == "ParseError") {
            return body;
        }
        let ctorNode = parser.make_node("ConstructorStatement");
        ctorNode.parameters = params;
        ctorNode.body = body;
        return ctorNode;
    }
    if (parser.current_token.type == "MICRO") {
        parser.advance();
        let name = parser.parse_identifier();
        if (name && name.type == "ParseError") {
            return name;
        }
        let lparen = parser.expect("LPAREN");
        if (lparen && lparen.type == "ParseError") {
            return lparen;
        }
        let params = package__parser__parseTermParameters(parser);
        if (params && params.type == "ParseError") {
            return params;
        }
        let rparen = parser.expect("RPAREN");
        if (rparen && rparen.type == "ParseError") {
            return rparen;
        }
        let returnType = null;
        if (parser.current_token.type == "ARROW") {
            parser.advance();
            returnType = package__parser__parseTypeExpression(parser);
            if (returnType && returnType.type == "ParseError") {
                return returnType;
            }
        }
        let effectType = null;
        if (parser.current_token.type == "DIVIDE") {
            parser.advance();
            effectType = package__parser__parseTypeExpression(parser);
            if (effectType && effectType.type == "ParseError") {
                return effectType;
            }
        }
        let body = package__parser__parse_function_block(parser);
        if (body && body.type == "ParseError") {
            return body;
        }
        let isInstanceMethod = false;
        let i = 0;
        while (i < params.length) {
            let param = params[i];
            let paramName = "";
            if (param && param.name) {
                paramName = param.name;
            } else {
                paramName = param;
            }
            if (paramName == "self") {
                isInstanceMethod = true;
                break;
            }
            i = i + 1;
        }
        let methodNode = parser.make_node("MemberStatement");
        methodNode.name = name.value;
        methodNode.parameters = params;
        methodNode.returnType = returnType;
        methodNode.effectType = effectType;
        methodNode.body = body;
        methodNode.isInstanceMethod = isInstanceMethod;
        methodNode.isStatic = !isInstanceMethod;
        return methodNode;
    }
    if (parser.current_token.type == "SYMBOL_XID") {
        let nextIndex = parser.position + 1;
        if (nextIndex < parser.tokens.length) {
            let next_token = parser.tokens[nextIndex];
            if (
                next_token.type == "COLON" ||
                next_token.type == "ASSIGN" ||
                next_token.type == "SEMICOLON"
            ) {
                let name = parser.parse_identifier();
                if (name && name.type == "ParseError") {
                    return name;
                }
                let typeAnnotation = null;
                if (parser.current_token.type == "COLON") {
                    parser.advance();
                    typeAnnotation =
                        package__parser__parseTypeExpression(parser);
                    if (typeAnnotation && typeAnnotation.type == "ParseError") {
                        return typeAnnotation;
                    }
                }
                let initValue = null;
                if (parser.current_token.type == "ASSIGN") {
                    parser.advance();
                    initValue = package__parser__parseExpression(parser);
                    if (initValue && initValue.type == "ParseError") {
                        return initValue;
                    }
                }
                let semicolon = parser.expect("SEMICOLON");
                if (semicolon && semicolon.type == "ParseError") {
                    return semicolon;
                }
                let node = parser.make_node("Property");
                node.name = name.value;
                node.typeAnnotation = typeAnnotation;
                node.initializer = initValue;
                return node;
            }
        }
    }
    let error = {};
    error.type = "ParseError";
    error.message =
        "Expected class member (field or method) but got " +
        parser.current_token.type;
    error.line = parser.current_token.line;
    error.column = parser.current_token.column;
    return error;
}
export function package__parser__parse_function_declaration(parser) {
    parser.advance();
    let name = parser.parse_identifier();
    if (name && name.type == "ParseError") {
        return name;
    }
    let lparen = parser.expect("LPAREN");
    if (lparen && lparen.type == "ParseError") {
        return lparen;
    }
    let params = package__parser__parseTermParameters(parser);
    if (params && params.type == "ParseError") {
        return params;
    }
    let rparen = parser.expect("RPAREN");
    if (rparen && rparen.type == "ParseError") {
        return rparen;
    }
    let body = package__parser__parse_function_block(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = parser.make_node("MicroDeclaration");
    node.name = name.value;
    node.parameters = params;
    node.body = body;
    return node;
}
export function package__parser__parseIfStatement(parser) {
    parser.advance();
    let condition = package__parser__parseInlineExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let thenBranch = package__parser__parseStatement(parser);
    if (thenBranch && thenBranch.type == "ParseError") {
        return thenBranch;
    }
    let node = parser.make_node("IfStatement");
    node.condition = condition;
    node.thenBranch = thenBranch;
    node.elseBranch = null;
    if (parser.current_token.type == "ELSE") {
        parser.advance();
        let elseBranch = package__parser__parseStatement(parser);
        if (elseBranch && elseBranch.type == "ParseError") {
            return elseBranch;
        }
        node.elseBranch = elseBranch;
    }
    return node;
}
export function package__parser__parseWhileStatement(parser) {
    parser.advance();
    let condition = package__parser__parseInlineExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let body = package__parser__parse_function_block(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = parser.make_node("WhileStatement");
    node.condition = condition;
    node.body = body;
    return node;
}
export function package__parser__parseUntilStatement(parser) {
    parser.advance();
    let condition = package__parser__parseInlineExpression(parser);
    if (condition && condition.type == "ParseError") {
        return condition;
    }
    let body = package__parser__parse_function_block(parser);
    if (body && body.type == "ParseError") {
        return body;
    }
    let node = parser.make_node("UntilStatement");
    node.condition = condition;
    node.body = body;
    return node;
}
export function package__parser__parseReturnStatement(parser) {
    parser.advance();
    let node = parser.make_node("ReturnStatement");
    if (parser.current_token.type == "SEMICOLON") {
        node.value = null;
    } else {
        let value = package__parser__parseExpression(parser);
        if (value && value.type == "ParseError") {
            return value;
        }
        node.value = value;
    }
    let semicolon = parser.expect("SEMICOLON");
    if (semicolon && semicolon.type == "ParseError") {
        return semicolon;
    }
    return node;
}
export function package__parser__parse_function_block(parser) {
    let lbrace = parser.expect("LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    let statements = [];
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        let stmt = package__parser__parseStatement(parser);
        if (stmt && stmt.type == "ParseError") {
            return stmt;
        }
        statements.push(stmt);
    }
    let rbrace = parser.expect("RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    let node = parser.make_node("Block");
    node.statements = statements;
    return node;
}
export function package__parser__parseFlagsDeclaration(parser) {
    parser.advance();
    let name = parser.parse_identifier();
    if (name && name.type == "ParseError") {
        return name;
    }
    let lbrace = parser.expect("LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    let members = [];
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        let member = package__parser__parseFlagsMember(parser);
        if (member && member.type == "ParseError") {
            return member;
        }
        members.push(member);
    }
    let rbrace = parser.expect("RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    let node = parser.make_node("FlagsDeclaration");
    node.name = name.value;
    node.members = members;
    return node;
}
export function package__parser__parseFlagsMember(parser) {
    let name = parser.parse_identifier();
    if (name && name.type == "ParseError") {
        return name;
    }
    let assign = parser.expect("ASSIGN");
    if (assign && assign.type == "ParseError") {
        return assign;
    }
    let value = package__parser__parseExpression(parser);
    if (value && value.type == "ParseError") {
        return value;
    }
    let node = parser.make_node("FlagsMember");
    node.name = name.value;
    node.value = value;
    return node;
}
export function package__parser__parseEidosDeclaration(parser) {
    parser.advance();
    let name = parser.parse_identifier();
    if (name && name.type == "ParseError") {
        return name;
    }
    let lbrace = parser.expect("LBRACE");
    if (lbrace && lbrace.type == "ParseError") {
        return lbrace;
    }
    let members = [];
    while (
        parser.current_token.type != "RBRACE" &&
        parser.current_token.type != "EOF"
    ) {
        let member = package__parser__parseEidosMember(parser);
        if (member && member.type == "ParseError") {
            return member;
        }
        members.push(member);
    }
    let rbrace = parser.expect("RBRACE");
    if (rbrace && rbrace.type == "ParseError") {
        return rbrace;
    }
    let node = parser.make_node("EidosDeclaration");
    node.name = name.value;
    node.members = members;
    return node;
}
export function package__parser__parseEidosMember(parser) {
    let name = parser.parse_identifier();
    if (name && name.type == "ParseError") {
        return name;
    }
    let assign = parser.expect("ASSIGN");
    if (assign && assign.type == "ParseError") {
        return assign;
    }
    let value = package__parser__parseExpression(parser);
    if (value && value.type == "ParseError") {
        return value;
    }
    let node = parser.make_node("EidosMember");
    node.name = name.value;
    node.value = value;
    return node;
}
export function package__parser__parse_program(parser) {
    let statements = [];
    while (parser.current_token.type != "EOF") {
        let stmt = package__parser__parseStatement(parser);
        if (stmt && stmt.type == "ParseError") {
            return stmt;
        }
        statements.push(stmt);
    }
    let node = parser.make_node("Program");
    node.statements = statements;
    return node;
}
