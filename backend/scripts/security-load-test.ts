import { test } from "node:test";
import assert from "node:assert";

const BASE_URL = "http://localhost:8080";

test("Day 8: Security - Health Check Without Auth", async (t) => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(res.status, 200, "Health check should always be 200 OK");
});

test("Day 8: Security - Missing JWT token on protected route", async (t) => {
  const res = await fetch(`${BASE_URL}/api/dashboard/stats`);
  assert.strictEqual(res.status, 401, "Should block access without JWT");
});

test("Day 8: Security - Invalid JWT signature", async (t) => {
  const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature_here";
  const res = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${invalidToken}` }
  });
  assert.strictEqual(res.status, 401, "Should block fake/invalid JWT");
});

test("Day 8: Security - SQL Injection Attempt on Login", async (t) => {
  const payload = {
    username: "admin' OR '1'='1",
    password: "password123"
  };
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  // Prisma sanitizes this automatically, so it should just return 401 Unauthorized
  assert.strictEqual(res.status, 401, "Should block SQL injection and fail auth securely");
});

test("Day 8: Security - Rate Limiting (Brute Force Protection)", async (t) => {
  const payload = { username: "wrong_user", password: "wrong_password" };
  
  let rateLimited = false;
  // Auth limiter is set to 5 requests per minute.
  for (let i = 0; i < 8; i++) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (res.status === 429) {
      rateLimited = true;
      break;
    }
  }
  
  assert.strictEqual(rateLimited, true, "Should block brute force attempts with 429 Too Many Requests");
});

test("Day 8: Load - Concurrent Requests Stability", async (t) => {
  const promises = [];
  const TOTAL_REQUESTS = 100;
  
  const startTime = Date.now();
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    promises.push(fetch(`${BASE_URL}/health`).then(r => r.status));
  }
  
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  const successCount = results.filter(status => status === 200).length;
  
  assert.strictEqual(successCount, TOTAL_REQUESTS, `All ${TOTAL_REQUESTS} concurrent requests should succeed`);
  console.log(`    Load Test: 100 requests handled in ${duration}ms`);
});
