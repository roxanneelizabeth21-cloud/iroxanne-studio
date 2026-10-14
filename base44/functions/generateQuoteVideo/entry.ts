// Retained for older callers. The Lead workflow now includes the video in its single confirmation.
export default async function(_req: Request) {
 return Response.json({ok:true,status:'included_in_quote_confirmation'});
}
