import { MTNetLogger } from "./logger";
import { Callprop, MTNetRouter } from "./router";
import { v4 as uuid } from "uuid";

export interface OnSettings {
  executionOrder?: number;
  id?: string;
}
export abstract class MTNetPluginBase {
  private groups: Set<string> = new Set();
  protected router: MTNetRouter;
  protected logger: MTNetLogger;

  private registeredCallbacks: Record<
    string,
    {
      id: string;
      executionOrder: number;
      handler: (...args: unknown[]) => unknown;
    }[]
  > = {};

  __setup(logger: MTNetLogger, router: MTNetRouter): void {
    this.logger = logger;
    this.router = router;
  }

  addGroup(group: string): void {
    this.groups.add(group);
  }

  removeGroup(group: string): void {
    this.groups.delete(group);
  }

  isInGroups(groups: string[]): boolean {
    for (const group of groups) {
      if (!this.groups.has(group)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Subscribes to the event.
   *
   * @param callprop - event to subscribe on
   * @param handler - handler fot the event
   * @returns id - subscription id, which is needed to unsubscribe from the event
   */
  on(
    event: string,
    handler: (...args: unknown[]) => unknown,
    settings: OnSettings = {}
  ): string {
    const callbackId = uuid();
    if (!this.registeredCallbacks[event]) {
      this.registeredCallbacks[event] = [];
    }
    this.registeredCallbacks[event].push({
      id: callbackId,
      handler,
      executionOrder: settings?.executionOrder ?? 0,
    });
    return callbackId;
  }

  /**
   * Subscribes to the event only once, after first call this subscription will be dropped automatically
   *
   * @param callprop - event to subscribe on
   * @param handler - handler for the event
   */
  once(
    event: string,
    handler: (...args: unknown[]) => unknown,
    settings: OnSettings = {}
  ): void {
    const id = uuid();
    this.on(
      event,
      async (...args: unknown[]) => {
        const res = await handler(...args);
        setImmediate(() => {
          this.off(id);
        });
        return res;
      },
      { ...settings, id }
    );
  }

  /**
   *  Unsubscribes from the handler
   *
   * @param id - id of the handler
   */
  off(id: string): void {
    const events = Object.keys(this.registeredCallbacks);
    for (let i = 0; i < events.length; i++) {
      const handlers = this.registeredCallbacks[events[i]];
      const neededEventIndex = handlers.findIndex(
        (handler) => handler.id === id
      );
      if (neededEventIndex === -1) continue;
      this.registeredCallbacks[events[i]].splice(neededEventIndex, 1);
    }
  }

  /**
   * Just sends the message. Will NOT await its completion
   *
   * @param callprop - event to fire
   * @param data - any args to pass to the event
   */
  send(callprop: Callprop, ...data: unknown[]): void {
    this.router.getTargetFor(callprop).receive(callprop, data);
  }

  /**
   * Fires the event and awaits its returned result
   *
   * @param callprop - event to fire
   * @param data - any args to pass to the event
   * @returns - the result of the execution
   */
  async call<T>(
    callprop: Callprop,
    ...data: unknown[]
  ): Promise<T | (T | T[])[]> {
    return await this.router
      .getTargetFor(callprop)
      .receiveCall<T>(callprop, data);
  }

  receive(event: string, data: unknown[]): void {
    if (!this.registeredCallbacks[event]) {
      throw new Error(`Event ${event} is not registered on this plugin`);
    }

    this.registeredCallbacks[event].forEach((eventData) =>
      eventData.handler(...data)
    );
  }

  async receiveCall<T>(event: string, data: unknown[]): Promise<T[]> {
    if (!this.registeredCallbacks[event]) {
      throw new Error(`Event ${event} is not registered on this plugin`);
    }

    const res = await Promise.all(
      this.registeredCallbacks[event].map((eventHandler) => {
        return eventHandler.handler(...data);
      })
    );
    return res as T[];
  }

  // ------------ PUBLIC API --------------
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
