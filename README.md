# Proxy Group Notes for Clash Verge & Shadowrocket

本仓库整理 Clash Verge / Mihomo / Shadowrocket 的代理组配置方法，重点解决 AI 服务分流、非港澳发达地区自动选择、美国专用代理组、双订阅合并、Shadowrocket `PROXY` 规则替换等问题。

> 注意：不要上传自己的机场订阅链接、节点密码、token、完整机场配置文件。本仓库只放规则片段、正则表达式、脚本模板和合并模板。

---

## 1. 现状问题：为什么需要这套配置？

### 1.1 AI 服务对地区敏感

ChatGPT / OpenAI / Claude / Gemini 等 AI 服务对访问地区较敏感，部分地区节点可能导致：

- 无法访问
- 登录异常
- 频繁验证
- 服务不可用
- 账号风控风险增加

### 1.2 机场默认节点不一定适合 AI

很多机场默认优先低延迟节点，例如香港节点，但 AI 服务并不一定适合走香港或澳门。低延迟不等于适合 AI 服务。

### 1.3 机场默认分组不够精细

机场订阅通常只提供：

- 自动选择
- 节点选择
- 香港
- 日本
- 美国
- 新加坡

但不一定提供：

- 非港澳发达地区自动组
- 美国专用 URL-Test 组
- AI 服务专用代理策略
- 多订阅合并后的统一代理组

### 1.4 两个订阅不等于自动合并

在 Clash Verge 里添加两个订阅，通常只是添加了两个 Profile。实际使用时一般只启用其中一个完整配置。

如果要把两个订阅的节点放进同一个代理组，需要使用 Mihomo 的 `proxy-providers`，把两个订阅作为节点来源合并到一个本地配置中。

### 1.5 Shadowrocket 里“建了分组但没有生效”

Shadowrocket 里常见问题是：分组已经建好，但规则没有指向这个分组。

例如：

```ini
[Proxy Group]
发达国家自动 = url-test,...

[Rule]
FINAL,PROXY
```

这表示实际流量仍然走 `PROXY`，而不是走 `发达国家自动`。

所以 Shadowrocket 的关键是：

```text
规则里的策略名
必须和
[Proxy Group] 里的代理组名
完全一致
```

---

## 2. 核心逻辑：规则、代理组、节点和订阅的关系

### 2.1 PROXY 是什么？

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

### 2.2 DIRECT 是什么？

`DIRECT` 表示直连，不走代理。

```ini
GEOIP,CN,DIRECT
```

### 2.3 FINAL / MATCH 是什么？

`FINAL` 是 Shadowrocket 常用的兜底规则。

```ini
FINAL,PROXY
```

Mihomo / Clash Verge 里通常写作：

```yaml
- MATCH,节点选择
```

意思是：前面所有规则都没匹配到时，最后统一走指定代理组。

### 2.4 URL-Test 与 Load-Balance 区别

#### URL-Test

自动测速，并选择延迟较低的节点。适合 ChatGPT、Claude、Google、YouTube、Telegram 和日常网页浏览。

#### Load-Balance

把请求分配到多个节点。适合下载、多连接场景，但不太适合登录类网站、AI 服务、Google、银行、购物、社交账号，因为可能导致同一网站看到多个 IP，触发风控。

### 2.5 proxy-providers 是什么？

`proxy-providers` 是 Mihomo / Clash.Meta 用来远程拉取节点来源的方式。它可以把多个订阅作为多个 provider，然后让同一个代理组同时引用它们。

```yaml
proxy-providers:
  sub_a:
    type: http
    url: "SUBSCRIPTION_URL_A"

  sub_b:
    type: http
    url: "SUBSCRIPTION_URL_B"

proxy-groups:
  - name: 🌐 发达地区自动
    type: url-test
    use:
      - sub_a
      - sub_b
```

---

## 3. 国家 / 地区策略：非港澳发达地区与欧盟节点

本仓库的地区策略不是政治表述，只是为了在代理客户端里按节点名称做筛选。目标是：

```text
优先选择非港澳发达国家 / 地区节点
覆盖全部欧盟成员国
排除香港、澳门、通知节点、套餐节点和部分非目标地区节点
```

