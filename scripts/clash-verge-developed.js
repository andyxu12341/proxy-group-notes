function uniqPrepend(arr, items) {
  if (!Array.isArray(arr)) arr = [];
  for (var i = items.length - 1; i >= 0; i--) {
    var item = items[i];
    if (arr.indexOf(item) === -1) arr.unshift(item);
  }
  return arr;
}

function upsertGroup(groups, group) {
  for (var i = 0; i < groups.length; i++) {
    if (groups[i] && groups[i].name === group.name) {
      groups[i] = group;
      return groups;
    }
  }
  groups.unshift(group);
  return groups;
}

function removeGroupByName(groups, name) {
  var result = [];
  for (var i = 0; i < groups.length; i++) {
    if (groups[i] && groups[i].name === name) continue;
    result.push(groups[i]);
  }
  return result;
}

function removeProxyByName(proxies, name) {
  if (!Array.isArray(proxies)) return [];
  var result = [];
  for (var i = 0; i < proxies.length; i++) {
    if (proxies[i] === name) continue;
    result.push(proxies[i]);
  }
  return result;
}

function getProviderNames(config) {
  var providers = config && config["proxy-providers"];
  if (!providers || typeof providers !== "object") return [];
  var names = [];
  for (var key in providers) {
    if (Object.prototype.hasOwnProperty.call(providers, key)) names.push(key);
  }
  return names;
}

function makeRegex(items) {
  return "(?i)(" + items.join("|") + ")";
}

function attachSources(group, providerNames) {
  if (providerNames && providerNames.length > 0) {
    group.use = providerNames;
  } else {
    group["include-all"] = true;
    group["include-all-proxies"] = true;
  }
  return group;
}

function attachEntrySources(group, providerNames) {
  // 让 select 主入口除了自动代理组外，也能展开显示 provider 中的单个节点。
  // 有 proxy-providers 时使用 use；没有 provider 时回退 include-all。
  return attachSources(group, providerNames);
}

function createUrlTestGroup(name, filterRegex, excludeRegex, providerNames, tolerance) {
  var group = {
    name: name,
    type: "url-test",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: tolerance || 50,
    lazy: true,
    "expected-status": 204
  };
  if (filterRegex) group.filter = filterRegex;
  if (excludeRegex) group["exclude-filter"] = excludeRegex;
  return attachSources(group, providerNames);
}

function createMrsRuleProvider(behavior, url, path) {
  return {
    type: "http",
    behavior: behavior,
    format: "mrs",
    interval: 86400,
    path: path,
    url: url
  };
}

function injectRuleProviders(config) {
  var geosite = "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/";

  // 保留 MetaCubeX 中国大陆域名 rule-set；其他常见类别通过 GEOSITE/GEOIP 调用。
  config["rule-providers"] = {
    cn: createMrsRuleProvider("domain", geosite + "cn.mrs", "./rules/geosite-cn.mrs")
  };

  return config;
}

function injectRules(config) {
  var DEV_NAME = "🌐 发达地区自动";

  // 规则只保留两个走向：需要直连的走 DIRECT，需要代理的统一走“🌐 发达地区自动”。
  // “🇺🇸 美国自动”仅放在“节点选择”里供手动选择，不被 rules 自动调用。
  config.rules = [
    // Homestyler 被 cn 规则集收录，但这里优先指定走代理，避免被 RuleSet(cn) 截走。
    "DOMAIN-SUFFIX,homestyler.com," + DEV_NAME,
    "DOMAIN-SUFFIX,homestyler.sjv.io," + DEV_NAME,

    "RULE-SET,cn,DIRECT",
    "GEOSITE,private,DIRECT",
    "GEOSITE,onedrive,DIRECT",
    "GEOSITE,microsoft@cn,DIRECT",
    "GEOSITE,apple-cn,DIRECT",
    "GEOSITE,steam@cn,DIRECT",
    "GEOSITE,category-games@cn,DIRECT",

    "GEOSITE,openai," + DEV_NAME,
    "GEOSITE,youtube," + DEV_NAME,
    "GEOSITE,google," + DEV_NAME,
    "GEOSITE,github," + DEV_NAME,
    "GEOSITE,telegram," + DEV_NAME,
    "GEOSITE,twitter," + DEV_NAME,
    "GEOSITE,pixiv," + DEV_NAME,
    "GEOSITE,biliintl," + DEV_NAME,
    "GEOSITE,category-scholar-!cn," + DEV_NAME,
    "GEOSITE,geolocation-!cn," + DEV_NAME,
    "GEOSITE,cn,DIRECT",

    "GEOIP,private,DIRECT,no-resolve",
    "GEOIP,telegram," + DEV_NAME,
    "GEOIP,CN,DIRECT",
    "MATCH," + DEV_NAME
  ];

  return config;
}

