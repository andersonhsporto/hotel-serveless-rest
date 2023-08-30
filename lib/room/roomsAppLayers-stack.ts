import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export class RoomsAppLayersStack extends cdk.Stack {
  readonly roomsLayers: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.roomsLayers = new lambda.LayerVersion(this, "RoomsLayer", {
      code: lambda.Code.fromAsset("lambda/rooms/layers/roomsLayer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      layerVersionName: "RoomsLayer",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    new ssm.StringParameter(this, "RoomsLayerVersionArn", {
      parameterName: "RoomsLayerVersionArn",
      stringValue: this.roomsLayers.layerVersionArn,
    });
  }
}
