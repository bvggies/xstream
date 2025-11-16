# Test Registration Endpoint

## Quick Test

Open browser console on your frontend (https://xstream-wheat.vercel.app) and run:

```javascript
fetch('https://xstream-backend.vercel.app/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    username: 'testuser123',
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User'
  })
})
.then(async r => {
  const data = await r.json();
  console.log('Status:', r.status);
  console.log('Response:', data);
  return data;
})
.catch(err => {
  console.error('Error:', err);
});
```

## Check CORS

Test CORS preflight:

```javascript
fetch('https://xstream-backend.vercel.app/api/auth/register', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://xstream-wheat.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
})
.then(r => {
  console.log('CORS Headers:', {
    'access-control-allow-origin': r.headers.get('access-control-allow-origin'),
    'access-control-allow-credentials': r.headers.get('access-control-allow-credentials'),
    'access-control-allow-methods': r.headers.get('access-control-allow-methods'),
  });
});
```

## Verify Environment Variables

In Vercel Dashboard → Backend Project → Settings → Environment Variables:

Should have:
```
FRONTEND_URL=https://xstream-wheat.vercel.app
```

**Important:** No trailing slash!

## Common Issues

1. **CORS Error**: Backend not allowing frontend origin
2. **Network Error**: Backend URL wrong or backend down
3. **404 Error**: Route not found (check vercel.json)
4. **500 Error**: Backend crash (check function logs)

---

Run the test above and share the console output!

