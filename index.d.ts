import { RequestHandler } from 'express';
// tslint:disable-next-line no-implicit-dependencies
import { MultiCompiler, Stats } from 'webpack';
import { Context, Next } from 'koa';

type CreateHandler<
  InnerHandler = RequestHandler,
  Handler = RequestHandler,
> = (error: boolean, serverRenderer: InnerHandler) => Handler;

type Options<
  ServerRendererOptions = Record<string, any>,
  InnerHandler = RequestHandler,
  Handler = RequestHandler,
> = Partial<{
  /** The name of the server entry point, defaults to 'main'. */
  chunkName: string;

  /** object Mixed in with clientStats & serverStats and passed to the serverRenderer. */
  serverRendererOptions: ServerRendererOptions;

  createHandler: CreateHandler<InnerHandler, Handler>;
}>;

export default function webpackHotServerMiddleware<
  ServerRendererOptions,
  InnerHandler = RequestHandler,
  Handler = RequestHandler,
>(
  compiler: MultiCompiler,
  options?: Options<ServerRendererOptions, InnerHandler, Handler>,
): Handler;

export const createConnectHandler: CreateHandler<RequestHandler, RequestHandler>;

type KoaHandler = (ctx: Context, next: Next) => any;

export const createKoaHandler: CreateHandler<KoaHandler, KoaHandler>;