function ensureEntryGroup(groups, groupNames, providerNames) {
  var STANDARD_ENTRY_NAME = "节点选择";
  var standardEntryExists = false;
  var entryNameRegex = /节点选择|代理|Proxy|PROXY|默认|GLOBAL|全局|选择/i;

  for (var i = 0; i < groups.length; i++) {
    var group = groups[i];
    if (!group) continue;

    if (!Array.isArray(group.proxies)) group.proxies = [];
    group.proxies = removeProxyByName(group.proxies, "♻️ 全部自动");

    if (group.name === STANDARD_ENTRY_NAME && group.type === "select") {
      group.proxies = uniqPrepend(group.proxies, groupNames);
      group = attachEntrySources(group, providerNames);
      groups[i] = group;
      standardEntryExists = true;
      continue;
    }

    if (group.type === "select" && entryNameRegex.test(group.name || "")) {
      group.proxies = uniqPrepend(group.proxies, groupNames);
      group = attachEntrySources(group, providerNames);
      groups[i] = group;
    }
  }

  if (!standardEntryExists) {
    var entryGroup = {
      name: STANDARD_ENTRY_NAME,
      type: "select",
      proxies: groupNames.concat(["DIRECT"])
    };
    groups = upsertGroup(groups, attachEntrySources(entryGroup, providerNames));
  }

  return groups;
}

