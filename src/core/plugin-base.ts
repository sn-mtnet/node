import { EventEmitter } from "events";
import {
  BROADCAST_CHANNEL,
  MTNetInternalBus,
  Events,
  BusSendEvent,
  BusFireEvent,
} from "./internal-bus";

export abstract class MTNetPluginBase {
  private internalBus: MTNetInternalBus;
  private selfEmitter: EventEmitter;
  private channels: Set<string>;
  constructor() {
    this.selfEmitter = new EventEmitter();
    this.channels = new Set();
  }

  setupInternalBus(internalBus: MTNetInternalBus): void {
    this.internalBus = internalBus;
    this.internalBus.emitter.on(Events.SEND, (data: BusSendEvent) => {
      this.onSendEvent(data);
    });
    this.internalBus.emitter.on(Events.FIRE, (data: BusFireEvent) => {
      this.onFireEvent(data);
    });
    this.subscribeToChannel(BROADCAST_CHANNEL);
  }

  private onSendEvent(data: BusSendEvent): void {
    if (!this.channels.has(data.channel)) return;
    this.selfEmitter.emit(`${data.event}#:#${data.channel}`, ...data.data);
  }

  private onFireEvent(data: BusFireEvent): void {
    if (!this.channels.has(data.channel)) return;
    this.selfEmitter.emit(
      `${data.event}#:#${data.channel}`,
      data.data,
      data.id
    );
  }

  protected subscribeToChannel(channel: string): void {
    this.channels.add(channel);
  }
  protected unsubscribeFromChannel(channel: string): void {
    this.channels.delete(channel);
  }

  protected onChannel(
    event: string,
    channel: string,
    callback: (...args: unknown[]) => void | Promise<void>
  ): void {
    this.selfEmitter.on(`${event}#:#${channel}`, callback);
  }

  protected onBroadcast(
    event: string,
    callback: (...args: unknown[]) => void | Promise<void>
  ): void {
    this.selfEmitter.on(`${event}#:#${BROADCAST_CHANNEL}`, callback);
  }

  protected onChannelReturn(
    event: string,
    channel: string,
    callback: (...args: unknown[]) => unknown
  ): void {
    this.selfEmitter.on(
      `${event}#:#${channel}`,
      async (data: unknown[], id: string) => {
        const res = await callback(...data);
        this.internalBus.fireResponce(id, res);
      }
    );
  }

  protected send(event: string, channel: string, ...data: unknown[]): void {
    this.internalBus.send(event, channel, data);
  }
  protected broadcast(event: string, ...data: unknown[]): void {
    this.internalBus.broadcastSend(event, data);
  }
  /**
   * @description  This is called before start of the node
   * Should be used to initialize all async stuff
   * in the plugin (e.g. connection to the database)
   * If you do not need any logic here, just leave this method empty
   */
  abstract init(): Promise<void>;

  /**
   * @description This is called after all plugins were initiated
   * Should be used to initialize everething related to other plugins
   */
  abstract beforeStartup(): Promise<void>;

  /**
   * @description This is called after all plugins beforeStartup hook
   * haz been called. Just start ur proccesses, everething should be ready.
   */
  abstract start(): Promise<void>;
}
