import { MTNetPluginBase } from "..";
import IOServer, { Server as IIOServer } from "socket.io";
import IOClient from "socket.io-client";
import { createServer, Server as HttpServer } from "http";
import { v4 as uuid } from "uuid";

export interface MeshConnectionOptions {
  host: string;
  port: number;
  secret: string;
}

export interface MeshPluginConstructorProps {
  host: string;
  port: number;
  secret: string;
  connectTo: MeshConnectionOptions[];
}

export interface MessagePayload {
  groups: string[];
  event: string;
  data: unknown[];
  receivers: string[];
}
export interface CallPayload extends MessagePayload {
  senderId: string;
}

export class MeshPlugin extends MTNetPluginBase {
  private readonly httpServer: HttpServer;
  private readonly io: IIOServer;
  private readonly id: string;
  private readonly clients: SocketIOClient.Socket[] = [];

  constructor(private readonly config: MeshPluginConstructorProps) {
    super();
    this.httpServer = createServer();
    this.id = uuid();
    this.io = new IOServer(this.httpServer, {
      serveClient: false,
      cookie: false,
    });
  }

  async init(): Promise<void> {
    this.router.setupMeshPlugin(this);
    this.io.on("connection", (socket: IOServer.Socket) => {
      socket.on("message", (payload: MessagePayload) => {
        const callprop = `#:${payload.groups.join(" ")}:${payload.event}`;
        this.router.getTargetFor(callprop).receive(callprop, payload.data);
        this.clients
          .filter((client) => !payload.receivers.includes(client.id))
          .forEach((client) => {
            client.emit("message", {
              groups: payload.groups,
              event: payload.event,
              data: payload.data,
              receivers: [...payload.receivers],
            });
          });
      });
      socket.on("call", (payload: CallPayload) => {
        // @todo process payload
      });
      // skip for now
    });
    this.config.connectTo.forEach((connectTo) => {
      const client = IOClient({
        host: connectTo.host,
        port: connectTo.port + "",
      });
      this.clients.push(client);
    });
    this.logger.log("MeshPlugin initiated");
  }

  async beforeStartup(): Promise<void> {
    this.logger.log("MeshPlugin prepared");
  }

  async start(): Promise<void> {
    this.httpServer.listen(this.config.port, this.config.host, () => {
      this.logger.log("MeshPlugin started");
    });
  }

  _message(groups: string[], event: string, data: unknown[]): void {
    const payload: MessagePayload = {
      groups,
      event,
      data,
      receivers: [this.id],
    };
    this.clients.forEach((client) => client.emit("message", payload));
  }

  async _call<T>(
    groups: string[],
    event: string,
    data: unknown[]
  ): Promise<T | (T | T[])[]> {
    this.clients.forEach((client) => {
      const payload: CallPayload = {
        groups,
        event,
        data,
        receivers: [this.id],
        senderId: client.id,
      };
      client.emit("call", payload);
    });
    return [];
  }
}
