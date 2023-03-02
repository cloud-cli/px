## PX

Reverse proxy to map local services to http(s) subdomains

#### Usage

Use it with [Cloudy](https://github.com/cloud-cli/cli)

```ts
// cloudy.conf.mjs

import proxy from '@cloud-cli/px';

export default { proxy };
```

#### API

**Add a proxy to a local service**

```
cy proxy.add --domain "foo.example.com" --target "localhost:1234"
cy proxy.add --domain "bar.example.com/api" --target "localhost:3000"
```

**Remove a proxy**

```
cy proxy.remove --domain "foo.example.com" --target "localhost:1234"
cy proxy.remove --domain "bar.example.com/api" --target "localhost:1234"
```

**Get details of a proxy**

```
cy proxy.get --domain "foo.example.com"
```

**List proxies**

```
cy proxy.list
```

**List registered domains**

```
cy proxy.domains
```

**Reload all configurations**

```
cy proxy.reload
```

## Certificate file resolution

```
certificatesFolder  = '/etc/letsencrypt/live' or process.env.PX_CERTS_FOLDER
rootDomain          = 'example.com' in 'xyz.example.com'
cert                = certificatesFolder + '/' + rootDomain + '/' + certificateFile
key                 = certificatesFolder + '/' + rootDomain + '/' + keyFile
```

So xyz.example.com points to:

```
/etc/letsencrypt/live/example.com/fullchain.pem   for certificate
/etc/letsencrypt/live/example.com/privkey.pem     for private key
```
