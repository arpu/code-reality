import {AbstractComponent} from "./AFrame";
import {ClusterClient, Decode, Encode} from "@tlaukkan/aframe-dataspace";
import uuid = require("uuid");
import {Space} from "./Space";
import {Object3D} from "three";
import {Entity} from "aframe";

export class DataspaceComponent extends AbstractComponent {

    private avatarId = uuid.v4();
    private playerElement: Entity | null = null;
    private playerObject: Object3D | undefined = undefined;
    private client: ClusterClient | undefined = undefined;
    private url: string | undefined = undefined;
    private space: Space | undefined = undefined;
    private lastRefresh: number = 0;
    private idToken: string | undefined;

    constructor() {
        super(
            "dataspace",
            {type: 'string', default: '?'},
            false
        );
    }

    init(): void {
        console.log(this.name + " init: " + JSON.stringify(this.data));
        this.playerElement = document.getElementById("player") as Entity;
        if (!this.playerElement) {
            console.log("dataspace - did not find player element in dom.");
        }

        this.space = new Space(this.entity!!, this.avatarId);
        this.url = this.data;

        fetch('/api/users/current/id-token')
            .then((response) => {
                response.text().then((data) => {
                    console.log(data);
                    this.idToken = data;
                });
            }).catch((err) => {
            console.error(err);
        });
    }

    update(data: any, oldData: any): void {
        console.log(this.name + " update");
    }

    remove(): void {
        console.log(this.name + " remove");
    }

    pause(): void {
        console.log(this.name + " pause");
        if (this.client) {
            this.client.close();
        }
    }

    play(): void {
        console.log(this.name + " play");
        if (this.playerElement && !this.playerObject) {
            this.playerObject = this.playerElement!!.object3D;
            if (!this.playerObject) {
                console.log("No player object.");
            }
        }

        if (this.url && this.playerObject) {

            this.client = new ClusterClient(this.url!!, this.avatarId, this.playerObject.position.x, this.playerObject.position.y, this.playerObject.position.z,
                this.playerObject.quaternion.x, this.playerObject.quaternion.y, this.playerObject.quaternion.z, this.playerObject.quaternion.w, "<a-sphere></a-sphere>");
            this.client.onReceive = (serverUrl: string, type: string, message: string[]) => {
                //console.log(message);
                if (type === Encode.ADDED) {
                    const m = Decode.added(message);
                    this.space!!.added(serverUrl, m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9]);
                }
                if (type === Encode.UPDATED) {
                    const m = Decode.updated(message);
                    this.space!!.updated(serverUrl, m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7]);
                }
                if (type === Encode.REMOVED) {
                    const m = Decode.removed(message);
                    this.space!!.removed(serverUrl, m[0], m[1]);
                }
                if (type === Encode.DESCRIBED) {
                    const m = Decode.described(message);
                    this.space!!.described(serverUrl, m[0], m[1]);
                }
                if (type === Encode.ACTED) {
                    const m = Decode.acted(message);
                    this.space!!.acted(serverUrl, m[0], m[1]);
                }
            };
            this.client.onConnect = (serverUrl: string) => {
                console.log("dataspace - connected: " + serverUrl);
                this.space!!.connected(serverUrl);
            };
            this.client.onDisconnect = (serverUrl: string) => {
                console.log("dataspace - disconnected: " + serverUrl)
                this.space!!.disconnected(serverUrl);

            };
            this.client.connect().catch(error => {
                console.warn("dataspace - cluster client connect error.", error);
                this.client = undefined;
            });
        }
    }

    tick(time: number, timeDelta: number): void {
        if (this.client) {
            this.space!!.simulate(timeDelta / 1000);
            if (time - this.lastRefresh > 200) {
                if (this.playerObject) {
                    if (this.client.clusterConfiguration) {
                        this.client!!.refresh(this.playerObject.position.x, this.playerObject.position.y, this.playerObject.position.z,
                            this.playerObject.quaternion.x, this.playerObject.quaternion.y, this.playerObject.quaternion.z, this.playerObject.quaternion.w);
                    }
                }
                this.lastRefresh = time;
            }
        }
    }
}


