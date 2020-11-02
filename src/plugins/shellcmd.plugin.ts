import { createInterface, Interface as ReadlineInterface } from "readline";
import { MTNetPluginBase } from "..";

export interface ShellCMDCommandFlag {
  name: string;
  desctiption: string;
  type?: string;
  required?: boolean;
}

export interface ShellCMDCommand {
  cmd: string;
  flags: ShellCMDCommandFlag[];
  description: string;
  handler: (
    plugin: ShellCMDPlugin,
    flags: Record<string, string>
  ) => void | Promise<void>;
}

export class ShellCMDPlugin extends MTNetPluginBase {
  private rl: ReadlineInterface;
  constructor(private readonly commands: ShellCMDCommand[]) {
    super();
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async init(): Promise<void> {
    this.logger.log("ShellCMDPlugin inited");
  }

  async beforeStartup(): Promise<void> {
    this.logger.log("ShellCMDPlugin prepared");
  }

  async start(): Promise<void> {
    console.log("ShellCMDPlugin started");
    this.rl.on("line", (command) => {
      this.parseCommand(command);
    });
  }

  parseCommand(command: string): void {
    if (command === "help") {
      this.printHelpMenu();
      return;
    }
    const [exec, ...flags] = command.split(" ");
    const parsedFlags = flags.reduce((res, cur) => {
      const [key, value] = cur.split("=");
      res[key] = value;
      return res;
    }, {});

    const cmd = this.commands.find((cmd) => cmd.cmd === exec);
    if (!cmd) {
      console.log("No such command");
      return;
    }

    cmd.handler(this, parsedFlags);
  }

  printHelpMenu(): void {
    let help = "Help:\n";

    this.commands.forEach((command) => {
      help += `COMMAND: ${command.cmd}\n   FLAGS:\n`;
      command.flags.forEach((flag) => {
        help += `     * ${flag.name} {${flag.type ? flag.type : "string"}} - ${
          flag.desctiption
        } [${flag.required ? "REQUIRED" : "NOT REQUIRED"}]\n`;
      });
      help += `   DESCRIPTION: ${command.description}\n`;
    });

    console.log(help);
  }
}
