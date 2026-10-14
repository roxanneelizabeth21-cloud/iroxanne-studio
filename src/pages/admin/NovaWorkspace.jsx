import {useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import SocialMarketer from '@/pages/marketing/SocialMarketer';
import StudioAssistant from './StudioAssistant';
import {Button} from '@/components/ui/button';
export default function NovaWorkspace(){
 const [params,setParams]=useSearchParams();
 const desk=params.get('view')==='desk';
 const [request,setRequest]=useState(null);
 const ask=(text,mode,clientEmail)=>{setRequest({id:Date.now(),text:(clientEmail?'For client '+clientEmail+': ':'')+text});setParams({});};
 return <div className="space-y-4">
  <nav aria-label="Nova workspace" className="flex gap-2"><Button variant={desk?'outline':'default'} onClick={()=>setParams({})}>Chat with Nova</Button><Button variant={desk?'default':'outline'} onClick={()=>setParams({view:'desk'})}>Work desk & approvals</Button></nav>
  <div hidden={desk}><SocialMarketer request={request}/></div>
  {desk&&<StudioAssistant onAsk={ask}/>}
 </div>;
}
