declare module 'source-map-support' {
    declare type SourceMap = {
        url: string,
        map: string
    };
    declare type RetrieveSourceMap = (source: string) => ?SourceMap;
    declare type Options = {
        handleUncaughtExceptions?: bool,
        retrieveSourceMap?: RetrieveSourceMap,
        environment?: string,
        hookRequire?: bool,
        emptyCacheBetweenOperations?: bool
    };
    declare function install(options: ?Options): void;
}
