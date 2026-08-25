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

「＋ 項目追加」「＋ カテゴリ追加」から、GitHubのソースを編集せずに項目を追加できます。追加内容はブラウザのlocalStorageに保存されます。現在は端末ごとの保存で、他の端末とは同期されません。
