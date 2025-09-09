export declare function getRecentVotesForMember(_memberId: string): Promise<{
    roll: string;
    date: string;
    title: string;
    position: string;
    result: string;
}[]>;
