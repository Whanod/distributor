# Distributor SDK

Distributor SDK is a TypeScript client SDK used to interact with the distributor contract

## How to install the SDK

[![npm](https://img.shields.io/npm/v/@hubbleprotocol/distributor-sdk)](https://www.npmjs.com/package/@hubbleprotocol/distributor-sdk)

```shell
yarn add @hubbleprotocol/distributor-sdk
```

```shell
yarn update @hubbleprotocol/distributor-sdk
```

## How to use the SDK

```typescript
// Initialize the client and then you can use it to fetch data by calling it
const distributorClient = new Distributor(env.provider.connection);
```