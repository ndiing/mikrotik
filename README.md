<a name="MikroTik"></a>

## MikroTik
MikroTik class handles communication with a MikroTik router via its API using a TCP connection.

**Kind**: global class  

* [MikroTik](#MikroTik)
    * [new MikroTik([options])](#new_MikroTik_new)
    * [.encodeWord(word)](#MikroTik+encodeWord) ⇒ <code>Buffer</code>
    * [.encodeSentence(words)](#MikroTik+encodeSentence) ⇒ <code>Buffer</code>
    * [.decodeResponse(data)](#MikroTik+decodeResponse) ⇒ <code>Array.&lt;Array.&lt;string&gt;&gt;</code>
    * [.parseResponse(responses)](#MikroTik+parseResponse) ⇒ <code>Object</code>
    * [.processQueue()](#MikroTik+processQueue)
    * [.sendCommand(words, callback)](#MikroTik+sendCommand)
    * [.send(req)](#MikroTik+send) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="new_MikroTik_new"></a>

### new MikroTik([options])
Creates an instance of the MikroTik class.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> | Configuration options for the MikroTik connection. |
| [options.host] | <code>string</code> | <code>&quot;\&quot;192.168.88.1\&quot;&quot;</code> | Router's hostname or IP address. |
| [options.port] | <code>number</code> | <code>8728</code> | API port for MikroTik RouterOS. |
| [options.timeout] | <code>number</code> | <code>10000</code> | Request timeout in milliseconds. |

**Example**  
```js
const mikrotik = new MikroTik({    host: "192.168.88.1",    port: 8720,});mikrotik    .send({        path: "/login",        body: {            name: "ndiing",            password: "rahasia123",        },    })    .then(console.log)    .catch(console.log);mikrotik    .send({        path: "/system/resource/print",    })    .then(console.log)    .catch(console.log);mikrotik    .send({        path: "/interface/vlan/print",    })    .then(console.log)    .catch(console.log);
```
<a name="MikroTik+encodeWord"></a>

### mikroTik.encodeWord(word) ⇒ <code>Buffer</code>
Encodes a MikroTik API word into a correctly formatted byte buffer.

**Kind**: instance method of [<code>MikroTik</code>](#MikroTik)  
**Returns**: <code>Buffer</code> - The encoded word as a byte buffer.  

| Param | Type | Description |
| --- | --- | --- |
| word | <code>string</code> | The word to encode. |

<a name="MikroTik+encodeSentence"></a>

### mikroTik.encodeSentence(words) ⇒ <code>Buffer</code>
Encodes an array of API words into a full MikroTik command sentence.

**Kind**: instance method of [<code>MikroTik</code>](#MikroTik)  
**Returns**: <code>Buffer</code> - The encoded sentence as a byte buffer.  

| Param | Type | Description |
| --- | --- | --- |
| words | <code>Array.&lt;string&gt;</code> | The words to encode. |

<a name="MikroTik+decodeResponse"></a>

### mikroTik.decodeResponse(data) ⇒ <code>Array.&lt;Array.&lt;string&gt;&gt;</code>
Decodes a MikroTik API response buffer into an array of sentences.

**Kind**: instance method of [<code>MikroTik</code>](#MikroTik)  
**Returns**: <code>Array.&lt;Array.&lt;string&gt;&gt;</code> - Decoded response sentences.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Buffer</code> | The received API response buffer. |

<a name="MikroTik+parseResponse"></a>

### mikroTik.parseResponse(responses) ⇒ <code>Object</code>
Parses MikroTik API responses into a structured JavaScript object.

**Kind**: instance method of [<code>MikroTik</code>](#MikroTik)  
**Returns**: <code>Object</code> - Parsed response data.  

| Param | Type | Description |
| --- | --- | --- |
| responses | <code>Array.&lt;Array.&lt;string&gt;&gt;</code> | The decoded API responses. |

<a name="MikroTik+processQueue"></a>

### mikroTik.processQueue()
Processes pending API command requests in the queue.

**Kind**: instance method of [<code>MikroTik</code>](#MikroTik)  
<a name="MikroTik+sendCommand"></a>

### mikroTik.sendCommand(words, callback)
Sends a MikroTik API command.

**Kind**: instance method of [<code>MikroTik</code>](#MikroTik)  

| Param | Type | Description |
| --- | --- | --- |
| words | <code>Array.&lt;string&gt;</code> | The API command words. |
| callback | <code>function</code> | Callback function to handle the response. |

<a name="MikroTik+send"></a>

### mikroTik.send(req) ⇒ <code>Promise.&lt;Object&gt;</code>
Sends a formatted MikroTik API request.

**Kind**: instance method of [<code>MikroTik</code>](#MikroTik)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise resolving with the parsed response data.  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | API request parameters. |
| req.path | <code>string</code> | API command path. |
| req.query | <code>Object</code> | Query parameters. |
| req.body | <code>Object</code> | Body parameters. |

