# CDK
## deploy
```shell
source ../.env
npm run deploy:dev -- --parameters ApiKeyHashSecret="$API_KEY_HASH_DEV" --profile rui
```

## destroy
```shell
npx cdk destroy InterviewBuddyApiStack-dev --profile rui
```
