import {mkdir,readdir,copyFile,writeFile,rm} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import sharp from "sharp";
const SRC="fotos-originais",OUT="dist",WIDTHS=[800,1600,2400],EXT=/\.(jpe?g|png|webp|tiff?|avif)$/i;
await rm(OUT,{recursive:true,force:true});
await mkdir(path.join(OUT,"img"),{recursive:true});
await copyFile("index.html",path.join(OUT,"index.html"));
const manifest={};
if(existsSync(SRC)){
  for(const d of await readdir(SRC,{withFileTypes:true})){
    if(!d.isDirectory())continue;
    const files=(await readdir(path.join(SRC,d.name))).filter(f=>EXT.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    if(!files.length)continue;
    await mkdir(path.join(OUT,"img",d.name),{recursive:true});
    manifest[d.name]=[];
    let n=0;
    for(const f of files){
      n++;
      const input=path.join(SRC,d.name,f);
      const meta=await sharp(input).rotate().metadata();
      const top=Math.min(meta.width,2400);
      const sizes=[...new Set([...WIDTHS.filter(w=>w<top*0.85),top])];
      for(const w of sizes){
        await sharp(input).rotate().resize({width:w,withoutEnlargement:true}).webp({quality:84,effort:5}).toFile(path.join(OUT,"img",d.name,n+"-"+w+".webp"));
      }
      manifest[d.name].push({n,w:sizes});
      console.log(d.name,f,"->",sizes.join(", "));
    }
  }
}
await writeFile(path.join(OUT,"fotos.json"),JSON.stringify(manifest));
console.log("Build concluido.");
