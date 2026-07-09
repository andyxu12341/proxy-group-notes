# Clash Verge / Mihomo 双订阅合并方法

本文说明如何在 Clash Verge Rev / Mihomo 中把两个机场订阅的节点合并到同一个配置里，并统一使用 `🌐 发达地区自动`、`🇺🇸 美国自动` 等代理组。

> 不要把真实订阅链接、token、节点密码提交到 GitHub。本仓库只保存模板和规则。

---

## 1. 为什么不是直接在 Clash Verge 添加两个订阅？

Clash Verge 里添加两个订阅，通常只是添加了两个 Profile。实际使用时一般只会启用其中一个完整配置。

```text
订阅 A
订阅 B
```

并不等于：

```text
订阅 A 的节点 + 订阅 B 的节点一起可选
```

要让两个订阅的节点一起参与同一个代理组，推荐使用 Mihomo 的 `proxy-providers`。

---

## 2. 推荐方案：proxy-providers 合并

核心逻辑是：

```yaml
proxy-providers:
  sub_a:
    type: http
    url: "第一个订阅链接"

  sub_b:
    type: http
    url: "第二个订阅链接"

proxy-groups:
  - name: 🌐 发达地区自动
    type: url-test
    use:
      - sub_a
      - sub_b
```

`use` 表示这个代理组同时使用两个订阅来源的节点。

---

## 3. 模板文件位置

可直接复制下面这个模板：

```text
configs/clash-verge-merge-template.yaml
```

模板已经包含：

```text
节点选择
🌐 发达地区自动
🇺🇸 美国自动
♻️ 全部自动
AI 服务分流规则
国内直连规则
MATCH 兜底规则
```

---

## 4. 使用步骤

### 4.1 复制模板

复制：

```text
configs/clash-verge-merge-template.yaml
```

到你本地，例如：

```text
merged-local.yaml
```

### 4.2 替换订阅链接

把模板里的：

```yaml
url: "SUBSCRIPTION_URL_A"
url: "SUBSCRIPTION_URL_B"
```

替换成自己的两个订阅链接。

示例：

```yaml
proxy-providers:
  sub_a:
    type: http
    url: "https://example.com/sub-a"

  sub_b:
    type: http
    url: "https://example.com/sub-b"
```

真实订阅链接不要发给别人，也不要上传 GitHub。

### 4.3 在 Clash Verge 导入

```text
Clash Verge Rev
→ 订阅
→ 新建
→ 本地配置 / Local File
→ 选择 merged-local.yaml
→ 保存
→ 切换到这个配置
→ 刷新 / 更新
→ 测试延迟
```

---

## 5. 发达地区自动组的策略

`🌐 发达地区自动` 覆盖：

```text
台湾、新加坡、日本、韩国、美国、加拿大、英国、澳大利亚、新西兰、以色列、瑞士、挪威、冰岛、列支敦士登、安道尔、摩纳哥、圣马力诺、梵蒂冈、全部欧盟成员国
```

欧盟成员国包括：

```text
奥地利、比利时、保加利亚、克罗地亚、塞浦路斯、捷克、丹麦、爱沙尼亚、芬兰、法国、德国、希腊、匈牙利、爱尔兰、意大利、拉脱维亚、立陶宛、卢森堡、马耳他、荷兰、波兰、葡萄牙、罗马尼亚、斯洛伐克、斯洛文尼亚、西班牙、瑞典
```

排除：

```text
香港、澳门、俄罗斯、白俄罗斯、乌克兰、土耳其、阿联酋、尼日利亚、菲律宾、泰国、越南、印度、印尼、马来西亚、巴西、阿根廷、南非
```

同时排除：

```text
剩余流量、套餐到期、流量重置、官网通知、客户端更新提示、备用域名、旧节点提示、帮助中心等非真实节点
```

---

## 6. 与全局扩展脚本的关系

有两种方式可以得到 `🌐 发达地区自动`：

### 6.1 单订阅 / 普通订阅：用全局扩展脚本

```text
scripts/clash-verge-developed.js
```

适合已经在 Clash Verge 里导入了某个订阅，希望在该订阅加载后自动生成 `🌐 发达地区自动`。

### 6.2 双订阅合并：用 proxy-providers 模板

```text
configs/clash-verge-merge-template.yaml
```

适合两个订阅一起使用。两个订阅会作为 `sub_a` 和 `sub_b` 被同一个代理组调用。

---

## 7. 常见问题

### 7.1 两个订阅添加到 Clash Verge 后为什么不能一起用？

因为它们是两个 Profile，不是同一个配置里的两个节点来源。

### 7.2 为什么发达地区自动组为空？

通常是节点名称没有包含国家 / 地区关键词，或者订阅没有被 provider 成功拉取。

检查：

```text
订阅链接是否有效
provider 是否刷新成功
节点名称是否包含日本 / 美国 / 新加坡 / 台湾 / 德国等关键词
```

### 7.3 为什么出现通知节点？

有些机场会把“剩余流量”“套餐到期”“客户端更新提示”伪装成节点。本模板使用 `exclude-filter` 尽量排除这类节点。

### 7.4 为什么 CC 云 / AnyTLS 节点在 Clash Verge 里 Timeout？

优先检查本地进程拦截、防火墙、系统代理、杀毒软件、Clash Verge 内核版本和 Mihomo 版本。确认原订阅在 Clash Verge 中可用后，再进行合并。

---

## 8. 文件安全建议

可以提交到 GitHub：

```text
模板文件
正则表达式
全局扩展脚本
说明文档
```

不要提交到 GitHub：

```text
真实订阅链接
完整机场配置
节点密码
token
包含账号信息的 YAML / CONF 文件
```
