lamassu-bitcoinaverage
======================

[![Build Status](https://travis-ci.org/lamassu/lamassu-bitcoinaverage.svg)](https://travis-ci.org/lamassu/lamassu-bitcoinaverage)

Lamassu BitcoinAverage ticker plugin

### Testing

1. Type this into your terminal:

```bash
npm update # in case you cloned via git
npm test
```

### BitcoinAverage releases it's API v2.0

BitcoinAverage has released v2.0 of it's API which requires authentication via an api key-pair.
These can be generated for free at https://bitcoinaverage.com/en/apikeys, registration is required.

This plugin uses the old v1.0 API by default, which will be discarded soon.
So make sure to create an account and generate yourself an API v2.0 key-pair. Then copy and paste this key-pair(key and secret)
into the API_KEY and API_SECRET variables in the ticker.js file.