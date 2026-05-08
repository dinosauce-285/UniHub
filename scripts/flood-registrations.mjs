const TOTAL = Number(process.env.TOTAL_REQUESTS ?? 12000);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 250);
const TOKEN = process.env.STUDENT_TOKEN;
const WS_ID = process.env.WORKSHOP_ID;
const URL = process.env.DEMO_URL ?? 'http://localhost:3000/api/registrations';

if (!TOKEN || !WS_ID) {
  console.error('Missing STUDENT_TOKEN or WORKSHOP_ID in environment.');
  process.exit(1);
}

const statuses = new Map();
let nextRequest = 0;

async function worker() {
  while (true) {
    const current = nextRequest++;
    if (current >= TOTAL) return;

    try {
      const res = await fetch(URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `flood-${current}-${Date.now()}`
        },
        body: JSON.stringify({ workshopId: WS_ID })
      });
      
      const body = await res.text();
      statuses.set(res.status, (statuses.get(res.status) || 0) + 1);
      
      if (res.status === 429) {
        console.log(`[Request ${current}] 🔴 429 Too Many Requests. Retry-After: ${res.headers.get('Retry-After') || 'unknown'}s`);
      } else {
        console.log(`[Request ${current}] 🟢 ${res.status}`);
      }
    } catch (err) {
      console.log(`[Request ${current}] ❌ Error: ${err.message}`);
    }
  }
}

console.log(`Flooding ${URL} with ${TOTAL} requests...`);
await Promise.all(Array.from({ length: CONCURRENCY }).map(worker));

console.log('\n--- Results ---');
for (const [status, count] of statuses.entries()) {
  console.log(`Status ${status}: ${count} requests`);
}
