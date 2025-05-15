const net = require("net");

/**
 * MikroTik class handles communication with a MikroTik router via its API using a TCP connection.
 */
class MikroTik {
    /**
     * Creates an instance of the MikroTik class.
     * @param {Object} [options={}] - Configuration options for the MikroTik connection.
     * @param {string} [options.host="192.168.88.1"] - Router's hostname or IP address.
     * @param {number} [options.port=8728] - API port for MikroTik RouterOS.
     * @param {number} [options.timeout=10000] - Request timeout in milliseconds.
     */
    constructor(options = {}) {
        this.options = {
            host: "192.168.88.1",
            port: 8728,
            timeout: 10000,
            ...options,
        };
        this.buffer = Buffer.alloc(0);
        this.queue = [];
        this.busy = false;

        this.client = net.createConnection({ host: this.options.host, port: this.options.port });

        this.client.on("end", () => {});
        this.client.on("timeout", () => this.client.end());
    }

    /**
     * Encodes a MikroTik API word into a correctly formatted byte buffer.
     * @param {string} word - The word to encode.
     * @returns {Buffer} The encoded word as a byte buffer.
     */
    encodeWord(word) {
        const len = word.length;
        let lenBytes = [];

        if (len < 0x80) {
            lenBytes.push(len);
        } else if (len < 0x4000) {
            lenBytes.push((len >> 8) | 0x80, len & 0xff);
        } else if (len < 0x200000) {
            lenBytes.push((len >> 16) | 0xc0, (len >> 8) & 0xff, len & 0xff);
        } else if (len < 0x10000000) {
            lenBytes.push((len >> 24) | 0xe0, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff);
        } else {
            lenBytes.push(0xf0, (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff);
        }

        return Buffer.concat([Buffer.from(lenBytes), Buffer.from(word)]);
    }

    /**
     * Encodes an array of API words into a full MikroTik command sentence.
     * @param {string[]} words - The words to encode.
     * @returns {Buffer} The encoded sentence as a byte buffer.
     */
    encodeSentence(words) {
        return Buffer.concat([...words.map((word) => this.encodeWord(word)), Buffer.from([0])]);
    }

    /**
     * Decodes a MikroTik API response buffer into an array of sentences.
     * @param {Buffer} data - The received API response buffer.
     * @returns {string[][]} Decoded response sentences.
     */
    decodeResponse(data) {
        let offset = 0;
        let responses = [];
        let current = [];

        while (offset < data.length) {
            let len = data[offset++];

            if (len === 0) {
                if (current.length) {
                    responses.push(current);
                    current = [];
                }
                continue;
            }

            if (len >= 0xf0) {
                len = (data[offset++] << 24) | (data[offset++] << 16) | (data[offset++] << 8) | data[offset++];
            } else if (len >= 0xe0) {
                len = ((len & 0x1f) << 24) | (data[offset++] << 16) | (data[offset++] << 8) | data[offset++];
            } else if (len >= 0xc0) {
                len = ((len & 0x3f) << 16) | (data[offset++] << 8) | data[offset++];
            } else if (len >= 0x80) {
                len = ((len & 0x7f) << 8) | data[offset++];
            }

            current.push(data.slice(offset, offset + len).toString());
            offset += len;
        }

        if (current.length) {
            responses.push(current);
        }

        return responses;
    }

    /**
     * Parses MikroTik API responses into a structured JavaScript object.
     * @param {string[][]} responses - The decoded API responses.
     * @returns {Object} Parsed response data.
     */
    parseResponse(responses) {
        const result = { success: true };

        for (const res of responses) {
            const type = res[0];

            if (type === "!trap") {
                return {
                    success: false,
                    message: res.find((r) => r.startsWith("=message="))?.replace("=message=", "") || "Unknown error",
                };
            }

            if (type === "!re") {
                result.data ??= [];
                const item = {};

                for (const r of res) {
                    if (r.startsWith("=")) {
                        const [key, value] = r.slice(1).split("=");
                        item[key] = value;
                    }
                }

                result.data.push(item);
            }
        }

        return result;
    }

    /**
     * Processes pending API command requests in the queue.
     */
    processQueue() {
        if (this.busy || this.queue.length === 0) return;

        const task = this.queue.shift();
        this.busy = true;

        this.client.write(this.encodeSentence(task.words));

        const responses = [];
        const onData = (data) => {
            this.buffer = Buffer.concat([this.buffer, data]);

            if (this.buffer.includes(Buffer.from("!done"))) {
                const decoded = this.decodeResponse(this.buffer);
                this.buffer = Buffer.alloc(0);

                responses.push(...decoded);

                if (decoded.some((r) => r.includes("!done") || r.find((w) => w.startsWith("!trap")))) {
                    this.client.off("data", onData);
                    this.busy = false;
                    task.callback(null, responses);
                    this.processQueue();
                }
            }
        };

        this.client.on("data", onData);

        setTimeout(() => {
            if (this.busy) {
                this.client.off("data", onData);
                this.busy = false;
                task.callback(new Error("Command timed out"), null);
                this.processQueue();
            }
        }, this.options.timeout);
    }

    /**
     * Sends a MikroTik API command.
     * @param {string[]} words - The API command words.
     * @param {Function} callback - Callback function to handle the response.
     */
    sendCommand(words, callback) {
        this.queue.push({ words, callback });
        this.processQueue();
    }

    /**
     * Sends a formatted MikroTik API request.
     * @param {Object} req - API request parameters.
     * @param {string} req.path - API command path.
     * @param {Object} req.query - Query parameters.
     * @param {Object} req.body - Body parameters.
     * @returns {Promise<Object>} A promise resolving with the parsed response data.
     */
    send(req = {}) {
        return new Promise((resolve, reject) => {
            const { path, query, body } = req;
            const words = [path];

            for (const name in body) {
                words.push(`=${name}=${body[name]}`);
            }

            for (const name in query) {
                Array.isArray(query[name])
                    ? query[name].forEach((value) => words.push(`?${name}=${value}`))
                    : words.push(`?${name}=${query[name]}`);
            }

            this.sendCommand(words, (err, response) => {
                err ? reject(err) : resolve(this.parseResponse(response));
            });
        });
    }
}

module.exports = MikroTik;


// // Usage example
// {
//     const mikrotik = new MikroTik({
//         host: "103.28.148.202",
//         port: 8720,
//     });
    
//     mikrotik
//         .send({
//             path: "/login",
//             body: {
//                 name: "ndiing",
//                 password: "rahasia123",
//             },
//         })
//         .then(console.log)
//         .catch(console.log);
        
    
//     mikrotik
//         .send({
//             path: "/system/resource/print",
//         })
//         .then(console.log)
//         .catch(console.log);
        
//     // mikrotik
//     //     .send({
//     //         path: "/interface/vlan/print",
//     //     })
//     //     .then(console.log)
//     //     .catch(console.log);
// }
