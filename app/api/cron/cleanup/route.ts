import { cleanupResults, storageEnabled } from '../../../../lib/result-storage';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request) {
 const secret=process.env.CRON_SECRET;
 if(!storageEnabled() || !secret || req.headers.get('authorization')!==`Bearer ${secret}`)return new Response('Unauthorized',{status:401});
 try {const removed=await cleanupResults();console.log(JSON.stringify({event:'result_cleanup',removed}));return Response.json({removed},{headers:{'Cache-Control':'no-store'}});}
 catch {console.error(JSON.stringify({event:'result_cleanup_failed'}));return new Response('Cleanup failed',{status:500});}
}
