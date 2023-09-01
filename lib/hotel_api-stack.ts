import * as cdk from "aws-cdk-lib";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cwlogs from "aws-cdk-lib/aws-logs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface HotelApiStackProps extends cdk.StackProps {
  guestsFetchHandler: lambdaNodeJS.NodejsFunction;
  guestsAdminHandler: lambdaNodeJS.NodejsFunction;
  roomsFetchHandler: lambdaNodeJS.NodejsFunction;
  roomsAdminHandler: lambdaNodeJS.NodejsFunction;
}

export class HotelApiStack extends cdk.Stack {
  private guestAuthorizer: apigateway.CognitoUserPoolsAuthorizer;
  private customerPool: cognito.UserPool;
  private adminPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props: HotelApiStackProps) {
    super(scope, id, props);

    const logGroup = new cwlogs.LogGroup(this, "HotelApiLogs");
    const api = new apigateway.RestApi(this, "HotelApi", {
      restApiName: "HotelApi",
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true,
        }),
      },
    });

    this.createCognitoAuth();

    // ##################################################################################
    // GUEST
    // ##################################################################################

    this.createGuestsService(props, api);

    // ##################################################################################
    // ROOM
    // ##################################################################################

    this.createRoomsService(props, api);
  }

  private createCognitoAuth() {
    const postConfirmationHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "PostConfirmationFunction",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        functionName: "PostConfirmationFunction",
        entry: "lambda/auth/postConfirmationFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(2),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      }
    );

    const preAuthenticationHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "PreAuthenticationFunction",
      {
        functionName: "PreAuthenticationFunction",
        entry: "lambda/auth/preAuthenticationFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(2),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      }
    );

    // cognito customer user pool
    this.customerPool = new cognito.UserPool(this, "CustomerPool", {
      lambdaTriggers: {
        preAuthentication: preAuthenticationHandler,
        postConfirmation: postConfirmationHandler,
      },
      userPoolName: "CustomerPool",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
        phone: false,
      },
      userVerification: {
        emailSubject: "Verify your email to the Hotel Service",
        emailBody:
          "Thanks for signing up to Hotel service! Your verification code is {####}",
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      signInAliases: {
        username: false,
        email: true,
      },
      standardAttributes: {
        fullname: {
          required: true,
          mutable: false,
        },
        birthdate: {
          required: true,
          mutable: false,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(1),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    this.customerPool.addDomain("CustomerDomain", {
      cognitoDomain: {
        domainPrefix: "porto-hotel-customer-service",
      },
    });

    const customerWebScope = new cognito.ResourceServerScope({
      scopeName: "web",
      scopeDescription: "Customer Web Operation",
    });

    const customerMobileScope = new cognito.ResourceServerScope({
      scopeName: "mobile",
      scopeDescription: "Customer Mobile Operation",
    });

    const customerResourceServer = this.customerPool.addResourceServer(
      "CustomerResourceServer",
      {
        identifier: "customer",
        userPoolResourceServerName: "CustomerResourceServer",
        scopes: [customerWebScope, customerMobileScope],
      }
    );

    this.customerPool.addClient("customer-web-client", {
      userPoolClientName: "customerWebClient",
      authFlows: {
        userPassword: true,
      },
      accessTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(2),
      oAuth: {
        scopes: [
          cognito.OAuthScope.resourceServer(
            customerResourceServer,
            customerWebScope
          ),
        ],
      },
    });

    this.customerPool.addClient("customer-mobile-client", {
      userPoolClientName: "customerMobileClient",
      authFlows: {
        userPassword: true,
      },
      accessTokenValidity: cdk.Duration.minutes(120),
      refreshTokenValidity: cdk.Duration.days(2),
      oAuth: {
        scopes: [
          cognito.OAuthScope.resourceServer(
            customerResourceServer,
            customerMobileScope
          ),
        ],
      },
    });

    this.guestAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "ProductAuthorizer",
      {
        authorizerName: "ProductAuthorizer",
        cognitoUserPools: [this.customerPool],
      }
    );
  }

  private createGuestsService(
    props: HotelApiStackProps,
    api: cdk.aws_apigateway.RestApi
  ) {
    const guestsFetchIntegration = new apigateway.LambdaIntegration(
      props.guestsFetchHandler
    );

    const guestFetchWebMobileIntegration = {
      authorizer: this.guestAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizationScopes: ["customer/web", "customer/mobile"],
    };

    const guestFetchWebIntegration = {
      authorizer: this.guestAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizationScopes: ["customer/web"],
    };

    // "/guests"
    const guestsResource = api.root.addResource("guests");
    guestsResource.addMethod(
      "GET",
      guestsFetchIntegration,
      guestFetchWebMobileIntegration
    );

    // GET /guests/{id}
    const guestsIdResource = guestsResource.addResource("{id}");

    guestsIdResource.addMethod(
      "GET",
      guestsFetchIntegration,
      guestFetchWebIntegration
    );

    const guestsAdminIntegration = new apigateway.LambdaIntegration(
      props.guestsAdminHandler
    );

    // POST /guests
    guestsResource.addMethod("POST", guestsAdminIntegration);

    // PUT /guests/{id}
    guestsIdResource.addMethod("PUT", guestsAdminIntegration);

    // DELETE /guests/{id}
    guestsIdResource.addMethod("DELETE", guestsAdminIntegration);
  }

  private createRoomsService(
    props: HotelApiStackProps,
    api: cdk.aws_apigateway.RestApi
  ) {
    const roomsFetchIntegration = new apigateway.LambdaIntegration(
      props.roomsFetchHandler
    );

    const roomResource = api.root.addResource("rooms");
    roomResource.addMethod("GET", roomsFetchIntegration);

    // GET /guests/{id}
    const roomsIdResource = roomResource.addResource("{id}");
    roomsIdResource.addMethod("GET", roomsFetchIntegration);

    const roomsAdminIntegration = new apigateway.LambdaIntegration(
      props.roomsAdminHandler
    );

    // POST /guests
    roomResource.addMethod("POST", roomsAdminIntegration);

    // PUT /guests/{id}
    roomsIdResource.addMethod("PUT", roomsAdminIntegration);

    // DELETE /guests/{id}
    roomsIdResource.addMethod("DELETE", roomsAdminIntegration);
  }
}
