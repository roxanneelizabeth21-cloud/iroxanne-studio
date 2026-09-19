import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { ensureContractInvoice } from '../../shared/contractInvoice.ts';
export default async function(req: Request) {
  try {
    const base44=createClientFromRequest(req);
    const guard=await requireAdmin(base44);
    if(!guard.ok)return guard.response;
    const {contract_id}=await req.json();
    if(!contract_id)return Response.json({error:'Agreement is required.'},{status:400});
    const contract=await base44.entities.Contract.get(contract_id);
    const invoice=await ensureContractInvoice(base44.entities,contract);
    return Response.json({invoice_id:invoice.id});
  } catch(e) {return Response.json({error:e.message||'Invoice could not be prepared.'},{status:409});}
}
