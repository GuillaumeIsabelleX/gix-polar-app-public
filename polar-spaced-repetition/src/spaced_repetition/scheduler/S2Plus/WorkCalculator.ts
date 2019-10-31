import {IDStr} from "polar-shared/src/util/Strings";
import {ISODateTimeString, ISODateTimeStrings} from "polar-shared/src/metadata/ISODateTimeStrings";
import {HighlightColor} from "polar-shared/src/metadata/IBaseHighlight";
import {ISpacedRep, LearningState, ReviewState} from "polar-spaced-repetition-api/src/scheduler/S2Plus/S2Plus";
import {DurationMS, TimeDurations} from "polar-shared/src/util/TimeDurations";
import {AsyncWorkQueue} from "polar-shared/src/util/AsyncWorkQueue";
import {Arrays} from "polar-shared/src/util/Arrays";
import {Learning} from "./Learning";

export class WorkCalculator {

    /**
     * Take potential work and use data from the backend to prioritize it for the user.
     */
    public static async calculate(opts: CalculateOpts): Promise<ReadonlyArray<WorkRep>> {

        const workReps: WorkRep[] = [];

        const jobs = opts.potential.map((current) => async () => {
            const workRep = await opts.resolver(current);
            workReps.push(workRep);
        });

        const asyncWorkQueue = new AsyncWorkQueue(jobs);

        await asyncWorkQueue.execute();

        const prioritized =
            workReps.filter(current => current.age > 0)
                .sort((a, b) => b.age - a.age);

        return Arrays.head(prioritized, opts.limit);

    }

    public static computeNext(current: ISpacedRep): ISpacedRep {

        switch (current.stage) {

            case "learning":

                const state = <LearningState> current.state;

                if (state.intervals.length === 0) {
                    
                    const newState: ReviewState = {
                        reviewedAt: ISODateTimeStrings.create(),
                        difficulty: Learning.DEFAULT_GRADUATING_DIFFICULTY,
                        interval: Learning.DEFAULT_GRADUATING_INTERVAL
                    };
                    
                    return {...current, state: newState};

                }

                const intervals = [...state.intervals];
                const interval = intervals.shift()!;

                const newState: LearningState = {
                    reviewedAt: ISODateTimeStrings.create(),
                    intervals,
                    interval
                };

                return {...current, state: newState};

            case "review":
                throw new Error("Not supported: " + current.stage);

            default:
                throw new Error("Not supported: " + current.stage);

        }

    }

}

/**
 * Return a WorkRep if we were able to find it or undefined.
 */
export type OptionalWorkRepResolver = (work: Work) => Promise<WorkRep | undefined>;

/**
 * Return a WorkRep or a default rep if we're unable to find it.
 */
export type WorkRepResolver = (work: Work) => Promise<WorkRep>;

/**
 * If we don't have an explicit state, then we need to compute a new one...
 *
 */
export function createDefaultWorkRepResolver(delegate: OptionalWorkRepResolver): WorkRepResolver {

    return async (work: Work): Promise<WorkRep> => {

        const result = await delegate(work);

        if (result) {
            return result;
        }

        const intervals = [...Learning.intervals('reading')];
        const interval = intervals.shift()!;
        const intervalMS = TimeDurations.toMillis(interval);

        const created = ISODateTimeStrings.parse(work.created);

        const age = Date.now() - (created.getTime() + intervalMS);

        return {
            ...work,
            age,
            stage: "learning",
            state: {
                reviewedAt: work.created,
                interval,
                intervals
            }
        }

    };

}

export interface CalculateOpts {

    readonly potential: ReadonlyArray<Work>;

    /**
     * Given a unit of work, resolved the space rep metadata.
     */
    readonly resolver: WorkRepResolver;

    /**
     * The limit of the number of tasks to return.
     */
    readonly limit: number;

}


export interface Work {

    readonly id: IDStr;

    readonly text: string;

    /**
     * The time the items was first created. This is used to compute the initial age.
     */
    readonly created: ISODateTimeString;

    readonly color: HighlightColor;

}

export interface WorkRep extends ISpacedRep, Work {

    /**
     * The age of the work so we can sort the priority queue.
     */
    readonly age: DurationMS;

}
