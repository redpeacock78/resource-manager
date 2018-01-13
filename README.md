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

You can make above code brief using [on-finished](https://www.npmjs.com/package/on-finished):
```javascript
import ResourceManager from "@shimataro/resource-manager";
import onFinished from "on-finished";

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
    onFinished(res, () => {
        objResourceManager.close();
    });

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

## Built-in resources
The following resource names can be used without registering, because they are already defined as "built-in resources".
* `array`: [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)
* `map`: [Map](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)
* `set`: [Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)

These resources also release elements by calling `close()`, so keys of Map or Set will be the target of garbage collection at that point.
In other words, you don't need to use [WeakMap](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) or [WeakSet](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakSet).

You can also use them as "request-local" collection with `openSingleton()`:
```javascript
function middleware1(req, res, next) {
    const map1 = req.objResourceManager.openSingleton("map", 1);
    console.log(map1.size); // 0
    map1.set(1, "a");

    const map2 = req.objResourceManager.openSingleton("map", 2);
    console.log(map2.size); // 0
    map2.set(2, "b");

    next();
}

function middleware2(req, res, next) {
    const map1 = req.objResourceManager.openSingleton("map", 1);
    console.log(map1.get(1)); // "a"
    console.log(map1.get(2)); // undefined

    const map2 = req.objResourceManager.openSingleton("map", 2);
    console.log(map2.get(1)); // undefined
    console.log(map2.get(2)); // "b"

    next();
}
```

## License
MIT License

## Copyright
&copy; 2018 shimataro
