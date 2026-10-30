const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'src');
const paw='data:image/svg+xml;base64,'+fs.readFileSync(path.join(dir,'paw.svg')).toString('base64');
let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,name)=>'<style>\n'+fs.readFileSync(path.join(dir,name.split('?')[0]),'utf8').replaceAll("url('paw.svg')","url('"+paw+"')")+'\n</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>'<script>\n'+fs.readFileSync(path.join(dir,name.split('?')[0]),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
if(/AIza[\w-]{25,}/.test(html))throw new Error('Remove the embedded API key before building.');
for(const name of ['index.html','WAKL.html'])fs.writeFileSync(path.join(__dirname,name),html);
console.log('Built index.html and WAKL.html without embedded API keys.');
