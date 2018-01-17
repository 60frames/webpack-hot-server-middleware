import { RequestHandler } from 'express';
// tslint:disable-next-line no-implicit-dependencies
import { MultiCompiler, Stats } from 'webpack';
type Options<T = Record<string, any>> = Partial<{
  /** The name of the server entry point, defaults to 'main'. */
  chunkName: string;

  /** object Mixed in with clientStats & serverStats and passed to the serverRenderer. */
  serverRendererOptions: T;

  createHandler(error: boolean, serverRenderer: RequestHandler): RequestHandler;
}>;

declare function webpackHotServerMiddleware<T>(
  compiler: MultiCompiler,
  options?: Options<T>,
): RequestHandler;

export = webpackHotServerMiddleware;
