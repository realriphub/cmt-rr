<template>
  <div class="page">
    <h2 class="page-title">{{ t("data.title") }}</h2>
    <div
      v-if="toastVisible"
      class="toast"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      {{ toastMessage }}
    </div>

    <!-- 1. 评论数据 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.comments.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.comments.desc") }}</p>

      <div class="action-row">
        <span class="action-label">{{ t("data.sections.comments.exportLabel") }}</span>
        <button
          class="card-button secondary"
          :disabled="exporting"
          @click="handleExportComments"
        >
          <span v-if="exporting">{{ t("data.sections.comments.exporting") }}</span>
          <span v-else>{{ t("data.sections.comments.exportJson") }}</span>
        </button>
      </div>

      <div class="action-row">
        <span class="action-label">{{ t("data.sections.comments.importLabel") }}</span>
        <select v-model="importSource" class="form-select" style="min-width: 120px">
          <option value="cwd">{{ t("data.sections.comments.source.cwd") }}</option>
          <option value="twikoo">{{ t("data.sections.comments.source.twikoo") }}</option>
          <option value="artalk">{{ t("data.sections.comments.source.artalk") }}</option>
        </select>
        <button
          class="card-button secondary"
          :disabled="importing"
          @click="triggerFileInput('comments')"
        >
          {{ t("data.sections.comments.importButton") }}
        </button>
      </div>
    </div>

    <!-- 2. 系统配置 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.config.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.config.desc") }}</p>
      <div class="action-row">
        <button
          class="card-button secondary"
          :disabled="exporting"
          @click="handleExportConfig"
        >
          {{ t("data.sections.config.export") }}
        </button>
        <button
          class="card-button secondary"
          :disabled="importing"
          @click="triggerFileInput('config')"
        >
          {{ t("data.sections.config.import") }}
        </button>
      </div>
    </div>

    <!-- 3. 访问统计 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.stats.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.stats.desc") }}</p>
      <div class="action-row">
        <button
          class="card-button secondary"
          :disabled="exporting"
          @click="handleExportStats"
        >
          {{ t("data.sections.stats.export") }}
        </button>
        <button
          class="card-button secondary"
          :disabled="importing"
          @click="triggerFileInput('stats')"
        >
          {{ t("data.sections.stats.import") }}
        </button>
      </div>
    </div>

    <!-- 4. 全量备份 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.backup.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.backup.desc") }}</p>
      <div class="action-row">
        <button
          class="card-button secondary"
          :disabled="exporting"
          @click="handleExportBackup"
        >
          {{ t("data.sections.backup.export") }}
        </button>
        <button
          class="card-button secondary"
          :disabled="importing"
          @click="triggerFileInput('backup')"
        >
          {{ t("data.sections.backup.import") }}
        </button>
      </div>
    </div>

    <!-- 5. S3 备份 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.s3.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.s3.desc") }}</p>

      <div class="form-group">
        <label class="form-label">{{ t("data.sections.s3.endpoint") }}</label>
        <input
          v-model="s3Config.endpoint"
          class="form-input"
          :placeholder="t('data.sections.s3.endpointHint')"
        />
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">{{ t("data.sections.s3.bucket") }}</label>
          <input v-model="s3Config.bucket" class="form-input" />
        </div>
        <div class="form-group half">
          <label class="form-label">{{ t("data.sections.s3.region") }}</label>
          <input
            v-model="s3Config.region"
            class="form-input"
            :placeholder="t('data.sections.s3.regionHint')"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">{{ t("data.sections.s3.accessKey") }}</label>
          <input v-model="s3Config.accessKeyId" class="form-input" />
        </div>
        <div class="form-group half">
          <label class="form-label">{{ t("data.sections.s3.secretKey") }}</label>
          <input v-model="s3Config.secretAccessKey" class="form-input" />
        </div>
      </div>

      <div class="action-row" style="margin-top: 16px">
        <button class="card-button primary" :disabled="s3Saving" @click="handleSaveS3">
          {{ s3Saving ? t("data.sections.s3.saving") : t("data.sections.s3.save") }}
        </button>
        <button
          class="card-button secondary"
          :disabled="s3BackingUp"
          @click="handleS3Backup"
        >
          {{
            s3BackingUp ? t("data.sections.s3.backingUp") : t("data.sections.s3.backup")
          }}
        </button>
        <button
          class="card-button secondary"
          :disabled="false"
          @click="handleViewS3Backups"
        >
          {{ t("data.sections.s3.viewBackups") }}
        </button>
      </div>
    </div>

    <!-- 隐藏的文件输入框 -->
    <input
      type="file"
      ref="fileInput"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />

    <!-- 导入日志 -->
    <div v-if="importLogs.length > 0" class="log-container">
      <div class="log-title">{{ t("data.logs.title") }}</div>
      <div class="log-list">
        <div v-for="(log, index) in importLogs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
    </div>

    <!-- 前缀确认弹窗 -->
    <div v-if="showPrefixModal" class="modal-overlay">
      <div class="modal">
        <h3 class="modal-title">{{ t("data.prefixModal.title") }}</h3>
        <p class="modal-desc">
          {{ t("data.prefixModal.descPart1") }}
          <strong>{{ missingPrefixCount }}</strong>
          {{ t("data.prefixModal.descPart2") }}<br />
          {{ t("data.prefixModal.descPart3") }}
        </p>
        <div class="form-group">
          <label class="form-label">{{ t("data.prefixModal.label") }}</label>
          <input
            v-model="urlPrefix"
            class="form-input"
            :placeholder="t('data.prefixModal.placeholder')"
            @keyup.enter="confirmPrefix"
          />
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" @click="cancelPrefix">
            {{ t("data.prefixModal.skip") }}
          </button>
          <button class="modal-btn primary" @click="confirmPrefix">
            {{ t("data.prefixModal.confirm") }}
          </button>
        </div>
      </div>
    </div>

    <!-- S3 备份列表弹窗 -->
    <S3BackupModal
      :visible="showS3BackupModal"
      @close="handleS3BackupModalClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  exportComments,
  importComments,
  exportConfig,
  importConfig,
  exportStats,
  importStats,
  exportBackup,
  importBackup,
  fetchS3Settings,
  saveS3Settings,
  triggerS3Backup,
  S3SettingsResponse,
} from "../../api/admin";
import S3BackupModal from "./components/S3BackupModal.vue";
import { useSite } from "../../composables/useSite";