### 3.1 推荐纳入的非港澳发达国家 / 地区

```text
台湾、新加坡、日本、韩国、美国、加拿大、英国、澳大利亚、新西兰、以色列、瑞士、挪威、冰岛、列支敦士登、安道尔、摩纳哥、圣马力诺、梵蒂冈
```

这些节点通常更适合 AI 服务、账号登录、Google 服务和需要较低风控的场景。

### 3.2 推荐纳入的欧盟国家

最新版正则已经覆盖全部欧盟成员国：

```text
奥地利、比利时、保加利亚、克罗地亚、塞浦路斯、捷克、丹麦、爱沙尼亚、芬兰、法国、德国、希腊、匈牙利、爱尔兰、意大利、拉脱维亚、立陶宛、卢森堡、马耳他、荷兰、波兰、葡萄牙、罗马尼亚、斯洛伐克、斯洛文尼亚、西班牙、瑞典
```

### 3.3 尽量排除的地区和节点类型

```text
中国大陆、香港、澳门、俄罗斯、白俄罗斯、乌克兰、土耳其、阿联酋、尼日利亚、菲律宾、泰国、越南、印度、印尼、马来西亚、巴西、阿根廷、南非等
```

同时排除这类非真实节点：

```text
剩余流量、套餐到期、流量重置、官网通知、客户端更新提示、备用域名、旧节点提示、帮助中心等
```

### 3.4 本仓库采用的主要策略

本仓库提供三套主要策略：

- Clash Verge / Mihomo：全局扩展脚本自动生成 `🌐 发达地区自动`
- Clash Verge / Mihomo：双订阅 `proxy-providers` 合并模板
- Shadowrocket：非港澳发达国家 / 地区 + 欧盟国家正则与 `PROXY` 替换片段

最新版 Shadowrocket 正则位置：

```text
configs/shadowrocket-developed-region-regex.txt
```

实际支持地区仍以 OpenAI、Anthropic、Google 等服务官方支持列表为准。

---

## 4. 平台一：Clash Verge / Mihomo 单订阅解决方案

### 4.1 适用场景

适用于电脑端 Clash Verge Rev / Mihomo / Clash.Meta。

### 4.2 解决思路

通过 Clash Verge 的全局扩展脚本，在配置加载时自动生成一个可复用的 URL-Test 代理组：

- 自动读取当前订阅节点
- 新增 `🌐 发达地区自动` URL-Test 组
- 使用正则筛选台湾、新加坡、日本、韩国、美国、加拿大、英国、澳洲、新西兰、欧盟国家、瑞士、挪威、冰岛等节点
- 排除香港、澳门和订阅信息节点
- 自动插入主选择组，方便在代理页面直接选择

### 4.3 代码位置

```text
scripts/clash-verge-developed.js
```

### 4.4 使用方法

```text
Clash Verge Rev
→ 订阅
→ 全局扩展脚本 Script
→ 粘贴脚本
→ 保存
→ 刷新订阅
```

### 4.5 结果验证

代理页面应出现：

```text
🌐 发达地区自动
```

进入该代理组后，应主要看到非港澳发达地区和欧盟国家节点，不应出现香港、澳门或订阅信息节点。

---

## 5. 平台二：Clash Verge / Mihomo 双订阅合并方案

### 5.1 适用场景

适用于想把两个机场订阅的节点放到同一个配置中使用的情况，例如：

```text
订阅 A + 订阅 B
→ 一个本地合并配置
→ 一个统一的 节点选择 / 发达地区自动 / 美国自动
```

### 5.2 代码位置

合并模板：

```text
configs/clash-verge-merge-template.yaml
```

详细教程：

```text
docs/MERGE_SUBSCRIPTIONS.md
```

### 5.3 核心代码

```yaml
proxy-providers:
  sub_a:
    type: http
    url: "SUBSCRIPTION_URL_A"

  sub_b:
    type: http
    url: "SUBSCRIPTION_URL_B"

proxy-groups:
  - name: 🌐 发达地区自动
    type: url-test
    use:
      - sub_a
      - sub_b
```

