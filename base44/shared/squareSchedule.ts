import {validateSchedule,squareRequests} from './paymentSchedule.ts';

export async function squareApi(base44:any) {
  const {accessToken}=await base44.asServiceRole.connectors.getConnection('square');
  if (!accessToken) throw new Error('Connect Square before sending a payment plan.');
  return async (path:string,body?:any)=>{
    const r=await fetch('https://connect.squareup.com/v2/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+accessToken,'Square-Version':'2025-08-21','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    const data=await r.json();
    if (!r.ok) throw new Error('Square: '+(data.errors || []).map((e:any)=>e.detail || e.code).join(';')+' (HTTP '+r.status+'). Check Square invoice permissions and installment subscription.');
    return data;
  };
}
// Square's invoice is the authoritative ledger for these plans. Copy cumulative
// paid amounts; never append a second payment when polling the same invoice.
export async function syncSquareSchedule(base44:any,invoice:any,api?:any) {
  if (!invoice.square_invoice_id) return invoice;
  const call=api || await squareApi(base44);
  const {invoice:s}=await call('invoices/'+encodeURIComponent(invoice.square_invoice_id));
  const rows=validateSchedule(invoice.payment_installments,invoice.amount_total);
  if (s?.id!==invoice.square_invoice_id || s.order_id!==invoice.square_order_id || s.location_id!==invoice.square_location_id) throw new Error('Square invoice binding mismatch. No balance was changed.');
  if (['REFUNDED','PARTIALLY_REFUNDED'].includes(s.status)) throw new Error('Square reports a refund. Review this payment plan in Square before continuing.');
  const payments=rows.map((r,i)=>{
    const p=(s.payment_requests || []).find((p:any)=>p.uid==='studio-payment-'+(i+1));
    const amount=p?.computed_amount_money, paid=p?.total_completed_amount_money;
    if (!p || amount?.currency!=='USD' || Number(amount.amount)!==Math.round(r.amount*100) || p.due_date!==r.due_date || (paid && paid.currency!=='USD')) throw new Error('Square payment plan changed. Review amounts and dates before syncing.');
    const n=Number(paid?.amount || 0);
    if (!Number.isSafeInteger(n) || n<0 || n>Number(amount.amount)) throw new Error('Unexpected Square payment amount.');
    return {...r,paid_amount:n/100,status:n===Number(amount.amount)?'paid':n>0?'partial':'pending'};
  });
  const depositPaid=payments[0].paid_amount, balancePaid=payments.slice(1).reduce((n,p)=>n+Math.round(p.paid_amount*100),0)/100;
  const deposit=rows[0].amount, balance=Math.round((invoice.amount_total-deposit)*100)/100;
  const paid=payments.every(p=>p.status==='paid');
  const patch={square_payment_snapshot:payments,square_status:s.status,square_public_url:s.public_url || '',square_last_checked_at:new Date().toISOString(),square_sync_error:'',
    deposit_paid_amount:depositPaid,balance_paid_amount:balancePaid,deposit_status:depositPaid===deposit?'paid':'pending',
    balance_status:balance===0?'waived':balancePaid===balance?'paid':balancePaid>0?'partial':'pending',
    status:s.status==='CANCELED'?'cancelled':paid?'paid':depositPaid===deposit?'deposit_paid':'open',
    ...(depositPaid===deposit?{deposit_paid_at:invoice.deposit_paid_at || new Date().toISOString()}:{})};
  const updated=await base44.asServiceRole.entities.Invoice.update(invoice.id,patch);
  if (depositPaid===deposit && invoice.contract_id && s.status!=='CANCELED') {
    const c=await base44.asServiceRole.entities.Contract.get(invoice.contract_id);
    if (['signed','deposit_paid','active'].includes(c.status)) await base44.asServiceRole.entities.Contract.update(c.id,{
      ...(['signed','deposit_paid'].includes(c.status)?{status:'active'}:{}),
      deposit_paid_at:c.deposit_paid_at || patch.deposit_paid_at
    });
  }
  return {...invoice,...updated,...patch};
}
export async function publishSquareSchedule(base44:any,invoice:any) {
  const db=base44.asServiceRole.entities, rows=validateSchedule(invoice.payment_installments,invoice.amount_total);
  if (invoice.status==='cancelled') throw new Error('This invoice is cancelled.');
  const api=await squareApi(base44);
  // Never move an invoice that has been collected through another payment path.
  if (!invoice.square_invoice_id) {
    const ledger=await db.Payment.filter({invoice_id:invoice.id},'-created_date',1000);
    const checkouts=await db.SquareCheckout.filter({invoice_id:invoice.id},'-created_date',1000);
    if (ledger.length || checkouts.length || invoice.deposit_paid_amount>0 || invoice.balance_paid_amount>0) throw new Error('This invoice has payment activity. Keep its existing payment method; create a new agreed plan only for a new invoice.');
    const {locations}=await api('locations');
    const location=locations?.find((l:any)=>l.id===invoice.square_location_id) || locations?.find((l:any)=>l.status==='ACTIVE' && l.currency==='USD');
    if (!location || location.status!=='ACTIVE' || location.currency!=='USD') throw new Error('An active USD Square location is required.');
    // Persist location before external writes, so retries use the same payload.
    await db.Invoice.update(invoice.id,{square_location_id:location.id,square_schedule_enabled:true});
    const {customer}=await api('customers',{idempotency_key:'studio-customer-'+invoice.id,email_address:invoice.client_email,company_name:invoice.client_name || invoice.project_title,reference_id:invoice.id});
    const {order}=await api('orders',{idempotency_key:'studio-order-'+invoice.id,order:{location_id:location.id,reference_id:invoice.id,customer_id:customer.id,
      line_items:[{name:invoice.project_title.slice(0,200),quantity:'1',base_price_money:{amount:Math.round(invoice.amount_total*100),currency:'USD'}}]}});
    const {invoice:s}=await api('invoices',{idempotency_key:'studio-invoice-'+invoice.id,invoice:{location_id:location.id,order_id:order.id,primary_recipient:{customer_id:customer.id},title:invoice.project_title.slice(0,255),
      description:'iRoxanne Studio project payment plan. Payments follow the agreed schedule.',
      delivery_method:'EMAIL',accepted_payment_methods:{card:true},payment_requests:squareRequests(rows),store_payment_method_enabled:false}});
    await db.Invoice.update(invoice.id,{square_invoice_id:s.id,square_order_id:order.id,square_location_id:location.id,square_status:s.status});
    invoice={...invoice,square_invoice_id:s.id,square_order_id:order.id,square_location_id:location.id};
  }
  const {invoice:current}=await api('invoices/'+encodeURIComponent(invoice.square_invoice_id));
  if (current.status==='DRAFT') await api('invoices/'+encodeURIComponent(current.id)+'/publish',{version:current.version,idempotency_key:'studio-publish-'+invoice.id});
  return syncSquareSchedule(base44,invoice,api);
}
