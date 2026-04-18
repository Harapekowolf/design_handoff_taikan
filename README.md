# Handoff: 体感温度アプリ (Perceived Temperature App)

> HTMLモックアップを既存コードベースの環境(React / Next.js / Vue / SwiftUI等)で**再実装**してください。ここに含まれるHTMLは**デザインリファレンス**であり、本番コードではありません。

## Overview

ユーザーの現在地の**体感温度**を一目で確認できるモバイルファーストのウェブアプリ。気温だけでなく、日射・湿度・風速・服装・時間帯などから算出した体感温度を、**日向と日陰で分けて**表示するのが核となる差別化要素。全6画面(ホーム / 1時間ごと / 週間 / 服装 / 地域比較 / 服の色)。99%モバイル使用を想定。

主要プロトタイプは `体感温度アプリ - Mobile.html` (iPhone 402×874)。参考としてデスクトップ版 `体感温度アプリ.html` も同梱。

## About the Design Files

このバンドル内のHTMLは**デザインリファレンス**です。React + Babel(ブラウザ内トランスパイル)で書かれていますが、そのままデプロイするものではありません。ターゲットコードベースの既存の環境(React + TypeScript、Next.js、Vue、SwiftUI など)で、その設計パターン・UIライブラリ・スタイリング手法(CSS Modules / Tailwind / styled-components 等)を用いて**再実装**してください。まだ環境がない場合は、プロジェクトに最も適したフレームワーク(Next.js + TypeScript + Tailwind を推奨)を選定して実装してください。

## Fidelity

**ハイファイ (hifi)** — 最終的な色・タイポグラフィ・間隔・インタラクションをピクセルパーフェクトに規定しています。HTMLに書かれている値(色・サイズ・余白・フォント)を正確に再現してください。データはダミー(東京の2026年4月18日想定)。実装時は気象API(OpenWeatherMap / 気象庁API等)からの取得に差し替えてください。

---

## Design System / Tokens

### Colors

| Token | Hex | 用途 |
|---|---|---|
| `--ink` | `#0f0f0f` | 主要テキスト、強調 |
| `--ink-2` | `#2b2b2b` | 本文 |
| `--ink-3` | `#5a5a5a` | 副次テキスト |
| `--ink-4` | `#8a8a8a` | ラベル、キャプション |
| `--ink-5` | `#b8b8b8` | 最も薄いテキスト |
| `--rule` | `#e4e2dd` | 罫線 |
| `--rule-2` | `#efede8` | 薄い罫線、バー背景 |
| `--paper` | `#f7f5f0` | 画面背景(基調) |
| `--paper-2` | `#eeebe3` | 副背景、active行 |
| `--card` | `#ffffff` | カード、チャート背景 |
| `--accent` | `#d94b1a` | **唯一のアクセント色**。体感数字、NOWマーカー、日向ライン |
| (sun card) | `#f3ede2` / border `#e6dcc5` | 日向カード背景 |
| (shade card) | `#eae9e4` / border `#d9d7cf` | 日陰カード背景 |

**ダークテーマ (`ink`):** `--paper: #1a1a1a`, `--card: #222222`, `--ink: #f2f0ea`, `--ink-4: #6a6864`, `--rule: #333333`。アクセント色は不変。

### Typography

Google Fontsから:
- **Noto Sans JP** — 300/400/500/600/700。UI全般、本文。`font-feature-settings: "palt" 1;`
- **Fraunces** — 200/300/400/500。見出し、大きな数字、キャプション。イタリックを多用。
- **JetBrains Mono** — 300/400/500。数値、時刻、温度の単位。`font-feature-settings: "tnum" 1;`

主要スケール(モバイル):
- ヒーロー体感数字: Fraunces 200, 156px, line-height 0.8, letter-spacing -0.05em
- セクション見出し: Fraunces 400, 24px, letter-spacing -0.01em
- 場所名: Fraunces italic 400, 22px
- 本文: Noto Sans JP 400, 12–14px
- eyebrowラベル: 9px, uppercase, letter-spacing 0.26em, color `--ink-4`
- 単位/時刻: JetBrains Mono 10–12px

### Spacing / Radii

