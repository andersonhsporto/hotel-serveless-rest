import * as cdk from "aws-cdk-lib";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cwlogs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

interface HotelApiStackProps extends cdk.StackProps {
  guestsFetchHandler: lambdaNodeJS.NodejsFunction;
  guestsAdminHandler: lambdaNodeJS.NodejsFunction;
  roomsFetchHandler: lambdaNodeJS.NodejsFunction;
  roomsAdminHandler: lambdaNodeJS.NodejsFunction;
}

export class HotelApiStack extends cdk.Stack {
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

    // ##################################################################################
    // GUEST
    // ##################################################################################

    const guestsFetchIntegration = new apigateway.LambdaIntegration(
      props.guestsFetchHandler
    );

    // "/guests"
    const guestsResource = api.root.addResource("guests");
    guestsResource.addMethod("GET", guestsFetchIntegration);

    // GET /guests/{id}
    const guestsIdResource = guestsResource.addResource("{id}");

    guestsIdResource.addMethod("GET", guestsFetchIntegration);

    const guestsAdminIntegration = new apigateway.LambdaIntegration(
      props.guestsAdminHandler
    );

    // POST /guests
    guestsResource.addMethod("POST", guestsAdminIntegration);

    // PUT /guests/{id}
    guestsIdResource.addMethod("PUT", guestsAdminIntegration);

    // DELETE /guests/{id}
    guestsIdResource.addMethod("DELETE", guestsAdminIntegration);

    // ##################################################################################
    // ROOM
    // ##################################################################################

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
