<template>
  <div class="page">
    <h2 class="page-title">数据管理</h2>
    <div
      v-if="toastVisible"
      class="toast"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      {{ toastMessage }}
    </div>

    <div class="card">
      <h3 class="card-title">评论数据导出</h3>
      <p class="card-desc">将所有评论数据导出为 JSON 格式。</p>
      <div class="card-actions">
        <button class="card-button" :disabled="exporting" @click="handleExport">
          <span v-if="exporting">导出中...</span>
          <span v-else>导出 JSON</span>
        </button>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">评论数据导入</h3>
      <p class="card-desc">从其他评论系统导入数据，请选择来源并上传 JSON 文件。</p>

      <div class="form-group">
        <label class="form-label">来源系统</label>
        <select v-model="importSource" class="form-select">
          <option value="twikoo">Twikoo (.json)</option>
          <option value="artalk">Artalk (.json)</option>
        </select>
      </div>

      <div class="card-actions">
        <input
          type="file"
          ref="fileInput"
          accept=".json"
          style="display: none"
          @change="handleFileChange"
        />
        <button class="card-button" :disabled="importing" @click="triggerFileInput">
          <span v-if="importing">导入中...</span>
          <span v-else>选择文件并导入</span>
        </button>
      </div>

      <div v-if="importLogs.length > 0" class="log-container">
        <div class="log-title">导入日志</div>
        <div class="log-list">
          <div v-for="(log, index) in importLogs" :key="index" class="log-item">
            {{ log }}
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">其他</h3>
      <p class="card-desc">访问明细、后台配置等数据导入导出正在开发中...</p>
      
    </div>

    <!-- 前缀确认弹窗 -->
    <div v-if="showPrefixModal" class="modal-overlay">
      <div class="modal">
        <h3 class="modal-title">检测到 URL 缺失前缀</h3>
        <p class="modal-desc">
          检测到 <strong>{{ missingPrefixCount }}</strong> 条评论的 URL
          不存在域名前缀（http/https）。<br />
          是否在导入时统一添加？
        </p>
        <div class="form-group">
          <label class="form-label">域名前缀 (例如 https://example.me)</label>
          <input
            v-model="urlPrefix"
            class="form-input"
            placeholder="请输入域名前缀"
            @keyup.enter="confirmPrefix"
          />
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" @click="cancelPrefix">
            直接导入 (不添加)
          </button>
          <button class="modal-btn primary" @click="confirmPrefix">添加并导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { exportComments, importComments } from "../api/admin";

const exporting = ref(false);
const importing = ref(false);
const importSource = ref("twikoo");
const fileInput = ref<HTMLInputElement | null>(null);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);
const importLogs = ref<string[]>([]);

// 前缀处理相关状态
const showPrefixModal = ref(false);
const urlPrefix = ref("");
const missingPrefixCount = ref(0);
const pendingJson = ref<any[]>([]);

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  window.setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

function addLog(msg: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const timeStr = `${y}.${m}.${d} ${h}:${min}:${s}`;
  importLogs.value.push(`${timeStr} ${msg}`);
}

async function handleExport() {
  exporting.value = true;
  try {
    const data = await exportComments();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comments-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast("导出成功", "success");
  } catch (e: any) {
    showToast(e.message || "导出失败", "error");
  } finally {
    exporting.value = false;
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // 重置 input，允许重复选择同一文件
  target.value = "";

  // 清空之前的日志
  importLogs.value = [];
  showPrefixModal.value = false;
  urlPrefix.value = "";
  pendingJson.value = [];

  importing.value = true;
  addLog(`开始导入文件 ${file.name}`);
  addLog("正在读取文件...");

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      addLog("文件读取完成，正在解析数据...");

      let json;
      try {
        json = JSON.parse(content);
      } catch (parseError) {
        throw new Error("JSON 解析失败，请检查文件格式");
      }

      const comments = Array.isArray(json) ? json : [json];
      const count = comments.length;
      addLog(`解析成功，共 ${count} 条数据`);

      // 检测前缀逻辑
      let missingCount = 0;
      for (const item of comments) {
        // 优先检查 Twikoo 字段 href，其次 Artalk 字段 page_key，最后 CWD 字段 post_slug
        const url = item.href || item.page_key || item.post_slug;
        if (url && typeof url === "string") {
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            missingCount++;
          }
        }
      }

      if (missingCount > 0) {
        addLog(`检测到 ${missingCount} 条评论 URL 缺少前缀，等待确认...`);
        missingPrefixCount.value = missingCount;
        pendingJson.value = comments;
        showPrefixModal.value = true;
        // 暂停在这里，等待用户操作 modal
      } else {
        // 无需处理，直接导入
        await executeImport(comments);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`导入失败：${err.message || "未知错误"}`);
      showToast(err.message || "导入失败，文件格式错误", "error");
      importing.value = false;
    }
  };

  reader.onerror = () => {
    addLog("读取文件失败");
    showToast("读取文件失败", "error");
    importing.value = false;
  };

  reader.readAsText(file);
}

