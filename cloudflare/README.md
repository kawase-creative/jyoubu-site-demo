# 上武サイトの投稿機能（Cloudflare）

公開サイトはこれまでどおり GitHub Pages に置き、投稿データと写真は Cloudflare に保存します。

- `api/`: 公開サイト用の読み取り API と公開画像配信
- `admin/`: Cloudflare Access で保護する管理画面と投稿 API
- `database/migrations/`: 施工事例・Instagram投稿のテーブルと初期データ
- D1: 投稿情報
- R2: 管理画面からアップロードする写真

Cloudflare のアカウント接続が必要なため、ここにあるコードだけではまだ公開されていません。初回接続時に次の設定を行います。

## Cloudflare に接続して初回公開

1. Cloudflare アカウントで開発者向け CLI にログインします。

   ```sh
   npx wrangler login
   ```

2. D1 データベースと R2 バケットを作ります。

   ```sh
   npx wrangler d1 create jyoubu-site-content
   npx wrangler r2 bucket create jyoubu-site-media
   ```

3. D1 作成時に表示された ID を、`api/wrangler.jsonc` と `admin/wrangler.jsonc` の `database_id` に同じ値で設定します。D1 の名前と R2 バケット名を変えた場合は、それぞれの設定もそろえます。

4. テーブルと初期の施工事例・Instagram投稿を登録します。

   ```sh
   npx wrangler d1 migrations apply jyoubu-site-content --remote --config cloudflare/api/wrangler.jsonc
   ```

5. API Worker と管理画面 Worker を公開します。

   ```sh
   npx wrangler deploy --config cloudflare/api/wrangler.jsonc
   npx wrangler deploy --config cloudflare/admin/wrangler.jsonc
   ```

6. Cloudflare ダッシュボードで `jyoubu-site-admin` Worker の **Access** を有効にします。許可するメールアドレスを登録し、ログイン方法にメールのワンタイム PIN を選べば、クライアントに Cloudflare や GitHub のアカウントを作ってもらわずにログインできます。許可リストには担当者のアドレスだけを入れてください。

7. `site-config.js` の `contentApi` と `adminUrl` に、デプロイ後に表示されるそれぞれの `workers.dev` URL を設定します。GitHub Pages に反映すると、管理画面リンクが表示され、保存した内容がサイトに出ます。

## 画面・データの仕様

- 管理画面では施工事例の追加・編集・削除、画像アップロード、Instagram投稿 URL の追加・削除ができます。
- 施工事例は保存すると公開 API に反映されます。写真は JPEG・PNG・WebP の最大 10 MB を受け付けます。
- Instagram は公開投稿またはリールを埋め込み表示します。ストーリーズは保存期間や公開状態が限られるため、リンクカードとして表示します。
- 旧データと画像の初期表示は、Cloudflare 接続前も GitHub Pages で保持されます。

## 料金の目安

Cloudflare の現在の Free 利用枠では Workers は 1 日 100,000 リクエスト、D1 は 1 日 5,000,000 行読み取り・100,000 行書き込みと合計 5 GB、R2 は月 10 GB-month と月 100 万回の書き込み・1,000 万回の読み込みが含まれます。小規模サイトの通常利用なら Free 枠から始められます。上限を超える利用や Workers Paid への変更が必要になった場合は、契約前に料金を確認します。

公式情報: [Workers の料金](https://developers.cloudflare.com/workers/platform/pricing/)、[D1 の料金](https://developers.cloudflare.com/d1/platform/pricing/)、[R2 の料金](https://developers.cloudflare.com/r2/pricing/)、[Workers の Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
