<template>
  <div class="layout">
    <header class="layout-header">
      <button
        class="layout-menu-toggle"
        @click="toggleSider"
        aria-label="切换菜单"
        type="button"
      >
        <svg class="layout-menu-icon" viewBox="0 0 24 24" width="18" height="18">
          <path
            d="M4 7h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2zm0 6h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2zm0 6h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2z"
            fill="currentColor"
          />
        </svg>
      </button>
      <div class="layout-title">CWD 评论系统</div>
      <div class="layout-actions-wrapper">
        <div class="layout-domain-filter layout-domain-filter-header">
          <select v-model="domainFilter" class="layout-domain-select">
            <option value="">全部域名</option>
            <option v-for="item in domainOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <div class="layout-actions">
          <a class="layout-button" href="https://cwd.js.org" target="_blank">
            使用文档
          </a>
          <a class="layout-button" href="https://github.com/anghunk/cwd" target="_blank">
            Github
          </a>
          <button
            class="layout-button"
            @click="cycleTheme"
            :title="themeTitle"
            type="button"
          >
            <svg v-if="theme === 'light'" viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414-2.121-2.121zm2.121-14.85l1.414 1.415-2.121 2.121-1.414-1.414 2.121-2.121zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414 2.121-2.121zM23 11v2h-3v-2h3zM4 11v2H1v-2h3z"
                fill="currentColor"
              />
            </svg>
            <svg v-else-if="theme === 'dark'" viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M20 12.986c-.52.095-1.056.15-1.6.15-5.238 0-9.486-4.248-9.486-9.486 0-.544.055-1.08.15-1.6-5.275.986-9.264 5.615-9.264 11.123 0 6.255 5.07 11.325 11.325 11.325 5.508 0 10.137-3.989 11.123-9.264a9.66 9.66 0 0 1-2.248.752z"
                fill="currentColor"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM6 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H6zm-3 14a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button class="layout-button" @click="handleLogout">退出</button>
        </div>

        <button
          class="layout-actions-toggle"
          @click="toggleActions"
          aria-label="更多操作"
          type="button"
        >
          <svg class="layout-actions-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M12 5.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zm0 8a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zm0 8a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div v-if="isActionsOpen" class="layout-actions-dropdown">
          <button class="layout-actions-item" type="button" @click="openDocs">
            使用文档
          </button>
          <button class="layout-actions-item" type="button" @click="openGithub">
            Github
          </button>
          <button
            class="layout-actions-item layout-actions-item-danger"
            type="button"
            @click="handleLogoutFromActions"
          >
            退出
          </button>
        </div>
      </div>
    </header>
    <div class="layout-body">
      <nav
        class="layout-sider"
        :class="{ 'layout-sider-mobile-open': isMobileSiderOpen }"
      >
        <div class="layout-sider-domain-filter">
          <select v-model="domainFilter" class="layout-domain-select">
            <option value="">全部域名</option>
            <option v-for="item in domainOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <ul class="menu">
          <li
            class="menu-item"
            :class="{ active: isRouteActive('comments') }"
            @click="goComments"
          >
            评论管理
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('stats') }"
            @click="goStats"
          >
            数据看板
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('analytics') }"
            @click="goAnalytics"
          >
            访问统计
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('settings') }"
            @click="goSettings"
          >
            网站设置
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('data') }"
            @click="goData"
          >
            数据管理
          </li>
        </ul>
      </nav>
      <div v-if="isMobileSiderOpen" class="layout-sider-mask" @click="closeSider" />
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, provide, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { logoutAdmin, fetchDomainList } from "../api/admin";
import { useTheme } from "../composables/useTheme";

const DOMAIN_STORAGE_KEY = "cwd_admin_domain_filter";

const router = useRouter();
const route = useRoute();
const { theme, setTheme } = useTheme();

const isMobileSiderOpen = ref(false);
const isActionsOpen = ref(false);

const themeTitle = computed(() => {
  if (theme.value === "light") return "明亮模式";
  if (theme.value === "dark") return "暗黑模式";
  return "跟随系统";
});

function cycleTheme() {
  if (theme.value === "system") setTheme("light");
  else if (theme.value === "light") setTheme("dark");
  else setTheme("system");
}

const storedDomain =
  typeof window !== "undefined"
    ? window.localStorage.getItem(DOMAIN_STORAGE_KEY) || ""
    : "";
const domainFilter = ref(storedDomain);
const domainOptions = ref<string[]>([]);

async function loadDomains() {
  try {
    const res = await fetchDomainList();
    const domains = Array.isArray(res.domains) ? res.domains : [];
    const set = new Set(domains);
    if (domainFilter.value && !set.has(domainFilter.value)) {
      set.add(domainFilter.value);
    }
    domainOptions.value = Array.from(set);
  } catch {
    domainOptions.value = [];
  }
}

provide("domainFilter", domainFilter);

onMounted(() => {
  loadDomains();
});

watch(domainFilter, (value) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DOMAIN_STORAGE_KEY, value || "");
  }
});

