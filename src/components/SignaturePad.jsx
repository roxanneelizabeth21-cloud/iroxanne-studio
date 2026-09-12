import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
export default function SignaturePad({onChange, disabled=false}) {
  const canvas=useRef(null), drawing=useRef(false), distance=useRef(0), previous=useRef(null);
  const point=e=>{const r=canvas.current.getBoundingClientRect();return [(e.clientX-r.left)*720/r.width,(e.clientY-r.top)*240/r.height];};
  const start=e=>{if(disabled)return;e.preventDefault();drawing.current=true;previous.current=point(e);canvas.current.setPointerCapture(e.pointerId);};
  const move=e=>{
    if(!drawing.current)return;e.preventDefault();
    const p=point(e),last=previous.current,ctx=canvas.current.getContext('2d');
    ctx.strokeStyle='#301B33';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(...last);ctx.lineTo(...p);ctx.stroke();distance.current+=Math.hypot(p[0]-last[0],p[1]-last[1]);previous.current=p;
  };
  const end=()=>{if(!drawing.current)return;drawing.current=false;onChange(distance.current>20?canvas.current.toDataURL('image/png'):'');};
  const clear=()=>{canvas.current.getContext('2d').clearRect(0,0,720,240);distance.current=0;drawing.current=false;onChange('');};
  return <div className="space-y-2"><canvas ref={canvas} width={720} height={240} role="img" aria-label="Draw your signature here with a mouse, pen, or finger" className="w-full border rounded-xl bg-[#FAF7F0]" style={{touchAction:'none'}} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Draw with your mouse, pen, or finger. You can also choose a typed signature.</p><Button type="button" variant="outline" size="sm" onClick={clear} disabled={disabled}>Clear</Button></div></div>;
}