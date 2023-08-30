# Hotel Management System

## Description

Rest service for hotel management system, made with AWS CDK and AWS Lambda using typescript and node.js.
this project is heavily inspired in the example developed during the course [AWS Serverless com NodeJS e AWS CDK](https://siecola.com.br).

## !! Working in progress


## Technologies

- [Typescript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/en/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [AWS API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- [AWS DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [AWS S3](https://docs.aws.amazon.com/s3/index.html)
- [AWS CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html)
- [AWS IAM](https://docs.aws.amazon.com/iam/index.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [AWS Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
- [AWS SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)

## System requirements

- [Node.js](https://nodejs.org/en/) 12.x or higher
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) 2.x or higher
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) 1.x or higher
- [Docker](https://docs.docker.com/get-docker/) 19.x or higher


## Installation

1. Clone the repository
2. Install dependencies
	```bash
	npm install
	```
3. Build the project
	```bash
	npm run build
	```

## Deployment

1. Configure AWS CLI
	```bash
	aws configure
	```
2. Deploy the project
	```bash
	cdk deploy --all --require-approval never
	```

## Endpoints

- GET /guests - List all guests
- GET /guests/{id} - Get guest by id
- POST /guests - Create new guest
- PUT /guests/{id} - Update guest by id
- DELETE /guests/{id} - Delete guest by id

### Json Example

Some endpoints like POST /guests and PUT /guests/{id} require a json body like this:

```json
 {
  "id": "string",
  "guestName": "string",
  "guestEmail": "string",
  "guestMobile": "string",
  "guestBirthDate": "string",
  "guestAddress": "string",
  "code": "string"
  }
```

## TODO: Endpoints

### ROOMS

- GET /rooms
- GET /rooms/{id}
- POST /rooms
- PUT /rooms/{id}
- DELETE /rooms/{id}

### RESERVATIONS

- GET /reservations
- GET /reservations/{id}
- POST /reservations
- PUT /reservations/{id}
- DELETE /reservations/{id}

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## Contact Information

If you have any questions, suggestions, or critiques, please contact me using [email](mailto:anderson.higo2@gmail.com)
or through [LinkedIn](https://www.linkedin.com/in/andersonhsporto/).