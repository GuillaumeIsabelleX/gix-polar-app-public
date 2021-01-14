export interface ISnapshotCacheEntry<V> {

    /**
     * false if this value is cached as a negative entry.  This can be used to
     * listen to snapshot values which don't exist.
     */
    readonly exists: boolean;

    readonly value: V | undefined;

}