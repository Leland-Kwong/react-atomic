declare type SubscriberId = string;
export declare type ChannelFn<T> = (data: T) => void;
export declare type Channel<T> = Map<SubscriberId, ChannelFn<T>>;
export declare function channel<T = never>(): Channel<T>;
export declare function emit<T>(channel: Channel<T>, data: T): void;
export declare function subscribe<T>(channel: Channel<T>, fn: ChannelFn<T>): SubscriberId;
export declare function unsubscribe<T>(channel: Channel<T>, id: SubscriberId): void;
export declare function subscriberCount<T>(channel: Channel<T>): number;
export {};
