export function test_flags_eidos_test_flags_usage() {
    let read_perm = READ.READ;
    let write_perm = WRITE.WRITE;
    let all_perm = ALL.ALL;
    let read_write = READ.READ | WRITE.WRITE;
    return read_perm;
}
export function test_flags_eidos_test_eidos_usage() {
    let primary_color = RED.RED;
    let secondary_color = GREEN.GREEN;
    if (primary_color == RED.RED) {
        return true;
    }
    return false;
}
export function test_flags_eidos_main() {
    let manager = new test_flags_eidos_FileManager(READ.READ | WRITE.WRITE);
    let can_read = manager.has_permission(READ.READ);
    let can_execute = manager.has_permission(EXECUTE.EXECUTE);
    let file_color = manager.get_color();
    return can_read && !can_execute;
}
class test_flags_eidos_FileManager {
    constructor(permissions) {
        this.permissions = permissions;
        this.default_color = BLUE.BLUE;
    }

    has_permission(perm) {
        return (this.permissions & perm) == perm;
    }

    get_color() {
        return this.default_color;
    }
}
const FilePermissions = {
    READ: 1,
    WRITE: 2,
    EXECUTE: 4,
    ALL: 7,
};
Object.freeze(FilePermissions);
const Color = {
    RED: 0,
    GREEN: 1,
    BLUE: 2,
    YELLOW: 3,
};
Object.freeze(Color);
