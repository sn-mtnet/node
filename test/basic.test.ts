import { exec } from "child_process";
import { group } from "console";
import { before } from "lodash";
import { start } from "repl";
import { MTNetNode, MTNetPluginBase } from "../src/index";

class StartPlugin extends MTNetPluginBase {
  public startMethod = false;
  public initMethod = false;
  public beforeStartupMethod = false;
  async init(): Promise<void> {
    this.initMethod = true;
    this.addGroup("start");
    this.on("get-string", () => {
      return "hello";
    });
  }

  async beforeStartup(): Promise<void> {
    this.beforeStartupMethod = true;
  }
  async start(): Promise<void> {
    this.startMethod = true;
  }
}

class OnTheFlyPlugin extends MTNetPluginBase {
  private secret: string;
  constructor(private readonly name: string) {
    super();
  }

  async init() {
    this.addGroup(name);
  }

  async beforeStartup() {
    if (this.name == 'fly') {
    }
  }
}

describe("Base test", () => {
  let node: MTNetNode;
  let startPlugin: StartPlugin;
  let onTheFly1;
  let onTheFly2;

  describe("Initialization", () => {
    it("should instantiate", () => {
      node = new MTNetNode();
      expect(node).toBeDefined();
    });

    it("should add plugins", () => {
      startPlugin = new StartPlugin();
      node.getPluginManager().addPlugin(startPlugin);
    });
  });

  describe("Start", () => {
    it("should start and call all methods", async () => {
      await node.init();
      expect(startPlugin.initMethod).toBe(true);
      expect(startPlugin.beforeStartupMethod).toBe(true);
      await node.start();
      expect(startPlugin.startMethod).toBe(true);
    });
  });

  describe("Adding plugins on the fly", () => {
    onTheFly1 = ...;
  });
});
