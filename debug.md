# Mobile App 真机测试缺陷记录

- 设备：Android 真机（ID `10ADB5022F002RL`）
- 构建：`apps/mobile` Expo 55，debug APK（`xyz.app315618.banxiacycle.debug`）
- 后端：`https://period-api-235126-9-1412339053.sh.run.tcloudbase.com`
- 测试用户：`mobile-preview-user-cn`
- 测试日期：2026-04-17
- Metro 日志持久监视期间未捕获到 ERROR / WARN / 崩溃

---

## 严重度：高

### Bug 1 —— "记录今天" 入口在已有周期内会静默覆盖旧记录

- **现象**：首页入口"记录今天"默认使用当天日期；若今天落入某条已有记录的 `start~end` 区间内，保存时实际发送 `PATCH /cycles/:id` 修改那条历史记录，而非创建新记录；用户无任何提示。
- **复现**：
  1. 已有记录 `80e35cff`：start `2026-04-11`，end `2026-04-17`
  2. 今天是 `2026-04-17`，点首页"记录今天"
  3. 在表单中把 `startDate` 改为 `2026-04-20` 并保存
  4. 查 API：`records` 数量不变，原 `80e35cff` 被改写为 `2026-04-20 ~ 2026-04-27`，`updatedAt` 刷新为 `2026-04-17T11:09:50`
- **预期**：用户心智是"新建一条"，此场景至少应：
  - 在提交前提示"该日期已有记录，是否覆盖？"，或
  - 区分"记录今天"（编辑当前周期）与"新建周期"（总是 POST）两个入口
- **风险**：历史记录可能被静默覆盖，且没有保留版本，数据不可恢复。

### Bug 2 —— 同一 `startDate/endDate` 存在重复记录，后端未去重

- **现象**：`GET /cycles` 返回两条完全重叠的记录：
  - `cb3c5498` — start `2026-03-16`，end `2026-03-22`，createdAt `2026-03-22T09:34:35.628Z`
  - `efbb3b2b` — start `2026-03-16`，end `2026-03-22`，createdAt `2026-04-14T09:56:52.869Z`
- **影响**：
  - 趋势页"最近记录"把这两条并排展示
  - `summary.averageCycleLength` 计算被重复记录拉偏（当前 24 天）
  - 预测基于偏差数据，`predictedCycleLength` 跟随偏移
- **预期**：后端在 `POST /cycles` 或 `PATCH /cycles/:id` 时对同一用户的 `startDate`（或重叠区间）做校验，要么覆盖要么拒绝；前端展示层也可合并重叠周期。
- **修复方向**：优先在 API 层加约束（唯一约束或业务校验），前端展示去重只作兜底。

---

## 严重度：中

### Bug 3 —— 趋势页删除后 UI 未刷新

- **现象**：删除记录 `64efed43`（`2026-05-15 → 2026-05-21`），API `GET /cycles` 确认 `records` 从 6 降到 5，返回趋势页后：
  - 右上角仍显示"·6条"
  - "最近记录"列表第一条仍是 `2026-05-15 → 2026-05-21`
- **预期**：删除后重新进入趋势页应显示 5 条，计数改为 5。
- **怀疑**：`app/trends.tsx` 或其数据源对删除事件未做 invalidate / refetch，只靠首次进入时拉取的快照渲染。
- **复现**：
  1. 在首页新建一条未来日期的记录（如 2026-05-15）
  2. 打开趋势页确认该记录出现
  3. 返回首页，删除这条记录
  4. 再次打开趋势页 → UI 与 API 不一致

### Bug 4 —— 隐私页"最近动作"列表不随导出操作刷新

- **现象**：
  - 点"导出 / 访问日志" → 后端 `privacy/actions` 成功新增一条 `type:export_data`
  - UI"导出预览"显示本次生成时间与记录数（`2026/04/17 19:34, 5 条记录`）
  - 但同页"最近动作"列表仍是旧的 3 条（2026-03-20 / 03-22 / 03-30），未包含本次
