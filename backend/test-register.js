async function testRegister() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hoTen: 'KIEU TAN PHUOC',
        email: 'phuoc@gmail.com',
        soDienThoai: '0222222222',
        matKhau: 'phuoc123'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Error:', data);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.error('Network/Internal Error:', err);
  }
}

testRegister();
