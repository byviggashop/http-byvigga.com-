import {env} from 'cloudflare:workers';
import {requireChatGPTUser} from '../chatgpt-auth';
import AdminClient from './ui';
export const metadata={title:'Administration | By Vigga',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Admin({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const params=await searchParams,query=new URLSearchParams();for(const key of ['product','order'])if(params[key])query.set(key,params[key]!);const user=await requireChatGPTUser('/admin'+(query.size?'?'+query.toString():''));if(!env.ADMIN_EMAIL||user.email.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())return <main style={{padding:50}}><h1>Ingen adgang</h1><p>Administrationen er kun til shoppens ejer.</p></main>;return <AdminClient/>;}