### 5.4 使用方法

```text
1. 复制 configs/clash-verge-merge-template.yaml 到本地
2. 把 SUBSCRIPTION_URL_A / SUBSCRIPTION_URL_B 换成自己的两个订阅链接
3. 不要把替换后的真实文件上传 GitHub
4. Clash Verge Rev → 订阅 → 新建 → 本地配置 / Local File
5. 导入本地 YAML，刷新并测试延迟
```

### 5.5 合并后会生成的代理组

```text
节点选择
🌐 发达地区自动
🇺🇸 美国自动
♻️ 全部自动
```

其中 `🌐 发达地区自动` 会同时从两个订阅中筛选非港澳发达国家 / 地区和欧盟国家节点。

---

## 6. 平台三：Shadowrocket 解决方案

### 6.1 Shadowrocket 的问题本质

Shadowrocket 不是只靠 UI 分组生效，而是要看配置文件里的：

```ini
[Proxy Group]
PROXY = ...

[Rule]
FINAL,PROXY
```

规则里的名字必须和代理组名字一致。

如果规则里大量使用：

```ini
PROXY
```

那么最稳的方式不是另建一个没人引用的新分组，而是直接把 `PROXY` 这个代理组改成你想要的 URL-Test 筛选逻辑。

### 6.2 推荐使用模式

```text
全局路由：配置
```

不要长期使用：

```text
全局路由：代理
```

因为“代理”模式会直接使用首页当前节点，容易绕开配置文件里的规则。

### 6.3 非港澳发达地区自动 PROXY

代码位置：

```text
configs/shadowrocket-developed.conf
configs/shadowrocket-developed-region-regex.txt
```

用途：

让所有原本走 `PROXY` 的流量，只在非港澳发达国家 / 地区和欧盟国家节点里自动选择。

### 6.4 美国专用 PROXY

代码位置：

```text
configs/shadowrocket-us.conf
```

用途：

让所有原本走 `PROXY` 的流量，只在美国节点里自动选择。

### 6.5 替换方法

找到 Shadowrocket 配置中的：

```ini
[Proxy Group]
PROXY = ...
```

把整行替换成对应配置片段。

同时确认规则最后是：

```ini
FINAL,PROXY
```

### 6.6 订阅名替换

配置片段里使用：

```ini
<SUBSCRIPTION_NAME>
```

需要替换成当前配置里真实存在的订阅名，例如：

```ini
SakuraCat
api.efanyunapi.com
```

---

## 7. 正则表达式说明

### 7.1 最新完整发达地区正则

代码位置：

```text
configs/shadowrocket-developed-region-regex.txt
scripts/clash-verge-developed.js
configs/clash-verge-merge-template.yaml
```

覆盖：

- 台湾
- 新加坡
- 日本
- 韩国
- 美国
- 加拿大
- 英国
- 澳大利亚
- 新西兰
- 以色列
- 瑞士
- 挪威
- 冰岛
- 列支敦士登
- 安道尔
- 摩纳哥
- 圣马力诺
- 梵蒂冈
- 全部欧盟成员国

排除：

- 香港
- 澳门
- 俄罗斯、白俄罗斯、乌克兰等非目标地区
- 东南亚、南美、非洲等非目标地区节点
- 剩余流量、套餐到期、流量重置等信息节点
- 官网通知、客户端更新、备用域名、旧节点提示等通知节点

### 7.2 Shadowrocket 配置片段

代码位置：

```text
configs/shadowrocket-developed.conf
```

用途：

保存可直接放入 `[Proxy Group]` 的配置行。

### 7.3 美国专用正则

代码位置：

```text
configs/shadowrocket-us.conf
```

筛选：

- 美国
- 美西
- 美东
- US
- USA
- United States
- Los Angeles
- San Jose
- New York
- Dallas
- Chicago
- Washington

---

## 8. 目录结构

