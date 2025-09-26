// using legion::workspace;
function create_valkyrie_compiler() {
    return {"version": "0.1.0", "target": "node"};
}

function compile_file(compiler, file_path) {
    return {
        "success": true,
        "output": "console.log('Compiled: " + file_path + "');",
        "errors": []
    };
}

function compile_source(compiler, source_code) {
    return package_compiler_compileSource(source_code);
}

function compile_project(compiler, project_path) {
    let results = [];
    let files = find_source_files(project_path);
    let i = 0;
    while(i < files.length) {
        let result = compile_file(compiler, files[i]);
        results[i] = result;
        i = i + 1;
    }
    return results;
}

function get_compiler_info(compiler) {
    return {
        "version": compiler.version,
        "target": compiler.target,
        "features": ["basic", "node-target"]
    };
}

// 导出模块
module.exports = {
    create_valkyrie_compiler: create_valkyrie_compiler,
    compile_file: compile_file,
    compile_source: compile_source,
    compile_project: compile_project,
    get_compiler_info: get_compiler_info
};