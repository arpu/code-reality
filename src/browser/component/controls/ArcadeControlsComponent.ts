import {AbstractComponent} from "../../AFrame";
import {Raycaster, Vector3, Plane, Object3D} from "three";
import {CollidableCrawler} from "./CollideableCrawler";
import {EntityStateEventDetail} from "../../model/EntityStateEventDetail";
import {Events} from "../../model/Events";

export class ArcadeControlsComponent extends AbstractComponent {

    movementSpeed: number = 0;
    height: number = 0;
    width: number = 0;
    jumpStartSpeed: number = 0;
    forwardKey: string = '';
    backwardKey: string = '';
    leftKey: string = '';
    rightKey: string = '';
    jumpKey: string = '';

    collediableCrawler: CollidableCrawler | undefined;
    raycaster: Raycaster | undefined;
    yAxisPositive: Vector3 = new Vector3(0, 1, 0);
    yAxisNegative: Vector3 = new Vector3(0, -1, 0);
    xzPlane: Plane = new Plane(this.yAxisPositive);

    jumping: boolean = false;
    airborne: boolean = false;

    time: number = 0;
    yVelocity: number = 0;
    pressed: Map<string, number> = new Map();

    centerOfMassPosition: Vector3 = new Vector3(0, 0, 0);
    cameraDirection: Vector3 = new Vector3(0, 0, 0);
    xzDirection: Vector3 = new Vector3(0, 0, 0);
    xzDeltaDirection: Vector3 = new Vector3(0, 0, 0);
    xzDeltaOppositeDirection: Vector3 = new Vector3(0, 0, 0);

    constructor() {
        super(
            "arcade-controls",
            {
                movementSpeed: {type: 'number', default: 2},
                height: {type: 'number', default: 2},
                width: {type: 'number', default: 0.5},
                jumpStartSpeed: {type: 'number', default: 5.0},
                forwardKey: {type: 'string', default: 'w'},
                backwardKey: {type: 'string', default: 's'},
                leftKey: {type: 'string', default: 'a'},
                rightKey: {type: 'string', default: 'd'},
                jumpKey: {type: 'string', default: ' '}
            }
            , false
        );
    }

    init(): void {
        console.log(this.name + " init");

        // Configuration
        this.movementSpeed = this.data.movementSpeed;
        this.height = this.data.height;
        this.width = this.data.width;
        this.jumpStartSpeed = this.data.jumpStartSpeed;

        this.forwardKey = this.data.forwardKey;
        this.backwardKey = this.data.backwardKey;
        this.leftKey = this.data.leftKey;
        this.rightKey = this.data.rightKey;
        this.jumpKey = this.data.jumpKey;

        // Utility objects
        this.collediableCrawler = new CollidableCrawler(this.entity!!.object3D, this.entity!!.sceneEl!!.object3D);
        this.raycaster = new Raycaster();

        // Constants
        this.yAxisPositive = new Vector3(0, 1, 0);
        this.yAxisNegative = new Vector3(0, -1, 0);
        this.xzPlane = new Plane(this.yAxisPositive);

        // State booleans
        this.jumping = false;
        this.airborne = false;

        // State variables
        this.time = 0;
        this.yVelocity = 0;
//        this.pressed = new Map(); // Pressed keys

        // Reused vector variables.
        this.centerOfMassPosition = new Vector3(0, 0, 0); // Center of mass for collision checks
        this.centerOfMassPosition.x = this.entity!!.object3D.position.x;
        this.centerOfMassPosition.y = this.entity!!.object3D.position.y + this.height / 2;
        this.centerOfMassPosition.z = this.entity!!.object3D.position.z;

        this.cameraDirection = new Vector3(0, 0, 0);
        this.xzDirection = new Vector3(0, 0, 0);
        this.xzDeltaDirection = new Vector3(0, 0, 0);
        this.xzDeltaOppositeDirection = new Vector3(0, 0, 0);

        window.addEventListener('keydown', (e) => {
            this.onKeyDown(e.key);

        });

        window.addEventListener('keyup', (e) => {
            this.onKeyUp(e.key);
        });
    }

    setJumping(state: boolean) {
        if (this.jumping !== state) {
            this.jumping = state;
            this.entityStateChange("jumping", this.jumping);
        }
    }

    setAirborne(state: boolean) {
        if (this.airborne !== state) {
            this.airborne = state;
            this.entityStateChange("airborne", this.airborne);
        }
    }

    entityStateChange(state: string, enabled: boolean) {
        if (enabled) {
            this.entity!!.dispatchEvent(new CustomEvent(Events.ENTITY_STATE_BEGIN, { detail: new EntityStateEventDetail(state) }));
        } else {
            this.entity!!.dispatchEvent(new CustomEvent(Events.ENTITY_STATE_END, { detail: new EntityStateEventDetail(state) }));
        }
        console.log(state + ":" + enabled);
    }

    update(data: any, oldData: any): void {
        console.log(this.name + " update");
    }

    remove(): void {
        console.log(this.name + " remove");
    }

    pause(): void {
        console.log(this.name + " pause");
    }

    play(): void {
        console.log(this.name + " play");
    }

    tick(time: number, timeDelta: number): void {
        this.collediableCrawler!!.crawl();

        this.time = time;

        let collidables = this.collediableCrawler!!.collideables();
        this.updateXZ(timeDelta, collidables);
        this.updateY(timeDelta, collidables);
    }

