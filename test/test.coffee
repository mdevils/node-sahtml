{SAHtml} = require('../index')
colors = require('colors')

assertEquals = (str, expr) ->
  if str == expr
    console.log "#{colors.green('OK', 'green')}: #{colors.yellow("'#{expr}'")} === #{colors.yellow("'#{str}'")}."
  else
    throw Error("Assertion failed (not equals): \n'#{expr}'\n'#{str}'.")

entitiesToStr = (entities) ->
  opts = ['type', 'name', 'value', 'pos']
  result = []
  for ent in entities
    entRes = []
    for opt in opts
      entRes.push(opt + ': ' + if ent[opt] == undefined then 'null' else '\'' + (ent[opt] + '').replace('\\', '\\\\').replace('\'', '\\\'') + '\'')
    result.push '{' + entRes.join(', ') + '}'
  '[' + result.join(', ') + ']'

assertEntities = (str, entities) ->
  assertEquals(entitiesToStr(entities), entitiesToStr((new SAHtml(str)).all()))

assertRender = (str, expr) ->
  parser = new SAHtml(expr)
  assertEquals str, parser.render(parser.all())

assertEntities """<!DOCTYPE>""", [{type: 'doctype', value: '', pos: 0}]
assertEntities """<!DOCTYPE html>""", [{type: 'doctype', value: 'html', pos: 0}]
assertEntities """<b>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagDefEnd', pos: 2}]
assertEntities """<b""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagDefEnd', pos: 2}]
assertEntities """<b></b>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagDefEnd', pos: 2}, {type: 'tagClose', name: 'b', pos: 3}]
assertEntities """<b >""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagDefEnd', pos: 3}]
assertEntities """<b d>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagAttr', name: 'd', pos: 3}, {type: 'tagDefEnd', pos: 4}]
assertEntities """<b d/>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagAttr', name: 'd', pos: 3}, {type: 'tagDefAutoEnd', pos: 4}]
assertEntities """<b< d>""", [{type: 'tagDef', name: 'b<', pos: 0}, {type: 'tagAttr', name: 'd', pos: 4}, {type: 'tagDefEnd', pos: 5}]
assertEntities """<b d=>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagAttr', name: 'd', value: '', pos: 3}, {type: 'tagDefEnd', pos: 5}]
assertEntities """<b d=/>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagAttr', name: 'd', value: '', pos: 3}, {type: 'tagDefAutoEnd', pos: 5}]
assertEntities """<b d="f">""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagAttr', name: 'd', value: 'f', pos: 3}, {type: 'tagDefEnd', pos: 8}]
assertEntities """<b d="f"/>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagAttr', name: 'd', value: 'f', pos: 3}, {type: 'tagDefAutoEnd', pos: 8}]
assertEntities """<b d='f'>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagAttr', name: 'd', value: 'f', pos: 3}, {type: 'tagDefEnd', pos: 8}]
assertEntities """<b d='&#60;'>""", [{type: 'tagDef', name: 'b', pos: 0}, {type: 'tagAttr', name: 'd', value: '<', pos: 3}, {type: 'tagDefEnd', pos: 12}]
assertEntities """<!--cmt-->""", [{type: 'comment', value: 'cmt', pos: 0}]
assertEntities """<!cmt>""", [{type: 'comment', value: 'cmt', pos: 0}]
assertEntities """Hello World""", [{type: 'string', value: 'Hello World', pos: 0}]
assertEntities """Hello  \fWorld""", [{type: 'string', value: 'Hello World', pos: 0}]
assertEntities """Hello <b>World</b>""", [{type: 'string', value: 'Hello ', pos: 0}, {type: 'tagDef', name: 'b', pos: 6}, {type: 'tagDefEnd', pos: 8}, {type: 'string', value: 'World', pos: 9}, {type: 'tagClose', name: 'b', pos: 14}]
assertEntities """&#60;""", [{type: 'string', value: '<', pos: 0}]
assertEntities """<script>Hello <b>World</b></script>""", [{type: 'tagDef', name: 'script', pos: 0}, {type: 'tagDefEnd', pos: 7}, {type: 'string', value: 'Hello <b>World</b>', pos: 8}, {type: 'tagClose', name: 'script', pos: 26}]
assertEntities """<![CDATA[Hello World]]>""", [{type: 'comment', value: '[CDATA[Hello World]]', pos: 0}]
assertEntities """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><![CDATA[Hello World]]>""", [{type: 'doctype', value: 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"', pos: 0}, {type: 'cdata', value: 'Hello World', pos: 97}]

assertRender "<b></b>", "<b></b>"
assertRender "<b></b>", "<B></b>"
assertRender "<b></b>", "<B></B>"
assertRender "<b>", "<b"
assertRender """<b attr="123">""", "<b attr='123'>"
assertRender "<b attr>", "<b attr"
assertRender " ", "&nbsp;"
assertRender """<b attr="">""", "<b attr="
assertRender """<!--[CDATA[Hello World]]-->""", "<![CDATA[Hello World]]>"
assertRender """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><![CDATA[Hello World]]>""", """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><![CDATA[Hello World]]>"""
