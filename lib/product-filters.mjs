import {stockInfo} from './stock.mjs';
export const productStatusLabels={active:'Aktiv',draft:'Kladde / skjult',soldout:'Udsolgt',deleted:'Slettet'};
export function productStatus(product){
 if(product.slettet)return 'deleted';
 if(!product.aktiv)return 'draft';
 if(stockInfo(product).soldout)return 'soldout';
 return 'active';
}
export function filterAdminProducts(products,{category='Alle',status='all',query=''}={}){
 const search=query.trim().toLocaleLowerCase('da-DK');
 return products.filter(p=>(category==='Alle'||p.kategori===category)&&(status==='all'?!p.slettet:productStatus(p)===status)&&`${p.navn} ${p.id}`.toLocaleLowerCase('da-DK').includes(search));
}
