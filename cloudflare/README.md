# 上武サイトの投稿機能（Cloudflare）

公開サイトはこれまでどおり GitHub Pages に置き、投稿データと写真は Cloudflare に保存します。

- `api/`: 公開サイト用の読み取り API と公開画像配信
- `admin/`: Cloudflare Access で保護する管理画面と投稿 API
- `database/migrations/`: 施工事例・Instagram投稿のテーブルと初期データ
- D1: 投稿情報
- R2: 管理画面からアップロードする写真

現在、API Worker と管理画面 Worker は Cloudflare に公開済みで、D1 と R2 に接続しています。公開サイトは GitHub Pages から配信しています。

## 公開中の構成

- 公開サイト: `https://kawase-creative.github.io/jyoubu-site-demo/`
- 投稿 API: `https://jyoubu-site-api.1641494papa.workers.dev`
- 管理画面: `https://jyoubu-site-admin.1641494papa.workers.dev`
- 管理画面の認証: Cloudflare Access で保護しています。Cloudflare アカウントメンバーに加えて、許可リストに登録したメールアドレスへ One-time PIN を送るログインを有効にしています。担当者を追加する場合は、個別のメールアドレスを Access ポリシーに追加します。

## 再デプロイ

1. `npx wrangler login` で Cloudflare に接続します。
2. 必要に応じて D1 のマイグレーションを適用します。

   ```sh
   npx wrangler d1 migrations apply jyoubu-site-content --remote --config cloudflare/api/wrangler.jsonc
   ```

3. Worker をそれぞれデプロイします。

   ```sh
   npx wrangler deploy --config cloudflare/api/wrangler.jsonc
   npx wrangler deploy --config cloudflare/admin/wrangler.jsonc
   ```

4. API URL や管理画面 URL を変更した場合は `site-config.js` も更新して、GitHub Pages に反映します。

## 画面・データの仕様

- 管理画面では施工事例の追加・編集・削除、画像アップロード、Instagram投稿 URL の追加・削除ができます。
- 施工事例は保存すると公開 API に反映されます。写真は JPEG・PNG・WebP の最大 10 MB を受け付けます。
- Instagram は公開投稿またはリールを埋め込み表示します。ストーリーズは保存期間や公開状態が限られるため、リンクカードとして表示します。
- 旧データと画像の初期表示は、Cloudflare 接続前も GitHub Pages で保持されます。

## 料金の目安

Cloudflare の現在の Free 利用枠では Workers は 1 日 100,000 リクエスト、D1 は 1 日 5,000,000 行読み取り・100,000 行書き込みと合計 5 GB、R2 は月 10 GB-month と月 100 万回の書き込み・1,000 万回の読み込みが含まれます。小規模サイトの通常利用なら Free 枠から始められます。上限を超える利用や Workers Paid への変更が必要になった場合は、契約前に料金を確認します。

公式情報: [Workers の料金](https://developers.cloudflare.com/workers/platform/pricing/)、[D1 の料金](https://developers.cloudflare.com/d1/platform/pricing/)、[R2 の料金](https://developers.cloudflare.com/r2/pricing/)、[Workers の Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