function isRouteActive(name: string) {
  return route.name === name;
}

function closeSider() {
  isMobileSiderOpen.value = false;
}

function toggleSider() {
  isMobileSiderOpen.value = !isMobileSiderOpen.value;
}

function toggleActions() {
  isActionsOpen.value = !isActionsOpen.value;
}

function closeActions() {
  isActionsOpen.value = false;
}

function goComments() {
  router.push({ name: "comments" });
  closeSider();
}

function goStats() {
  router.push({ name: "stats" });
  closeSider();
}

function goAnalytics() {
  router.push({ name: "analytics" });
  closeSider();
}

function goData() {
  router.push({ name: "data" });
  closeSider();
}

function goSettings() {
  router.push({ name: "settings" });
  closeSider();
}

function goFeatureSettings() {
  router.push({ name: "feature-settings" });
  closeSider();
}

function openDocs() {
  window.open("https://cwd.js.org", "_blank");
  closeActions();
}

function openGithub() {
  window.open("https://github.com/anghunk/cwd", "_blank");
  closeActions();
}

function handleLogout() {
  logoutAdmin();
  router.push({ name: "login" });
  closeSider();
}

function handleLogoutFromActions() {
  closeActions();
  handleLogout();
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}
::-webkit-scrollbar {
  width: 8px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg-body);
  border-radius: 0;
}
::-webkit-scrollbar-thumb {
  background: var(--text-secondary);
  border-radius: 10px;
  transition: all 0.1s linear;
}
.layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.layout-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: var(--bg-header);
  color: var(--text-inverse);
  border-bottom: 1px solid var(--border-header);
}

.layout-title {
  font-size: 18px;
  font-weight: 600;
}

.layout-actions-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.layout-domain-filter {
  display: flex;
  align-items: center;
}

.layout-domain-select {
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-header);
  background-color: var(--bg-select);
  color: var(--text-inverse);
  font-size: 13px;
}

.layout-sider-domain-filter {
  display: none;
}

.layout-actions {
  display: flex;
  gap: 8px;
}

.layout-button {
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-header);
  background-color: var(--bg-select);
  color: var(--text-inverse);
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.layout-button:hover {
  background-color: var(--border-header);
}

.layout-actions-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid var(--border-header);
  background-color: var(--bg-select);
  color: var(--text-inverse);
  cursor: pointer;
}

.layout-actions-dropdown {
  display: none;
}

.layout-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.layout-sider {
  width: 180px;
  background-color: var(--bg-sider);
  border-right: 1px solid var(--border-color);
}

.menu {
  list-style: none;
  margin: 0;
  padding: 12px 0;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 15px;
  color: var(--text-primary);
}

.menu-item:hover {
  background-color: var(--bg-hover);
}

.menu-item.active {
  background-color: var(--bg-active);
  font-weight: 600;
  color: var(--primary-color);
}

.layout-content {
  flex: 1;
  padding: 16px 20px 40px;
  overflow: auto;
}

.layout-menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-header);
  background-color: var(--bg-select);
  color: var(--text-inverse);
  cursor: pointer;
  font-size: 13px;
}

.layout-sider-mask {
  display: none;
}

@media (max-width: 768px) {
  .layout {
    height: 100vh;
  }

  .layout-header {
    padding: 0 12px;
    gap: 8px;
  }

  .layout-title {
    font-size: 16px;
  }

  .layout-body {
    position: relative;
  }

  .layout-menu-toggle {
    display: inline-flex;
  }

  .layout-sider {
    position: fixed;
    top: 56px;
    left: 0;
    bottom: 0;
    width: 220px;
    max-width: 80%;
    border-right: 1px solid var(--border-color);
    transform: translateX(-100%);
    transition: transform 0.2s ease-out;
    z-index: 1000;
  }

  .layout-sider-mobile-open {
    transform: translateX(0);
  }

  .layout-sider-mask {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 900;
    display: block;
  }

  .layout-content {
    padding: 12px;
  }

  .layout-actions {
    display: none;
  }

  .layout-domain-filter-header {
    display: none;
  }

  .layout-sider-domain-filter {
    display: block;
    padding: 12px 16px 0;
  }

  .layout-sider-domain-filter .layout-domain-select {
    width: 100%;
    box-sizing: border-box;
  }

  .layout-actions-toggle {
    display: inline-flex;
  }

  .layout-actions-dropdown {
    position: fixed;
    top: 56px;
    right: 12px;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: var(--shadow-card);
    padding: 6px 0;
    min-width: 160px;
    z-index: 1100;
    display: flex;
    flex-direction: column;
  }

  .layout-actions-item {
    padding: 8px 14px;
    font-size: 13px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    color: var(--text-primary);
    width: 100%;
  }

  .layout-actions-item:hover {
    background-color: var(--bg-hover);
  }

  .layout-actions-item-danger {
    color: var(--color-danger);
  }

  .layout-actions-item-danger:hover {
    background-color: rgba(209, 36, 47, 0.1);
  }
}
</style>
