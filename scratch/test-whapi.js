const whapiToken = "1jVxBv4wqxclZGiNa9ZJSgFfnTfRDgf";
const phone = "51943968151"; // The phone number to test

async function testFormat1() {
  const url = `https://gate.whapi.cloud/business/products?wid=${phone}`;
  console.log("Testing Format 1 (Query param):", url);
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${whapiToken}`, 'Accept': 'application/json' }
    });
    console.log("Format 1 Status:", res.status);
    const data = await res.json();
    console.log("Format 1 Data length:", data?.products?.length, JSON.stringify(data).substring(0, 300));
  } catch (err) {
    console.error("Format 1 Error:", err.message);
  }
}

async function testFormat2() {
  const url = `https://gate.whapi.cloud/business/${phone}/products`;
  console.log("\nTesting Format 2 (Path param):", url);
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${whapiToken}`, 'Accept': 'application/json' }
    });
    console.log("Format 2 Status:", res.status);
    const data = await res.json();
    console.log("Format 2 Data length:", data?.products?.length, JSON.stringify(data).substring(0, 300));
  } catch (err) {
    console.error("Format 2 Error:", err.message);
  }
}

async function testFormat3() {
  const url = `https://gate.whapi.cloud/business/${phone}@s.whatsapp.net/products`;
  console.log("\nTesting Format 3 (Path param with @s.whatsapp.net):", url);
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${whapiToken}`, 'Accept': 'application/json' }
    });
    console.log("Format 3 Status:", res.status);
    const data = await res.json();
    console.log("Format 3 Data length:", data?.products?.length, JSON.stringify(data).substring(0, 300));
  } catch (err) {
    console.error("Format 3 Error:", err.message);
  }
}

async function run() {
  await testFormat1();
  await testFormat2();
  await testFormat3();
}

run();
