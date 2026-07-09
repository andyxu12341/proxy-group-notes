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

function main(config, profileName) {
  if (!config) return config;

  if (!Array.isArray(config["proxy-groups"])) {
    config["proxy-groups"] = [];
  }

  var groups = config["proxy-groups"];
  var DEV_NAME = "🌐 发达地区自动";

  // 非港澳发达国家 / 地区 + 全部欧盟成员国。
  // 用于 Clash Verge / Mihomo 的 filter 字段。
  var developedRegex =
    "(?i)(" +
    "台湾|台灣|\\btw\\b|taiwan|🇹🇼" +
    "|新加坡|狮城|獅城|\\bsg\\b|singapore|🇸🇬" +
    "|日本|东京|東京|大阪|\\bjp\\b|japan|tokyo|osaka|🇯🇵" +
    "|韩国|韓國|首尔|首爾|\\bkr\\b|korea|seoul|🇰🇷" +
    "|美国|美國|\\bus\\b|\\busa\\b|united states|america|美西|美东|美東|美中|美南|los angeles|san jose|seattle|new york|dallas|chicago|washington|🇺🇸" +
    "|加拿大|\\bca\\b|canada|🇨🇦" +
    "|英国|英國|\\buk\\b|united kingdom|britain|london|伦敦|倫敦|🇬🇧" +
    "|澳大利亚|澳大利亞|澳洲|\\bau\\b|australia|sydney|melbourne|悉尼|墨尔本|墨爾本|🇦🇺" +
    "|新西兰|新西蘭|\\bnz\\b|new zealand|🇳🇿" +
    "|以色列|\\bil\\b|israel|🇮🇱" +
    "|瑞士|\\bch\\b|switzerland|🇨🇭" +
    "|挪威|\\bno\\b|norway|🇳🇴" +
    "|冰岛|冰島|\\bis\\b|iceland|🇮🇸" +
    "|列支敦士登|\\bli\\b|liechtenstein|🇱🇮" +
    "|安道尔|安道爾|\\bad\\b|andorra|🇦🇩" +
    "|摩纳哥|摩納哥|\\bmc\\b|monaco|🇲🇨" +
    "|圣马力诺|聖馬力諾|san marino|\\bsm\\b|🇸🇲" +
    "|梵蒂冈|梵蒂岡|vatican|\\bva\\b|🇻🇦" +
    "|奥地利|奧地利|\\bat\\b|austria|🇦🇹" +
    "|比利时|比利時|\\bbe\\b|belgium|🇧🇪" +
    "|保加利亚|保加利亞|\\bbg\\b|bulgaria|🇧🇬" +
    "|克罗地亚|克羅地亞|\\bhr\\b|croatia|🇭🇷" +
    "|塞浦路斯|\\bcy\\b|cyprus|🇨🇾" +
    "|捷克|\\bcz\\b|czech|czechia|🇨🇿" +
    "|丹麦|丹麥|\\bdk\\b|denmark|🇩🇰" +
    "|爱沙尼亚|愛沙尼亞|\\bee\\b|estonia|🇪🇪" +
    "|芬兰|芬蘭|\\bfi\\b|finland|🇫🇮" +
    "|法国|法國|\\bfr\\b|france|paris|巴黎|🇫🇷" +
    "|德国|德國|\\bde\\b|germany|frankfurt|法兰克福|法蘭克福|🇩🇪" +
    "|希腊|希臘|\\bgr\\b|greece|🇬🇷" +
    "|匈牙利|\\bhu\\b|hungary|🇭🇺" +
    "|爱尔兰|愛爾蘭|\\bie\\b|ireland|🇮🇪" +
    "|意大利|義大利|\\bit\\b|italy|🇮🇹" +
    "|拉脱维亚|拉脫維亞|\\blv\\b|latvia|🇱🇻" +
    "|立陶宛|\\blt\\b|lithuania|🇱🇹" +
    "|卢森堡|盧森堡|\\blu\\b|luxembourg|🇱🇺" +
    "|马耳他|馬耳他|\\bmt\\b|malta|🇲🇹" +
    "|荷兰|荷蘭|\\bnl\\b|netherlands|amsterdam|阿姆斯特丹|🇳🇱" +
    "|波兰|波蘭|\\bpl\\b|poland|🇵🇱" +
    "|葡萄牙|\\bpt\\b|portugal|🇵🇹" +
    "|罗马尼亚|羅馬尼亞|\\bro\\b|romania|🇷🇴" +
    "|斯洛伐克|\\bsk\\b|slovakia|🇸🇰" +
    "|斯洛文尼亚|斯洛文尼亞|\\bsi\\b|slovenia|🇸🇮" +
    "|西班牙|\\bes\\b|spain|🇪🇸" +
    "|瑞典|\\bse\\b|sweden|🇸🇪" +
    ")";

  var excludeRegex =
    "(?i)(" +
    "香港|hong[ -]?kong|\\bhk\\b|\\bhkg\\b|🇭🇰" +
    "|澳门|澳門|macau|\\bmo\\b|🇲🇴" +
    "|俄罗斯|俄羅斯|russia|\\bru\\b" +
    "|乌克兰|烏克蘭|ukraine|\\bua\\b" +
    "|白俄罗斯|白俄羅斯|belarus|\\bby\\b" +
    "|土耳其|turkey|\\btr\\b" +
    "|阿联酋|阿聯酋|uae|\\bae\\b" +
    "|尼日利亚|尼日利亞|nigeria|\\bng\\b" +
    "|菲律宾|菲律賓|philippines|\\bph\\b" +
    "|泰国|泰國|thailand|\\bth\\b" +
    "|越南|vietnam|\\bvn\\b" +
    "|印度尼西亚|印度尼西亞|印尼|indonesia|\\bid\\b" +
    "|印度|india|\\bin\\b" +
    "|马来西亚|馬來西亞|malaysia|\\bmy\\b" +
    "|巴西|brazil|\\bbr\\b" +
    "|阿根廷|argentina|\\bar\\b" +
    "|南非|south africa|\\bza\\b" +
    "|剩余流量|套餐到期|下次重置剩余|重置剩余|到期时间|流量重置" +
    "|traffic|expire|expiration|subscription|subscribe|reset|plan" +
    "|官网|官方|通知|重要|客户端|更新|升级|审核|补偿|备用域名|域名|旧节点|帮助中心" +
    "|流量|套餐|到期|重置|剩余|windows|mac|android|ios-shadowrocket|无法享受|请尽快" +
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
        g2.proxies = uniqPrepend(g2.proxies, [DEV_NAME]);
        break;
      }
    }
  }

  config["proxy-groups"] = groups;
  return config;
}
