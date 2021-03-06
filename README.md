## PX

Reverse proxy self-service

#### Use as a module

```ts
import px from '@cloud-cli/px';

px.addProxy({ domain: 'example.com', target: 'localhost:1234' });
px.removeProxy('example.com');

console.log(px.getDomainList());
console.log(px.getProxyForDomain('example.com'));

px.addCertificate({ domain: 'example.com', certificate: '...', key: '...' });
px.removeCertificate('example.com');
```

#### Use as a standalone API

```ts
import { startProxy } from '@cloud-cli/px';

startProxy();
```

**Environment variables**

| Property  | Type   | Default     |
| --------- | ------ | ----------- |
| `PX_HOST` | String | '127.0.0.1' |
| `PX_PORT` | Number |             |

That's it!

#### API Reference

**Add a certificate**

```
PUT /certificates

{
  "domain": "example.com",
  "certificate": "...",
  "key": "...",
}

```

**Add a certificate**

```
DELETE /certificates/example.com
```

**Add a service**

```
POST /services
{
  "domain": "example.com",
  "target": "localhost:1234"
}
```

**Remove a service**

```
DELETE /services/example.com
```
