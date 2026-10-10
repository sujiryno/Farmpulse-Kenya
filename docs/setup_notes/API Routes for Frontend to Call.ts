export async function calculateProfit(params: any) {
  const res = await fetch('/api/profit-calculator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}