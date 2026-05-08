const TOKEN = process.env.STUDENT_TOKEN;
const REG_ID = process.env.REGISTRATION_ID;
// NOTE: Make sure the demo url matches your actual routes
const URL = process.env.DEMO_URL ?? `http://localhost:3000/api/payments/registrations/${REG_ID}/pay`;

if (!TOKEN || !REG_ID) {
  console.error('Missing STUDENT_TOKEN or REGISTRATION_ID in environment.');
  process.exit(1);
}

let attempt = 0;

async function fire() {
  attempt++;
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `trip-${attempt}-${Date.now()}`
      }
    });
    
    const body = await res.json().catch(() => null);
    
    if (body && body.canPay === false) {
      console.log(`[Attempt ${attempt}] 🔴 CIRCUIT OPEN (Fast Fail):`, body.reason);
      console.log('\nCircuit successfully tripped! Now you can wait for HALF-OPEN state.');
      process.exit(0);
    } else {
      console.log(`[Attempt ${attempt}] Status ${res.status}:`, body || res.statusText);
      // Keep firing to trip the circuit
      setTimeout(fire, 300);
    }
  } catch (err) {
    console.error(`[Attempt ${attempt}] Error:`, err.message);
    setTimeout(fire, 300);
  }
}

console.log('Repeatedly calling payment endpoint to trip the circuit...');
console.log('Make sure mock gateway is configured to fail (e.g. 502).');
fire();
