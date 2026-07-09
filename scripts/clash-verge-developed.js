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
  if (!config["rule-providers"] || typeof config["rule-providers"] !== "object") {
    config["rule-providers"] = {};
  }

  var geosite = "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/";
  var geoip = "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/";
  var rules = {
    reject: createMrsRuleProvider("domain", geosite + "category-ads-all.mrs", "./rules/geosite-category-ads-all.mrs"),
    cn: createMrsRuleProvider("domain", geosite + "cn.mrs", "./rules/geosite-cn.mrs"),
    openai: createMrsRuleProvider("domain", geosite + "openai.mrs", "./rules/geosite-openai.mrs"),
    google: createMrsRuleProvider("domain", geosite + "google.mrs", "./rules/geosite-google.mrs"),
    youtube: createMrsRuleProvider("domain", geosite + "youtube.mrs", "./rules/geosite-youtube.mrs"),
    telegram: createMrsRuleProvider("domain", geosite + "telegram.mrs", "./rules/geosite-telegram.mrs"),
    telegram_ip: createMrsRuleProvider("ipcidr", geoip + "telegram.mrs", "./rules/geoip-telegram.mrs"),
    github: createMrsRuleProvider("domain", geosite + "github.mrs", "./rules/geosite-github.mrs"),
    microsoft: createMrsRuleProvider("domain", geosite + "microsoft.mrs", "./rules/geosite-microsoft.mrs"),
    apple: createMrsRuleProvider("domain", geosite + "apple.mrs", "./rules/geosite-apple.mrs"),
    netflix: createMrsRuleProvider("domain", geosite + "netflix.mrs", "./rules/geosite-netflix.mrs"),
    spotify: createMrsRuleProvider("domain", geosite + "spotify.mrs", "./rules/geosite-spotify.mrs")
  };

  for (var name in rules) {
    if (Object.prototype.hasOwnProperty.call(rules, name)) {
      config["rule-providers"][name] = rules[name];
    }
  }

  return config;
}

function startsWithAny(value, prefixes) {
  if (typeof value !== "string") return false;
  var lower = value.toLowerCase();
  for (var i = 0; i < prefixes.length; i++) {
    if (lower.indexOf(prefixes[i]) === 0) return true;
  }
  return false;
}

function isManagedRule(rule) {
  return startsWithAny(rule, [
    "rule-set,reject,",
    "rule-set,openai,",
    "domain-suffix,chatgpt.com,",
    "domain-suffix,oaistatic.com,",
    "domain-suffix,oaiusercontent.com,",
    "domain-suffix,anthropic.com,",
    "domain-suffix,claude.ai,",
    "domain-suffix,gemini.google.com,",
    "domain-suffix,perplexity.ai,",
    "domain-suffix,poe.com,",
    "domain-suffix,notebooklm.google.com,",
    "domain-suffix,aistudio.google.com,",
    "domain-suffix,ai.google.dev,",
    "domain-suffix,makersuite.google.com,",
    "domain-suffix,generativelanguage.googleapis.com,",
    "domain-suffix,openrouter.ai,",
    "rule-set,google,",
    "rule-set,youtube,",
    "rule-set,telegram,",
    "rule-set,telegram_ip,",
    "rule-set,github,",
    "rule-set,netflix,",
    "rule-set,spotify,",
    "rule-set,apple,",
    "rule-set,microsoft,",
    "rule-set,cn,",
    "geoip,private,",
    "geoip,cn,",
    "match,"
  ]);
}

