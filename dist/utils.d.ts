export declare function useIsNew<X, Y>(fn: (x: X) => Y, isNewValue?: (prev: Y, next: Y) => boolean): (x: X) => Y;
export declare function errorMsg(msg: string): string;
