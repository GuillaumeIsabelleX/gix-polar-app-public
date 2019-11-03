import {
    createDefaultTaskRepResolver,
    OptionalTaskRepResolver,
    Task,
    TasksCalculator,
    TaskRepResolver
} from "./TasksCalculator";
import {Optional} from "polar-shared/src/util/ts/Optional";
import {ISODateTimeStrings} from "polar-shared/src/metadata/ISODateTimeStrings";
import {assertJSON} from "polar-test/src/test/Assertions";
import {TestingTime} from "polar-shared/src/test/TestingTime";
import {DurationStr, TimeDurations} from "polar-shared/src/util/TimeDurations";
import {ISpacedRep} from "polar-spaced-repetition-api/src/scheduler/S2Plus/S2Plus";
import {Dictionaries} from "polar-shared/src/util/Dictionaries";


async function doTest(potential: ReadonlyArray<Task>, workMap: PendingTaskRepMap = {}) {

    const resolver = createMockWorkRepResolver(workMap);

    const tasks = await TasksCalculator.calculate({
        potential,
        resolver,
        limit: 10
    });

    return tasks;

}
class Tester {

    public pendingTaskRepMap: PendingTaskRepMap = {};

    public step: number = 0;

    public potential: ReadonlyArray<Task>;

    constructor(public readonly task: Task) {
        this.potential = [task];
    }

    public async doStep(expectedTasks: any, timeForward: DurationStr = '0h') {

        TestingTime.forward(TimeDurations.toMillis(timeForward));

        console.log("==== Doing step " + this.step);

        const tasks = await doTest(this.potential, this.pendingTaskRepMap);

        console.log("tasks: " + JSON.stringify(Dictionaries.sorted(tasks), null, "  ") );

        assertJSON(Dictionaries.sorted(tasks), Dictionaries.sorted(expectedTasks));

        const next = TasksCalculator.computeNextSpacedRep(tasks[0], 'good');
        const pendingWorkRep: PendingTaskRep = {task: this.task, spacedRep: next};
        this.pendingTaskRepMap[next.id] = pendingWorkRep;
        ++this.step;

    };

}

describe("TasksCalculator", () => {

    beforeEach(() => {
        TestingTime.freeze();
    });

    afterEach(() => {
        TestingTime.freeze();
    });

    it("with no items", async () => {

        const potential: ReadonlyArray<Task> = [

        ];

        const tasks = await doTest(potential);

        assertJSON(tasks, []);

    });

    it("with all new items but not ready to use as they haven't expired yet.", async () => {

        const potential: ReadonlyArray<Task> = [
            {
                id: "101",
                text: 'this is the first one',
                created: ISODateTimeStrings.create(),
                color: 'yellow'
            }
        ];

        const tasks = await doTest(potential);

        assertJSON(tasks, []);

    });

    it("compute walk through of each stage", async () => {

        const twoDaysAgo = TimeDurations.compute('-2d');

        const work: Task = {
            id: "101",
            text: 'this is the first one',
            created: twoDaysAgo.toISOString(),
            color: 'yellow'
        };

        const potential: ReadonlyArray<Task> = [
            work
        ];

        const workMap: PendingTaskRepMap = {};

        let step: number = 0;

        const doStep = async (expectedTasks: any, timeForward: DurationStr = '0h') => {

            TestingTime.forward(TimeDurations.toMillis(timeForward));

            console.log("==== Doing step " + step);

            const tasks = await doTest(potential, workMap);

            console.log("tasks: " + JSON.stringify(Dictionaries.sorted(tasks), null, "  ") );

            assertJSON(Dictionaries.sorted(tasks), Dictionaries.sorted(expectedTasks));

            const next = TasksCalculator.computeNextSpacedRep(tasks[0], 'good');
            const pendingWorkRep: PendingTaskRep = {task: work, spacedRep: next};
            workMap[next.id] = pendingWorkRep;
            ++step;
        };

        await doStep([
            {
                "id": "101",
                "text": "this is the first one",
                "created": "2012-02-29T11:38:49.321Z",
                "color": "yellow",
                "age": 86400000,
                "stage": "learning",
                "state": {
                    "reviewedAt": "2012-02-29T11:38:49.321Z",
                    "interval": "1d",
                    "intervals": [
                        "4d",
                        "8d"
                    ]
                }
            }
        ]);

        await doStep([
            {
                "id": "101",
                "text": "this is the first one",
                "created": "2012-02-29T11:38:49.321Z",
                "color": "yellow",
                "stage": "learning",
                "state": {
                    "reviewedAt": "2012-03-02T11:38:49.321Z",
                    "intervals": [
                        "8d"
                    ],
                    "interval": "4d"
                },
                "age": 86400000
            }
        ], '1d');

        await doStep([
            {
                "id": "101",
                "text": "this is the first one",
                "created": "2012-02-29T11:38:49.321Z",
                "color": "yellow",
                "stage": "learning",
                "state": {
                    "reviewedAt": "2012-03-03T11:38:49.321Z",
                    "intervals": [],
                    "interval": "8d"
                },
                "age": 345600000
            }
        ], '4d');

        await doStep([
            {
                "id": "101",
                "text": "this is the first one",
                "created": "2012-02-29T11:38:49.321Z",
                "color": "yellow",
                "stage": "review",
                "state": {
                    "reviewedAt": "2012-03-07T11:38:49.321Z",
                    "difficulty": 0.3,
                    "interval": "16d"
                },
                "age": 691200000
            }
        ], '8d');

        await doStep([
            {
                "id": "101",
                "text": "this is the first one",
                "created": "2012-02-29T11:38:49.321Z",
                "color": "yellow",
                "stage": "review",
                "state": {
                    "difficulty": 0.3367647058823529,
                    "interval": "32d",
                    "nextReviewDate": "2012-04-16T11:38:49.321Z",
                    "reviewedAt": "2012-03-15T11:38:49.321Z"
                },
                "age": 1382400000
            }
        ], '16d');

    });

});

export interface PendingTaskRep {
    readonly task: Task;
    readonly spacedRep: ISpacedRep;
}

export type PendingTaskRepMap = {[id: string]: PendingTaskRep};

function createMockWorkRepResolver(pendingTaskRepMap: PendingTaskRepMap = {}): TaskRepResolver {

    const optionalWorkRepResolver: OptionalTaskRepResolver = async (work: Task) => {

        const pendingWorkRep = Optional.of(pendingTaskRepMap[work.id]).getOrUndefined();

        if (pendingWorkRep) {
            const age = TasksCalculator.computeAge(pendingWorkRep.spacedRep);
            return {...pendingWorkRep.task, ...pendingWorkRep.spacedRep, age};
        }

        return undefined;

    };

    return createDefaultTaskRepResolver(optionalWorkRepResolver)

}

