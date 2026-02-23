# frontend/Dockerfile

## ベースイメージ ##
FROM node:20-alpine

## 作業ディレクトリを設定 ##
WORKDIR /app

## package.json と lock ファイルを先にコピー ##
COPY package*.json ./

## 依存関係をインストール ##
RUN npm install

## アプリのコードをコピー ##
COPY . .

## Next.js 開発サーバーのポート（明示的に記載） ##
EXPOSE 3000

## コンテナ起動時に実行するコマンド ##
CMD ["npm", "run", "dev"]