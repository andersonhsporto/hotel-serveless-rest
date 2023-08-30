#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { HotelApiStack } from "../lib/hotel_api-stack";
import { GuestsAppStack } from "../lib/guest/guestsApp-stack";
import { GuestsAppLayersStack } from "../lib/guest/guestsAppLayers-stack";
import { RoomsAppLayersStack } from "../lib/room/roomsAppLayers-stack";
import { RoomsAppStack } from "../lib/room/roomsApp-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.ACCOUNT_AWS,
  region: process.env.REGION_AWS,
};

const tags = {
  cost: "Hotel-API",
  team: "Staff",
};

const guestsAppLayersStack = new GuestsAppLayersStack(app, "GuestsAppLayers", {
  tags: tags,
  env: env,
});

const guestsAppStack = new GuestsAppStack(app, "GuestsApp", {
  tags: tags,
  env: env,
});
guestsAppStack.addDependency(guestsAppLayersStack);

const roomAppLayerStack = new RoomsAppLayersStack(app, "RoomAppLayers", {
  tags: tags,
  env: env,
});

const roomAppStack = new RoomsAppStack(app, "RoomApp", {
  tags: tags,
  env: env,
});
guestsAppStack.addDependency(roomAppLayerStack);

const hotelApiStack = new HotelApiStack(app, "HotelApi", {
  guestsFetchHandler: guestsAppStack.guestsFetchHandler,
  guestsAdminHandler: guestsAppStack.guestsAdminHandler,
  roomsFetchHandler: roomAppStack.roomsFetchHandler,
  roomsAdminHandler: roomAppStack.roomsAdminHandler,
  tags: tags,
  env: env,
});
hotelApiStack.addDependency(guestsAppStack);
