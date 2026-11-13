import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const child=spawn(process.execPath,[path.join(root,'server','app.mjs')],{cwd:root,stdio:['inherit','pipe','inherit']});let pending='',opened=false;child.stdout.on('data',chunk=>{const s=chunk.toString();process.stdout.write(s);pending+=s;const m=pending.match(/http:\/\/127\.0\.0\.1:\d+/);if(m&&!opened){opened=true;const command=process.platform==='win32'?'explorer.exe':process.platform==='darwin'?'open':'xdg-open';const p=spawn(command,[m[0]],{detached:true,stdio:'ignore',windowsHide:true});p.on('error',()=>console.error('请手动打开上方地址'));p.unref()}});child.on('exit',code=>{process.exitCode=code||0});child.on('error',e=>{console.error(e.message);process.exitCode=1});
