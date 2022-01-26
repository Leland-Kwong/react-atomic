/**
 * @public
 * Returns a new function that compares the old return value
 * and new return value. If they are the same, then it will
 * return what was previously returned. This is useful for
 * determining if two different objects are equal to prevent
 * unecessary rerenders.
 */
export declare function useIsNew<X, Y>(fn: (x: X) => Y, isNewValue?: (prev: Y, next: Y) => boolean): (x: X) => Y;