```text
proxy-group-notes
│
├── README.md
├── LICENSE
├── .gitignore
│
├── scripts
│   └── clash-verge-developed.js
│
├── configs
│   ├── clash-verge-merge-template.yaml
│   ├── shadowrocket-developed.conf
│   ├── shadowrocket-developed-region-regex.txt
│   └── shadowrocket-us.conf
│
└── docs
    ├── MERGE_SUBSCRIPTIONS.md
    ├── SEO.md
    └── KEYWORDS.md
```

---

## 9. 换订阅后的注意事项

### 9.1 Clash Verge 单订阅

全局脚本开启时，换订阅通常仍然有效。

前提：

- 节点名包含国家 / 地区关键词
- 订阅能被 Clash Verge / Mihomo 正常识别
- 全局扩展脚本没有关闭

### 9.2 Clash Verge 双订阅合并

如果使用 `configs/clash-verge-merge-template.yaml`，换订阅时只需要改：

```yaml
proxy-providers:
  sub_a:
    url: "新的第一个订阅链接"

  sub_b:
    url: "新的第二个订阅链接"
```

不需要修改 `proxy-groups`，除非你要改筛选地区或代理组名称。

### 9.3 Shadowrocket

Shadowrocket 是配置文件级别生效。

换订阅后需要检查：

```ini
PROXY = url-test,...
FINAL,PROXY
```

以及订阅名是否变化。

如果订阅名从：

```ini
SakuraCat
```

变成：

```ini
api.efanyunapi.com
```

则需要把配置片段中的 `<SUBSCRIPTION_NAME>` 或旧订阅名替换成新的订阅名。

---

## 10. 常见问题

### 10.1 为什么 Shadowrocket 建了分组还是走香港？

因为规则可能仍然指向 `PROXY`，而不是你新建的分组。

解决方式：直接把 `PROXY` 这个策略组改成目标 URL-Test 代理组。

### 10.2 为什么首页显示香港？

如果全局路由是“配置”，实际出口主要看配置规则；如果全局路由是“代理”，首页显示什么就走什么。

推荐：

```text
全局路由：配置
```

### 10.3 为什么两个订阅添加到 Clash Verge 后没有一起用？

因为两个订阅通常是两个 Profile，不是同一个配置里的两个节点来源。要一起用，需要 `proxy-providers` 合并模板。

### 10.4 为什么发达地区自动组为空？

常见原因：

```text
订阅链接没有拉取成功
节点名称没有国家 / 地区关键词
provider 名称和 use 里的名称不一致
filter 正则过窄
```

### 10.5 Trojan / AnyTLS / UDP 是什么？

- Trojan / AnyTLS：节点使用的代理协议
- UDP：节点支持 UDP 流量

UDP 对游戏、语音通话、视频通话、部分 DNS 和 HTTP/3 有用。

### 10.6 启动回退是什么？

启动 Shadowrocket / 打开 VPN 时，如果当前节点不可用，自动回退到分组里其他可用节点。

适合开启：

```text
URL-Test 自动组、节点多、节点经常 Timeout
```

不适合开启：

```text
想长期固定某一个节点、不希望自动切换地区
```

---

## 11. 推荐最终配置

### 11.1 电脑端：单订阅

```text
Clash Verge Rev
全局扩展脚本开启
使用 🌐 发达地区自动
```

### 11.2 电脑端：双订阅合并

```text
Clash Verge Rev
使用 configs/clash-verge-merge-template.yaml
把两个订阅作为 sub_a / sub_b
使用 🌐 发达地区自动
```

### 11.3 手机端

```text
Shadowrocket
全局路由：配置
PROXY = url-test,...
FINAL,PROXY
```

---

## 12. SEO 与关键词

SEO 描述和关键词放在：

```text
docs/SEO.md
docs/KEYWORDS.md
```

推荐 GitHub Topics：

```text
clash-verge
mihomo
clash-meta
shadowrocket
proxy-group
url-test
proxy-rules
proxy-providers
subscription-merge
chatgpt-proxy
openai-proxy
ai-proxy
regex-filter
```

---

## 13. 免责声明

本仓库仅用于个人网络配置学习与备忘，不包含任何机场订阅链接、节点密码或账号信息。实际访问效果取决于节点质量、服务支持地区、网络环境和客户端版本。
