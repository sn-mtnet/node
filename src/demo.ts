import { MTNetNode } from "./index";
import { MeshPlugin } from "./plugins/mesh.plugin";
import { ShellCMDPlugin } from "./plugins/shellcmd.plugin";

async function bootstrap() {
  const mtnetnode = new MTNetNode();

  const meshPlugin = new MeshPlugin({
    host: "0.0.0.0",
    port: 9898,
    secret: "none",
    connectTo: [],
  });

  const shellCommands = [];
  const manager = mtnetnode.getPluginManager();
  manager.addPlugins([new ShellCMDPlugin(shellCommands), meshPlugin]);

  await mtnetnode.init();
  await mtnetnode.start();
}

bootstrap().catch((err) => console.error(err));
