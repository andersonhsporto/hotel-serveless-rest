import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export class RoomsAppStack extends cdk.Stack {
  readonly roomsFetchHandler: lambdaNodeJS.NodejsFunction;
  readonly roomsAdminHandler: lambdaNodeJS.NodejsFunction;
  readonly roomsDdb: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // pointer to the database table (like)
    this.roomsDdb = this.newRoomTable();

    //Rooms Layer
    const roomsLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "RoomsLayerVersionArn"
    );
    const roomsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "RoomsLayerVersionArn",
      roomsLayerArn
    );

    this.roomsFetchHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "RoomsFetchFunction",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        functionName: "RoomsFetchFunction",
        entry: "lambda/rooms/roomsFetchFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        environment: {
          GUESTS_DDB: this.roomsDdb.tableName,
        },
        layers: [roomsLayer],
      }
    );
    this.roomsDdb.grantReadData(this.roomsFetchHandler);

    this.roomsAdminHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "RoomsAdminFunction",
      {
        functionName: "RoomsAdminFunction",
        entry: "lambda/rooms/roomsAdminFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        environment: {
          GUESTS_DDB: this.roomsDdb.tableName,
        },
        layers: [roomsLayer],
      }
    );
    this.roomsDdb.grantWriteData(this.roomsAdminHandler);
  }

  private newRoomTable(): dynamodb.Table {
    return new dynamodb.Table(this, "RoomsDdb", {
      tableName: "rooms",
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