- **预期**：导出成功后列表应与 `GET /privacy/actions` 同步。
- **怀疑**：与 Bug 3 同源 —— 进入页面时一次性拉取，之后的本地操作不触发重取。
- **可疑文件**：`apps/mobile/app/privacy.tsx`

---

### Bug 7 —— Onboarding 重走时不做 Consent 幂等校验，产生重复 grant 记录

- **现象**：
  - 用 `adb shell pm clear xyz.app315618.banxiacycle.debug` 清本地数据后从桌面打开 app，onboarding 重新出现
  - 走完 onboarding 后，`GET /consents` 多出 2 条 granted：
    - `9d9376cd` `privacy_policy` granted `v=2026.03` at `2026-04-17T13:21:29.824Z`
    - `d726d02c` `sensitive_health_data` granted `v=2026.03` at `2026-04-17T13:21:30.129Z`
  - 但旧的同类型 granted 记录并未被撤销：
    - `3c094d98` `privacy_policy` granted `v=2026.03`（2026-04-14）仍 active
    - `31d960a7` `sensitive_health_data` granted `v=v1.0.0`（2026-04-17 11:35）仍 active
- **结果**：同一用户对 `privacy_policy` 和 `sensitive_health_data` 各有 **2 条 active granted 记录**。
- **影响**：合规审计容易双重计数、版本追溯混乱；用户在隐私页撤销一次可能还保留着另一条生效同意。
- **预期**：onboarding 提交同意前，前端应先检查是否已有同 type 的 active granted 记录，若有则跳过（或替换）；后端也可加唯一约束（同 userId+type 只允许一条 active granted）。
- **旁证**：这次 `sensitive_health_data` 的 version 是 `2026.03`，而此前在隐私页撤销后再 grant 的版本是 `v1.0.0` —— 不同入口硬编码了不同的 version 字符串，与"观察 —— Consent 版本号不一致"相互印证。
- **可疑文件**：`apps/mobile/app/onboarding.tsx`、`apps/mobile/app/privacy.tsx` 中 `api.grantConsent` 的调用点

## 严重度：低

### Bug 5 —— 隐私页同意开关切换瞬间 UI 闪烁

- **现象**：切换"提醒通知"开关（撤销 / 再授权）时，按下瞬间页面"闪两下"。API 正常（`735a1258` withdraw → `b47db093` grant 仅间隔 4 秒）。
- **推断**：不是 crash。怀疑是点击后触发整页 consents 重拉，loading 占位 → 数据回来重绘导致视觉抖动。
- **建议**：切换改为**乐观更新**（立刻改 UI 状态，失败回滚）；或者 loading 时保留当前渲染不清空列表。
- **可疑文件**：`apps/mobile/app/privacy.tsx`

### Bug 8 —— 声明支持深色模式但实际未适配

- **现象**：系统切换深色模式后，app 界面与浅色模式完全无差别（文字颜色、背景色、卡片、按钮配色都不变）。
- **证据**：
  - `apps/mobile/app.json` 第 9 行：`"userInterfaceStyle": "automatic"` —— 声明跟随系统
  - 已封装 `apps/mobile/components/useColorScheme.ts`
  - 但 `apps/mobile/app/(tabs)/*`、`app/trends.tsx`、`app/privacy.tsx`、`app/reminder-settings.tsx` 都**没有 import / 调用** `useColorScheme`
  - `apps/mobile/app/_layout.tsx:72` 硬编码 `<StatusBar style="dark" />`
- **影响**：声明与实现不符。系统深色模式下白底黑字的 UI 与手机整体的深色环境反差很大，夜间使用刺眼。
- **修复方向**：
  - 要么把 `userInterfaceStyle` 改为 `"light"`（明确放弃深色）
  - 要么让各页面通过 `useColorScheme` 消费主题，并在 `StatusBar` 上使用动态 style

### Bug 6 —— 提醒设置页批量修改时偶现部分字段未保存（难稳定复现）

