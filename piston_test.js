// Manual test script for Piston execute API (e.g. run with node piston_test.js).
const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";
fetch(PISTON_API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    language: "python",
    version: "3.10.0",
    files: [{ content: 'print("hello")' }],
  }),
}).then(r => r.text()).then(t => console.log("Status:", t)).catch(console.error);
