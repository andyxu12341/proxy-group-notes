function uniqPrepend(arr, items) {
  if (!Array.isArray(arr)) arr = [];
  for (var i = items.length - 1; i >= 0; i--) {
    var item = items[i];
    var exists = false;
    for (var j = 0; j < arr.length; j++) {
      if (arr[j] === item) {
        exists = true;
        break;
      }
    }
    if (!exists) arr.unshift(item);
  }
  return arr;
}

function removeItems(arr, items) {
  if (!Array.isArray(arr)) return [];
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    var keep = true;
    for (var j = 0; j < items.length; j++) {
      if (arr[i] === items[j]) {
        keep = false;
        break;
      }
    }
    if (keep) result.push(arr[i]);
  }
  return result;
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
  if (!Array.isArray(groups)) return [];
  var result = [];
  for (var i = 0; i < groups.length; i++) {
    if (groups[i] && groups[i].name === name) continue;
    result.push(groups[i]);
  }
  return result;
}

function main(config, profileName) {
  if (!config) return config;

  if (!Array.isArray(config["proxy-groups"])) {
    config["proxy-groups"] = [];
  }

  var groups = config["proxy-groups"];

  var OLD_LB_NAME = "🔁 非港轮询";
  var DEV_NAME = "🌐 发达地区自动";

  groups = removeGroupByName(groups, OLD_LB_NAME);

  var developedRegex =
    "(?i)(" +
    "台湾|台灣|\\btw\\b|taiwan|🇹🇼" +
    "|新加坡|狮城|獅城|\\bsg\\b|singapore|🇸🇬" +
    "|日本|东京|東京|大阪|\\bjp\\b|japan|tokyo|osaka|🇯🇵" +
    "|韩国|韓國|首尔|首爾|\\bkr\\b|korea|seoul|🇰🇷" +
    "|英国|英國|\\buk\\b|united kingdom|london|🇬🇧" +
    "|法国|法國|\\bfr\\b|france|🇫🇷" +
    "|德国|德國|\\bde\\b|germany|🇩🇪" +
    "|意大利|\\bit\\b|italy|🇮🇹" +
    "|挪威|\\bno\\b|norway|🇳🇴" +
    "|美国|美國|\\bus\\b|\\busa\\b|united states|america|los angeles|san jose|🇺🇸" +
    "|加拿大|\\bca\\b|canada|🇨🇦" +
    "|澳大利亚|澳大利亞|澳洲|\\bau\\b|australia|🇦🇺" +
    "|荷兰|荷蘭|\\bnl\\b|netherlands|🇳🇱" +
    "|瑞典|\\bse\\b|sweden|🇸🇪" +
    "|芬兰|芬蘭|\\bfi\\b|finland|🇫🇮" +
    "|丹麦|丹麥|\\bdk\\b|denmark|🇩🇰" +
    "|爱尔兰|愛爾蘭|\\bie\\b|ireland|🇮🇪" +
    "|西班牙|\\bes\\b|spain|🇪🇸" +
    "|奥地利|奧地利|\\bat\\b|austria|🇦🇹" +
    "|比利时|比利時|\\bbe\\b|belgium|🇧🇪" +
    "|卢森堡|盧森堡|\\blu\\b|luxembourg|🇱🇺" +
    "|瑞士|\\bch\\b|switzerland|🇨🇭" +
    "|新西兰|新西蘭|\\bnz\\b|new zealand|🇳🇿" +
    ")";

  var excludeRegex =
    "(?i)(" +
    "香港|hong[ -]?kong|\\bhk\\b|\\bhkg\\b|🇭🇰" +
    "|澳门|澳門|macau|\\bmo\\b|🇲🇴" +
    "|剩余流量|套餐到期|下次重置剩余|重置剩余|到期时间|流量重置" +
    "|traffic|expire|expiration|subscription|subscribe|reset|plan" +
    "|官网|流量|套餐|到期|重置|剩余" +
    ")";

  groups = upsertGroup(groups, {
    name: DEV_NAME,
    type: "url-test",
    "include-all": true,
    "include-all-proxies": true,
    filter: developedRegex,
    "exclude-filter": excludeRegex,
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 50,
    lazy: true,
    "expected-status": 204
  });

  var injected = false;
  var entryNameRegex = /节点选择|代理|Proxy|PROXY|默认|GLOBAL|全局|选择/i;

  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    if (!g || g.type !== "select") continue;

    if (!Array.isArray(g.proxies)) g.proxies = [];
    g.proxies = removeItems(g.proxies, [OLD_LB_NAME]);

    if (entryNameRegex.test(g.name || "")) {
      g.proxies = uniqPrepend(g.proxies, [DEV_NAME]);
      injected = true;
    }
  }

  if (!injected) {
    for (var k = 0; k < groups.length; k++) {
      var g2 = groups[k];
      if (g2 && g2.type === "select") {
        if (!Array.isArray(g2.proxies)) g2.proxies = [];
        g2.proxies = removeItems(g2.proxies, [OLD_LB_NAME]);
        g2.proxies = uniqPrepend(g2.proxies, [DEV_NAME]);
        break;
      }
    }
  }

  config["proxy-groups"] = groups;
  return config;
}
