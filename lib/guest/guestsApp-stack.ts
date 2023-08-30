import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export class GuestsAppStack extends cdk.Stack {
  readonly guestsFetchHandler: lambdaNodeJS.NodejsFunction;
  readonly guestsAdminHandler: lambdaNodeJS.NodejsFunction;
  readonly guestsDdb: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.guestsDdb = this.newGuestTable();

    //Guests Layer
    const guestsLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "GuestsLayerVersionArn"
    );
    const guestsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "GuestsLayerVersionArn",
      guestsLayerArn
    );

    this.guestsFetchHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "GuestsFetchFunction",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        functionName: "GuestsFetchFunction",
        entry: "lambda/guests/guestsFetchFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        environment: {
          GUESTS_DDB: this.guestsDdb.tableName,
        },
        layers: [guestsLayer],
      }
    );
    this.guestsDdb.grantReadData(this.guestsFetchHandler);

    this.guestsAdminHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "GuestsAdminFunction",
      {
        functionName: "GuestsAdminFunction",
        entry: "lambda/guests/guestsAdminFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        environment: {
          GUESTS_DDB: this.guestsDdb.tableName,
        },
        layers: [guestsLayer],
      }
    );
    this.guestsDdb.grantWriteData(this.guestsAdminHandler);
  }

  private newGuestTable(): dynamodb.Table {
    return new dynamodb.Table(this, "GuestsDdb", {
      tableName: "guests",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });
  }
}
