import { MTNetInternalBus } from "./internal-bus";
import { MTNetLogger } from "./logger";
import { MTNetPluginManager } from "./plugin-manager";

export class MTNetNode {
  private readonly internalBus: MTNetInternalBus;
  private readonly logger: MTNetLogger;

  public readonly pluginManager: MTNetPluginManager;

  constructor() {
    this.logger = new MTNetLogger();
    this.internalBus = new MTNetInternalBus(this.logger);
    this.pluginManager = new MTNetPluginManager(this.internalBus);
  }

  async init(): Promise<void> {
    await this.pluginManager.init();
    await this.pluginManager.beforeStartup();
  }

  async start(): Promise<void> {
    await this.pluginManager.start();
  }
}
