## 程式開發設計思路
### 1️⃣ 環境搭建與 Firebase 設定

- 目標：初始化 Next.js 專案，配置 Firebase SDK 並連接到 Firestore
- 步驟：
  - 建立 Firebase 專案並啟用 Firestore
  - 在 Next.js 專案中安裝 `firebase` 套件
  - 建立 `lib/firebase.ts` 檔案，初始化 Firebase app
  - 將 Firebase 設定資訊儲存於 `.env`

### 2️⃣ 工具函式開發

- 目標：建立短網址生成與驗證的核心工具函式
- 步驟：
  - 在 `lib/utils.ts` 中建立處理函式：
    - `generateShortUrl(length)`: 生成指定長度的隨機短網址 ID
    - `isValidUrl(url)`: 驗證輸入的網址格式是否正確
    - `formatShortUrl(shortId, baseUrl)`: 將短網址 ID 格式化為完整的短網址

### 3️⃣ 短網址生成 API

- 目標：實現接收長網址、生成短網址、存儲至 Firestore 並返回短網址的 API
- 步驟：
  - 在 `app/api/shorten/route.ts` 中建立 `POST` 處理函式 
  - 驗證請求體中的 `originalUrl` 欄位是否存在 
  - 使用 `isValidUrl()` 函式驗證網址格式 
  - 透過迴圈機制確保短網址 ID 在 Firestore 中的唯一性（最多嘗試 10 次）
  - 將包含 `originalUrl`、`shortId`、`createdAt` 的資料存入 Firestore 的 `urls` 集合 
  - 使用 `formatShortUrl()` 組裝完整的短網址 
  - 返回包含 `success`、`data`（含 `id`、`originalUrl`、`shortUrl`、`shortId`、`createdAt`）的 JSON 回應 
  - 包含完整的錯誤處理機制，處理 Firebase 權限錯誤和服務不可用等情況 

### 4️⃣ 短網址重定向功能

- 目標：實現使用者訪問短網址時，系統能解析並重定向到原始長網址
- 步驟：
  - 建立動態路由 `app/[shortId]/route.ts` 以進行伺服器端重定向
  - 從路由參數中獲取 `shortId`
  - 查詢 Firestore 中是否有對應的 `shortId`
  - 若找到，使用 `NextResponse.redirect()` 功能重定向到原始長網址（狀態碼 302）
  - 若未找到，返回 400 錯誤並顯示「短網址不存在或已失效」訊息
  - 包含完整的錯誤處理機制，處理 Firebase 權限錯誤和服務不可用等情況

### 5️⃣ 前端介面開發

- 目標：建立簡單頁面，讓使用者可以輸入長網址，並顯示生成的短網址
- 步驟：
  - 在 `app/page.tsx` 中建立響應式表單介面，包含：
    - 網址輸入框（type="url"，必填驗證）
    - 提交按鈕（載入時顯示「產生中...」並禁用）
  - 實作狀態管理：
    - `originalUrl`：原始網址輸入
    - `shortUrl`：產生的短網址
    - `isLoading`：載入狀態
    - `error`：錯誤訊息
    - `copied`：複製成功提示
  - 處理表單提交事件，呼叫 `/api/shorten` API 並處理回應
  - 在頁面上顯示 API 返回的短網址結果區域
  - 提供功能按鈕：
    - 複製按鈕（使用 `navigator.clipboard.writeText`）
    - 前往按鈕（在新分頁開啟短網址）
  - 包含完整的錯誤處理和使用者體驗優化



---

## 📚 API 文件

### POST `/api/shorten`

**功能**：將長網址轉換為短網址

#### 請求方法
```
POST /api/shorten
```

#### 請求標頭
```
Content-Type: application/json
```

#### 請求體
```json
{
  "originalUrl": "https://example.com/very/long/url/path"
}
```

**參數說明**：
- `originalUrl` (string, 必填)：要縮短的原始網址，必須是有效的 URL 格式

#### 成功回應 (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "firestore_document_id",
    "originalUrl": "https://example.com/very/long/url/path",
    "shortUrl": "http://localhost:3000/abc123",
    "shortId": "abc123",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**回應欄位說明**：