function injectRules(config) {
  var DEV_NAME = "🌐 发达地区自动";
  var ENTRY_NAME = "节点选择";
  var existingRules = Array.isArray(config.rules) ? config.rules : [];
  var customRules = [];

  for (var i = 0; i < existingRules.length; i++) {
    var rule = existingRules[i];
    if (!isManagedRule(rule)) customRules.push(rule);
  }

  var headRules = [
    "RULE-SET,reject,REJECT",
    "RULE-SET,openai," + DEV_NAME,
    "DOMAIN-SUFFIX,chatgpt.com," + DEV_NAME,
    "DOMAIN-SUFFIX,oaistatic.com," + DEV_NAME,
    "DOMAIN-SUFFIX,oaiusercontent.com," + DEV_NAME,
    "DOMAIN-SUFFIX,anthropic.com," + DEV_NAME,
    "DOMAIN-SUFFIX,claude.ai," + DEV_NAME,
    "DOMAIN-SUFFIX,gemini.google.com," + DEV_NAME,
    "DOMAIN-SUFFIX,perplexity.ai," + DEV_NAME,
    "DOMAIN-SUFFIX,poe.com," + DEV_NAME,
    "DOMAIN-SUFFIX,notebooklm.google.com," + DEV_NAME,
    "DOMAIN-SUFFIX,aistudio.google.com," + DEV_NAME,
    "DOMAIN-SUFFIX,ai.google.dev," + DEV_NAME,
    "DOMAIN-SUFFIX,makersuite.google.com," + DEV_NAME,
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com," + DEV_NAME,
    "DOMAIN-SUFFIX,openrouter.ai," + DEV_NAME,
    "RULE-SET,google," + DEV_NAME,
    "RULE-SET,youtube," + DEV_NAME,
    "RULE-SET,telegram," + DEV_NAME,
    "RULE-SET,telegram_ip," + DEV_NAME + ",no-resolve",
    "RULE-SET,github," + DEV_NAME,
    "RULE-SET,netflix," + ENTRY_NAME,
    "RULE-SET,spotify," + ENTRY_NAME,
    "RULE-SET,apple,DIRECT",
    "RULE-SET,microsoft,DIRECT"
  ];

  var tailRules = [
    "RULE-SET,cn,DIRECT",
    "GEOIP,private,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT",
    "MATCH," + ENTRY_NAME
  ];

  config.rules = headRules.concat(customRules).concat(tailRules);
  return config;
}

