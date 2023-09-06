<script lang="ts" setup>
defineOptions({
  name: 'Description',
})
</script>

<template>
  <div class="description">
    <VanCellGroup
      class="desc"
      title="說明"
    >
      <VanCell>
        <div class="disc">
          <p>
            感謝您使用開源網站"澳車北上小助手"，本網站的開發旨在為澳門市民提供方便快捷查詢方式。
          </p>
          <p>
            本網頁非網絡攻擊工具，純粹改寫原網站介面及使用方式，提供更好、更簡化的使用方法。
            市民可以使用本網站快速查詢申請餘額，或開啟自動定時查詢
            （需要保持網頁開啟），可以設定Telegarm訊息通知讓你第一時間收到餘額通知。請仔細閱讀免責聲明，善意使用工具，維護網絡秩序。
          </p>
        </div>
      </VanCell>
    </VanCellGroup>
    <VanCellGroup
      class="desc"
      title="直連教學"
    >
      <VanCell>
        <div class="disc">
          <p>
            右上角的設定 -> API ->
            直連，可將網頁的API設定為直連模式，由於原網站API有CORS（跨域源資源共用）限制，請使用瀏覧器安裝"Allow
            CORS"之類的插件，即可以用。
          </p>
          <p>優點：速度快、不會被判定為異常網絡行為</p>
          <p>缺點：需要安裝插件、移動端難以使用</p>
        </div>
      </VanCell>
    </VanCellGroup>
    <VanCellGroup
      class="desc"
      title="Proxy教學"
    >
      <VanCell>
        <div class="disc">
          <p>
            右上角的設定 -> API -> CORS
            Proxy，可將網頁的API設定為Proxy模式，可以使用作者自建的免費Proxy，或使用自行設置的Proxy地址。
          </p>
          <p>優點：任何設備都適用、無需插件、若自建廣東伺服器可以加速連線</p>
          <p>缺點：速度較直連慢、若使用公共Proxy可以被原網站判定為異常網絡行為</p>
        </div>
      </VanCell>
    </VanCellGroup>
    <VanCellGroup title="開發說明">
      <VanCell>
        <div class="disc">
          <p>
            此網站使用無伺服器設計
            （無伺服器不包括Telegarm通知功能），目的是讓使用者終端直接調用「"澳車北上"信息管理服务系统」提供的API，開發代碼已開源於Github上，有興趣的人士也可自行下載搭建，觀迎各界人士提供指導。
          </p>
          <p>
            <a
              target="_blank"
              href="https://github.com/oscar-wg/acbs-helper"
              style="text-decoration: underline"
              >源代碼地址</a
            >
          </p>
          <p>
            由於「"澳車北上"信息管理服务系统」API有CORS（跨域源資源共用）限制，此演示有直連或Proxy的設定，假如您的瀏覧器有安裝"Allow
            CORS"之類的插件，可以使用直連。Proxy版由作者托管的Proxy或自建Proxy，只作為API請求轉發，如不信任請不要使用Proxy。
          </p>
        </div>
      </VanCell>
    </VanCellGroup>
    <VanCellGroup title="免責聲明">
      <VanCell>
        <div class="disc">
          <p>
            在使用本網站之前，請您詳細閱讀以下免責聲明內容。使用本網站即表示您同意以下條款和條件。
          </p>
          <ul>
            <li>
              免責內容:
              本網站所提供的內容和資訊僅供參考。雖然我們已經盡力確保內容的準確性，但不保證內容的完整性、及時性和準確性。您在使用本網站的任何資訊時，需自行承擔風險。
            </li>
            <li>
              技術負擔:
              使用本網站所提供的任何代碼、工具、插件或指南時，您應該了解這些內容可能需要進一步的技術知識和經驗。我們不對因使用這些內容導致的技術問題、錯誤或損失負責。
            </li>
            <li>
              第三方連結:
              本網站可能包含指向第三方網站或資源的連結。這些連結僅為方便用戶提供，並不代表我們對該等第三方網站的支持或背書。我們對於這些第三方內容的準確性和可用性不承擔任何責任。
            </li>
            <li>
              程式碼安全性:
              雖然我們已經努力確保在我們的開源代碼中沒有已知的安全問題，但使用這些代碼可能存在風險。我們強烈建議您在使用前仔細審查和測試這些代碼，以確保其安全性。
            </li>
            <li>
              免責聲明的變更:
              我們保留隨時更改或更新此免責聲明的權利。我們建議您定期查看此頁面以獲取最新的免責聲明信息。
            </li>
          </ul>
          <p>
            總之，您使用此網站的一切內容和資源時，都是基於自己的判斷和風險承擔。我們不對使用本網站內容可能導致的任何直接或間接損失負責。
          </p>
        </div>
      </VanCell>
    </VanCellGroup>
  </div>
</template>

<style lang="scss">
.description {
  .disc {
    color: black;
    text-align: left;

    p:not(:last-child) {
      margin-bottom: 5px;
    }
    p:last-child {
      margin-top: 5px;
    }
    li {
      list-style: disc;
      margin-left: 25px;
    }
  }
}
</style>
