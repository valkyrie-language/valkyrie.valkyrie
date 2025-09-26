function create_workspace_config(name, version) {
    return {
        "name": name,
        "version": version,
        "source_dir": "src",
        "build_dir": "dist",
        "main_entry": "main.vk",
        "target": "node",
        "dependencies": []
    };
}

function add_dependency(config, dependency) {
    let new_deps = [];
    let i = 0;
    while(i < config.dependencies.length) {
        new_deps[i] = config.dependencies[i];
        i = i + 1;
    }
    new_deps[config.dependencies.length] = dependency;
    config.dependencies = new_deps;
    return config;
}

function validate_config(config) {
    if(config.name == "") {
        return false;
    }
    if(config.version == "") {
        return false;
    }
    return true;
}

function create_config_manager(config_path) {
    return {"config_path": config_path};
}

function load_config(manager) {
    return create_workspace_config("default", "0.1.0");
}

function save_config(manager, config) {
    return true;
}

function parse_yaml_config(content) {
    let config = create_workspace_config("", "");
    let lines = content.split("\n");
    let i = 0;
    while(i < lines.length) {
        let line = lines[i].trim();
        if(line == "" || line.startsWith("#")) {
            i = i + 1;
            continue;
        }
        let colon_pos = line.indexOf(":");
        if(colon_pos != -1) {
            let key = line.substring(0, colon_pos).trim();
            let value = line.substring(colon_pos + 1).trim();
            if(value.startsWith("\"") && value.endsWith("\"")) {
                value = value.substring(1, value.length - 1);
            }
            if(value.startsWith("'") && value.endsWith("'")) {
                value = value.substring(1, value.length - 1);
            }
            if(key == "name") {
                config.name = value;
            } else if(key == "version") {
                config.version = value;
            } else if(key == "source_dir") {
                config.source_dir = value;
            } else if(key == "build_dir") {
                config.build_dir = value;
            } else if(key == "main_entry") {
                config.main_entry = value;
            } else if(key == "target") {
                config.target = value;
            }
        }
        i = i + 1;
    }
    return config;
}

function config_to_yaml(config) {
    return "name: \"" + config.name + "\"\n" +
           "version: \"" + config.version + "\"\n" +
           "source_dir: \"" + config.source_dir + "\"\n" +
           "build_dir: \"" + config.build_dir + "\"\n" +
           "main_entry: \"" + config.main_entry + "\"\n" +
           "target: \"" + config.target + "\"\n";
}

function create_project_template(name) {
    return {"name": name, "files": {}};
}

function add_template_file(template, file_path, content) {
    template.files[file_path] = content;
    return template;
}

function get_default_config_template() {
    return "name: \"my-project\"\n" +
           "version: \"0.1.0\"\n" +
           "source_dir: \"src\"\n" +
           "build_dir: \"dist\"\n" +
           "main_entry: \"main.vk\"\n" +
           "target: \"node\"\n" +
           "dependencies: []\n";
}

function get_default_main_template() {
    return "namespace main;\n\n" +
           "function main() {\n" +
           "    console.log(\"Hello, Valkyrie!\");\n" +
           "}\n";
}

function get_default_gitignore_template() {
    return "dist/\n" + "node_modules/\n" + "*.log\n" +
           ".DS_Store\n";
}

function generate_project_template(template, project_path) {
    return true;
}

// 导出模块
module.exports = {
    create_workspace_config: create_workspace_config,
    add_dependency: add_dependency,
    validate_config: validate_config,
    create_config_manager: create_config_manager,
    load_config: load_config,
    save_config: save_config,
    parse_yaml_config: parse_yaml_config,
    config_to_yaml: config_to_yaml,
    create_project_template: create_project_template,
    add_template_file: add_template_file,
    get_default_config_template: get_default_config_template,
    get_default_main_template: get_default_main_template,
    main: main,
    get_default_gitignore_template: get_default_gitignore_template,
    generate_project_template: generate_project_template
};