Resource Manager for JavaScript
===

* [English](README.md)
* [日本語](README.ja.md)

## 機能
* 任意のリソースを取得
* 以前に取得したことがあるリソースを使いまわす（Singleton）
* 取得したリソースをまとめて解放

## どこで必要？
JavaScriptのクラスにはデストラクタがないので、メモリ以外のリソースは自動的に解放されません。
これは特にサーバサイドで動かす場合に深刻な問題になる可能性があります。

そのため通常はリソースが不要になったら都度解放する必要がありますが、リクエストの終了時にまとめて解放したほうが見通しが良くなることも多いです。

また、例えばDB接続は一度確保したらそのリクエストの間は同じ接続を使い回したほうが接続コストやトランザクションの面で便利なことがあります。

## インストール
```bash
npm install -S @shimataro/resource-manager
```

## 使い方（Express.jsの例）
こんな感じのミドルウェアを、ルーティング前（リソース使用前）に `app.use()` で登録しておく
```javascript
import ResourceManager from "@shimataro/resource-manager";

function middleware(req, res, next) {
    // リソースマネージャーをreqのプロパティに追加
    const objResourceManager = ResourceManager.factory();
    req.objResourceManager = objResourceManager;

    // リソース名・取得方法・解放方法を指定
    objResourceManager.register(
        "mysql",
        (options) => {
            return mysql.createConnection(options);
        },
        (conn) => {
            conn.end();
        });

    // 終了時にリソースをすべて解放
    res
        .on("close", () => {
            // 切断
            objResourceManager.close();
        })
        .on("finish", () => {
            // 処理完了
            objResourceManager.close();
        });
    if (res.socket.destroyed) {
        // そもそもこの時点で切断されていた
        objResourceManager.close();
    }

    next();
}
```

[on-finished](https://www.npmjs.com/package/on-finished)パッケージを使うと簡潔に記述できる
```javascript
import ResourceManager from "@shimataro/resource-manager";
import onFinished from "on-finished";

function middleware(req, res, next) {
    // リソースマネージャーをreqのプロパティに追加
    const objResourceManager = ResourceManager.factory();
    req.objResourceManager = objResourceManager;

    // リソース名・取得方法・解放方法を指定
    objResourceManager.register(
        "mysql",
        (options) => {
            return mysql.createConnection(options);
        },
        (conn) => {
            conn.end();
        });

    // 終了時にリソースをすべて解放
    onFinished(res, () => {
        objResourceManager.close();
    });

    next();
}
```

リソースの取得方法はこんな感じで。
```javascript
app.get("/", (req, res, next) => {
    // DB接続
    const conn1 = req.objResourceManager.open("mysql", {/* 接続オプション1 */});

    // openSingleton() は同じリソース名・同じオプションなら何度コールしても最初のリソースを使いまわす
    // （この場合、conn2_1とconn2_2は同じものを返す）
    const conn2_1 = req.objResourceManager.openSingleton("mysql", {/* 接続オプション2 */});
    const conn2_2 = req.objResourceManager.openSingleton("mysql", {/* 接続オプション2 */});

    // リクエスト終了時にすべて解放される
    res.send("OK");
});
```

## ライセンス
MITライセンス

## 著作権
&copy; 2018 shimataro
