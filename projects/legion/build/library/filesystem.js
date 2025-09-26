function read_file(file_path) {
    let fs = require("fs");
    return fs.readFileSync(file_path, "utf8");
}

function write_file(file_path, content) {
    let fs = require("fs");
    fs.writeFileSync(file_path, content, "utf8");
    return true;
}

function file_exists(file_path) {
    let fs = require("fs");
    return fs.existsSync(file_path);
}

function create_directory(dir_path) {
    let fs = require("fs");
    if(!fs.existsSync(dir_path)) {
        fs.mkdirSync(dir_path, { recursive: true });
    }
    return true;
}

function list_files(dir_path) {
    let fs = require("fs");
    let path = require("path");
    let files = [];
    if(fs.existsSync(dir_path)) {
        let items = fs.readdirSync(dir_path);
        let i = 0;
        while(i < items.length) {
            let item = items[i];
            let full_path = path.join(dir_path, item);
            if(fs.statSync(full_path).isFile()) {
                files[files.length] = full_path;
            }
            i = i + 1;
        }
    }
    return files;
}

function list_directories(dir_path) {
    let fs = require("fs");
    let path = require("path");
    let dirs = [];
    if(fs.existsSync(dir_path)) {
        let items = fs.readdirSync(dir_path);
        let i = 0;
        while(i < items.length) {
            let item = items[i];
            let full_path = path.join(dir_path, item);
            if(fs.statSync(full_path).isDirectory()) {
                dirs[dirs.length] = full_path;
            }
            i = i + 1;
        }
    }
    return dirs;
}

function get_file_name(file_path) {
    let path = require("path");
    return path.basename(file_path);
}

function get_file_extension(file_path) {
    let path = require("path");
    return path.extname(file_path);
}

function join_path(path1, path2) {
    let path = require("path");
    return path.join(path1, path2);
}

function get_directory_name(dir_path) {
    let path = require("path");
    return path.basename(dir_path);
}

function find_files_with_extension(dir_path, extension) {
    let fs = require("fs");
    let path = require("path");
    let files = [];
    if(fs.existsSync(dir_path)) {
        let items = fs.readdirSync(dir_path);
        let i = 0;
        while(i < items.length) {
            let item = items[i];
            let full_path = path.join(dir_path, item);
            if(fs.statSync(full_path).isFile() && path.extname(item) == extension) {
                files[files.length] = full_path;
            }
            i = i + 1;
        }
    }
    return files;
}

function copy_file(source_path, dest_path) {
    let fs = require("fs");
    fs.copyFileSync(source_path, dest_path);
    return true;
}

function delete_file(file_path) {
    let fs = require("fs");
    if(fs.existsSync(file_path)) {
        fs.unlinkSync(file_path);
    }
    return true;
}

function delete_directory(dir_path) {
    let fs = require("fs");
    if(fs.existsSync(dir_path)) {
        fs.rmSync(dir_path, { recursive: true, force: true });
    }
    return true;
}

// 导出模块
module.exports = {
    read_file: read_file,
    write_file: write_file,
    file_exists: file_exists,
    create_directory: create_directory,
    list_files: list_files,
    list_directories: list_directories,
    get_file_name: get_file_name,
    get_file_extension: get_file_extension,
    join_path: join_path,
    get_directory_name: get_directory_name,
    find_files_with_extension: find_files_with_extension,
    copy_file: copy_file,
    delete_file: delete_file,
    delete_directory: delete_directory
};