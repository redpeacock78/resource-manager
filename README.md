Resource Manager for JavaScript
===

* [English](README.md)
* [日本語](README.ja.md)

## Features
* open any resources
* reuse previous resource (singleton)
* close all resources at a stretch

## Where to use
Since JavaScript does not have destructor, resources will not be closed automatically (except memory).
This may cause critical problem when it works as a server in particular.

So, generally, resources should be closed each time they become unnecessary.
But it might be better to close all resources at the end of the request.

In addition, reusing DB connection might be better for transaction.

## How to install
```bash
npm install -S @shimataro/resource-manager
```

## Usage (for Express.js)
Register the middleware like this in advance (before using resources).
```javascript
import ResourceManager from "@shimataro/resource-manager";

function middleware(req, res, next) {
    // add resource manager to req
    const objResourceManager = ResourceManager.factory();
    req.objResourceManager = objResourceManager;

    // specify the resource name, how to open/close
    objResourceManager.register(
        "mysql",
        (options) => {
            return mysql.createConnection(options);
        },
        (conn) => {
            conn.end();
        });

    // close all resources at exit
    res
        .on("close", () => {
            // disconnected
            objResourceManager.close();
        })
        .on("finish", () => {
            // finished
            objResourceManager.close();
        });
    if (res.socket.destroyed) {
        // already disconnected
        objResourceManager.close();
    }

    next();
}
```

Open resources like this.
```javascript
app.get("/", (req, res, next) => {
    // connect to DB
    const conn1 = req.objResourceManager.open("mysql", {/* options 1 */});

    // openSingleton() returns single resource when name and options are same.
    // (in this case, conn2_1 and conn2_2 indicate same object)
    const conn2_1 = req.objResourceManager.openSingleton("mysql", {/* options 2 */});
    const conn2_2 = req.objResourceManager.openSingleton("mysql", {/* options 2 */});

    // all resources will be closed at the end of request
    res.send("OK");
});
```

## License
MIT License

## Copyright
&copy; 2018 shimataro
