import { MTNetPluginBase } from "../core/plugin-base";

export class DemoPlugin extends MTNetPluginBase {
  async init(): Promise<void> {
    // throw new Error("Method not implemented.");
  }
  async beforeStartup(): Promise<void> {
    this.subscribeToChannel("test-channel");

    this.onChannel("test", "test-channel", (abs: string) => {
      console.log(abs);
    });
    this.onChannel("test", "not-regged-channel", (abs: string) => {
      console.log("This wont be logged", abs);
    });
    this.onBroadcast("test", (abs: string, abs2: string) => {
      console.log(abs, abs2);
    });
    this.onChannelReturn("test-return", "test-channel", (abs: string) => {
      return "Hello, " + abs;
    });
  }
  async start(): Promise<void> {
    this.send("test", "test-channel", "world");
    this.send("test", "not-regged-channel", "world");
  }
}