- 画面左右パディング: 22px
- ヘッダー上部: 56px(iOSステータスバーとの共存)
- カード内padding: 14–22px
- ボーダー半径: 0(カード・バーは基本的にシャープ)。トグルのみ 100px(pill)
- 罫線: 1px `--rule`。セクション区切りは `2px solid var(--ink)` もあり

---

## Screens

### 1. Home (`home`)

**目的:** 現在の体感温度を一目で。

**レイアウト:**
1. **ヒーロー** — eyebrow「Feels like · 日向/日陰」、特大数字(accent色)+ °C単位、イタリックのキャプション文、気温/湿度/風/UVの4項目インライン
2. **日向/日陰トグル** — pill型セグメントコントロール(3px padding)。アクティブは `--ink` 背景 + `--paper` テキスト。0.2s ease
3. **2カラム小カード** — 日向(warm beige背景)と日陰(cool gray背景)の体感数字・気温比
4. **「体感の内訳」** — 要因バー5本(気温/日射/湿度/風速/服装)。`grid-template-columns: 60px 1fr 62px`、バーは高さ4px、日射/湿度は`--accent`、風速は`--ink-4`、服装は文脈で変化
5. **「今日の一言」** — Adviceカード(`--card`背景 + `--rule`ボーダー + 14/16px padding)

**状態:** `inSun` (boolean、ローカル)、tweaks経由の`solarBoost`で日向体感に加算。

### 2. Hourly (`hourly`)

**目的:** 時間別の気温vs体感推移。

**レイアウト:**
1. **SVGラインチャート** — 340×160、y軸12–34°C、x軸6時–21時。dashed=気温、solid black=日陰体感、solid accent=日向体感。NOWの縦点線(`--accent`、stroke-dasharray 2 2)+ 現在点
2. **横スクロール時刻カード** — 各時刻44px幅、時刻/日向値(accent)/日陰値。NOWは`--ink`背景反転
3. **3つのInsightカード** — 日差しのピーク / 涼しくなる時間 / 風の影響

### 3. Weekly (`weekly`)

**目的:** 1週間の体感傾向。

**レイアウト:** `grid-template-columns: 28px 40px 1fr 58px` の行を7回。
- 曜日(Fraunces 20px、土=青系 `#3b5d8a`、日=赤系 `#8a3b3b`)
- 日付(Mono)
- 天気アイコン + ノート / 体感バー(気温レンジ灰色 + 日向体感オレンジ2px)
- 日向体感数値

下に週のサマリーテキストを2ブロック。

### 4. Outfit (`outfit`)

**目的:** 今日の体感に合った服装提案。

**レイアウト:**
- ヒーロー: eyebrow / 大見出し「半袖 + 薄手の羽織り」(Fraunces 34px) / サブコピー / 4項目コンテキスト行(日向/日陰/UV/風)
- `2px solid var(--ink)` 区切り
- 5行のアイテム: `grid 64px 1fr` — 部位ラベル / 選択(Fraunces 18px) + 代替案 + 注意書き(em italic)
- トップス、羽織り、ボトムス、足元、小物

### 5. Map (`map`)

**目的:** 日本全国の体感比較。

**レイアウト:**
- `aspect-ratio: 4/5` のマップキャンバス、グリッド線 + 簡略化した日本列島のSVGパス
- 8ピン(札幌/仙台/東京/名古屋/大阪/広島/福岡/那覇) — 東京がactive(accent、拡大1.4x)
- 下に主要都市テーブル: `grid 1fr 48px 48px 44px` = 都市/気温/体感/差。差が+なら`--accent`、-なら`--ink-3`

### 6. Colors (`colors`)

**目的:** 服の色による体感差(最大5.6°C)。

**レイアウト:**
- イントロ: 大見出し「服の色で、体感は5.6°C変わる」 + 解説文
- 2×3グリッド(aspect-ratio 3/4 / 各セル): 白/ベージュ/グレー/ネイビー/赤/黒。各セル背景=実色、Fraunces 18pxの色名(左上)、+°Cとsurface温度(左下)。文字色はコントラストで白/黒切替
- 下に3ノート(素材 / 今日のおすすめ / 冬の場合)

---

## Navigation

**下タブバー** — `position: absolute; bottom: 0`、6タブ等分。`backdrop-filter: blur(20px) saturate(180%)`、上に1pxルール。各タブ:

