import { MTNetInternalBus } from "./internal-bus";
import { MTNetPluginBase } from "./plugin-base";

export class MTNetPluginManager {
  private plugins: MTNetPluginBase[] = [];
  constructor(private readonly internalBus: MTNetInternalBus) {}

  addPlugin(plugin: MTNetPluginBase): void {
    // @todo add check if plugin already there
    this.plugins.push(plugin);
    plugin.setupInternalBus(this.internalBus);
  }

  addPlugins(plugins: MTNetPluginBase[]): void {
    plugins.forEach(this.addPlugin);
  }

  async init(): Promise<void> {
    await Promise.all(this.plugins.map((plugin) => plugin.init()));
  }

  async beforeStartup(): Promise<void> {
    await Promise.all(this.plugins.map((plugin) => plugin.beforeStartup()));
  }

  async start(): Promise<void> {
    await Promise.all(this.plugins.map((plugin) => plugin.start()));
  }
}
