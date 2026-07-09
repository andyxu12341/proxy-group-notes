# Proxy Group Notes for Clash Verge, Mihomo and Shadowrocket

面向 Clash Verge / Mihomo / Shadowrocket 的代理组配置文档，整理代理组命名、规则指向、URL-Test 自动选择、多订阅合并、地区筛选正则和自定义代理组模板。

本项目提供三类地区策略：

```text
全部发达地区
美国自动
自定义模板
```

其中“全部发达地区”是默认推荐策略，用于筛选适合 AI 服务、Google 服务、开发者工具和常见国际服务的稳定地区节点。

---

## 1. 基础概念：规则、代理组与订阅来源

### 1.1 规则必须指向代理组

代理客户端不会自动选择界面中看起来最合适的代理组，而是按照规则中的策略名称执行。

```ini
DOMAIN-SUFFIX,openai.com,PROXY
DOMAIN-SUFFIX,google.com,PROXY
FINAL,PROXY
```

上述规则表示相关流量都会交给名为 `PROXY` 的代理组处理。

核心原则：

```text
规则中的策略名称 = 代理组名称
```

### 1.2 PROXY、DIRECT、FINAL、MATCH

`PROXY` 通常是代理组名称，不是固定功能。

```ini
PROXY = select,...
```

表示手动选择代理。

```ini
PROXY = url-test,...
```

表示自动测速代理组。

`DIRECT` 表示直连。

```ini
GEOIP,CN,DIRECT
```

Shadowrocket 常用兜底规则：

```ini
FINAL,PROXY
```

Clash / Mihomo 常用兜底规则：

```yaml
- MATCH,节点选择
```

### 1.3 select、url-test、load-balance

```text
select       手动选择节点或代理组
url-test     自动测速并选择延迟较低的节点
load-balance 多节点负载均衡
```

`url-test` 更适合 AI 服务、Google、Telegram、YouTube、日常网页等场景。

`load-balance` 不适合登录类、AI、银行、购物、社交账号等容易触发风控的场景。

### 1.4 订阅、节点、代理组的关系

```text
订阅提供节点
代理组组织节点
规则决定流量走哪个代理组
```

在 Clash Verge / Mihomo 中，多订阅合并通常通过 `proxy-providers` 完成。

在 Shadowrocket 中，多订阅合并通常通过同一代理组引用多个订阅名称，或通过 Sub-Store / 订阅转换工具生成合并订阅。

---

## 2. 地区策略

### 2.1 全部发达地区

默认推荐策略。

覆盖：

```text
台湾、新加坡、日本、韩国、美国、加拿大、英国、澳大利亚、新西兰、以色列、瑞士、挪威、冰岛、列支敦士登、安道尔、摩纳哥、圣马力诺、梵蒂冈
```

同时覆盖全部欧盟成员国：

```text
奥地利、比利时、保加利亚、克罗地亚、塞浦路斯、捷克、丹麦、爱沙尼亚、芬兰、法国、德国、希腊、匈牙利、爱尔兰、意大利、拉脱维亚、立陶宛、卢森堡、马耳他、荷兰、波兰、葡萄牙、罗马尼亚、斯洛伐克、斯洛文尼亚、西班牙、瑞典
```

默认排除：

```text
香港、澳门、俄罗斯、白俄罗斯、乌克兰、土耳其、阿联酋、尼日利亚、菲律宾、泰国、越南、印度、印尼、马来西亚、巴西、阿根廷、南非
```

同时排除机场信息节点：

```text
剩余流量、套餐到期、流量重置、官网通知、客户端更新、备用域名、旧节点提示、帮助中心
```

### 2.2 美国自动

用于只希望使用美国节点的场景。

覆盖：

```text
美国、美國、美西、美东、美東、美中、美南、US、USA、United States、America、Los Angeles、San Jose、Seattle、New York、Dallas、Chicago、Washington
```

