export const isDefinedAndHasItems = <T>(array: T[] | undefined | null): array is T[] => {
    return !!array && array.length > 0;
};