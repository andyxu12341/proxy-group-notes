# 多订阅合并方法

本文说明 Clash Verge / Mihomo 与 Shadowrocket 中的多订阅合并逻辑，并给出对应模板。

多订阅合并的目标是让多个订阅来源中的节点进入同一个代理组，再通过地区策略进行筛选。

---

## 1. 合并逻辑概览

### 1.1 Clash Verge / Mihomo

Clash Verge / Mihomo 推荐使用 `proxy-providers` 合并多个订阅来源。

```text
订阅 A
+
订阅 B
↓
proxy-providers
↓
同一个 proxy-groups
```

核心结构：

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

`use` 表示该代理组同时使用多个 provider 中的节点。

### 1.2 Shadowrocket

Shadowrocket 不使用 Mihomo 的 `proxy-providers`，也没有 Clash Verge 的全局扩展脚本。多订阅通常有两种方式：

```text
方式 A：同一个代理组直接引用多个订阅名称
方式 B：先通过 Sub-Store / 订阅转换生成合并订阅，再在 Shadowrocket 中筛选
```

---

## 2. Clash Verge / Mihomo 多订阅合并

### 2.1 模板文件

```text
configs/clash-verge-merge-template.yaml
```

模板包含：

```text
节点选择
🌐 发达地区自动
🇺🇸 美国自动
♻️ 全部自动
AI 服务分流规则
国内直连规则
MATCH 兜底规则
```

### 2.2 使用步骤

复制模板为本地配置文件，例如：

```text
merged-local.yaml
```

替换模板中的订阅占位符：

```yaml
url: "SUBSCRIPTION_URL_A"
url: "SUBSCRIPTION_URL_B"
```

在 Clash Verge Rev 中导入：

```text
订阅
→ 新建
→ 本地配置 / Local File
→ 选择 merged-local.yaml
→ 保存
→ 切换到该配置
→ 刷新 / 更新
→ 测试延迟
```

### 2.3 YAML 合并 + 全局扩展脚本

Clash Verge / Mihomo 也可以采用“订阅来源”和“筛选策略”分离的结构：

```text
YAML：负责定义多个订阅来源
全局扩展脚本：负责自动生成地区代理组
```

YAML 中只维护 provider：

```yaml
proxy-providers:
  sub_a:
    type: http
    url: "SUBSCRIPTION_URL_A"

  sub_b:
    type: http
    url: "SUBSCRIPTION_URL_B"
```

再由以下脚本自动创建 `🌐 发达地区自动`：

```text
scripts/clash-verge-developed.js
```

这种方式适合频繁调整订阅来源，但希望地区筛选策略保持统一的配置体系。

---

## 3. Shadowrocket 多订阅合并

### 3.1 多订阅名直接引用

如果 Shadowrocket 中已经存在多个订阅来源，可以在同一个代理组中直接引用多个订阅名称。

模板文件：

```text
configs/shadowrocket-multi-developed.conf
```

核心结构：

```ini
PROXY = url-test,<SUBSCRIPTION_NAME_A>,<SUBSCRIPTION_NAME_B>,use=true,url=http://www.gstatic.com/generate_204,policy-regex-filter=...
```

示例：

```ini
PROXY = url-test,SakuraCat,api.efanyunapi.com,use=true,url=http://www.gstatic.com/generate_204,policy-regex-filter=...
```

订阅名称应与 Shadowrocket 配置中显示的名称一致。

适用场景：

```text
多个订阅都已在 Shadowrocket 中可用
希望一个代理组同时筛选多个订阅中的节点
规则集中指向 PROXY
```

### 3.2 Sub-Store / 订阅转换合并

另一种方式是先在外部工具中合并订阅，再导入 Shadowrocket。

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
需要多个客户端共用同一个合并订阅
需要统一节点命名
需要节点去重、重命名或加前缀
```

### 3.3 Shadowrocket 与 YAML

部分 Shadowrocket 配置支持 `yaml = true`，但这不等同于支持 Clash Verge 的全局扩展脚本。

因此，Shadowrocket 多订阅合并的主方案应优先使用：

```text
多订阅名引用
Sub-Store / 订阅转换
```

而不是依赖 Clash Verge 的脚本机制。

---

## 4. 地区策略

多订阅合并后，可以继续使用三类地区策略。

### 4.1 全部发达地区

覆盖非港澳发达国家 / 地区与全部欧盟成员国。

相关文件：

```text
scripts/clash-verge-developed.js
configs/clash-verge-merge-template.yaml
configs/shadowrocket-developed.conf
configs/shadowrocket-multi-developed.conf
configs/shadowrocket-developed-region-regex.txt
```

### 4.2 美国自动

只筛选美国相关节点。

相关文件：

```text
configs/clash-verge-merge-template.yaml
configs/shadowrocket-us.conf
```

### 4.3 自定义模板

用于按实际节点命名规则建立新的自动代理组。

相关文件：

```text
configs/clash-verge-custom-template.yaml
configs/shadowrocket-custom-template.conf
```

---

## 5. 常见问题

### 5.1 Clash Verge 添加两个订阅后为什么不能一起使用？

因为两个订阅通常是两个独立 Profile，不是同一个配置里的两个 provider。需要使用 `proxy-providers` 将订阅来源放进同一个配置。

### 5.2 Shadowrocket 多订阅代理组为什么为空？

常见原因包括：

```text
订阅名称与配置中显示名称不一致
订阅未启用
policy-regex-filter 没有匹配到节点
节点名称缺少地区关键词
```

### 5.3 发达地区自动组为什么出现通知节点？

机场订阅可能将套餐、流量、到期时间、客户端提示等信息写成节点。应在排除条件中加入：

```text
剩余、流量、套餐、到期、重置、官网、通知、客户端、更新、备用域名、旧节点
```

### 5.4 合并后节点可用性由什么决定？

合并模板只负责组织节点和筛选节点。实际连接质量取决于订阅内容、节点协议、客户端内核、本地网络环境和系统代理状态。