const { t } = useI18n();

const exporting = ref(false);
const importing = ref(false);
const importSource = ref("cwd");
const fileInput = ref<HTMLInputElement | null>(null);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);
const importLogs = ref<string[]>([]);
const { currentSiteId } = useSite();

// 当前导入模式: comments | config | stats | backup
const currentImportMode = ref<string>("comments");

// 前缀处理相关状态
const showPrefixModal = ref(false);
const urlPrefix = ref("");
const missingPrefixCount = ref(0);
const pendingJson = ref<any[]>([]);
const s3Config = ref<S3SettingsResponse>({
  endpoint: "",
  accessKeyId: "",
  secretAccessKey: "",
  bucket: "",
  region: "auto",
});
const s3Saving = ref(false);
const s3BackingUp = ref(false);
const showS3BackupModal = ref(false);

async function loadS3Config() {
  try {
    const res = await fetchS3Settings();
    s3Config.value = res;
  } catch (e) {
    // silent fail or log
  }
}

async function handleSaveS3() {
  s3Saving.value = true;
  try {
    await saveS3Settings(s3Config.value);
    showToast(t("common.saveSuccess"));
  } catch (e: any) {
    showToast(e.message || t("common.saveFailed"), "error");
  } finally {
    s3Saving.value = false;
  }
}

async function handleS3Backup() {
  s3BackingUp.value = true;
  try {
    const res = await triggerS3Backup();
    showToast(t("data.sections.s3.success", { file: res.file }));
  } catch (e: any) {
    showToast(e.message || t("data.messages.exportFailed"), "error");
  } finally {
    s3BackingUp.value = false;
  }
}

function handleViewS3Backups() {
  showS3BackupModal.value = true;
}

function handleS3BackupModalClose() {
  showS3BackupModal.value = false;
}

onMounted(() => {
  loadS3Config();
});

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
  const timeStr = now.toLocaleTimeString();
  importLogs.value.push(`[${timeStr}] ${msg}`);
}

// 通用导出函数
async function executeExport(apiFunc: () => Promise<any>, fileNamePrefix: string) {
  exporting.value = true;
  try {
    const data = await apiFunc();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileNamePrefix}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast(t("data.messages.exportSuccess"), "success");
  } catch (e: any) {
    showToast(e.message || t("data.messages.exportFailed"), "error");
  } finally {
    exporting.value = false;
  }
}

// 导出处理
const handleExportComments = () => executeExport(exportComments, "comments-export");
const handleExportConfig = () => executeExport(exportConfig, "cwd-config");
const handleExportStats = () =>
  executeExport(() => exportStats(currentSiteId.value), "cwd-stats");