- `success` (boolean)：操作是否成功
- `data.id` (string)：Firestore 文件 ID
- `data.originalUrl` (string)：原始長網址
- `data.shortUrl` (string)：完整的短網址
- `data.shortId` (string)：短網址識別碼
- `data.createdAt` (string)：建立時間 (ISO 8601 格式)

#### 錯誤回應

**400 Bad Request - 缺少必要欄位**
```json
{
  "error": "缺少必要的 originalUrl 欄位"
}
```

**400 Bad Request - 無效網址格式**
```json
{
  "error": "無效的網址格式"
}
```

**403 Forbidden - 資料庫權限不足**
```json
{
  "error": "資料庫權限不足"
}
```

**500 Internal Server Error - 無法生成唯一短網址**
```json
{
  "error": "無法生成唯一的短網址，請稍後再試"
}
```

**500 Internal Server Error - 伺服器錯誤**
```json
{
  "error": "伺服器內部錯誤，請稍後再試"
}
```

**503 Service Unavailable - 資料庫服務不可用**
```json
{
  "error": "資料庫服務暫時無法使用"
}
```

#### 注意事項
- 短網址 ID 長度為 6 個字元，使用英數字組合
- 系統會自動檢查短網址 ID 的唯一性，最多嘗試 10 次生成
- 所有網址資料會儲存在 Firebase Firestore 中
- 網址格式驗證支援 HTTP 和 HTTPS 協定

## 開發心得與經驗分享

### 開發過程中遇到的挑戰

#### 1. 變數命名衝突問題
在開發初期，我遇到了變數取名重複的問題，特別是在處理 `generateShortUrl` 範圍，導致變數覆蓋和邏輯錯誤。這提醒我在編寫程式碼時要：
- 仔細檢查變數命名的唯一性
- 使用有意義的變數名稱
- 適當使用 TypeScript 的型別檢查來避免此類問題

#### 2. 語法錯誤 - 多餘的大括號
在某個階段忘記移除多餘的 `}` 符號，導致網址解析功能出現錯誤。這個小疏忽讓我學到：
- 程式碼審查的重要性
- 使用 IDE 的語法檢查功能
- 定期測試每個功能模組

#### 3. 部署平台限制 - Cloudflare Pages
原本計劃將專案部署到 Cloudflare Pages，但發現該平台不支援 Next.js 的動態路由功能（如 `[shortId]` 路由）。這個限制讓我：
- 深入了解不同部署平台的技術限制
- 學習到靜態網站生成器與伺服器端渲染的差異

### 技術收穫

#### 1. Firebase Firestore 整合
- 學會了 Firestore 的查詢語法和資料結構設計
- 掌握了 Firebase 的錯誤處理機制
- 了解了 NoSQL 資料庫的優勢和限制

#### 2. Next.js API Routes
- 熟悉了 Next.js 13+ 的 App Router 架構
- 學會了動態路由的實作方式
- 掌握了 API 路由的錯誤處理和回應格式

#### 3. TypeScript 應用
- 提升了型別定義和介面設計能力
- 學會了泛型和聯合型別的實際應用
- 體驗到型別安全對程式碼品質的提升

### 未來發展可能性

#### 1. 功能擴展
- **自訂短網址**：允許使用者自訂短網址後綴
- **網址分析**：追蹤點擊次數、來源地區、裝置類型等統計資料
- **批次處理**：支援一次性縮短多個網址
- **QR Code 生成**：為每個短網址自動生成 QR Code
- **網址預覽**：在重定向前顯示目標網址預覽頁面

#### 2. 使用者體驗優化
- **使用者帳戶系統**：讓使用者管理自己的短網址
- **網址分類**：支援標籤和分類功能
- **搜尋功能**：在個人網址列表中搜尋
- **網址有效期**：設定網址過期時間
- **密碼保護**：為敏感網址添加密碼保護



這個專案讓我深刻體會到全端開發的複雜性，也讓我對現代 Web 開發技術有了更深入的理解。
