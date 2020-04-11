import {XmlEntities, AllHtmlEntities} from 'html-entities';

const encoder = new AllHtmlEntities();
const xmlEncoder = new XmlEntities();

export type Entity = {pos: number} & (
    {
        type: typeof SAHtml.ENTITY_TAG_DEF,
        name: string
    } |
    {
        type: typeof SAHtml.ENTITY_TAG_ATTR,
        name: string,
        value?: string
    } |
    {
        type: typeof SAHtml.ENTITY_TAG_DEF_END
    } |
    {
        type: typeof SAHtml.ENTITY_TAG_DEF_AUTOCLOSE_END
    } |
    {
        type: typeof SAHtml.ENTITY_TAG_CLOSE,
        name: string
    } |
    {
        type: typeof SAHtml.ENTITY_STRING,
        value: string
    } |
    {
        type: typeof SAHtml.ENTITY_DOCTYPE,
        value: string
    } |
    {
        type: typeof SAHtml.ENTITY_DOCTYPE,
        value: string
    } |
    {
        type: typeof SAHtml.ENTITY_COMMENT,
        value: string
    } |
    {
        type: typeof SAHtml.ENTITY_CDATA,
        value: string
    } |
    {
        type: typeof SAHtml.ENTITY_EOF
    }
);

export class SAHtml {
    public static STATE_TAG_CONTENT = 1;
    public static STATE_TAG_DEF = 2;
    public static ENTITY_TAG_DEF = 'tagDef' as const;
    public static ENTITY_TAG_ATTR = 'tagAttr' as const;
    public static ENTITY_TAG_DEF_END = 'tagDefEnd' as const;
    public static ENTITY_TAG_DEF_AUTOCLOSE_END = 'tagDefAutoEnd' as const;
    public static ENTITY_TAG_CLOSE = 'tagClose' as const;
    public static ENTITY_STRING = 'string' as const;
    public static ENTITY_DOCTYPE = 'doctype' as const;
    public static ENTITY_COMMENT = 'comment' as const;
    public static ENTITY_CDATA = 'cdata' as const;
    public static ENTITY_EOF = 'eof' as const;

    private str: string;
    private len: number;
    private pos = 0;
    private state = SAHtml.STATE_TAG_CONTENT;
    private currentTag = null as null | string;
    private xhtml = false;
    private autoDetectXHtml = true;

    constructor(str: string) {
        this.str = str || '';
        this.len = this.str.length;
    }

    public isWhitespace(c: string) {
        return c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f';
    }

    public EOF() {
        return {
            type: SAHtml.ENTITY_EOF,
            pos: this.str.length
        };
    }

    public noHtmlContentTags: {[tag: string]: boolean} = {
        script: true,
        textarea: true,
        style: true,
        xmp: true
    };

    public noDecodeTags: {[tag: string]: boolean} = {
        script: true,
        style: true
    };

    public getPos() {
        return this.pos;
    }

    public setPos(pos: number) {
        this.pos = pos;
    }

    public isXHtml() {
        return this.xhtml;
    }

    public setXHtml(xhtml: boolean) {
        this.xhtml = xhtml;
    }

    public getAutoDetectXHtml() {
        return this.autoDetectXHtml;
    }

    public setAutoDetectXHtml(autoDetectXHtml: boolean) {
        this.autoDetectXHtml = autoDetectXHtml;
    }

    public decodeText(text: string) {
        return encoder.decode(text).replace(/[\n\r\t\f ]+/g, ' ');
    }

