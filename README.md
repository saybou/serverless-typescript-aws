# Serverless AWS example

This is a Serverless project example using Typescript, ready for [AWS Lambda](https://aws.amazon.com/lambda) and [API Gateway](https://aws.amazon.com/api-gateway/).

You need to have an AWS account, to create a dedicated IAM User with credentials so Serverless can deploy your app. ([Configure AWS credentials](#configure-aws-credentials))

## Stack

- [Node.js](https://nodejs.org/en/) 12x
- [Serverless](https://serverless.com/framework/docs/)
- [Typescript](https://www.typescriptlang.org/) (> 3.8) for type checking.
- A sample [docker-compose.yml](https://docs.docker.com/compose/), which allow us to test our App with [Docker](https://www.docker.com/).

## IDE Setup

[VSCode](https://code.visualstudio.com/) is highly preferred. Please ensure you have installed these extensions:

- Prettier
- Eslint

---

You can clone this repo and use it with docker, or jump to the next section and follow the instructions to set up your application step by step

## Use with Docker

```bash
# host project dir
cd serverless-aws-example

# Up container
docker-compose up -d

# Attach to node container
docker exec -ti node sh

# container project dir
cd /var/www/serverless-aws-example

# install dependencies
npm install
```

## Set up step by step

### Project initialization

Let's start to initialize our project with the Serverless template "aws-nodejs-typescript"

```bash
serverless create --template aws-nodejs-typescript
```

Now we have initial handler.ts, serverless.yml, tsconfig.json and webpack.config.js files.

### Add ESLint with Typescript support

[TypeScript ESLint](https://github.com/typescript-eslint/typescript-eslint/)

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

- Create `.eslintrc.js`

```js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: './',
    sourceType: 'module',
    ecmaVersion: 2019,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

- Create `.eslintignore` :

```text
node_modules
.serverless
.vscode
*.config.js
.webpack
**/*.js
```

### Add Prettier

[Prettier with linters](https://prettier.io/docs/en/integrating-with-linters.html)

```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

- Create `.prettierrc.js`

```js
module.exports = {
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
};
```

- Create `.prettierignore`

```text
node_modules
.serverless
.webpack
```

- Update `.eslintrc.js` rules

```js
extends: [
  "prettier/@typescript-eslint", // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
  "plugin:prettier/recommended" // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
],
```

### Webpack

Enable Webpack plugin that runs TypeScript type checker on a separate process.

Update `webpack.config.js`

```js
plugins: [
  new ForkTsCheckerWebpackPlugin({
    eslint: true,
    eslintOptions: {
      cache: true,
    },
  }),
],
```

### Update our Handler with correct types

```typescript
// handler.ts
import { APIGatewayProxyHandler, APIGatewayEvent, Context, Callback } from 'aws-lambda';
import 'source-map-support/register';

export const hello: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback,
): Promise<any> => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
        input: event,
        context: context,
        callback: callback,
      },
      null,
      2,
    ),
  };
};
```

## NPM Scripts

Let's add some scripts for our application in `package.json`

```json
"scripts": {
  "lint": "eslint . --ext js,ts --cache --fix",
  "prettier": "prettier --list-different './**/*.{js,ts}'",
  "typecheck": "tsc --noEmit",
  "test": "echo \"Error: no test specified\" && exit 1"
},
```

Test them :

```bash
# linter
npm run lint

# prettier
npm run prettier

# type checking
npm run typecheck
```

## Configure AWS Credentials

### Create IAM user for Serverless

- Login to AWS and navigate to IAM
- Create a new user called serverless-admin
- Give serverless-admin Programatic access
- Attach the AdministratorAccess policy

Save your new AWS profile into `~/.aws/credentials` (Don't forget to set your values :D) :

```test
[serverless-admin]
aws_access_key_id = XXX
aws_secret_access_key = XXX
region = XXX
```

Set this profile in your `serverless.yml` so Serverless can use it for deployment.

```yaml
provider:
  profile: serverless-admin
```

(or pass it with `--profile` argument to `serverless deploy`command.)

Here is our final `serverless.yml` :

```yaml
service:
  name: my-service
# app and org for use with dashboard.serverless.com
#app: your-app-name
#org: your-org-name

custom:
  webpack:
    webpackConfig: ./webpack.config.js
    includeModules: true

# Add the serverless-webpack plugin
plugins:
  - serverless-webpack

provider:
  name: aws
  runtime: nodejs12.x
  profile: serverless-admin
  apiGateway:
    minimumCompressionSize: 1024 # Enable gzip compression for responses > 1 KB
  environment:
    AWS_NODEJS_CONNECTION_REUSE_ENABLED: 1 # reuse HTTP connections : https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          method: get
          path: hello
```

## Deploy

```bash
# -v enables verbose output so you can see what happens
serverless deploy -v
```

Dev stage is assumed by default.

What do Serverless do ?

- Package our application (with Webpack)
- Creates a CloudFormation stack
- Create a S3 Bucket
- Upload the CloudFormation template to S3
- Upload our application package to S3
- Provisions the IAM Roles
- Provisions the Log Groups
- Provisions the ApiGateway end points
- Provisions the Lambda function our service

You can now invoke your service :

```bash
# -f specifies the function name, -l specifiesto output the logs to the console
serverless invoke -f hello -l
```

You can test it with your API Gateway end point : `https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev`

## Delete your service

```bash
serverless remove
```

## Add JEST for testing

WIP :)

## And now

Now it's your time !

Update your function, update your provider config, create new functions, and deploy your service(s) as you want :D