适用场景：

```text
AI 服务
美国区账号
美国区流媒体
美国搜索 / 开发者服务
固定美国出口需求
```

### 2.3 自定义模板

自定义模板用于按实际节点命名建立地区代理组，例如：

```text
日本自动
新加坡自动
日韩自动
美日新自动
欧洲自动
家宽自动
IEPL 自动
低倍率自动
```

基本结构分为两部分：

```text
include：需要纳入的关键词
exclude：需要排除的关键词
```

Clash / Mihomo 中对应：

```yaml
filter: '...'
exclude-filter: '...'
```

Shadowrocket 中对应：

```ini
policy-regex-filter=...
```

---

## 3. Clash Verge / Mihomo

### 3.1 设置“全部发达地区”自动代理组

#### 方式 A：全局扩展脚本

文件位置：

```text
scripts/clash-verge-developed.js
```

作用：

```text
读取当前配置节点
创建 🌐 发达地区自动
筛选全部发达地区节点
排除香港、澳门、通知节点和非目标地区
插入主选择组
```

使用方式：

```text
Clash Verge Rev
→ 订阅
→ 全局扩展脚本 Script
→ 粘贴脚本
→ 保存
→ 刷新订阅
```

生成代理组：

```text
🌐 发达地区自动
```

#### 方式 B：YAML 中直接写代理组

适合本地配置、完整合并配置和固定模板。

```yaml
proxy-groups:
  - name: 🌐 发达地区自动
    type: url-test
    use:
      - sub_a
      - sub_b
    filter: '全部发达地区 include 正则'
    exclude-filter: '排除地区与信息节点正则'
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    lazy: true
```

### 3.2 设置“美国自动”代理组

Clash / Mihomo 示例：

```yaml
- name: 🇺🇸 美国自动
  type: url-test
  use:
    - sub_a
    - sub_b
  filter: '(?i)(美国|美國|美西|美东|美東|美中|美南|\bus\b|\busa\b|united states|america|los angeles|san jose|seattle|new york|dallas|chicago|washington|🇺🇸)'
  exclude-filter: '(?i)(香港|澳门|澳門|剩余|流量|套餐|到期|重置|官网|通知|客户端|更新)'
  url: https://www.gstatic.com/generate_204
  interval: 300
  tolerance: 50
  lazy: true
```

### 3.3 设置“自定义模板”代理组

文件位置：

```text
configs/clash-verge-custom-template.yaml
```

示例：日本自动。

```yaml
- name: 日本自动
  type: url-test
  use:
    - sub_a
    - sub_b
  filter: '(?i)(日本|东京|東京|大阪|\bjp\b|japan|tokyo|osaka|🇯🇵)'
  exclude-filter: '(?i)(香港|澳门|澳門|剩余|流量|套餐|到期|重置|官网|通知)'
  url: https://www.gstatic.com/generate_204
  interval: 300
  tolerance: 50
  lazy: true
```

### 3.4 Clash Verge / Mihomo 多订阅合并

在 Clash Verge / Mihomo 中，多订阅合并主要有两种方式：

```text
动态合并：通过 proxy-providers 拉取多个订阅
静态合并：将多个订阅中的节点展开后写入同一个 YAML
```

两种方式都可以实现“多个订阅节点进入同一个代理组”，但适用场景不同。

#### 3.4.1 动态合并：proxy-providers

动态合并是 Mihomo / Clash.Meta 更推荐的长期维护方式。

核心逻辑是：订阅链接不直接展开为固定节点，而是作为远程 provider 保留。代理组通过 `use` 同时引用多个 provider。