    public next(): Entity {
        const len = this.len;
        if (this.state === SAHtml.STATE_TAG_DEF) {
            let chr = null;
            while (this.pos < len) {
                chr = this.str.charAt(this.pos);
                if (!this.isWhitespace(chr)) {
                    break;
                }
                this.pos++;
            }
            if (this.pos >= len) {
                this.state = SAHtml.STATE_TAG_CONTENT;
                return {
                    type: SAHtml.ENTITY_TAG_DEF_END,
                    pos: len
                };
            }
            let spos = this.pos;
            if (chr === '>') {
                this.pos++;
                this.state = SAHtml.STATE_TAG_CONTENT;
                return {
                    type: SAHtml.ENTITY_TAG_DEF_END,
                    pos: spos
                };
            }
            if (chr === '/') {
                this.pos++;
                while (this.pos < len) {
                    chr = this.str.charAt(this.pos);
                    if (chr === '>') {
                        this.pos++;
                        break;
                    }
                    this.pos++;
                }
                this.state = SAHtml.STATE_TAG_CONTENT;
                if (this.currentTag && !this.xhtml && this.noHtmlContentTags[this.currentTag]) {
                    return {
                        type: SAHtml.ENTITY_TAG_DEF_END,
                        pos: spos
                    };
                } else {
                    return {
                        type: SAHtml.ENTITY_TAG_DEF_AUTOCLOSE_END,
                        pos: spos
                    };
                }
            }
            let attrName = '';
            while (this.pos < len) {
                chr = this.str.charAt(this.pos);
                if (this.isWhitespace(chr) || chr === '>' || chr === '/') {
                    return {
                        type: SAHtml.ENTITY_TAG_ATTR,
                        name: attrName.toLowerCase(),
                        pos: spos
                    };
                }
                if (chr === '=') {
                    this.pos++;
                    chr = this.str.charAt(this.pos);
                    let attrValue = '';
                    if (chr === '"') {
                        this.pos++;
                        while (this.pos < len) {
                            chr = this.str.charAt(this.pos);
                            if (chr === '"') {
                                this.pos++;
                                break;
                            }
                            attrValue += chr;
                            this.pos++;
                        }
                    } else if (chr === '\'') {
                        this.pos++;
                        while (this.pos < len) {
                            chr = this.str.charAt(this.pos);
                            if (chr === '\'') {
                                this.pos++;
                                break;
                            }
                            attrValue += chr;
                            this.pos++;
                        }
                    } else {
                        while (this.pos < len) {
                            chr = this.str.charAt(this.pos);
                            if (this.isWhitespace(chr) || chr === '>') {
                                break;
                            }
                            if (chr === '/' && this.str.charAt(this.pos + 1) === '>') {
                                break;
                            }
                            attrValue += chr;
                            this.pos++;
                        }
                    }
                    return {
                        type: SAHtml.ENTITY_TAG_ATTR,
                        name: attrName.toLowerCase(),
                        value: this.decodeText(attrValue),
                        pos: spos
                    };
                }
                attrName += chr;
                this.pos++;
            }
            return {
                type: SAHtml.ENTITY_TAG_ATTR,
                name: attrName.toLowerCase(),
                pos: spos
            };
        } else if (this.state === SAHtml.STATE_TAG_CONTENT) {
            if (this.pos >= len) {
                return this.EOF();
            }
            let spos = this.pos;
            let content = '';
            if (this.currentTag && !this.xhtml && this.noHtmlContentTags[this.currentTag]) {
                let endStr = '</' + this.currentTag + '>';
                let endPos = this.str.indexOf(endStr, this.pos);
                if (endPos === -1) {
                    endPos = len;
                }
                content = this.str.substring(this.pos, endPos);
                if (this.pos !== endPos) {
                    spos = this.pos;
                    this.pos = endPos;
                    return {
                        type: SAHtml.ENTITY_STRING,
                        value: this.noDecodeTags[this.currentTag] ? content : this.decodeText(content),
                        pos: spos
                    };
                }
            }
            while (this.pos < len) {
                let chr = this.str.charAt(this.pos);
                if (chr === '<' && !this.isWhitespace(this.str.charAt(this.pos + 1))) {
                    if (content !== '') {
                        return {
                            type: SAHtml.ENTITY_STRING,
                            value: this.decodeText(content),
                            pos: spos
                        };
                    }
                    spos = this.pos;
                    this.pos++;
                    chr = this.str.charAt(this.pos);
                    let tagName = '';
                    if (chr === '/') {
                        this.pos++;
                        while (this.pos < len) {
                            chr = this.str.charAt(this.pos);
                            if (this.isWhitespace(chr) || chr === '>') {
                                break;
                            }
                            tagName += chr;
                            this.pos++;
                        }
                        while (this.pos < len) {
                            chr = this.str.charAt(this.pos);
                            if (chr === '>') {
                                this.pos++;
                                break;
                            }
                            this.pos++;
                        }
                        this.currentTag = null;
                        return {
                            type: SAHtml.ENTITY_TAG_CLOSE,
                            name: tagName.toLowerCase(),
                            pos: spos
                        };
                    }
                    if (chr === '!') {
                        this.pos++;
                        chr = this.str.charAt(this.pos);
                        if (this.str.substr(this.pos, 7).toLowerCase() === 'doctype') {
                            let endPos = this.str.indexOf('>', this.pos);
                            if (endPos === -1) {
                                endPos = len;
                            }
                            let doctype = endPos > this.pos + 8 ? this.str.substring(this.pos + 8, endPos) : '';
                            this.pos = endPos + 1;
                            if (this.autoDetectXHtml) {
                                this.xhtml = doctype.toLowerCase().indexOf('xhtml') !== -1;
                            }
                            return {
                                type: SAHtml.ENTITY_DOCTYPE,
                                value: doctype,
                                pos: spos
                            };
                        } else if (this.xhtml && this.str.substr(this.pos, 7) === '[CDATA[') {
                            let endPos = this.str.indexOf(']]>', this.pos);
                            if (endPos === -1) {
                                endPos = len;
                            }
                            const cdata = endPos > this.pos + 7 ? this.str.substring(this.pos + 7, endPos) : '';
                            this.pos = endPos + 3;
                            return {
                                type: SAHtml.ENTITY_CDATA,
                                value: cdata,
                                pos: spos
                            };
                        } else {
                            let comment = '';
                            if (chr === '-' && this.str.charAt(this.pos + 1) === '-') {
                                this.pos += 2;
                                let endPos = this.str.indexOf('-->', this.pos);
                                comment = this.str.substring(this.pos, endPos);
                                if (endPos === -1) {
                                    endPos = len;
                                }
                                this.pos = endPos + 3;
                            } else {
                                let endPos = this.str.indexOf('>', this.pos);
                                comment = this.str.substring(this.pos, endPos);
                                if (endPos === -1) {
                                    endPos = len;
                                }
                                this.pos = endPos + 1;
                            }
                            return {
                                type: SAHtml.ENTITY_COMMENT,
                                value: comment,
                                pos: spos
                            };
                        }
                    }
                    while (this.pos < len) {
                        chr = this.str.charAt(this.pos);
                        if (this.isWhitespace(chr) || chr === '>' || chr === '/') {
                            break;
                        }
                        tagName += chr;
                        this.pos++;
                    }
                    this.state = SAHtml.STATE_TAG_DEF;
                    tagName = tagName.toLowerCase();
                    this.currentTag = tagName;
                    return {
                        type: SAHtml.ENTITY_TAG_DEF,
                        name: tagName,
                        pos: spos
                    };
                } else {
                    content += chr;
                }
                this.pos++;
            }
            if (content !== '') {
                return {
                    type: SAHtml.ENTITY_STRING,
                    value: this.decodeText(content),
                    pos: spos
                };
            } else {
                return this.EOF();
            }
        } else {
            throw new Error('Unexpected state.');
        }
    }

