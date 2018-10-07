import {registerAFrameComponent} from "./AFrame";
import {LabelComponent} from "./LabelComponent";
import {IdentityComponent} from "./IdentityComponent";
import {DataspaceComponent} from "./DataspaceComponent";

registerAFrameComponent(() => new DataspaceComponent());
registerAFrameComponent(() => new IdentityComponent());
registerAFrameComponent(() => new LabelComponent());



