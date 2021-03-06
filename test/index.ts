import {Entity, SAHtml} from '../src';
import * as colors from 'colors';

function assertEquals(str: string, expr: string) {
    if (str === expr) {
        return console.log(
            (colors.green('OK')) + ': ' + (colors.yellow('\'' + expr + '\'')) +
            ' === ' + (colors.yellow('\'' + str + '\'')) + '.'
        );
    } else {
        throw Error('Assertion failed (not equals): \n\'' + expr + '\'\n\'' + str + '\'.');
    }
}

function entitiesToStr(entities: Entity[]) {
    const opts = ['type', 'name', 'value', 'pos'] as (keyof Entity)[];
    const result = [];
    for (let ent of entities) {
        let entRes = [];
        for (let opt of opts) {
            entRes.push(
                opt + ': ' + (
                    ent[opt] === void 0 ? 'null' : '\'' + (ent[opt] + '').replace('\\', '\\\\').replace('\'', '\\\'') +
                    '\''
                )
            );
        }
        result.push('{' + entRes.join(', ') + '}');
    }
    return '[' + result.join(', ') + ']';
}

function assertEntities(str: string, entities: Entity[]) {
    return assertEquals(entitiesToStr(entities), entitiesToStr((new SAHtml(str)).all()));
}

function assertRender(str: string, expr: string) {
    var parser = new SAHtml(expr);
    return assertEquals(str, parser.render(parser.all()));
}

assertEntities('<!DOCTYPE>', [
    {
        type: 'doctype',
        value: '',
        pos: 0
    }
]);
assertEntities('<!DOCTYPE html>', [
    {
        type: 'doctype',
        value: 'html',
        pos: 0
    }
]);
assertEntities('<b>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagDefEnd',
        pos: 2
    }
]);
assertEntities('<b', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagDefEnd',
        pos: 2
    }
]);
assertEntities('<b></b>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagDefEnd',
        pos: 2
    }, {
        type: 'tagClose',
        name: 'b',
        pos: 3
    }
]);
assertEntities('<b >', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagDefEnd',
        pos: 3
    }
]);
assertEntities('<b d>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        pos: 3
    }, {
        type: 'tagDefEnd',
        pos: 4
    }
]);
assertEntities('<b d/>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        pos: 3
    }, {
        type: 'tagDefAutoEnd',
        pos: 4
    }
]);
assertEntities('<b< d>', [
    {
        type: 'tagDef',
        name: 'b<',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        pos: 4
    }, {
        type: 'tagDefEnd',
        pos: 5
    }
]);
assertEntities('<b d=>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        value: '',
        pos: 3
    }, {
        type: 'tagDefEnd',
        pos: 5
    }
]);
assertEntities('<b d=/>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        value: '',
        pos: 3
    }, {
        type: 'tagDefAutoEnd',
        pos: 5
    }
]);
assertEntities('<b d="f">', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        value: 'f',
        pos: 3
    }, {
        type: 'tagDefEnd',
        pos: 8
    }
]);
assertEntities('<b d="f"/>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        value: 'f',
        pos: 3
    }, {
        type: 'tagDefAutoEnd',
        pos: 8
    }
]);
assertEntities('<b d=\'f\'>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        value: 'f',
        pos: 3
    }, {
        type: 'tagDefEnd',
        pos: 8
    }
]);
assertEntities('<b d=\'&#60;\'>', [
    {
        type: 'tagDef',
        name: 'b',
        pos: 0
    }, {
        type: 'tagAttr',
        name: 'd',
        value: '<',
        pos: 3
    }, {
        type: 'tagDefEnd',
        pos: 12
    }
]);
assertEntities('<!--cmt-->', [
    {
        type: 'comment',
        value: 'cmt',
        pos: 0
    }
]);
assertEntities('<!cmt>', [
    {
        type: 'comment',
        value: 'cmt',
        pos: 0
    }
]);
assertEntities('Hello World', [
    {
        type: 'string',
        value: 'Hello World',
        pos: 0
    }
]);
assertEntities('Hello  \fWorld', [
    {
        type: 'string',
        value: 'Hello World',
        pos: 0
    }
]);
assertEntities('Hello <b>World</b>', [
    {
        type: 'string',
        value: 'Hello ',
        pos: 0
    }, {
        type: 'tagDef',
        name: 'b',
        pos: 6
    }, {
        type: 'tagDefEnd',
        pos: 8
    }, {
        type: 'string',
        value: 'World',
        pos: 9
    }, {
        type: 'tagClose',
        name: 'b',
        pos: 14
    }
]);
assertEntities('&#60;', [
    {
        type: 'string',
        value: '<',
        pos: 0
    }
]);
assertEntities('<script>Hello <b>World</b></script>', [
    {
        type: 'tagDef',
        name: 'script',
        pos: 0
    }, {
        type: 'tagDefEnd',
        pos: 7
    }, {
        type: 'string',
        value: 'Hello <b>World</b>',
        pos: 8
    }, {
        type: 'tagClose',
        name: 'script',
        pos: 26
    }
]);
assertEntities('<![CDATA[Hello World]]>', [
    {
        type: 'comment',
        value: '[CDATA[Hello World]]',
        pos: 0
    }
]);
assertEntities('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><![CDATA[Hello World]]>', [
    {
        type: 'doctype',
        value: 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"',
        pos: 0
    }, {
        type: 'cdata',
        value: 'Hello World',
        pos: 97
    }
]);

assertRender('<script>alert(a<b);</script>', '<script>alert(a<b);</script>');
assertRender('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><script>alert(a&gt;b);</script>', '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><script>alert(a>b);</script>');
assertRender('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><script/>123', '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><script/>123');
assertRender('<script>123', '<script/>123');
assertRender('<b></b>', '<b></b>');
assertRender('<b></b>', '<B></b>');
assertRender('<b></b>', '<B></B>');
assertRender('<b>', '<b');
assertRender('<b attr="123">', '<b attr=\'123\'>');
assertRender('<b attr>', '<b attr');
assertRender(' ', '&nbsp;');
assertRender('<b attr="">', '<b attr=');
assertRender('<!--[CDATA[Hello World]]-->', '<![CDATA[Hello World]]>');
assertRender('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><![CDATA[Hello World]]>', '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><![CDATA[Hello World]]>');

const parser = new SAHtml('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><script/>123');
parser.setAutoDetectXHtml(false);
assertEquals('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><script>123', parser.render(parser.all()));
