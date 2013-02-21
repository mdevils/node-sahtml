{XmlEntities, AllHtmlEntities} = require('html-entities')

class SAHtml

  @STATE_TAG_CONTENT: 1
  @STATE_TAG_DEF: 2

  @ENTITY_TAG_DEF: 'tagDef'
  @ENTITY_TAG_ATTR: 'tagAttr'
  @ENTITY_TAG_DEF_END: 'tagDefEnd'
  @ENTITY_TAG_DEF_AUTOCLOSE_END: 'tagDefAutoEnd'
  @ENTITY_TAG_CLOSE: 'tagClose'
  @ENTITY_STRING: 'string'
  @ENTITY_DOCTYPE: 'doctype'
  @ENTITY_COMMENT: 'comment'
  @ENTITY_CDATA: 'cdata'
  @ENTITY_EOF: 'eof'

  constructor: (str) ->
    @str = str or ''
    @len = @str.length
    @pos = 0
    @state = SAHtml.STATE_TAG_CONTENT
    @currentTag = null
    @encoder = new AllHtmlEntities
    @xhtml = false

  isWhitespace: (c) -> c == ' ' || c == "\t" || c == "\r" || c == "\n" || c == "\f"

  EOF: -> { type: SAHtml.ENTITY_EOF, pos: @str.length }

  noHtmlContentTags:
    script: true
    textarea: true
    style: true
    xmp: true

  getPos: -> @pos
  setPos: (@pos) ->

  isXHtml: -> @xhtml
  setXHtml: (@xhtml) ->

  decodeText: (text) ->
    @encoder.decode(text).replace(/[\n\r\t\f ]+/g, ' ')

  next: ->
    len = @len
    if @state is SAHtml.STATE_TAG_DEF
      chr = null
      while @pos < len
        chr = @str.charAt(@pos)
        break unless @isWhitespace(chr)
        @pos++
      if @pos >= len
        @state = SAHtml.STATE_TAG_CONTENT
        return { type: SAHtml.ENTITY_TAG_DEF_END, pos: len }
      spos = @pos
      if chr == ">"
        @pos++
        @state = SAHtml.STATE_TAG_CONTENT
        return { type: SAHtml.ENTITY_TAG_DEF_END, pos: spos }
      if chr == "/"
        @pos++
        while @pos < len
          chr = @str.charAt @pos
          (@pos++; break) if chr == '>'
          @pos++
        @state = SAHtml.STATE_TAG_CONTENT
        if @currentTag && @noHtmlContentTags[@currentTag]
          return { type: SAHtml.ENTITY_TAG_DEF_END, pos: spos }
        else
          return { type: SAHtml.ENTITY_TAG_DEF_AUTOCLOSE_END, pos: spos }
      attrName = ''
      while @pos < len
        chr = @str.charAt @pos
        if @isWhitespace(chr) || chr == '>' || chr == '/'
          return {
            type: SAHtml.ENTITY_TAG_ATTR,
            name: attrName.toLowerCase(),
            pos: spos
          }
        if chr == '='
          @pos++
          chr = @str.charAt @pos
          attrValue = ''
          if chr == '"'
            @pos++
            while @pos < len
              chr = @str.charAt @pos
              (@pos++; break) if chr == '"'
              attrValue += chr
              @pos++
          else if chr == '\''
            @pos++
            while @pos < len
              chr = @str.charAt @pos
              (@pos++; break) if chr == '\''
              attrValue += chr
              @pos++
          else while @pos < len
            chr = @str.charAt @pos
            break if @isWhitespace(chr) || chr == '>'
            break if chr == '/' && @str.charAt(@pos + 1) == '>'
            attrValue += chr
            @pos++
          return {
            type: SAHtml.ENTITY_TAG_ATTR,
            name: attrName.toLowerCase(),
            value: @decodeText(attrValue),
            pos: spos
          }
        attrName += chr
        @pos++
      if @pos >= len
        return {
          type: SAHtml.ENTITY_TAG_ATTR,
          name: attrName.toLowerCase()
        }
    else if @state is SAHtml.STATE_TAG_CONTENT
      return @EOF() if @pos >= len
      spos = @pos
      content = ''
      if @currentTag && @noHtmlContentTags[@currentTag]
        endStr = "</#{@currentTag}>"
        endPos = @str.indexOf(endStr, @pos)
        if endPos == -1
          endPos = len
        content = @str.substring(@pos, endPos)
        if @pos != endPos
          spos = @pos
          @pos = endPos
          return {
            type: SAHtml.ENTITY_STRING,
            value: @decodeText(content),
            pos: spos
          }
      while @pos < len
        chr = @str.charAt @pos
        if chr == '<' && !@isWhitespace(@str.charAt(@pos + 1))
          if content != ''
            return {
              type: SAHtml.ENTITY_STRING,
              value: @decodeText(content),
              pos: spos
            }
          spos = @pos
          @pos++
          chr = @str.charAt @pos
          tagName = ''
          if chr == '/'
            @pos++
            while @pos < len
              chr = @str.charAt @pos
              break if @isWhitespace(chr) || chr == '>'
              tagName += chr
              @pos++
            while @pos < len
              chr = @str.charAt @pos
              (@pos++; break) if chr == '>'
              @pos++
            @currentTag = null
            return {
              type: SAHtml.ENTITY_TAG_CLOSE,
              name: tagName.toLowerCase(),
              pos: spos
            }
          if chr == '!'
            @pos++
            chr = @str.charAt @pos
            if @str.substr(@pos, 7).toLowerCase() == 'doctype'
              endPos = @str.indexOf('>', @pos)
              if endPos == -1
                endPos = len
              doctype = if endPos > @pos + 8 then @str.substring(@pos + 8, endPos) else ''
              @pos = endPos + 1
              @xhtml = doctype.toLowerCase().indexOf('xhtml') != -1
              return {
                type: SAHtml.ENTITY_DOCTYPE,
                value: doctype,
                pos: spos
              }
            else if @xhtml && @str.substr(@pos, 7) == '[CDATA['
              endPos = @str.indexOf(']]>', @pos)
              if endPos == -1
                endPos = len
              cdata = if endPos > @pos + 7 then @str.substring(@pos + 7, endPos) else ''
              @pos = endPos + 3
              return {
                type: SAHtml.ENTITY_CDATA,
                value: cdata,
                pos: spos
              }
            else
              if chr == '-' && @str.charAt(@pos + 1) == '-'
                @pos += 2
                endPos = @str.indexOf('-->', @pos)
                comment = @str.substring(@pos, endPos)
                if endPos == -1
                  endPos = len
                @pos = endPos + 3
              else
                endPos = @str.indexOf('>', @pos)
                comment = @str.substring(@pos, endPos)
                if endPos == -1
                  endPos = len
                @pos = endPos + 1
              return {
                type: SAHtml.ENTITY_COMMENT,
                value: comment,
                pos: spos
              }
          while @pos < len
            chr = @str.charAt @pos
            break if @isWhitespace(chr) || chr == '>' || chr == '/'
            tagName += chr
            @pos++
          @state = SAHtml.STATE_TAG_DEF
          tagName = tagName.toLowerCase()
          @currentTag = tagName
          return {
            type: SAHtml.ENTITY_TAG_DEF,
            name: tagName,
            pos: spos
          }
        else content += chr
        @pos++
      if content != ''
        return {
          type: SAHtml.ENTITY_STRING,
          value: @decodeText(content),
          pos: spos
        }
      else return @EOF()

  all: ->
    result = []
    while (e = @next()).type != SAHtml.ENTITY_EOF
      result.push e
    result

  render: (entities) ->
    encoder = new XmlEntities
    result = []
    for entity in entities
      switch entity.type
        when SAHtml.ENTITY_TAG_DEF then result.push "<#{entity.name}"
        when SAHtml.ENTITY_TAG_ATTR
          if entity.value != undefined
            result.push " #{entity.name}=\"#{encoder.encode(entity.value)}\""
          else
            result.push " #{entity.name}"
        when SAHtml.ENTITY_TAG_DEF_END then result.push ">"
        when SAHtml.ENTITY_TAG_DEF_AUTOCLOSE_END then result.push "/>"
        when SAHtml.ENTITY_TAG_CLOSE then result.push "</#{entity.name}>"
        when SAHtml.ENTITY_STRING then result.push encoder.encode(entity.value)
        when SAHtml.ENTITY_DOCTYPE then result.push "<!DOCTYPE #{entity.value}>"
        when SAHtml.ENTITY_COMMENT then result.push "<!--#{entity.value}-->"
        when SAHtml.ENTITY_CDATA then result.push "<![CDATA[#{entity.value}]]>"
    result.join('')

exports.SAHtml = SAHtml