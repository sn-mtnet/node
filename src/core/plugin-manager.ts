import { MTNetNode } from "..";
import { MTNetPluginBase } from "./plugin-base";

export enum AppStatus {
  NONE,
  INIT,
  BEFORE_START,
  STARTED,
}

export class MTNetPluginManager {
  private plugins: MTNetPluginBase[] = [];
  private currentStatus = AppStatus.NONE;
  constructor(private readonly mtnetNode: MTNetNode) {}

  addPlugin(plugin: MTNetPluginBase): void | Promise<void> {
    this.plugins.push(plugin);
    plugin.__setup(this.mtnetNode.getLogger(), this.mtnetNode.getRouter());
    switch (this.currentStatus) {
      case AppStatus.STARTED:
        return new Promise(async (resolve) => {
          await plugin.init();
          await plugin.beforeStartup();
          await plugin.start();
          resolve();
        });
      case AppStatus.BEFORE_START:
        return new Promise(async (resolve) => {
          await plugin.init();
          await plugin.beforeStartup();
          resolve();
        });
      case AppStatus.INIT:
        return new Promise(async (resolve) => {
          await plugin.init();
          resolve();
        });
    }
  }

  addPlugins(plugins: MTNetPluginBase[]): void {
    plugins.forEach((plugin) => {
      this.addPlugin(plugin);
    });
  }

  async init(): Promise<void> {
    this.mtnetNode.getLogger().log("\n\n------- INIT ----------------");
    await Promise.all(this.plugins.map((plugin) => plugin.init()));
    this.currentStatus = AppStatus.INIT;
  }

  async beforeStartup(): Promise<void> {
    this.mtnetNode.getLogger().log("\n\n------- BEFORE START --------");
    await Promise.all(this.plugins.map((plugin) => plugin.beforeStartup()));
    this.currentStatus = AppStatus.BEFORE_START;
  }

  async start(): Promise<void> {
    this.mtnetNode.getLogger().log("\n\n------- STARTING ------------");
    await Promise.all(this.plugins.map((plugin) => plugin.start()));
    this.currentStatus = AppStatus.STARTED;
  }

  getPluginsForGroups(groups: string[]): MTNetPluginBase[] {
    return this.plugins.filter((plugin) => plugin.isInGroups(groups));
  }
}