function ensureEntryGroup(groups, groupNames, providerNames) {
  var STANDARD_ENTRY_NAME = "节点选择";
  var standardEntryExists = false;
  var entryNameRegex = /节点选择|代理|Proxy|PROXY|默认|GLOBAL|全局|选择/i;

  for (var i = 0; i < groups.length; i++) {
    var group = groups[i];
    if (!group) continue;

    if (group.name === STANDARD_ENTRY_NAME && group.type === "select") {
      if (!Array.isArray(group.proxies)) group.proxies = [];
      group.proxies = uniqPrepend(group.proxies, groupNames);
      group = attachEntrySources(group, providerNames);
      groups[i] = group;
      standardEntryExists = true;
      continue;
    }

    if (group.type === "select" && entryNameRegex.test(group.name || "")) {
      if (!Array.isArray(group.proxies)) group.proxies = [];
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

  var developedItems = [
    "台湾", "台灣", "\\btw\\b", "taiwan", "🇹🇼",
    "新加坡", "狮城", "獅城", "\\bsg\\b", "singapore", "🇸🇬",
    "日本", "东京", "東京", "大阪", "\\bjp\\b", "japan", "tokyo", "osaka", "🇯🇵",
    "韩国", "韓國", "首尔", "首爾", "\\bkr\\b", "korea", "seoul", "🇰🇷",
    "美国", "美國", "\\bus\\b", "\\busa\\b", "united states", "america", "美西", "美东", "美東", "美中", "美南", "los angeles", "san jose", "seattle", "new york", "dallas", "chicago", "washington", "🇺🇸",
    "加拿大", "\\bca\\b", "canada", "🇨🇦",
    "英国", "英國", "\\buk\\b", "united kingdom", "britain", "london", "伦敦", "倫敦", "🇬🇧",
    "澳大利亚", "澳大利亞", "澳洲", "\\bau\\b", "australia", "sydney", "melbourne", "悉尼", "墨尔本", "墨爾本", "🇦🇺",
    "新西兰", "新西蘭", "\\bnz\\b", "new zealand", "🇳🇿",
    "以色列", "\\bil\\b", "israel", "🇮🇱",
    "瑞士", "\\bch\\b", "switzerland", "🇨🇭",
    "挪威", "\\bno\\b", "norway", "🇳🇴",
    "冰岛", "冰島", "\\bis\\b", "iceland", "🇮🇸",
    "列支敦士登", "\\bli\\b", "liechtenstein", "🇱🇮",
    "安道尔", "安道爾", "\\bad\\b", "andorra", "🇦🇩",
    "摩纳哥", "摩納哥", "\\bmc\\b", "monaco", "🇲🇨",
    "圣马力诺", "聖馬力諾", "san marino", "\\bsm\\b", "🇸🇲",
    "梵蒂冈", "梵蒂岡", "vatican", "\\bva\\b", "🇻🇦",
    "奥地利", "奧地利", "\\bat\\b", "austria", "🇦🇹",
    "比利时", "比利時", "\\bbe\\b", "belgium", "🇧🇪",
    "保加利亚", "保加利亞", "\\bbg\\b", "bulgaria", "🇧🇬",
    "克罗地亚", "克羅地亞", "\\bhr\\b", "croatia", "🇭🇷",
    "塞浦路斯", "\\bcy\\b", "cyprus", "🇨🇾",
    "捷克", "\\bcz\\b", "czech", "czechia", "🇨🇿",
    "丹麦", "丹麥", "\\bdk\\b", "denmark", "🇩🇰",
    "爱沙尼亚", "愛沙尼亞", "\\bee\\b", "estonia", "🇪🇪",
    "芬兰", "芬蘭", "\\bfi\\b", "finland", "🇫🇮",
    "法国", "法國", "\\bfr\\b", "france", "paris", "巴黎", "🇫🇷",
    "德国", "德國", "\\bde\\b", "germany", "frankfurt", "法兰克福", "法蘭克福", "🇩🇪",
    "希腊", "希臘", "\\bgr\\b", "greece", "🇬🇷",
    "匈牙利", "\\bhu\\b", "hungary", "🇭🇺",
    "爱尔兰", "愛爾蘭", "\\bie\\b", "ireland", "🇮🇪",
    "意大利", "義大利", "\\bit\\b", "italy", "🇮🇹",
    "拉脱维亚", "拉脫維亞", "\\blv\\b", "latvia", "🇱🇻",
    "立陶宛", "\\blt\\b", "lithuania", "🇱🇹",
    "卢森堡", "盧森堡", "\\blu\\b", "luxembourg", "🇱🇺",
    "马耳他", "馬耳他", "\\bmt\\b", "malta", "🇲🇹",
    "荷兰", "荷蘭", "\\bnl\\b", "netherlands", "amsterdam", "阿姆斯特丹", "🇳🇱",
    "波兰", "波蘭", "\\bpl\\b", "poland", "🇵🇱",
    "葡萄牙", "\\bpt\\b", "portugal", "🇵🇹",
    "罗马尼亚", "羅馬尼亞", "\\bro\\b", "romania", "🇷🇴",
    "斯洛伐克", "\\bsk\\b", "slovakia", "🇸🇰",
    "斯洛文尼亚", "斯洛文尼亞", "\\bsi\\b", "slovenia", "🇸🇮",
    "西班牙", "\\bes\\b", "spain", "🇪🇸",
    "瑞典", "\\bse\\b", "sweden", "🇸🇪"
  ];

  var usItems = [
    "美国", "美國", "美西", "美东", "美東", "美中", "美南",
    "\\bus\\b", "\\busa\\b", "united states", "america",
    "los angeles", "san jose", "seattle", "new york", "dallas", "chicago", "washington", "🇺🇸"
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

  groups = upsertGroup(groups, createUrlTestGroup(ALL_NAME, null, makeRegex(infoItems), providerNames, 50));
  groups = upsertGroup(groups, createUrlTestGroup(US_NAME, makeRegex(usItems), makeRegex(infoItems), providerNames, 50));
  groups = upsertGroup(groups, createUrlTestGroup(DEV_NAME, makeRegex(developedItems), makeRegex(regionExcludeItems.concat(infoItems)), providerNames, 50));
  groups = ensureEntryGroup(groups, [DEV_NAME, US_NAME, ALL_NAME], providerNames);

  config["proxy-groups"] = groups;
  config = injectRuleProviders(config);
  config = injectRules(config);
  return config;
}