const handleExportBackup = () => executeExport(exportBackup, "cwd-full-backup");

// 触发文件选择
function triggerFileInput(mode: string) {
  currentImportMode.value = mode;
  importLogs.value = [];
  if (fileInput.value) {
    fileInput.value.value = ""; // 重置 input
    fileInput.value.click();
  }
}

// 文件选择回调
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  importing.value = true;
  addLog(
    t("data.messages.importStart", { name: file.name, mode: currentImportMode.value })
  );

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      let json;
      try {
        json = JSON.parse(content);
      } catch (parseError) {
        throw new Error(t("data.messages.jsonParseFailed"));
      }

      addLog(t("data.messages.fileParseSuccess"));

      switch (currentImportMode.value) {
        case "comments":
          await processImportComments(json);
          break;
        case "config":
          await processImportConfig(json);
          break;
        case "stats":
          await processImportStats(json);
          break;
        case "backup":
          await processImportBackup(json);
          break;
      }
    } catch (err: any) {
      console.error(err);
      addLog(t("data.messages.errorWithMessage", { msg: err.message }));
      showToast(err.message, "error");
      importing.value = false;
    }
  };

  reader.onerror = () => {
    addLog(t("data.messages.readFileFailedLog"));
    showToast(t("data.messages.fileReadFailed"), "error");
    importing.value = false;
  };

  reader.readAsText(file);
}

// 导入处理逻辑
async function processImportConfig(data: any) {
  const res = await importConfig(data);
  addLog(res.message);
  showToast(t("data.messages.importConfigSuccess"));
  importing.value = false;
}

async function processImportStats(data: any) {
  const res = await importStats(data);
  addLog(res.message);
  showToast(t("data.messages.importStatsSuccess"));
  importing.value = false;
}

async function processImportBackup(data: any) {
  const res = await importBackup(data);
  addLog(res.message);
  showToast(t("data.messages.importBackupSuccess"));
  importing.value = false;
}

async function processImportComments(json: any) {
  const comments = Array.isArray(json) ? json : [json];
  addLog(t("data.messages.parsedCommentsCount", { count: comments.length }));

  // 检查 URL 前缀 (仅针对评论导入)
  let missingCount = 0;
  for (const item of comments) {
    const url = item.href || item.page_key || item.post_slug;
    if (url && typeof url === "string") {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        missingCount++;
      }
    }
  }

  if (missingCount > 0) {
    addLog(t("data.messages.detectMissingPrefix", { count: missingCount }));
    missingPrefixCount.value = missingCount;
    pendingJson.value = comments;
    showPrefixModal.value = true;
    // 暂停，等待 Modal 操作
  } else {
    await executeImportComments(comments);
  }
}

async function executeImportComments(comments: any[]) {
  try {
    const res = await importComments(comments);
    addLog(t("data.messages.importCommentsDone", { message: res.message }));
    showToast(t("data.messages.importCommentsSuccess"));
  } catch (err: any) {
    throw err;
  } finally {
    importing.value = false;
    pendingJson.value = [];
  }
}

// 前缀确认逻辑
async function confirmPrefix() {
  if (!urlPrefix.value) {
    showToast(t("data.messages.prefixRequired"), "error");
    return;
  }

  let prefix = urlPrefix.value.trim();
  const comments = pendingJson.value.map((item) => {
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
  addLog(t("data.messages.prefixAdded"));
  await executeImportComments(comments);
}

function cancelPrefix() {
  showPrefixModal.value = false;
  addLog(t("data.messages.skipPrefix"));
  executeImportComments(pendingJson.value);
}

function joinUrl(prefix: string, path: string): string {
  if (prefix.endsWith("/") && path.startsWith("/")) return prefix + path.substring(1);
  if (!prefix.endsWith("/") && !path.startsWith("/")) return prefix + "/" + path;
  return prefix + path;
}
</script>

<style scoped lang="less">
@import "../../styles/components/data.less";

.form-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.form-group {
  margin-top: 12px;
}

.form-group.half {
  flex: 1;
  margin-top: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
  color: var(--text-primary);
}

/* S3 备份弹窗样式 */
.s3-backup-modal {
  max-width: 600px;
  width: 90%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 5px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-content {
  overflow-y: auto;
  flex: 1;
}

.empty-backup-list {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  gap: 12px;
}

.backup-info {
  flex: 1;
  min-width: 0;
}

.backup-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.backup-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

</style>