function main(config, profileName) {
  if (!config) return config;
  if (!Array.isArray(config["proxy-groups"])) config["proxy-groups"] = [];

  var groups = config["proxy-groups"];
  var providerNames = getProviderNames(config);

  var DEV_NAME = "🌐 发达地区自动";
  var US_NAME = "🇺🇸 美国自动";
  var ALL_NAME = "♻️ 全部自动";

  // 保留美国、日本、台湾、新加坡的完整中英关键词；
  // 其他发达地区删除简体中文名称，降低 CC 小众地区假节点误入自动组的概率。
  var developedItems = [
    "台湾", "台灣", "\\btw\\b", "taiwan", "🇹🇼",
    "新加坡", "狮城", "獅城", "\\bsg\\b", "singapore", "🇸🇬",
    "日本", "东京", "東京", "大阪", "\\bjp\\b", "japan", "tokyo", "osaka", "🇯🇵",
    "韓國", "首爾", "\\bkr\\b", "korea", "seoul", "🇰🇷",
    "美国", "美國", "\\bus\\b", "\\busa\\b", "united states", "america", "美西", "美东", "美東", "美中", "美南", "洛杉矶", "洛杉磯", "los angeles", "san jose", "seattle", "new york", "dallas", "chicago", "washington", "🇺🇸",
    "\\bca\\b", "canada", "🇨🇦",
    "英國", "\\buk\\b", "united kingdom", "britain", "london", "倫敦", "🇬🇧",
    "澳大利亞", "\\bau\\b", "australia", "sydney", "melbourne", "墨爾本", "🇦🇺",
    "新西蘭", "\\bnz\\b", "new zealand", "🇳🇿",
    "\\bil\\b", "israel", "🇮🇱",
    "\\bch\\b", "switzerland", "🇨🇭",
    "\\bno\\b", "norway", "🇳🇴",
    "冰島", "\\bis\\b", "iceland", "🇮🇸",
    "\\bli\\b", "liechtenstein", "🇱🇮",
    "安道爾", "\\bad\\b", "andorra", "🇦🇩",
    "摩納哥", "\\bmc\\b", "monaco", "🇲🇨",
    "聖馬力諾", "san marino", "\\bsm\\b", "🇸🇲",
    "梵蒂岡", "vatican", "\\bva\\b", "🇻🇦",
    "奧地利", "\\bat\\b", "austria", "🇦🇹",
    "比利時", "\\bbe\\b", "belgium", "🇧🇪",
    "保加利亞", "\\bbg\\b", "bulgaria", "🇧🇬",
    "克羅地亞", "\\bhr\\b", "croatia", "🇭🇷",
    "\\bcy\\b", "cyprus", "🇨🇾",
    "\\bcz\\b", "czech", "czechia", "🇨🇿",
    "丹麥", "\\bdk\\b", "denmark", "🇩🇰",
    "愛沙尼亞", "\\bee\\b", "estonia", "🇪🇪",
    "芬蘭", "\\bfi\\b", "finland", "🇫🇮",
    "法國", "\\bfr\\b", "france", "paris", "🇫🇷",
    "德國", "\\bde\\b", "germany", "frankfurt", "法蘭克福", "🇩🇪",
    "希臘", "\\bgr\\b", "greece", "🇬🇷",
    "\\bhu\\b", "hungary", "🇭🇺",
    "愛爾蘭", "\\bie\\b", "ireland", "🇮🇪",
    "義大利", "\\bit\\b", "italy", "🇮🇹",
    "拉脫維亞", "\\blv\\b", "latvia", "🇱🇻",
    "\\blt\\b", "lithuania", "🇱🇹",
    "盧森堡", "\\blu\\b", "luxembourg", "🇱🇺",
    "馬耳他", "\\bmt\\b", "malta", "🇲🇹",
    "荷蘭", "\\bnl\\b", "netherlands", "amsterdam", "🇳🇱",
    "波蘭", "\\bpl\\b", "poland", "🇵🇱",
    "\\bpt\\b", "portugal", "🇵🇹",
    "羅馬尼亞", "\\bro\\b", "romania", "🇷🇴",
    "\\bsk\\b", "slovakia", "🇸🇰",
    "斯洛文尼亞", "\\bsi\\b", "slovenia", "🇸🇮",
    "\\bes\\b", "spain", "🇪🇸",
    "\\bse\\b", "sweden", "🇸🇪"
  ];

  var usItems = [
    "美国", "美國", "美西", "美东", "美東", "美中", "美南",
    "\\bus\\b", "\\busa\\b", "united states", "america",
    "洛杉矶", "洛杉磯", "los angeles", "san jose", "seattle", "new york", "dallas", "chicago", "washington", "🇺🇸"
  ];

  var infoItems = [
    "剩余流量", "套餐到期", "下次重置剩余", "重置剩余", "到期时间", "流量重置",
    "traffic", "expire", "expiration", "subscription", "subscribe", "reset", "plan",
    "官网", "官方", "通知", "重要", "客户端", "更新", "升级", "审核", "补偿", "备用域名", "域名", "旧节点", "帮助中心",
    "流量", "套餐", "到期", "重置", "剩余", "windows", "mac", "android", "ios-shadowrocket", "无法享受", "请尽快"
  ];

  var regionExcludeItems = [
    "香港", "hong[ -]?kong", "\\bhk\\b", "\\bhkg\\b", "🇭🇰",
    "澳门", "澳門", "macau", "\\bmo\\b", "🇲🇴",
    "俄罗斯", "俄羅斯", "russia", "\\bru\\b",
    "乌克兰", "烏克蘭", "ukraine", "\\bua\\b",
    "白俄罗斯", "白俄羅斯", "belarus", "\\bby\\b",
    "土耳其", "turkey", "\\btr\\b",
    "阿联酋", "阿聯酋", "uae", "\\bae\\b",
    "尼日利亚", "尼日利亞", "nigeria", "\\bng\\b",
    "菲律宾", "菲律賓", "philippines", "\\bph\\b",
    "泰国", "泰國", "thailand", "\\bth\\b",
    "越南", "vietnam", "\\bvn\\b",
    "印度尼西亚", "印度尼西亞", "印尼", "indonesia", "\\bid\\b",
    "印度", "india", "\\bin\\b",
    "马来西亚", "馬來西亞", "malaysia", "\\bmy\\b",
    "巴西", "brazil", "\\bbr\\b",
    "阿根廷", "argentina", "\\bar\\b",
    "南非", "south africa", "\\bza\\b"
  ];

  groups = removeGroupByName(groups, ALL_NAME);
  groups = upsertGroup(groups, createUrlTestGroup(US_NAME, makeRegex(usItems), makeRegex(infoItems), providerNames, 50));
  groups = upsertGroup(groups, createUrlTestGroup(DEV_NAME, makeRegex(developedItems), makeRegex(regionExcludeItems.concat(infoItems)), providerNames, 50));
  groups = ensureEntryGroup(groups, [DEV_NAME, US_NAME], providerNames);

  config["proxy-groups"] = groups;
  config = injectRuleProviders(config);
  config = injectRules(config);
  return config;
}
