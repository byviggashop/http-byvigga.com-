const fs=require('fs'),path=require('path');
fs.mkdirSync('public',{recursive:true});
for(const file of ['index.html','se-flere-smykker.html','atelier.css','atelier.js','cart.js','assets','data'])fs.cpSync(file,path.join('public',file),{recursive:true});
fs.writeFileSync('app/page.tsx',`import { redirect } from 'next/navigation';\nexport default function Page(){redirect('/index.html');}\n`);
