export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'synaptria-web',
    timestamp: new Date().toISOString(),
  });
}