async function confirmPrefix() {
  if (!urlPrefix.value) {
    showToast("请输入域名前缀", "error");
    return;
  }

  // 处理前缀，确保以 / 结尾或拼接正确
  let prefix = urlPrefix.value.trim();
  // 简单处理：如果 prefix 不以 / 结尾，且 url 不以 / 开头，可能需要补 /。
  // 但通常用户输入的域名可能带也可能不带。
  // 这里假设用户输入的 prefix 是 "https://example.com"，而 href 是 "/posts/1" 或 "posts/1"
  // 为了安全，如果 prefix 结尾没有 /，且 target 不以 / 开头，中间加个 /。
  // 但更简单的策略是直接拼，让用户自己负责输入正确的。
  // 考虑到用户习惯，我们做个简单的优化：如果 prefix 没 / 且 url 没 /，加一个。

  const comments = pendingJson.value.map((item) => {
    // 浅拷贝
    const newItem = { ...item };

    // Twikoo
    if (newItem.href && typeof newItem.href === "string") {
      if (!newItem.href.startsWith("http://") && !newItem.href.startsWith("https://")) {
        newItem.href = joinUrl(prefix, newItem.href);
      }
    }

    // Artalk
    if (newItem.page_key && typeof newItem.page_key === "string") {
      if (
        !newItem.page_key.startsWith("http://") &&
        !newItem.page_key.startsWith("https://")
      ) {
        newItem.page_key = joinUrl(prefix, newItem.page_key);
      }
    }

    // CWD
    if (newItem.post_slug && typeof newItem.post_slug === "string") {
      if (
        !newItem.post_slug.startsWith("http://") &&
        !newItem.post_slug.startsWith("https://")
      ) {
        newItem.post_slug = joinUrl(prefix, newItem.post_slug);
      }
    }

    return newItem;
  });

  showPrefixModal.value = false;
  addLog(`已为 ${missingPrefixCount.value} 条数据添加前缀`);
  await executeImport(comments);
}

function joinUrl(prefix: string, path: string): string {
  if (prefix.endsWith("/") && path.startsWith("/")) {
    return prefix + path.substring(1);
  }
  if (!prefix.endsWith("/") && !path.startsWith("/")) {
    return prefix + "/" + path;
  }
  return prefix + path;
}

function cancelPrefix() {
  showPrefixModal.value = false;
  addLog("用户选择跳过添加前缀，直接导入");
  executeImport(pendingJson.value);
}

async function executeImport(comments: any[]) {
  addLog("正在上传并导入数据库...");
  try {
    const res = await importComments(comments);
    addLog(`导入完成：${res.message || "成功"}`);
    showToast(res.message || "导入成功", "success");
  } catch (err: any) {
    console.error(err);
    addLog(`导入失败：${err.message || "未知错误"}`);
    showToast(err.message || "导入失败", "error");
  } finally {
    importing.value = false;
    pendingJson.value = [];
  }
}
</script>

<style scoped>
/* ... (existing styles) ... */
.form-input {
  padding: 8px;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #0969da;
  outline: none;
  box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.3);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  width: 400px;
  max-width: 90%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292f;
}

.modal-desc {
  margin: 0;
  font-size: 14px;
  color: #57606a;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.modal-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.modal-btn.primary {
  background-color: #0969da;
  color: white;
}

.modal-btn.secondary {
  background-color: #f6f8fa;
  border-color: #d0d7de;
  color: #24292f;
}

.modal-btn:hover {
  opacity: 0.9;
}

.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 520px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.card {
  background-color: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  padding: 16px 18px;
  margin-bottom: 1em;
}

.card-title {
  margin: 0 0 12px;
  font-size: 15px;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stats-item {
  padding: 10px 12px;
  border-radius: 6px;
  background-color: var(--bg-sider);
  border: 1px solid var(--border-color);
}

.stats-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stats-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.stats-value-approved {
  color: var(--color-success);
}

.stats-value-pending {
  color: var(--color-warning);
}

.stats-value-rejected {
  color: var(--color-danger);
}

.domain-table {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.domain-table-header {
  display: flex;
  background-color: var(--bg-sider);
  color: var(--text-secondary);
}

.domain-table-row {
  display: flex;
  border-top: 1px solid var(--border-color);
}

.domain-cell {
  flex: 1;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text-primary);
  box-sizing: border-box;
}

.domain-cell-domain {
  flex: 2;
  font-weight: 500;
}

.card-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.card-button {
  padding: 8px 14px;
  border-radius: 4px;
  border: none;
  background-color: var(--primary-color);
  color: var(--text-inverse);
  font-size: 14px;
  cursor: pointer;
  min-width: 100px;
}

.card-button:disabled {
  opacity: 0.7;
  cursor: default;
}

.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-select {
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-primary);
  background-color: var(--bg-input);
  outline: none;
}

.form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.3);
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 220px;
  max-width: 320px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  box-shadow: var(--shadow-card);
  z-index: 1000;
}

.toast-success {
  background-color: var(--color-success);
  color: var(--text-inverse);
}

.toast-error {
  background-color: var(--color-danger);
  color: var(--text-inverse);
}

.log-container {
  margin-top: 16px;
  padding: 12px;
  background-color: var(--bg-sider);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.log-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono",
    monospace;
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>
