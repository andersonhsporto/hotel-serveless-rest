import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { bool } from "aws-sdk/clients/signer";
import { v4 as uuid } from "uuid";

export enum RoomType {
  SINGLE = "single",
  DOUBLE = "double",
  TRIPLE = "triple",
  COUPLE = "couple",
}

export interface RoomInterface {
  id: string;
  roomType: RoomType;
  isFull: bool;
  isCleaned: bool;
  description: string;
}

export interface RoomDTO {
  roomType: "single" | "double" | "triple" | "couple";
  isFull: bool;
  isCleaned: bool;
  description: string;
}

export class RoomRepository {
  constructor(private ddbClient: DocumentClient, private roomDDB: string) {}

  async getAll(): Promise<RoomInterface[]> {
    const data = await this.ddbClient
      .scan({
        TableName: this.roomDDB,
      })
      .promise();

    return data.Items as RoomInterface[];
  }

  async getById(roomId: string): Promise<RoomInterface> {
    const data = await this.ddbClient
      .get({
        TableName: this.roomDDB,
        Key: {
          id: roomId,
        },
      })
      .promise();

    if (!data.Item) {
      throw new Error("Room not found");
    }
    return data.Item as RoomInterface;
  }

  async getAllCleaned(): Promise<RoomInterface[]> {
    const data = await this.ddbClient
      .scan({
        TableName: this.roomDDB,
        FilterExpression: "isCleaned = :isCleaned",
        ExpressionAttributeValues: {
          ":isCleaned": true,
        },
      })
      .promise();

    return data.Items as RoomInterface[];
  }

  async getAllDirty(): Promise<RoomInterface[]> {
    const data = await this.ddbClient
      .scan({
        TableName: this.roomDDB,
        FilterExpression: "isCleaned = :isCleaned",
        ExpressionAttributeValues: {
          ":isCleaned": false,
        },
      })
      .promise();

    return data.Items as RoomInterface[];
  }

  async create(dto: RoomDTO): Promise<RoomInterface> {
    const object: RoomInterface = this.toObject(dto);

    await this.ddbClient
      .put({
        TableName: this.roomDDB,
        Item: object,
      })
      .promise();

    return object;
  }

  async delete(roomId: string): Promise<RoomInterface> {
    const data = await this.ddbClient
      .delete({
        TableName: this.roomDDB,
        Key: {
          id: roomId,
        },
        ReturnValues: "ALL_OLD",
      })
      .promise();

    if (!data.Attributes) {
      throw new Error("Room not found");
    }
    return data.Attributes as RoomInterface;
  }

  async update(roomId: string, dto: RoomDTO): Promise<RoomInterface> {
    const object: RoomInterface = this.toObject(dto);

    await this.ddbClient
      .update({
        TableName: this.roomDDB,
        Key: { id: roomId },
        UpdateExpression:
          "SET roomType = :roomType, isFull = :isFull, isCleaned = :isCleaned, description = :description",
        ExpressionAttributeValues: {
          ":roomType": object.roomType,
          ":isFull": object.isFull,
          ":isCleaned": object.isCleaned,
          ":description": object.description,
        },
      })
      .promise();
      
    return object;
  }

  private toObject(roomDTO: RoomDTO): RoomInterface {
    return {
      id: uuid(),
      roomType: roomDTO.roomType as RoomType,
      isFull: roomDTO.isFull,
      isCleaned: roomDTO.isCleaned,
      description: roomDTO.description,
    };
  }
}
