const TOKEN_A = process.env.TOKEN_A;
const TOKEN_B = process.env.TOKEN_B;
const WS_ID = process.env.WORKSHOP_ID;
const URL = process.env.DEMO_URL ?? 'http://localhost:3000/api/registrations';

if (!TOKEN_A || !TOKEN_B || !WS_ID) {
  console.error('Missing TOKEN_A, TOKEN_B, or WORKSHOP_ID in environment.');
  process.exit(1);
}

async function register(label, token) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `race-${label}-${Date.now()}`
    },
    body: JSON.stringify({ workshopId: WS_ID })
  });
  
  let body;
  try {
    body = await res.json();
  } catch (e) {
    body = await res.text();
  }
  
  console.log(`[Student ${label}] Status: ${res.status}`, body);
}

console.log('Firing 2 concurrent requests to grab the last slot...');
await Promise.all([
  register('A', TOKEN_A),
  register('B', TOKEN_B)
]);
