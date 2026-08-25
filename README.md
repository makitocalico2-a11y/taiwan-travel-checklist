# 台湾旅行チェックリスト

GitHub Pagesで公開する、HTML/CSS/Vanilla JavaScript製の台湾旅行用チェックリストです。

## 機能

- 持ち物 / 確認事項 / 機内持込 の3タブ
- カテゴリー別折りたたみ
- カテゴリー別進捗
- 全体進捗表示
- localStorageによるチェック状態保存
- 全展開 / 全折りたたみ
- チェック全解除
- スマートフォン対応
- 画面から項目を追加
- 画面からカテゴリを追加
- 追加した項目・カテゴリの削除
- 既存項目・既存カテゴリの削除（端末内で非表示）
- 削除した既存項目・カテゴリの復元
- 持ち物・機内持込品の用途／注意点説明表示
- 追加項目への任意説明文

## ファイル構成

```text
taiwan-travel-checklist/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── checklist-data.js
│   └── app.js
├── .nojekyll
└── README.md
```

## ローカル確認

単純な静的サイトなので `index.html` をブラウザで直接開くこともできます。

より本番に近い確認をする場合:

### Python

```bash
python -m http.server 8000
```

その後:

```text
http://localhost:8000/
```

## GitHub Pages

リポジトリをPublicにしたうえで、

1. Settings
2. Pages
3. Source: Deploy from a branch
4. Branch: main
5. Folder: / (root)
6. Save

公開URL例:

```text
https://<ユーザー名>.github.io/taiwan-travel-checklist/
```

## 注意

現在のチェック状態は `localStorage` に保存されるため、端末・ブラウザごとに独立しています。

友達全員で同じチェック状態を共有する場合は、次の段階でFirebase Firestore等の同期用バックエンドを追加してください。

公開リポジトリにはパスポート番号、予約番号、カード番号、秘密鍵などの機密情報を保存しないでください。


## 追加機能

「＋ 項目追加」「＋ カテゴリ追加」から、GitHubのソースを編集せずに項目を追加できます。項目には任意の説明文も登録できます。既存項目・既存カテゴリも画面上の「×」から削除でき、既存データは「削除項目を復元」から元に戻せます。追加・削除内容はブラウザのlocalStorageに保存されます。現在は端末ごとの保存で、他の端末とは同期されません。

## 編集するファイル

今後は次のファイルだけを編集してください。

- `index.html`
  - 画面のHTML構造を変更する場合
- `css/style.css`
  - 色、文字サイズ、余白、レイアウトなど見た目を変更する場合
- `js/checklist-data.js`
  - 最初から表示する持ち物、カテゴリ、説明文を追加・修正する場合
- `js/app.js`
  - チェック、追加、削除、復元、localStorageなどの動作を変更する場合
- `README.md`
  - 開発・運用メモ

ルート直下にあった `app.js`、`checklist-data.js`、`style.css` は、
`js/`・`css/` 配下のファイルと完全に重複していたため削除しました。

また、`index.html` 内に埋め込まれていたCSS・JavaScriptも削除し、
上記の外部ファイルを読み込む構成に統一しています。
