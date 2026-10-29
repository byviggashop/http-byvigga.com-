import { env } from 'cloudflare:workers';
import catalog from '../../../data/smykker.json';
import { submitOrder } from '../../../lib/order-service.mjs';
import {getProducts} from '../../../lib/products.mjs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) { try{return submitOrder(request, env, await getProducts(env.DB,catalog));}catch{return Response.json({error:'Udvalget kunne ikke kontrolleres. Din kurv er bevaret.'},{status:503})} }
