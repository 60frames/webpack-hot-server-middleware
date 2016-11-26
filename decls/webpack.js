declare module 'webpack/lib/MultiCompiler' {
    declare type ReadFileSync = ((filename: string, _: void) => Buffer) &
        ((filename: string, encoding: string) => string) &
        ((filename: string, options: { encoding: string, flag?: string }) => string) &
        ((filename: string, options: { encoding?: void, flag?: string }) => Buffer);
    declare class $Stats {
        toJson: () => ({
            assetsByChunkName: {
                [chunk: string]: Array<string> | string
            }
        }),
        compilation: {
            name: string,
            errors: Array<Error>
        }
    }
    declare type Stats = $Stats;
    declare class $MultiStats {
        stats: Array<Stats>
    }
    declare type MultiStats = $MultiStats;
    declare type PluginCallback = (multiStats: MultiStats) => void;
    declare type Plugin = (name: string, cb: PluginCallback) => void;
    declare type Compiler = {
        name: string,
        outputFileSystem: {
            readFileSync: ReadFileSync
        },
        outputPath: string,
        plugin: Plugin
    }
    declare class exports {
        compilers: Array<Compiler>,
        plugin: Plugin
    }
}
