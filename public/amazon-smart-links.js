// Amazon スマートリンクモジュール
// メモ内容から商品を検索して表示

class AmazonSmartLinks {
  constructor() {
    this.associateId = "bonsoleil2019-22";

    // Amazon API設定
    this.API_BASE_URL =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://11yih81024.execute-api.ap-northeast-1.amazonaws.com/dev";

    // 広告表示管理
    this.displayedASINs = new Set(); // 表示済みASIN（重複防止）

    // ローカルストレージキャッシュ設定
    this.CACHE_KEY_PREFIX = "amazon_cache_";
    this.CACHE_EXPIRY_HOURS = 24 * 14; // 2週間キャッシュ
    this.HIDDEN_ADS_KEY = "amazon_hidden_ads"; // 非表示広告のASINリスト
  }

  // メモから広告要素を作成
  async createSmartLinkElement(memos, index) {
    if (!memos || memos.length === 0) return null;

    const memo = memos[0];
    const keyword = memo.content.trim();

    if (!keyword) return null;

    // まずローカルキャッシュをチェック
    const cachedData = this.getCachedData(keyword);
    if (cachedData) {
      console.log(`Using cached data for keyword: ${keyword}`);

      // キャッシュデータも検証
      if (
        !cachedData.title ||
        cachedData.title === "商品名取得失敗" ||
        !cachedData.price ||
        cachedData.price === 0
      ) {
        console.log(
          `Skipping invalid cached data: ${
            cachedData.title || "no title"
          }, price: ${cachedData.price || "no price"}`
        );
        // 無効なキャッシュは削除
        this.removeCachedData(keyword);
        return null;
      }

      return this.createAdElement(cachedData, index);
    }

    // キャッシュがない場合はAPIで商品を検索
    try {
      const apiUrl = `${this.API_BASE_URL}/api/amazon/search`;
      const token = localStorage.getItem("googleToken");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword }),
      });

      if (!response.ok) {
        console.error("API response not OK:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        return null;
      }

      const data = await response.json();
      if (!data.found || !data.asin) return null;

      // タイトルまたは価格情報が不正な場合はスキップ
      if (
        !data.title ||
        data.title === "商品名取得失敗" ||
        !data.price ||
        data.price === 0
      ) {
        console.log(
          `Skipping invalid product data: ${data.title || "no title"}, price: ${
            data.price || "no price"
          }`
        );
        return null;
      }

      // 成功した検索結果をキャッシュに保存
      this.setCachedData(keyword, data);

      return this.createAdElement(data, index);
    } catch (error) {
      console.error("API request failed:", error);
      return null;
    }
  }

  // ローカルストレージからキャッシュデータを取得
  getCachedData(keyword) {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + keyword;
      const cachedItem = localStorage.getItem(cacheKey);

      if (!cachedItem) return null;

      const cached = JSON.parse(cachedItem);
      const now = Date.now();
      const expiryTime = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      // 有効期限チェック
      if (now - cached.timestamp > expiryTime) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }

  // ローカルストレージにキャッシュデータを保存
  setCachedData(keyword, data) {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + keyword;
      const cacheData = {
        timestamp: Date.now(),
        data: data,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Cache write error:", error);
      // キャッシュ書き込みエラーは無視して処理を続行
    }
  }

  // 広告要素を作成
  createAdElement(data, index) {
    // 重複チェック - 同じASINが既に表示されている場合はスキップ
    if (this.displayedASINs.has(data.asin)) {
      console.log(`Skipping duplicate ASIN: ${data.asin}`);
      return null;
    }

    // 非表示チェック - ユーザーが削除した広告はスキップ
    if (this.isHiddenAd(data.asin)) {
      console.log(`Skipping hidden ASIN: ${data.asin}`);
      return null;
    }

    // 広告要素を作成
    const div = document.createElement("div");
    div.className = "memo-item ad-item amazon-smart-link";
    div.dataset.memoId = `ad-${index}-${Date.now()}`;

    const content = document.createElement("div");
    content.className = "memo-content";

    const link = document.createElement("a");
    link.href = `https://www.amazon.co.jp/dp/${data.asin}?tag=${this.associateId}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = data.title;
    link.style.color = "#0066c0";
    link.style.textDecoration = "underline";

    content.appendChild(link);
    div.appendChild(content);

    // メタデータ
    const metadata = document.createElement("div");
    metadata.className = "memo-metadata";

    const timestamp = document.createElement("div");
    timestamp.className = "memo-timestamp";
    if (data.price) {
      timestamp.style.display = "inline-flex";
      timestamp.style.alignItems = "center";
      timestamp.style.gap = "4px";

      // Amazonアイコンを追加
      const amazonIcon = document.createElement("img");
      amazonIcon.src = "/icons/amazon.png";
      amazonIcon.style.width = "12px";
      amazonIcon.style.height = "12px";
      amazonIcon.style.position = "relative";
      amazonIcon.style.top = "2px";

      const priceText = document.createElement("span");
      priceText.textContent = `¥${data.price.toLocaleString()}`;
      priceText.style.color = "#B12704";
      priceText.style.fontWeight = "bold";

      timestamp.appendChild(amazonIcon);
      timestamp.appendChild(priceText);
    }

    const creator = document.createElement("div");
    creator.className = "memo-creator";
    creator.textContent = "by Amazon";

    metadata.appendChild(timestamp);
    metadata.appendChild(creator);
    div.appendChild(metadata);

    // ボタン
    const hideBtn = document.createElement("button");
    hideBtn.className = "delete-btn";
    hideBtn.textContent = "非表示";
    hideBtn.onclick = (e) => {
      e.preventDefault();
      this.hideAd(data.asin);
      div.style.display = "none";
    };

    const viewBtn = document.createElement("button");
    viewBtn.className = "edit-btn";
    viewBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="transform: scaleX(-1)">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>`;
    viewBtn.onclick = (e) => {
      e.preventDefault();
      // カートに入れるURLを開く
      window.open(
        `https://www.amazon.co.jp/gp/aws/cart/add.html?ASIN.1=${data.asin}&Quantity.1=1&tag=${this.associateId}`,
        "_blank"
      );
    };

    div.appendChild(hideBtn);
    div.appendChild(viewBtn);

    // 表示成功時の処理
    this.displayedASINs.add(data.asin);
    console.log(`Ad displayed: ${data.title} (ASIN: ${data.asin})`);

    return div;
  }

  // 広告を非表示リストに追加
  hideAd(asin) {
    try {
      const hiddenAds = this.getHiddenAds();
      const now = Date.now();
      hiddenAds[asin] = now;
      localStorage.setItem(this.HIDDEN_ADS_KEY, JSON.stringify(hiddenAds));
      console.log(`Ad hidden: ${asin}`);
    } catch (error) {
      console.error("Failed to save hidden ad:", error);
    }
  }

  // 非表示リストを取得
  getHiddenAds() {
    try {
      const stored = localStorage.getItem(this.HIDDEN_ADS_KEY);
      if (!stored) return {};

      const hiddenAds = JSON.parse(stored);
      const now = Date.now();
      const expiryTime = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      // 期限切れのエントリを削除
      const activeHiddenAds = {};
      for (const [asin, timestamp] of Object.entries(hiddenAds)) {
        if (now - timestamp < expiryTime) {
          activeHiddenAds[asin] = timestamp;
        }
      }

      // クリーンアップされたリストを保存
      if (
        Object.keys(activeHiddenAds).length !== Object.keys(hiddenAds).length
      ) {
        localStorage.setItem(
          this.HIDDEN_ADS_KEY,
          JSON.stringify(activeHiddenAds)
        );
      }

      return activeHiddenAds;
    } catch (error) {
      console.error("Failed to get hidden ads:", error);
      return {};
    }
  }

  // 広告が非表示リストに含まれているかチェック
  isHiddenAd(asin) {
    const hiddenAds = this.getHiddenAds();
    return asin in hiddenAds;
  }

  // キャッシュデータを削除
  removeCachedData(keyword) {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + keyword;
      localStorage.removeItem(cacheKey);
      console.log(`Removed invalid cache for keyword: ${keyword}`);
    } catch (error) {
      console.error("Failed to remove cache:", error);
    }
  }
}

// グローバルに公開
window.AmazonSmartLinks = AmazonSmartLinks;