```yaml
proxy-providers:
  sub_a:
    type: http
    url: "SUBSCRIPTION_URL_A"
    path: ./providers/sub_a.yaml
    interval: 86400
    health-check:
      enable: true
      url: https://www.gstatic.com/generate_204
      interval: 300

  sub_b:
    type: http
    url: "SUBSCRIPTION_URL_B"
    path: ./providers/sub_b.yaml
    interval: 86400
    health-check:
      enable: true
      url: https://www.gstatic.com/generate_204
      interval: 300

proxy-groups:
  - name: 🌐 发达地区自动
    type: url-test
    use:
      - sub_a
      - sub_b
    filter: '全部发达地区 include 正则'
    exclude-filter: '排除地区与信息节点正则'
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    lazy: true
```

其中：

```yaml
use:
  - sub_a
  - sub_b
```

表示该代理组同时使用两个订阅来源中的节点。

动态合并的特点：

```text
优点：订阅更新后节点会自动更新
优点：适合长期使用和多订阅维护
优点：配置结构清晰，订阅来源与代理组策略分离
缺点：依赖订阅链接可用性
缺点：依赖 Mihomo 对订阅格式和节点协议的兼容性
```

适用场景：

```text
长期同时使用多个订阅
希望节点自动跟随订阅更新
希望用统一代理组管理多个订阅来源
希望减少手动重新合并 YAML 的次数
```

相关文件：

```text
configs/clash-verge-merge-template.yaml
```

#### 3.4.2 静态合并：展开节点后写入同一个 YAML

静态合并是将多个订阅中的节点直接展开，合并到同一个配置文件的 `proxies` 中，再手动生成统一的 `proxy-groups` 和 `rules`。

结构通常如下：

```yaml
proxies:
  - name: "sub_a-日本01"
    type: ...
    server: ...
    port: ...

  - name: "sub_b-美国01"
    type: ...
    server: ...
    port: ...

proxy-groups:
  - name: 节点选择
    type: select
    proxies:
      - 🌐 发达地区自动
      - 🇺🇸 美国自动
      - ♻️ 全部自动
      - DIRECT

  - name: 🌐 发达地区自动
    type: url-test
    proxies:
      - "sub_a-日本01"
      - "sub_b-美国01"
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50

rules:
  - GEOIP,CN,DIRECT
  - MATCH,节点选择
```

静态合并的特点：

```text
优点：导入即用，结构直观
优点：不依赖 provider 再次拉取
优点：适合订阅格式不稳定、需要手动清理节点的情况
缺点：节点更新后不会自动同步
缺点：订阅新增、删除、改名后需要重新合并
缺点：完整 YAML 会包含节点连接参数，不适合作为公开模板
```

适用场景：

```text
需要一次性生成稳定可用的本地配置
需要手动去除通知节点、套餐节点或异常节点
需要对节点统一加前缀、重命名、去重
订阅 provider 拉取不稳定，但展开后的节点可以正常使用
```

#### 3.4.3 两种合并方式对比

| 合并方式 | 核心机制 | 是否自动更新节点 | 适合场景 |
|---|---|---|---|
| 动态合并 | `proxy-providers` + `use` | 是 | 长期使用、多订阅维护 |
| 静态合并 | 展开 `proxies` 后写入同一 YAML | 否 | 一次性稳定配置、手动清理节点 |

推荐优先级：

```text
长期维护：优先使用动态合并
临时稳定使用：可以使用静态合并
需要手动清洗节点：静态合并更直观
需要自动更新节点：动态合并更合适
```

#### 3.4.4 与全局扩展脚本的关系

多订阅合并和全局扩展脚本是两个不同层级的问题。

```text
多订阅合并：解决节点来源问题
全局扩展脚本：解决代理组生成和筛选问题
```

因此，Clash Verge / Mihomo 可以采用两种组合方式：

```text
方式一：proxy-providers 动态合并 + YAML 中直接写 proxy-groups
方式二：proxy-providers 动态合并 + 全局扩展脚本自动生成代理组
```

更通用的结构是：

```text
YAML 负责定义订阅来源
全局扩展脚本负责生成地区代理组
```

例如：

