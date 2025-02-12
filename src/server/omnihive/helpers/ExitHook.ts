import process from "process";

const callbacks: Function[] = [];
let isCalled: boolean = false;
let isRegistered: boolean = false;

function exit(shouldManuallyExit: boolean, signal: number) {
    if (isCalled) {
        return;
    }

    isCalled = true;

    for (const callback of callbacks) {
        callback();
    }

    if (shouldManuallyExit === true) {
        process.exit(128 + signal); // eslint-disable-line unicorn/no-process-exit
    }
}

export default function exitHook(onExit: () => void) {
    const pushCount: number = callbacks.push(onExit);
    const index: number = pushCount - 1;

    if (!isRegistered) {
        isRegistered = true;

        process.once("exit", exit);
        process.once("SIGINT", exit.bind(undefined, true, 2));
        process.once("SIGTERM", exit.bind(undefined, true, 15));

        // PM2 Cluster shutdown message. Caught to support async handlers with pm2, needed because
        // explicitly calling process.exit() doesn't trigger the beforeExit event, and the exit
        // event cannot support async handlers, since the event loop is never called after it.
        process.on("message", (message) => {
            if (message === "shutdown") {
                exit(true, -128);
            }
        });
    }

    return () => {
        callbacks.splice(index, 1);
    };
}
