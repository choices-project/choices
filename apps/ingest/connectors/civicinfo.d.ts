export declare function lookupAddress(addr: string): Promise<{
    normalizedAddress: string;
    divisions: {
        id: string;
        label: string;
    }[];
    posts: {
        id: string;
        label: string;
    }[];
    officials: never[];
}>;
