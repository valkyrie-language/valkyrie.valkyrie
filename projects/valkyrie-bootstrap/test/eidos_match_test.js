export function test_eidos_match_test_basic_eidos_match() {
    let current_status = RUNNING.RUNNING;
    if (current_status === Status.PENDING) {
        let message = "Task is pending";
    } else if (current_status === Status.RUNNING) {
        let message = "Task is running";
    } else if (current_status === Status.COMPLETED) {
        let message = "Task completed";
    } else if (current_status === Status.FAILED) {
        let message = "Task failed";
    } else {
        let message = "Unknown status";
    }
}
export function test_eidos_match_test_mixed_eidos_match() {
    let priority = HIGH.HIGH;
    if (priority === Priority.LOW) {
        let urgency = "Can wait";
    } else if (priority === Priority.MEDIUM) {
        let urgency = "Normal priority";
    } else if (priority === Priority.HIGH) {
        let urgency = "High priority";
    } else if (priority === Priority.CRITICAL) {
        let urgency = "Critical!";
    } else if (priority === 0) {
        let urgency = "Invalid priority";
    } else {
        let urgency = "Unknown priority";
    }
}
export function test_eidos_match_test_nested_eidos_match() {
    let status = COMPLETED.COMPLETED;
    let priority = HIGH.HIGH;
    if (status === Status.COMPLETED) {
        if (priority === Priority.HIGH) {
            let result = "High priority task completed";
        } else if (priority === Priority.CRITICAL) {
            let result = "Critical task completed";
        } else {
            let result = "Task completed";
        }
    } else if (status === Status.FAILED) {
        let result = "Task failed";
    } else {
        let result = "Task in progress";
    }
}
export function test_eidos_match_main() {
    test_eidos_match_test_basic_eidos_match();
    test_eidos_match_test_mixed_eidos_match();
    test_eidos_match_test_nested_eidos_match();
    let manager = new test_eidos_match_TaskManager();
    manager.set_status(RUNNING.RUNNING);
    let message = manager.get_status_message();
}
class test_eidos_match_TaskManager {
    constructor() {
        this.current_status = PENDING.PENDING;
    }

    get_status_message() {
        if (this.current_status === Status.PENDING) {
            return "Waiting to start";
        } else if (this.current_status === Status.RUNNING) {
            return "Currently executing";
        } else if (this.current_status === Status.COMPLETED) {
            return "Successfully finished";
        } else if (this.current_status === Status.FAILED) {
            return "Execution failed";
        } else {
            return "Status unknown";
        }
    }

    set_status(new_status) {
        this.current_status = new_status;
    }
}
const Status = {
    PENDING: 0,
    RUNNING: 1,
    COMPLETED: 2,
    FAILED: 3,
};
Object.freeze(Status);
const Priority = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
};
Object.freeze(Priority);
