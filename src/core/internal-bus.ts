import { EventEmitter } from "events";
import { MTNetLogger } from "./logger";
import { MTNetPluginBase } from "./plugin-base";
import { v4 as uuid } from "uuid";

export enum Events {
  SEND = "send",
  FIRE = "fire",
  FIRE_RESPONCE = "fire_responce",
}

export interface BusSendEvent {
  event: string;
  channel: string;
  data: unknown[];
}

export interface BusFireEvent extends BusSendEvent {
  id: string;
}

export interface BusFireEventResponce<T> {
  result: T;
}

export const BROADCAST_CHANNEL = "ch.broadcast";

export class MTNetInternalBus {
  public readonly emitter: EventEmitter;
  private plugins: MTNetPluginBase[] = [];

  constructor(private readonly logger: MTNetLogger) {
    this.emitter = new EventEmitter();
  }

  send(event: string, channel: string, data: unknown[]): void {
    this.emitter.emit(Events.SEND, {
      event,
      channel,
      data,
    });
  }

  broadcastSend(event: string, data: unknown[]): void {
    this.send(event, BROADCAST_CHANNEL, data);
  }

  fire<T>(event: string, channel: string, data: unknown): Promise<T> {
    const id = uuid();
    return new Promise((resolve) => {
      this.emitter.once(id, (inDt: BusFireEventResponce<T>) => {
        resolve(inDt.result);
      });
      this.emitter.emit(Events.FIRE, { event, channel, data, id });
    });
  }

  fireResponce<T>(id: string, data: T): void {
    this.emitter.emit(id, data);
  }

  registerPlugin(plugin: MTNetPluginBase): void {
    this.plugins.push(plugin);
  }
}
