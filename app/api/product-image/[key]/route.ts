import {env} from 'cloudflare:workers';
import {serveCachedImage} from '../../../../lib/image-storage.mjs';
export async function GET(request:Request,context:{params:Promise<{key:string}>}){const {key}=await context.params;const cache=typeof caches!=='undefined'?(caches as any).default:undefined;return serveCachedImage(request,env.BUCKET,key,cache)}
export const HEAD=GET;
