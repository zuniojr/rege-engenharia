export const prerender = false;
import { makeAPIRouteHandler } from '@keystatic/astro/api';
import keystaticConfig from '../../../keystatic.config';

export const all = makeAPIRouteHandler({
  config: keystaticConfig,
});
