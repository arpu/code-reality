import {Entity, Scene} from "AFrame";
import {Actuator} from "./Actuator";
import {StateSystemController} from "../state/StateSystemController";
import {getSystemController} from "../../AFrame";

export class DynamicSpace {

    scene: Scene;
    avatarId: string;
    avatarIndex: number = -1;
    actuatorsMap: Map<string, Map<number, Actuator>> = new Map<string, Map<number, Actuator>>();

    constructor(scene: Scene, avatarId: string) {
        this.avatarId = avatarId;
        this.scene = scene;
    }

    connected(serverUrl: string) {
        this.actuatorsMap.set(serverUrl, new Map<number, Actuator>());
    }

    disconnected(serverUrl: string) {
        if (!this.actuatorsMap.has(serverUrl)) {
            return;
        }
        this.actuatorsMap.get(serverUrl)!!.forEach((value: Actuator, key: number) => {
            value.removed();
        });
        this.actuatorsMap.delete(serverUrl);
    }

    added(serverUrl: string, index: number, id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string) : void {
        if (id === this.avatarId) {
            this.avatarIndex = index;
            console.log("dataspace - observed own avatar add:" + y);
            return;
        }
        const actuators = this.actuatorsMap.get(serverUrl);
        if (!actuators) { return; }
        const actuator = new Actuator(this.scene, serverUrl, id, description);
        actuators!!.set(index, actuator);
        actuator.added(x, y, z, rx, ry, rz, rw);
    }

    updated(serverUrl: string, index: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) : void {
        if (index === this.avatarIndex) {
            //console.log("dataspace - observed own avatar update.");
            return;
        }
        const actuators = this.actuatorsMap.get(serverUrl);
        if (!actuators) { return; }
        const actuator = actuators.get(index);
        if (!actuator) { return; }
        actuator!!.updated(x, y, z, rx, ry, rz, rw)
    }

    removed(serverUrl: string, index: number, id: string) : void {
        if (index == this.avatarIndex) {
            console.log("dataspace - observed own avatar remove.")
            return;
        }
        const actuators = this.actuatorsMap.get(serverUrl);
        if (!actuators) { return; }
        const actuator = actuators.get(index);
        if (!actuator) { return; }
        actuator!!.removed();
        (getSystemController(this.scene, "state-system") as StateSystemController).removeStates(actuator.entity);
    }

    described(serverUrl: string, index: number, description: string) : void {
        if (index == this.avatarIndex) {
            return;
        }
        const actuators = this.actuatorsMap.get(serverUrl);
        if (!actuators) { return; }
        const actuator = actuators.get(index);
        if (!actuator) { return; }
        actuator!!.described(description);
    }

    acted(serverUrl: string, index: number, action: string, description: string) : void {
        if (index == this.avatarIndex) {
            return;
        }
        const actuators = this.actuatorsMap.get(serverUrl);
        if (!actuators) { return; }
        const actuator = actuators.get(index);
        if (!actuator) { return; }
        actuator!!.acted(action, description);
    }

    simulate(t: number) {
        this.actuatorsMap.forEach(((actuators) => {
           actuators.forEach((actuator => {
               actuator.simulate(t);
           }))
        }));
    }

}