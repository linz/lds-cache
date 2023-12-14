# LINZ Data Service Export Cache

## Why?

LINZ has a lot of tools running in side AWS, sometimes it is useful to have direct S3 access to some datasets.

This system schedules a lambda to run every hour that will look for updates to datasets and export them into S3 when new changes are detected.


## Storage structure

The exports are stored inside of a folder based off their LDS Dataset Id

Full [STAC](https://stacspec.org/) catalog for the export cache
```
/catalog.json
```

STAC collection JSON
```
/:datasetId/collection.json 
```

Most recently imported record
```
/:datasetId/:datasetId.json 
```

Specific versions 
```
/:datasetId/:datasetId_:versionId.json 
```


## Deployment

Infrastructure is handled by `aws-cdk` 

This repository requires a SSM parameter `KxApiKey` to contain a API key for linz data service

```
npm run build

npx cdk deploy
```
