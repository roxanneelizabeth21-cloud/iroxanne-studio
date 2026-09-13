import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
// Read-only: background reconciliation is the sole Square ledger writer.
export default async function(req: Request) {
  try {
    const b = createClientFromRequest(req);
    const {id,token,order_id,transaction_id} = await req.json();
    if (!id || !token) return Response.json({error:'Missing invoice link'},{status:400});
    const invoice = await b.asServiceRole.entities.Invoice.get(id);
    if (invoice.access_token !== token) return Response.json({error:'Invalid link'},{status:403});
    const rows = await b.asServiceRole.entities.SquareCheckout.filter({invoice_id:id},'-created_date',100);
    const match = rows.find((r:any) => order_id ? r.order_id === order_id : transaction_id ? r.payment_id === transaction_id : r.status === 'recorded');
    if (order_id && !match) return Response.json({error:'Checkout does not belong to this invoice'},{status:403});
    return Response.json({success:match?.status === 'recorded',pending:match?.status !== 'recorded'});
  } catch {
    return Response.json({error:'Unable to check payment status'},{status:500});
  }
}