    public all() {
        const result = [];
        let e: Entity;
        while ((e = this.next()).type !== SAHtml.ENTITY_EOF) {
            result.push(e);
        }
        return result;
    }

    public render(entities: Entity[]): string {
        let result: string[] = [];
        let encodeText = true;
        for (let entity of entities) {
            switch (entity.type) {
                case SAHtml.ENTITY_TAG_DEF:
                    result.push('<' + entity.name);
                    if (this.noDecodeTags[entity.name] && !this.xhtml) {
                        encodeText = false;
                    }
                    break;
                case SAHtml.ENTITY_TAG_ATTR:
                    if (entity.value !== void 0) {
                        result.push(' ' + entity.name + '="' + (xmlEncoder.encode(entity.value)) + '"');
                    } else {
                        result.push(' ' + entity.name);
                    }
                    break;
                case SAHtml.ENTITY_TAG_DEF_END:
                    result.push('>');
                    break;
                case SAHtml.ENTITY_TAG_DEF_AUTOCLOSE_END:
                    result.push('/>');
                    break;
                case SAHtml.ENTITY_TAG_CLOSE:
                    result.push('</' + entity.name + '>');
                    encodeText = true;
                    break;
                case SAHtml.ENTITY_STRING:
                    result.push(encodeText ? xmlEncoder.encode(entity.value) : entity.value);
                    break;
                case SAHtml.ENTITY_DOCTYPE:
                    result.push('<!DOCTYPE ' + entity.value + '>');
                    break;
                case SAHtml.ENTITY_COMMENT:
                    result.push('<!--' + entity.value + '-->');
                    break;
                case SAHtml.ENTITY_CDATA:
                    result.push('<![CDATA[' + entity.value + ']]>');
                    break;
                default:
                    throw Error('Unknown entity type: ' + entity.type + '.');
            }
        }
        return result.join('');
    }
}
