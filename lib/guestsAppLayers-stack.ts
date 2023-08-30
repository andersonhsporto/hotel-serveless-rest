import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as ssm from "aws-cdk-lib/aws-ssm"
import { Construct } from "constructs"

export class GuestsAppLayersStack extends cdk.Stack {
   readonly guestsLayers: lambda.LayerVersion

   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props)

      this.guestsLayers = new lambda.LayerVersion(this, "GuestsLayer", {
         code: lambda.Code.fromAsset('lambda/guests/layers/guestsLayer'),
         compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
         layerVersionName: "GuestsLayer",
         removalPolicy: cdk.RemovalPolicy.RETAIN
      })
      new ssm.StringParameter(this, "GuestsLayerVersionArn", {
         parameterName: "GuestsLayerVersionArn",
         stringValue: this.guestsLayers.layerVersionArn
      })
   }
}