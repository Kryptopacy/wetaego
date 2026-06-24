const fs=require('fs');
function r(f){
  if(!fs.existsSync(f)) return;
  let c=fs.readFileSync(f,'utf8');
  if(!c.includes('ActionForm')){
    c="import { ActionForm } from '@/components/ActionForm'\n"+c;
    c=c.replace(/<form /g, '<ActionForm ').replace(/<form>/g, '<ActionForm>').replace(/<\/form>/g, '</ActionForm>');
    fs.writeFileSync(f,c);
  }
}
r('apps/web/app/(dashboard)/dashboard/settings/team/page.tsx');
r('apps/web/app/(dashboard)/dashboard/settings/qr/page.tsx');
r('apps/web/app/page.tsx');
