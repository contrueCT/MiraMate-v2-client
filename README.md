# MiraMate v2 Client

MiraMate 是一个以「长期陪伴 / 持续运行 / 类人格化」为方向的开源 AI 伴侣智能体项目。此仓库为 **客户端 (Windows 桌面端 + Android)**：

- Windows：Electron + Vue 3 + Vite + TypeScript
- Android：Capacitor（同一前端代码，原生打包为 APK/AAB）

> 客户端本身不内置大模型推理能力，它通过 REST 与 WebSocket 连接远端后端服务，实现对话、配置同步、流式输出与后续的“自主活动”展示。完整的智能体核心（记忆、调度、长程行为）在后端仓库：
> https://github.com/contrueCT/MiraMate-v2

---

## 目标与特点

与普通“一问一答”的聊天程序不同，MiraMate 的长期目标：

1. 持续运行并保持内部记忆 / 背景状态。
2. 具备类似“生活节奏”的自主活动（规划中）。
3. 多阶段回复：思考 → 流式输出 → 后处理整理。
4. 支持多种模型 / 接口类型（OpenAI 兼容、Google Gemini 等，可扩展）。
5. 可被动响应，也能主动触发对话（`proactive_chat`）。

本客户端聚焦：

- 直观的流式输出体验与状态可视化。
- 远程模型与对话设定查看 / 编辑。
- 服务连接、健康检查与本地偏好持久化。
- 未来扩展：主动行为面板、记忆可视化、工具调用轨迹等。

---

## 技术栈

| 领域     | 技术                                  |
| -------- | ------------------------------------- |
| UI 框架  | Vue 3 + `<script setup>` + TypeScript |
| 状态管理 | Pinia                                 |
| 构建     | Vite                                  |
| 样式     | Tailwind CSS                          |
| 桌面封装 | Electron（自定义无边框窗口）          |
| 通信     | REST + WebSocket（流式增量 token）    |
| 配置适配 | `configAdapter`（前后端模型配置互转） |

---

## 支持平台与获取方式

- Windows 桌面端与 Android 客户端
  - 在 GitHub Releases 页面获取安装包与 APK：
    - https://github.com/contrueCT/MiraMate-v2-client/releases

> 提示：客户端本身不包含模型推理，请在设置中填写后端服务地址与鉴权密钥；公网部署时 HTTP 走 Bearer 鉴权，WebSocket 通过 URL `token` 参数鉴权。

---

## 目录结构（节选）

```
electron/          # 主进程 / 预加载脚本
dist-electron/     # 打包后主进程产物
src/
	components/      # UI 组件（聊天输入、头部、设置面板等）
	core/
		stores/        # Pinia stores (chat / settings / service)
		services/      # socket / apiClient / configAdapter 等通信与适配层
		types.ts       # 公共类型
	views/           # ChatView / SettingsView
	assets/          # 静态资源与图标
```

---

## 后续规划（Roadmap 简要）

- 主动行为面板（展示“当前正在做什么”任务）
- 工具 / 函数调用轨迹可视化
- 插件化扩展（第三方脚本接入）
- 系统托盘 + 主动提醒

---

## 贡献

欢迎通过 Issue / PR / 讨论参与：

1. Fork 仓库
2. 创建分支：`feat/...` 或 `fix/...`
3. 提交并发起 PR（保持 ESLint + Prettier 一致）

如果新增模型接口类型，请同步更新：

- `core/types.ts`
- `core/services/configAdapter.ts`
- 相关设置组件（模型卡、选择器）

---

## 许可

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 后端仓库

智能体核心 / 长程逻辑：
https://github.com/contrueCT/MiraMate-v2

---

## 致谢

感谢所有探索“长期运行智能体”与人格化交互方向的开源社区贡献者。欢迎一起改进与扩展 MiraMate。

---

> 若你正在阅读此文件并准备首次运行：请先部署 / 连接后端，否则客户端仅会显示未配置状态。
