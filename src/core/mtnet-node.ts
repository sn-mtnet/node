import { MTNetLogger } from "./logger";
import { MTNetPluginManager } from "./plugin-manager";
import { MTNetRouter } from "./router";

export class MTNetNode {
  private readonly logger: MTNetLogger;
  private readonly router: MTNetRouter;
  private readonly pluginManager: MTNetPluginManager;

  constructor() {
    this.logger = new MTNetLogger();
    this.router = new MTNetRouter(this);
    this.pluginManager = new MTNetPluginManager(this);
  }

  async init(): Promise<void> {
    await this.pluginManager.init();
    await this.pluginManager.beforeStartup();
  }

  async start(): Promise<void> {
    await this.pluginManager.start();
  }

  getPluginManager(): MTNetPluginManager {
    return this.pluginManager;
  }

  getLogger(): MTNetLogger {
    return this.logger;
  }

  getRouter(): MTNetRouter {
    return this.router;
  }
}
