# Template Hello World (Javascript)

### _A minimal template for Javascript development_


## Why?

This repository exists to show a working example of Typescript formatting, linting and publishing with continuous integration.


## Deployment

Infrastructure is handled by `aws-cdk` 

This repository requires a SSM parameter `KxApiKey` to contain your API key for Linz data service

```
yarn build

npx cdk deploy
```