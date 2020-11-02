import { MTNetNode } from "./index";
import { DemoPlugin } from "./plugins/demo-plugin";

async function bootstrap() {
  const tiiNode = new MTNetNode();

  tiiNode.pluginManager.addPlugin(new DemoPlugin());
  await tiiNode.init();
  await tiiNode.start();
}

bootstrap().catch((err) => console.error(err));