    onKeyDown(key: string) {
        if (!this.pressed.has(key)) {
            if (key == this.backwardKey) {
                this.entityStateChange("backward", true);
            }
            if (key == this.forwardKey) {
                this.entityStateChange("forward", true);
            }
            if (key == this.leftKey) {
                this.entityStateChange("left", true);
            }
            if (key == this.rightKey) {
                this.entityStateChange("right", true);
            }
        }
        this.pressed.set(key, this.time);
    }

    onKeyUp(key: string) {
        if (this.pressed.has(key)) {
            if (key == this.backwardKey) {
                this.entityStateChange("backward", false);
            }
            if (key == this.forwardKey) {
                this.entityStateChange("forward", false);
            }
            if (key == this.leftKey) {
                this.entityStateChange("left", false);
            }
            if (key == this.rightKey) {
                this.entityStateChange("right", false);
            }
            this.pressed.delete(key)
        }
    }

    /*onTick(time: number, timeDelta: number) {
        this.collediableCrawler!!.crawl();

        this.time = time;

        let collidables = this.collediableCrawler!!.collideables();
        this.updateXZ(timeDelta, collidables);
        this.updateY(timeDelta, collidables);
    }*/

    updateXZ(timeDelta: number, collidables: Array<Object3D>) {
        let position = this.entity!!.object3D.position;

        let forward = this.pressed.has(this.forwardKey);
        let backward = this.pressed.has(this.backwardKey);
        let left = this.pressed.has(this.leftKey);
        let right = this.pressed.has(this.rightKey);
        if (forward || backward || left || right) {
            let delta = this.movementSpeed * timeDelta / 1000.0;
            this.computeXZDirectionFromCamera();
            this.centerOfMassPosition.x = this.entity!!.object3D.position.x;
            this.centerOfMassPosition.z = this.entity!!.object3D.position.z;
            this.xzDeltaDirection.copy(this.xzDirection);
            this.xzDeltaOppositeDirection.copy(this.xzDirection);
            this.xzDeltaOppositeDirection.multiplyScalar(-1);
            if (forward) {
                if (!this.testCollision(this.xzDeltaDirection, collidables)) {
                    position.x += this.xzDeltaDirection.x * delta;
                    position.z += this.xzDeltaDirection.z * delta;
                }
            }
            if (backward) {
                if (!this.testCollision(this.xzDeltaOppositeDirection, collidables)) {
                    position.x += this.xzDeltaOppositeDirection.x * delta;
                    position.z += this.xzDeltaOppositeDirection.z * delta;
                }
            }
            if (left || right) {
                this.xzDeltaDirection.cross(this.yAxisPositive);
                this.xzDeltaOppositeDirection.cross(this.yAxisPositive);
                if (right) {
                    if (!this.testCollision(this.xzDeltaDirection, collidables)) {
                        position.x += this.xzDeltaDirection.x * delta;
                        position.z += this.xzDeltaDirection.z * delta;
                    }
                }
                if (left) {
                    if (!this.testCollision(this.xzDeltaOppositeDirection, collidables)) {
                        position.x += this.xzDeltaOppositeDirection.x * delta;
                        position.z += this.xzDeltaOppositeDirection.z * delta;
                    }
                }
            }
        }
    }

    updateY(timeDelta: number, collidables: Array<Object3D>) {
        let position = this.entity!!.object3D.position;

        var distanceToNearestBelow = this.findDistanceToNearest(this.yAxisNegative, collidables);

        if (this.pressed.has(this.jumpKey) && !this.jumping && !this.airborne) {
            this.setJumping(true);
            this.yVelocity = this.jumpStartSpeed
        }

        let freeDropDelta = this.yVelocity * timeDelta / 1000.0;
        let delta;

        if (distanceToNearestBelow && !this.jumping) {
            let distanceFromBottom = distanceToNearestBelow - this.height / 2;
            if (Math.abs(freeDropDelta) > Math.abs(distanceFromBottom) || Math.abs(distanceFromBottom) < 0.1) {
                delta = -distanceFromBottom;
                this.setAirborne(false);
            } else {
                if (distanceFromBottom && distanceFromBottom < 0) {
                    delta = -freeDropDelta;
                } else {
                    delta = freeDropDelta;
                }
                this.setAirborne(true);
            }
        } else {
            delta = freeDropDelta;
            this.setAirborne(true);
        }

        if (this.airborne) {
            this.yVelocity -= 9.81 * timeDelta / 1000.0;
        } else {
            this.yVelocity = 0;
        }

        if (this.yVelocity < 0) {
            this.setJumping(false);
        }

        this.centerOfMassPosition.y = this.centerOfMassPosition.y + delta;

        position.y = this.centerOfMassPosition.y - this.height/2;
    }

    computeXZDirectionFromCamera() {
        document.querySelector('[camera]').object3D.getWorldDirection(this.cameraDirection);
        this.cameraDirection.multiplyScalar(-1);
        this.xzPlane.projectPoint(this.cameraDirection, this.xzDirection);
        this.xzDirection.normalize();
    }

    findDistanceToNearest(rayDirection: Vector3, objects: Array<Object3D>) {
        this.raycaster!!.near = 0;
        this.raycaster!!.far = this.height;
        this.raycaster!!.set(this.centerOfMassPosition, rayDirection);
        var intersects = this.raycaster!!.intersectObjects(objects);
        if (intersects.length > 0) {
            return intersects[0].distance;
        } else {
            return null;
        }
    }

    testCollision(direction: Vector3, objects: Array<Object3D>) {
        let distanceToNearestAhead = this.findDistanceToNearest(direction, objects);
        let collisionAhead = distanceToNearestAhead && distanceToNearestAhead < this.width / 2;
        return collisionAhead;
    }
}


