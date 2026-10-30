import {env} from 'cloudflare:workers';
import {handleImageUpload} from '../../../../lib/upload-endpoint.mjs';
export async function POST(request:Request){return handleImageUpload(request,env)}
