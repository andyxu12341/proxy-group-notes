# Proxy Group Notes for Clash Verge & Shadowrocket

整理个人使用 Clash Verge / Mihomo / Shadowrocket 时的代理组配置逻辑，主要目标是：

- 建立非港澳发达国家/地区自动代理组
- 建立美国专用自动代理组
- 避免 ChatGPT / Claude 等 AI 服务走香港、澳门等高风险地区
- 理清 Shadowrocket 中“配置、代理、直连、场景、代理分组”的关系

> 注意：不要上传自己的机场订阅链接、节点密码、token、完整机场配置文件。本仓库只放规则片段、正则表达式和脚本模板。

---

## 1. 核心概念

### PROXY

`PROXY` 通常是配置文件里的代理策略组名字，不是固定功能。

```ini
DOMAIN-SUFFIX,google.com,PROXY
DOMAIN-SUFFIX,openai.com,PROXY
FINAL,PROXY
```

意思是：Google、OpenAI 和其他未匹配流量都交给 `PROXY` 这个代理组处理。

如果 `[Proxy Group]` 里写：

```ini
PROXY = url-test,...
```

那么所有走 `PROXY` 的流量都会交给这个 URL-Test 代理组。

### DIRECT

`DIRECT` 表示直连，不走代理。

```ini
GEOIP,CN,DIRECT
```

### FINAL

`FINAL` 是兜底规则。

```ini
FINAL,PROXY
```

意思是：前面所有规则都没匹配到时，最后统一走 `PROXY`。

---

## 2. URL-Test 和 Load-Balance

### URL-Test

自动测速，并选择延迟较低的节点。适合 ChatGPT、Claude、Google、YouTube、Telegram 和日常网页浏览。

### Load-Balance

把请求分配到多个节点。适合下载、多连接场景，但不太适合登录类网站、ChatGPT、Google、银行、购物、社交账号，因为可能导致同一网站看到多个 IP，触发风控。

---

## 3. 推荐 AI 节点地区

建议优先使用：

```text
美国、日本、新加坡、台湾、韩国、英国、加拿大、澳洲、欧盟国家、瑞士、挪威、新西兰
```

尽量避免：

```text
中国大陆、香港、澳门、俄罗斯、伊朗、朝鲜、叙利亚、古巴、白俄罗斯、部分受制裁地区
```

实际支持地区以 OpenAI、Anthropic、Google 官方支持列表为准。

---

## 4. Clash Verge / Mihomo

脚本文件：

```text
scripts/clash-verge-developed.js
```

作用：

- 删除旧的 `🔁 非港轮询`
- 新建 `🌐 发达地区自动`
- 筛选台湾、新加坡、日本、韩国、美国、英国、加拿大、澳洲、欧盟、瑞士、挪威、新西兰
- 排除香港、澳门和订阅信息节点
- 将新代理组插入主选择组

使用位置：

```text
Clash Verge Rev → 订阅 → 全局扩展脚本 Script
```

保存后刷新当前订阅。

---

## 5. Shadowrocket 的几个概念

首页的“全局路由”有四种：

```text
配置 = 按配置文件规则走
代理 = 所有流量走首页当前选中的节点
直连 = 所有流量不走代理
场景 = 按 Wi-Fi / 蜂窝数据等场景切换
```

推荐使用：

```text
全局路由：配置
```

因为这样可以让 `[Rule]` 里的规则生效。

---

## 6. Shadowrocket 分组和配置的关系

```text
配置 → default.conf → 代理分组
```

这里是真正写进配置文件的 `[Proxy Group]`。

```text
全局路由 → 设置 → 分组
```

这里更像 UI 管理入口，可以新建分组、测速、查看当前自动选择的节点。

真正决定流量走哪里的是：

```ini
[Rule]
FINAL,PROXY
```

和：

```ini
[Proxy Group]
PROXY = url-test,...
```

这两个名字必须对上。

---

## 7. Shadowrocket 配置片段

- `configs/shadowrocket-developed.conf`：非港澳发达地区自动 PROXY。
- `configs/shadowrocket-us.conf`：只美国 PROXY。

使用方法：把配置文件 `[Proxy Group]` 里的 `PROXY = ...` 整行替换为对应片段。若订阅名不是 `<SUBSCRIPTION_NAME>`，需要替换成当前配置里真实存在的订阅名，例如 `SAKURACAT`。

---

## 8. Shadowrocket 分组界面正则

### 非港澳发达地区

```regex
^(?!.*(香港|港|HK|HKG|Hong|澳门|澳門|MO|Macau|剩余|流量|套餐|到期|重置)).*(台湾|台灣|TW|Taiwan|新加坡|SG|Singapore|日本|JP|Japan|东京|大阪|韩国|韓國|KR|Korea|首尔|Seoul|美国|US|USA|英国|UK|法国|FR|德国|DE|意大利|IT|挪威|NO|加拿大|CA|澳洲|澳大利亚|AU|荷兰|NL|瑞士|CH|新西兰|NZ)
```

### 只美国

```regex
^(?!.*(香港|港|HK|HKG|Hong|澳门|澳門|MO|Macau|剩余|流量|套餐|到期|重置)).*(美国|美國|美西|美东|美東|美中|美南|美國家宽|美国家宽|US|USA|United States|America|Los Angeles|San Jose|Seattle|New York|Dallas|Chicago|Washington|🇺🇸)
```

---

## 9. 启动回退

启动回退可以理解为：启动 Shadowrocket / 打开 VPN 时，如果当前节点不可用，自动回退到分组里其他可用节点。

适合开启：

```text
URL-Test 自动组、节点多、节点经常 Timeout
```

不适合开启：

```text
想长期固定某一个节点、不希望自动切换地区
```

如果正则已经限定为“只美国”或“非港澳发达地区”，开启启动回退一般没问题。

---

## 10. 换订阅后是否还有效

### Clash Verge

电脑端如果使用全局扩展脚本，一般换订阅后仍然有效。

前提：

```text
全局脚本还开着
新订阅节点名包含国家/地区关键词
订阅格式被 Clash Verge / Mihomo 正常识别
```

### Shadowrocket

手机端规则是跟配置文件走的。如果换订阅或新建配置，需要检查：

```ini
[Proxy Group]
PROXY = url-test,...
```

以及：

```ini
[Rule]
FINAL,PROXY
```

如果订阅名变了，需要把配置片段里的 `<SUBSCRIPTION_NAME>` 改成新配置里真实存在的订阅名。

---

## 11. 推荐最终状态

### 电脑 Clash Verge

```text
全局脚本开启
代理组：🌐 发达地区自动
日常使用 URL-Test
避免使用 Load-Balance 登录 AI / Google / 社交账号
```

### 手机 Shadowrocket

```text
全局路由：配置
[Proxy Group] 里 PROXY = url-test,...
[Rule] 最后一行 FINAL,PROXY
```

这样所有原本走代理的流量都会交给 `PROXY`，而 `PROXY` 会按正则自动筛选节点。
