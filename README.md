# 澳車北上小助手
歡迎來到開源的 "澳車北上小助手" 網站項目！這個項目旨在使用 Serverless 架構來建立一個「"澳車北上"信息管理服务系统」二次開發的快速查詢網站。

## 演示地址
[Link](https://acbs-helper.vercel.app/)

## 特點
- [Serverless](https://www.serverless.com/)
- 前端使用 [Vue.js](https://vuejs.org/) 和 [Vant](https://vant-contrib.gitee.io/vant/) UI 框架

## 使用介紹
### 提要
本項目以無伺服器的安全方式二次開發一個子系統，只提供餘額查詢和通知，網頁內的API請求由使用者裝置發出至"澳車北上小助手"，不涉及第三方伺服器之攻擊，使用者需自負使用的責任。

### 登入
使用原網站API的登入賬戶，若勾選「本機儲存登入資訊」，網頁會將資料儲存於瀏覽器的LocalStorage，由此網頁下次開啟時使用。

### 查詢
- 點擊"查詢預約情況"，網頁會發送請求至原網站API取得剩額資料，顯示在日曆中
- 若開啟自動更新，網頁會以設定的時間間隔內隨機自動請求，免除人手操作
- 若查詢結果有餘額，頁面上方會跳出綠色訊息通知，若有開啟Telegarm通知設定，則會發送即時訊息通知

### 設定
- Telegarm通知設定請見頁面說明，可以通知個人或群組
- API設定，由於CORS限制，一般使用需透過Reserve Proxy請求來解決；若不信任Proxy可設定為直連方式，通過瀏覽器插件來突破CORS（例如Chrome的CORS Unblock），即可直連原網站API。

## 聯繫我們
如果您對於這個項目有任何問題、建議或反饋，您可以通過 GitHub Issue 留言。
感謝您的支持和參與！

## 支持
如果你覺得這個項目幫助了你，可以為作者買一杯Coffee表示鼓勵
[Buy me a coffee](https://www.buymeacoffee.com/oscarmo)

更多二次開發的功能將在其它開發項目上進行，如有興趣了解其他開發項目，觀迎留下聯絡方式。

## 授權
本項目基於 [MIT 授權](LICENSE)進行許可。
