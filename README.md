# Proxy Group Notes for Clash Verge & Shadowrocket

本仓库整理 Clash Verge / Mihomo / Shadowrocket 的代理组配置方法，重点解决 AI 服务分流、非港澳发达地区自动选择、美国专用代理组、Shadowrocket `PROXY` 规则替换等问题。

> 注意：不要上传自己的机场订阅链接、节点密码、token、完整机场配置文件。本仓库只放规则片段、正则表达式和脚本模板。

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

### 1.4 Shadowrocket 里“建了分组但没有生效”

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

## 2. 核心逻辑：规则、代理组和节点的关系

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

### 2.3 FINAL 是什么？

`FINAL` 是兜底规则。

```ini
FINAL,PROXY
```

意思是：前面所有规则都没匹配到时，最后统一走 `PROXY`。

### 2.4 URL-Test 与 Load-Balance 区别

#### URL-Test

自动测速，并选择延迟较低的节点。适合 ChatGPT、Claude、Google、YouTube、Telegram 和日常网页浏览。

#### Load-Balance

把请求分配到多个节点。适合下载、多连接场景，但不太适合登录类网站、AI 服务、Google、银行、购物、社交账号，因为可能导致同一网站看到多个 IP，触发风控。

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

本仓库提供两套主要策略：

- 非港澳发达国家 / 地区 + 欧盟国家自动选择
- 美国专用自动选择

最新版 Shadowrocket 正则位置：

```text
configs/shadowrocket-developed-region-regex.txt
```

实际支持地区仍以 OpenAI、Anthropic、Google 等服务官方支持列表为准。

---

## 4. 平台一：Clash Verge / Mihomo 解决方案

### 4.1 适用场景

适用于电脑端 Clash Verge Rev / Mihomo / Clash.Meta。

### 4.2 解决思路

通过 Clash Verge 的全局扩展脚本，在配置加载时自动生成一个可复用的 URL-Test 代理组：

- 自动读取订阅节点
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

## 5. 平台二：Shadowrocket 解决方案

### 5.1 Shadowrocket 的问题本质

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

### 5.2 推荐使用模式

```text
全局路由：配置
```

不要长期使用：

```text
全局路由：代理
```

因为“代理”模式会直接使用首页当前节点，容易绕开配置文件里的规则。

### 5.3 非港澳发达地区自动 PROXY

代码位置：

```text
configs/shadowrocket-developed.conf
configs/shadowrocket-developed-region-regex.txt
```

用途：

让所有原本走 `PROXY` 的流量，只在非港澳发达国家 / 地区和欧盟国家节点里自动选择。

### 5.4 美国专用 PROXY

代码位置：

```text
configs/shadowrocket-us.conf
```

用途：

让所有原本走 `PROXY` 的流量，只在美国节点里自动选择。

### 5.5 替换方法

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

### 5.6 订阅名替换

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

## 6. 正则表达式说明

### 6.1 最新完整发达地区正则

代码位置：

```text
configs/shadowrocket-developed-region-regex.txt
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

### 6.2 Shadowrocket 配置片段

代码位置：

```text
configs/shadowrocket-developed.conf
```

用途：

保存可直接放入 `[Proxy Group]` 的配置行。

### 6.3 美国专用正则

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

## 7. 目录结构

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
│   ├── shadowrocket-developed.conf
│   ├── shadowrocket-developed-region-regex.txt
│   └── shadowrocket-us.conf
│
└── docs
    ├── SEO.md
    └── KEYWORDS.md
```

---

## 8. 换订阅后的注意事项

### 8.1 Clash Verge

全局脚本开启时，换订阅通常仍然有效。

前提：

- 节点名包含国家/地区关键词
- 订阅能被 Clash Verge / Mihomo 正常识别
- 全局扩展脚本没有关闭

### 8.2 Shadowrocket

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

## 9. 常见问题

### 9.1 为什么 Shadowrocket 建了分组还是走香港？

因为规则可能仍然指向 `PROXY`，而不是你新建的分组。

解决方式：直接把 `PROXY` 这个策略组改成目标 URL-Test 代理组。

### 9.2 为什么首页显示香港？

如果全局路由是“配置”，实际出口主要看配置规则；如果全局路由是“代理”，首页显示什么就走什么。

推荐：

```text
全局路由：配置
```

### 9.3 Trojan 和 UDP 是什么？

- Trojan：节点使用的代理协议
- UDP：节点支持 UDP 流量

UDP 对游戏、语音通话、视频通话、部分 DNS 和 HTTP/3 有用。

### 9.4 启动回退是什么？

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

## 10. 推荐最终配置

### 10.1 电脑端

```text
Clash Verge Rev
全局扩展脚本开启
使用 🌐 发达地区自动
```

### 10.2 手机端

```text
Shadowrocket
全局路由：配置
PROXY = url-test,...
FINAL,PROXY
```

---

## 11. SEO 与关键词

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
chatgpt-proxy
openai-proxy
ai-proxy
regex-filter
```

---

## 12. 免责声明

本仓库仅用于个人网络配置学习与备忘，不包含任何机场订阅链接、节点密码或账号信息。实际访问效果取决于节点质量、服务支持地区、网络环境和客户端版本。