- 20pxアイコン(line-icon、`stroke-width: 1.3`、`currentColor`)
- 9pxラベル(letter-spacing 0.06em)
- 3px `--accent` ドット(activeのみ表示)
- Activeは `--ink` カラー、非Activeは `--ink-4`

---

## Interactions & Behavior

- **日向/日陰トグル (Home)** — 即座に体感数字とキャプションを切替。0.2s ease。
- **タブ切替** — 即時。現在画面は`localStorage`に保存 (`taikan.m.screen`)。
- **横スクロール (Hourly)** — ネイティブ`-webkit-overflow-scrolling: touch`、スクロールバー非表示。
- **Tweaksパネル** — `__activate_edit_mode` / `__deactivate_edit_mode` postMessageで開閉。値変更時は `__edit_mode_set_keys` を親に通知。これはプロトタイプ専用機能で本番では不要。代わりに「設定」画面で同等UIを提供。
- **位置情報ドットアニメーション** — 2.4s ease-in-outでパルス(opacity 1→0.4、scale 1→0.7)

## State Management

- `screen: 'home' | 'hourly' | 'weekly' | 'outfit' | 'map' | 'colors'` — ルーティング
- `inSun: boolean` — ホームの日向/日陰
- `tweaks: { theme: 'paper'|'snow'|'ink', clothing: 'light'|'medium'|'heavy', solarBoost: number }` — 設定
- 実装時は気象データを: `{ now, hourly[], weekly[], regions[] }` で取得。データ形状は `data.js` を参照。

## Data Shape

`data.js`参照。主な型:
```ts
type Now = { location: string; airTemp: number; feelsLikeSun: number; feelsLikeShade: number; humidity: number; windMS: number; windDir: string; uv: number; solar: number; /* ... */ };
type Hour = { h: number; air: number; sun: number; shade: number; hum: number; wind: number; solar: number };
type Day  = { day: string; date: string; air: number; sun: number; shade: number; min: number; max: number; cond: 'sun'|'partly'|'cloud'|'rain'; note: string };
type Region = { name: string; lat: number; lon: number; air: number; feels: number; delta: number; x: number; y: number; active?: boolean };
```

## 体感温度の計算(参考)

プロトタイプは事前計算値を表示しているだけ。実装時は以下を参考に:
- **日陰体感:** Heat Index (気温≥27°C) または Wind Chill (気温≤10°C) ベース + 湿度補正
- **日向体感:** 日陰体感 + 日射補正(Solar W/m² × ~0.007°C/W)、服装係数、風速減衰
- 気象庁のWBGT(暑さ指数)や、CanadianヒューマンコンフォートモデルのUTCIも参考になります

## Assets

- アイコン: すべてインラインSVG、外部依存なし。line-iconスタイル、`stroke-width: 1.3`、`currentColor`
- 日本地図: 簡略化SVGパス(スタイライズされたもの)。本番では実ベクター地図(GeoJSON + d3-geo 等)への差替え推奨
- フォント: Google Fonts 3種(上記参照)
- 画像アセット: なし

## Responsive

モバイル 402px幅を基準設計。タブレット/デスクトップは `styles.css`(デスクトップ版)のグリッドレイアウトを参考に、ブレークポイント 768px / 1024pxで2カラム化。99%モバイル使用前提なので、**モバイル優先**で実装してください。

## Files in this handoff

- `体感温度アプリ - Mobile.html` — **メインのモバイルリファレンス**
- `mobile-styles.css` — モバイル版の完全なCSS
- `mobile-app.jsx` — 全6画面のコンポーネント
- `ios-frame.jsx` — iOSフレーム(参考、本番では不要)
- `data.js` — ダミーデータとその型
- `体感温度アプリ.html` + `styles.css` + `app.jsx` + `screens-*.jsx` + `browser-window.jsx` — デスクトップ版リファレンス(2カラム以上のレスポンシブ参考)

## Recommended Stack

推奨スタックが未定の場合:

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS** — 配色はCSS変数で管理(Tailwindの`theme.extend.colors`経由)、Fraunces/Noto Sans JPをnext/fontで読み込み
- 気象データ: Open-Meteo API(無料、APIキー不要)または気象庁API
- 状態: React Context または Zustand(シンプル)
- アイコン: 現状のインラインSVGをReactコンポーネント化、または`lucide-react`で置換
- デプロイ: Vercel
