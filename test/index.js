const MikroTik = require('../index.js')

// Usage example
{
const mikrotik = new MikroTik({
    host: "103.28.148.202",
    port: 8720,
});

mikrotik
    .send({
        path: "/login",
        body: {
            name: "ndiing",
            password: "rahasia123",
        },
    })
    .then(console.log)
    .catch(console.log);

mikrotik
    .send({
        path: "/system/resource/print",
    })
    .then(console.log)
    .catch(console.log);

mikrotik
    .send({
        path: "/interface/vlan/print",
    })
    .then(console.log)
    .catch(console.log);
}
