async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/courts');
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
