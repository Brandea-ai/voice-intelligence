"use client";

import { useCallback } from "react";
import { X, Sun, Moon, Monitor, Pin, Eye } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useTheme, ThemeMode } from "@/hooks/useTheme";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, setAlwaysOnTop, setShowThemeToggle } = useSettings();
  const { mode: themeMode, setThemeMode, isDark } = useTheme();

  const handleThemeChange = useCallback(
    async (mode: ThemeMode) => {
      await setThemeMode(mode);
    },
    [setThemeMode]
  );

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-[20px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[280px] rounded-2xl overflow-hidden"
        style={{
          background: isDark ? "rgba(30, 40, 50, 0.95)" : "rgba(255, 255, 255, 0.98)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Einstellungen
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-element)]"
          >
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Theme Selection */}
          <div className="space-y-2">
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              Erscheinungsbild
            </span>
            <div className="flex gap-2">
              <ThemeButton
                icon={<Monitor className="w-4 h-4" />}
                label="System"
                isActive={themeMode === "system"}
                onClick={() => handleThemeChange("system")}
                isDark={isDark}
              />
              <ThemeButton
                icon={<Sun className="w-4 h-4" />}
                label="Hell"
                isActive={themeMode === "light"}
                onClick={() => handleThemeChange("light")}
                isDark={isDark}
              />
              <ThemeButton
                icon={<Moon className="w-4 h-4" />}
                label="Dunkel"
                isActive={themeMode === "dark"}
                onClick={() => handleThemeChange("dark")}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-2">
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              Optionen
            </span>

            {/* Always on Top */}
            <ToggleRow
              icon={<Pin className="w-4 h-4" />}
              label="Immer im Vordergrund"
              isEnabled={settings.alwaysOnTop}
              onToggle={() => setAlwaysOnTop(!settings.alwaysOnTop)}
              isDark={isDark}
            />

            {/* Show Theme Toggle */}
            <ToggleRow
              icon={<Eye className="w-4 h-4" />}
              label="Theme-Button anzeigen"
              isEnabled={settings.showThemeToggle}
              onToggle={() => setShowThemeToggle(!settings.showThemeToggle)}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThemeButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isDark: boolean;
}

function ThemeButton({ icon, label, isActive, onClick, isDark }: ThemeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg transition-all"
      style={{
        background: isActive
          ? isDark
            ? "rgba(59, 130, 246, 0.2)"
            : "rgba(59, 130, 246, 0.15)"
          : "var(--bg-element)",
        border: isActive
          ? "1px solid rgba(59, 130, 246, 0.4)"
          : "1px solid transparent",
        color: isActive ? "var(--accent)" : "var(--text-secondary)",
      }}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  isEnabled: boolean;
  onToggle: () => void;
  isDark: boolean;
}

function ToggleRow({ icon, label, isEnabled, onToggle, isDark }: ToggleRowProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--bg-element)]"
    >
      <span style={{ color: "var(--text-secondary)" }}>{icon}</span>
      <span
        className="flex-1 text-left text-sm"
        style={{ color: "var(--text-primary)" }}
      >
        {label}
      </span>
      {/* Toggle Switch */}
      <div
        className="w-10 h-6 rounded-full p-0.5 transition-colors"
        style={{
          background: isEnabled
            ? "rgba(59, 130, 246, 0.8)"
            : isDark
              ? "rgba(255,255,255,0.15)"
              : "rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
          style={{
            transform: isEnabled ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </div>
    </button>
  );
}