```yaml
proxy-providers:
  sub_a:
    type: http
    url: "SUBSCRIPTION_URL_A"

  sub_b:
    type: http
    url: "SUBSCRIPTION_URL_B"
```

然后由：

```text
scripts/clash-verge-developed.js
```

自动生成：

```text
🌐 发达地区自动
```

这种方式适合希望“订阅来源”和“地区筛选策略”分离管理的配置体系。

---

## 4. Shadowrocket

### 4.1 设置“全部发达地区”自动代理组

文件位置：

```text
configs/shadowrocket-developed.conf
configs/shadowrocket-developed-region-regex.txt
```

核心写法：

```ini
PROXY = url-test,<SUBSCRIPTION_NAME>,use=true,url=http://www.gstatic.com/generate_204,policy-regex-filter=...
```

规则对应：

```ini
FINAL,PROXY
```

如果规则中大量使用 `PROXY`，可直接将 `PROXY` 代理组设置为全部发达地区自动组。

### 4.2 设置“美国自动”代理组

文件位置：

```text
configs/shadowrocket-us.conf
```

核心写法：

```ini
PROXY = url-test,<SUBSCRIPTION_NAME>,use=true,url=http://www.gstatic.com/generate_204,policy-regex-filter=...
```

筛选范围：

```text
美国、美國、美西、美东、美東、美中、美南、US、USA、United States、America、Los Angeles、San Jose、Seattle、New York、Dallas、Chicago、Washington
```

### 4.3 设置“自定义模板”代理组

文件位置：

```text
configs/shadowrocket-custom-template.conf
```

Shadowrocket 自定义模板的核心是改 `policy-regex-filter`。

示例：日本自动。

```ini
日本自动 = url-test,<SUBSCRIPTION_NAME>,use=true,url=http://www.gstatic.com/generate_204,policy-regex-filter=^(?!.*(香港|澳门|澳門|剩余|流量|套餐|到期|重置|官网|通知)).*(日本|东京|東京|大阪|JP|Japan|Tokyo|Osaka|🇯🇵),timeout=5,tolerance=100,interval=600
```

### 4.4 Shadowrocket 多订阅合并

Shadowrocket 与 Clash / Mihomo 的合并逻辑不同。它没有 Clash Verge 的全局扩展脚本，也不使用 Mihomo 的 `proxy-providers`。

Shadowrocket 多订阅通常有两种方式。

#### 方式 A：同一个代理组引用多个订阅名称

文件位置：

```text
configs/shadowrocket-multi-developed.conf
```

如果 Shadowrocket 中已经存在多个订阅来源，可以在一个代理组里同时引用多个订阅名。

```ini
PROXY = url-test,SakuraCat,api.efanyunapi.com,use=true,url=http://www.gstatic.com/generate_204,policy-regex-filter=...
```

这里的订阅名必须与 Shadowrocket 中显示的名称一致。

适用场景：

```text
两个订阅都已经在 Shadowrocket 中可用
希望一个 PROXY 组同时筛选两个订阅的节点
```

#### 方式 B：先合并订阅，再筛选

可以通过 Sub-Store 或订阅转换工具先合并订阅。

```text
订阅 A
+
订阅 B
↓
Sub-Store / 订阅转换
↓
合并订阅
↓
Shadowrocket 导入合并订阅
↓
PROXY = url-test,合并订阅名,use=true,policy-regex-filter=...
```

适用场景：

```text
需要跨客户端共用同一个合并订阅
需要统一节点名称
需要节点去重、加前缀、重命名
```

---

## 5. 平台方案对比

