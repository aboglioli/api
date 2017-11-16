import { IID, ICode, ITemplateId } from './interfaces';
import { ImageComponentBuilder, ComponentBuilder } from '../builder/ComponentBuilder';
export class Body {
    public components: Component[] = [];

    addComponent (comp) {
        this.components.push(comp);
    }

    component () {
        return this.components;
    }
}


export class Component {
    private _id: IID;
    private _code: ICode;
    private templateId: ITemplateId[] = [];
    private _text: String;

    builderFactory() {
        return new ComponentBuilder();
    }

    teplatesId() {
        return this.templateId;
    }

    addTemplateId (root) {
        this.templateId.push({ root });
    }

    Id(id = null) {
        if (id) { this._id = id; return this; } else { return this._id; }
    }

    code(code = null) {
        if (code) { this._code = code; return this; } else { return this._code; }
    }

    text (text = null) {
        if (text) { this._text = text; return this; } else { return this._text; }
    }
}


// <text>
//     <renderMultiMedia referencedObject='FIRMA'/>
// </text>

export class ImageComponent extends Component {
    private mimeType: String;
    private file64: String;
    public identifier: String = 'Adjunto';

    file (value = null) {
        // this.text('<renderMultiMedia referencedObject=\'' + this.identifier + '\'/>');
        if (value) {
            this.file64 = value;
            return this;
        } else {
            return this.file64;
        }
    }

    type (value = null) {
        if (value) {
            this.mimeType = value;
            return this;
        } else {
            return this.mimeType;
        }
    }

    builderFactory() {
        return new ImageComponentBuilder();
    }
}


// <value representation="B64" mediaType="image/jpeg">
//     Bgd3fsET4g...
// </value>