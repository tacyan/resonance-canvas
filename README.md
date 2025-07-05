# Dimensional Resonance Canvas

3D音響反応型インタラクティブアートキャンバス - Three.js、React、TypeScriptを使用した没入型視覚体験

## 🎨 特徴

- **3Dインタラクション**: マウスクリックで幾何学的な3D図形を生成
- **音響反応**: マイク入力による音声解析と視覚効果のリアルタイム連動
- **パーティクルシステム**: 数千個のパーティクルによる動的エフェクト
- **ポストプロセッシング**: ブルーム効果などの高品質なビジュアルエフェクト
- **モバイル対応**: レスポンシブデザインとタッチ操作対応

## 🚀 開始方法

### 前提条件

- Node.js 18以上
- npm または yarn
- モダンブラウザ（Chrome、Firefox、Safari、Edge）

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### ビルド

```bash
# プロダクションビルド
npm run build

# ビルドのプレビュー
npm run preview
```

## 🎮 操作方法

- **クリック**: 3D図形を生成
- **マウス移動**: パーティクルエフェクトとインタラクション
- **ドラッグ**: カメラの回転
- **スクロール**: ズームイン/アウト
- **音声入力**: マイクを有効にして音響反応を体験

## 🛠️ 技術スタック

- **React 18**: UIフレームワーク
- **TypeScript**: 型安全な開発
- **Three.js**: 3Dグラフィックスエンジン
- **@react-three/fiber**: React用Three.jsレンダラー
- **@react-three/drei**: Three.jsユーティリティ
- **@react-three/postprocessing**: ポストエフェクト
- **Web Audio API**: 音響解析
- **Vite**: 高速ビルドツール

## 📁 プロジェクト構造

```
src/
├── App.tsx                 # メインアプリケーションコンポーネント
├── components/
│   ├── Scene.tsx          # 3Dシーンのセットアップ
│   ├── GeometryGenerator.tsx  # 3D図形生成ロジック
│   ├── ParticleSystem.tsx     # パーティクルエフェクト
│   ├── AudioVisualizer.tsx    # 音響解析と視覚化
│   ├── MouseInteraction.tsx   # マウスインタラクション
│   └── ControlPanel.tsx       # UIコントロール
├── main.tsx               # エントリーポイント
└── index.css             # グローバルスタイル
```

## ⚡ パフォーマンス

- 60FPS安定動作を目標
- 最大10,000パーティクル同時処理
- WebGLによるGPUアクセラレーション
- 効率的なメモリ管理とオブジェクトプーリング

## 🔧 カスタマイズ

コントロールパネルから以下の設定が可能:

- ビジュアルモード切り替え（Visual/Audio/Hybrid）
- パーティクルエフェクトのON/OFF
- ポストプロセッシングのON/OFF
- 音響感度の調整

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容について議論してください。