| 平台 | 目标 | 推荐方式 | 文件 |
|---|---|---|---|
| Clash Verge / Mihomo | 全部发达地区 | 全局扩展脚本或 YAML filter | `scripts/clash-verge-developed.js` |
| Clash Verge / Mihomo | 美国自动 | YAML filter | `configs/clash-verge-merge-template.yaml` |
| Clash Verge / Mihomo | 自定义模板 | YAML filter / exclude-filter | `configs/clash-verge-custom-template.yaml` |
| Clash Verge / Mihomo | 多订阅合并 | proxy-providers / 静态完整合并 | `configs/clash-verge-merge-template.yaml` |
| Shadowrocket | 全部发达地区 | policy-regex-filter | `configs/shadowrocket-developed.conf` |
| Shadowrocket | 美国自动 | policy-regex-filter | `configs/shadowrocket-us.conf` |
| Shadowrocket | 自定义模板 | policy-regex-filter | `configs/shadowrocket-custom-template.conf` |
| Shadowrocket | 多订阅合并 | 多订阅名引用 / Sub-Store | `configs/shadowrocket-multi-developed.conf` |

---

## 6. 文件结构

```text
proxy-group-notes
├── README.md
├── LICENSE
├── .gitignore
├── scripts
│   └── clash-verge-developed.js
├── configs
│   ├── clash-verge-merge-template.yaml
│   ├── clash-verge-custom-template.yaml
│   ├── shadowrocket-developed.conf
│   ├── shadowrocket-multi-developed.conf
│   ├── shadowrocket-custom-template.conf
│   ├── shadowrocket-developed-region-regex.txt
│   └── shadowrocket-us.conf
└── docs
    ├── MERGE_SUBSCRIPTIONS.md
    ├── SEO.md
    └── KEYWORDS.md
```

---

## 7. 推荐工作流

### 7.1 Clash Verge / Mihomo

单订阅：

```text
导入订阅
→ 启用全局扩展脚本
→ 生成 🌐 发达地区自动
```

多订阅：

```text
proxy-providers 合并订阅
→ 使用 YAML filter 或全局扩展脚本生成代理组
→ 规则指向 节点选择 / 🌐 发达地区自动
```

### 7.2 Shadowrocket

单订阅：

```text
PROXY = url-test,订阅名,use=true,policy-regex-filter=...
→ FINAL,PROXY
```

多订阅：

```text
PROXY = url-test,订阅A,订阅B,use=true,policy-regex-filter=...
→ FINAL,PROXY
```

或者：

```text
Sub-Store 合并订阅
→ Shadowrocket 导入合并订阅
→ PROXY = url-test,合并订阅名,use=true,policy-regex-filter=...
```

---

## 8. 常见问题

### 8.1 新建代理组为什么没有生效？

规则没有指向这个代理组。需要让规则中的策略名称与代理组名称一致。

### 8.2 Clash Verge 中两个订阅为什么不能一起使用？

因为它们通常是两个独立 Profile。需要使用 `proxy-providers` 把它们放进同一个配置。

### 8.3 Shadowrocket 多订阅代理组为什么为空？

常见原因：

```text
订阅名不一致
订阅未启用
policy-regex-filter 没有匹配节点
节点名称不包含地区关键词
```

### 8.4 发达地区自动组为什么出现通知节点？

需要在排除条件中加入：

```text
剩余、流量、套餐、到期、重置、官网、通知、客户端、更新、备用域名、旧节点
```

### 8.5 自动组为什么频繁切换？

提高 `tolerance`。

Clash / Mihomo：

```yaml
tolerance: 100
```

Shadowrocket：

```ini
tolerance=100
```

---

## 9. 参数参考

### interval

测速间隔。

```yaml
interval: 300
```

### tolerance

容差值。

```yaml
tolerance: 50
```

### lazy

懒加载测速。

```yaml
lazy: true
```

### policy-regex-filter

Shadowrocket 中用于按节点名称筛选代理节点。

```ini
policy-regex-filter=...
```

---

## 10. 免责声明

本项目仅整理代理客户端配置方法、规则结构和正则表达式。实际连接质量取决于订阅内容、节点质量、客户端版本、本地网络环境和目标服务的访问策略。
