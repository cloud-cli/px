## PX

Reverse proxy with Nginx

#### Usage

As a module:

```ts
import px from '@cloud-cli/px';

px.start({ port: 4567 });

px.removeProxy({ domain: 'example.com' });
px.addProxy({ domain: 'example.com', target: 'localhost:1234' });

px.removeCertificate({ domain: 'example.com' });
px.addCertificate({ domain: 'example.com', certificate: '...', key: '...' });

console.log(px.getDomainList());
console.log(px.getProxyForDomain('example.com'));
```

With Cloudy CLI:

```ts
import px from '@cloud-cli/px';
import { cli } from '@cloud-cli/cy';

cli.add('px', px);
```

**start() options**

| Property | Type   | Default     |
| -------- | ------ | ----------- |
| `host`   | String | '127.0.0.1' |
| `port`   | Number |             |

#### HTTP API

**Add a certificate**

```
POST /certificates

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
