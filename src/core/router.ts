import { MTNetNode } from "..";
import { MeshPlugin } from "../plugins/mesh.plugin";

export type Callprop = string;

export enum TargetType {
  LOCAL,
  REMOTE,
}

export function parseCallprop(
  callprop: string
): { target: TargetType; groups: string[]; event: string } {
  const match = /^(@|#):(.*):(.*)$/.exec(callprop);
  const targetChar = match[1];
  const groupsString = match[2];
  const event = match[3];

  let target;
  switch (targetChar) {
    case "#":
      target = TargetType.LOCAL;
      break;
    case "@":
      target = TargetType.REMOTE;
      break;
    default:
      throw new Error(
        `No ${targetChar} target available. Target can be "#" or "@" only.`
      );
  }

  const groups = groupsString.split(" ");

  return {
    target,
    groups,
    event,
  };
}

export interface ExecTarget {
  receive(callprop: Callprop, data: unknown[]): void;
  receiveCall<T>(callprop: Callprop, data: unknown[]): Promise<T | (T | T[])[]>;
}

export class LocalTarget implements ExecTarget {
  constructor(private readonly mtnetNode: MTNetNode) {}

  receive(callprop: string, data: unknown[]): void {
    const { groups, event } = parseCallprop(callprop);
    const plugins = this.mtnetNode
      .getPluginManager()
      .getPluginsForGroups(groups);
    plugins.forEach((plugin) => plugin.receive(event, data));
  }

  async receiveCall<T>(
    callprop: string,
    data: unknown[]
  ): Promise<T | (T | T[])[]> {
    const { groups, event } = parseCallprop(callprop);
    const plugins = this.mtnetNode
      .getPluginManager()
      .getPluginsForGroups(groups);

    const results = await Promise.all(
      plugins.map((plugin) => plugin.receiveCall<T>(event, data))
    );
    if (results.length === 1) {
      return results[0].length === 1 ? results[0][0] : results[0];
    }
    return results;
  }
}

export class RemoteTarget implements ExecTarget {
  constructor(
    private readonly mtnetNode: MTNetNode,
    private readonly meshPlugin: MeshPlugin
  ) {}

  receive(callprop: string, data: unknown[]): void {
    const { groups, event } = parseCallprop(callprop);
    this.meshPlugin._message(groups, event, data);
  }

  async receiveCall<T>(
    callprop: string,
    data: unknown[]
  ): Promise<T | (T | T[])[]> {
    const { groups, event } = parseCallprop(callprop);
    const res = await this.meshPlugin._call<T>(groups, event, data);
    return res;
  }
}

export class MTNetRouter {
  private meshPlugin: MeshPlugin;
  constructor(private readonly mtnetNode: MTNetNode) {}

  getTargetFor(callprop: Callprop): ExecTarget {
    const parsed = parseCallprop(callprop);
    switch (parsed.target) {
      case TargetType.LOCAL:
        return new LocalTarget(this.mtnetNode);
      case TargetType.REMOTE:
        return new RemoteTarget(this.mtnetNode, this.meshPlugin);
    }
  }

  setupMeshPlugin(meshPlugin: MeshPlugin): void {
    this.meshPlugin = meshPlugin;
  }

  getMeshPlugin(): MeshPlugin {
    return this.meshPlugin;
  }
}