- **现象**：一次保存中改动 4 项，仅部分落盘：
  - 关闭 `period_due` ✅
  - 开启 `logging_gap` ❌ 首次未生效
  - `delayed.leadDays` 2→5 ✅
  - `quietHours.start` 22:00→23:00 ✅ / `quietHours.end` 08:00→07:00 ❌ 首次未生效
- **复测**：单独操作 `logging_gap` 和 `quietHours.end` 都能落盘。
- **推断**：控件和 PUT 链路没问题，怀疑批量修改时 TimePicker 关闭未触发 onCommit，或首次保存按钮未点到。
- **状态**：偶现，暂不阻断。
- **可疑文件**：`apps/mobile/app/reminder-settings.tsx`

---

## 观察（非 Bug）

### Consent 版本号不一致

- 同一用户对 `sensitive_health_data` 的两次 grant：
  - 首次 (2026-04-14)：`version: "2026.03"`
  - 撤销后再次 grant (2026-04-17)：`version: "v1.0.0"`
- 不算缺陷，但版本命名风格不同，可能是前端 `api.grantConsent` 调用处把 `version` 写死为 `v1.0.0`。若后端依赖版本号做合规基线判断，可能带来审计混乱。

### 趋势页经期天数显示公式

- `4-20 → 4-27` 显示"8 天"，`3-16 → 3-22` 显示"7 天"：公式 `end-start+1` 一致，4-20~4-27 的 endDate 是用户手动拉到 27 号的，所以 8 天正确。不是 bug。

### 网络异常错误弹窗文案通用

- 飞行模式下保存失败弹"保存失败 / 请稍后重试"，没区分"网络不可用"和"服务端错误"；可做 UX 打磨，不阻断。

### 横屏锁定为竖屏

- `app.json` 第 6 行 `"orientation": "portrait"` 明确锁定竖屏，旋转手机 app 不跟随 —— 为设计决策，不列为缺陷。

### 大字体适配良好

- 系统字体拉到最大后，首页 / 日历 / 趋势 / 设置 / 提醒 / 隐私 / 新建记录等页面的卡片、按钮、标签均未塌陷或被截断，整体表现过关。

---

## 未完成功能

- **伴侣设置（partner-settings）**：`apps/mobile/app/partner-settings.tsx` 仅是一个 `<Redirect href="/(tabs)/settings" />` 占位；`(tabs)/settings.tsx` 中也没有跳到该路由的入口按钮。功能在路由表注册但 UI 无可达入口。

---

## 测试通过的场景

- **CRUD 主链路**：新建 / 编辑 / 删除（`POST / PATCH / DELETE /cycles`）API 层均正常
- **编辑 `updatedAt` 单独验证**：对 `62285e6a`（2026-06-01）仅改 `painLevel` 1→2 并保存后，`updatedAt` 从 `11:42:10` 刷新到 `13:19:19`，`createdAt` 保持不变；`startDate/endDate` 未动，符合 PATCH 语义
- **提醒偏好 PUT**：单字段修改能正确落盘
- **同意 grant / withdraw**：`POST /consents` 和 `POST /consents/:id/withdraw` 工作正常
- **导出数据**：`GET /privacy/export` 成功，UI 给出预览
- **飞行模式**：保存失败有用户可感知的弹窗，表单字段保留便于重试
- **网络恢复**：自动回显数据
- **冷启动**：上滑杀掉 app 再打开，首页 / 趋势数据与后端一致

---

## 仍待覆盖（本轮未测）

- **删除账户（`POST /privacy/delete`）**：本次未执行，会清空所有记录与偏好；建议单独找测试账号跑。
- ~~**AsyncStorage 边缘路径**：已验证 —— `pm clear` 后 onboarding 能重走，记录与偏好由后端回显，隐私同意按 type 最新一条渲染，但 onboarding 重走会造成重复 grant（见 Bug 7）。~~
- ~~**大字体 / 深色模式 / 横屏**：已验证 —— 大字体各页面布局良好无塌陷；横屏锁 portrait 是设计决策；深色模式未适配见 Bug 8。~~
