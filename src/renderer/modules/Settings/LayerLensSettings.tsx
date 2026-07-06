/* Bazecor
 * Copyright (C) 2024  DygmaLab SE.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect } from "react";
import { ipcRenderer } from "electron";
import { Card, CardContent, CardHeader, CardTitle } from "@Renderer/components/atoms/Card";
import { Switch } from "@Renderer/components/atoms/Switch";
import { Slider } from "@Renderer/components/atoms/slider";
import { IconLens } from "@Renderer/components/atoms/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@Renderer/components/atoms/Tooltip";

interface LensSettingsShape {
  enabled: boolean;
  opacity: number;
  overlayAutoShow: boolean;
  hoverMode: boolean;
}

const LayerLensSettings = () => {
  const [lensEnabled, setLensEnabled] = useState(false);
  const [layerLensOnChange, setLayerLensOnChange] = useState(false);
  const [hoverMode, setHoverMode] = useState(false);
  const [overlayTransparency, setOverlayTransparency] = useState([85]);
  const [runInBackground, setRunInBackground] = useState(false);

  const applySettings = (s: Partial<LensSettingsShape>) => {
    if (typeof s.enabled === "boolean") setLensEnabled(s.enabled);
    if (typeof s.overlayAutoShow === "boolean") setLayerLensOnChange(s.overlayAutoShow);
    if (typeof s.hoverMode === "boolean") setHoverMode(s.hoverMode);
    if (typeof s.opacity === "number") setOverlayTransparency([Math.round(s.opacity * 100)]);
  };

  useEffect(() => {
    ipcRenderer
      .invoke("lens:get-settings")
      .then((s: LensSettingsShape) => applySettings(s))
      .catch(() => {});
    ipcRenderer
      .invoke("lens:get-run-in-background")
      .then((v: boolean) => setRunInBackground(v))
      .catch(() => {});

    // Keep in sync with changes made elsewhere (overlay window, tray, shortcut).
    const onSettings = (_: unknown, s: LensSettingsShape) => applySettings(s);
    ipcRenderer.on("lens:settings", onSettings);
    return () => {
      ipcRenderer.removeListener("lens:settings", onSettings);
    };
  }, []);

  const handleLensEnabled = async (checked: boolean) => {
    setLensEnabled(checked);
    await ipcRenderer.invoke("lens:set-enabled", checked);
    // Turning Lens on for the first time also turns on background mode (main side).
    const bg: boolean = await ipcRenderer.invoke("lens:get-run-in-background").catch(() => runInBackground);
    setRunInBackground(bg);
  };

  const handleLayerLensOnChange = (checked: boolean) => {
    setLayerLensOnChange(checked);
    ipcRenderer.invoke("lens:set-overlay-auto-show", checked).catch(() => {});
  };

  const handleHoverMode = (checked: boolean) => {
    setHoverMode(checked);
    ipcRenderer.invoke("lens:set-hover-mode", checked).catch(() => {});
  };

  const handleOverlayTransparency = (value: number[]) => {
    setOverlayTransparency(value);
    ipcRenderer.invoke("lens:set-opacity", value[0] / 100).catch(() => {});
  };

  const handleRunInBackground = (checked: boolean) => {
    setRunInBackground(checked);
    ipcRenderer.invoke("lens:set-run-in-background", checked).catch(() => {});
  };

  return (
    <Card className="mt-3 max-w-2xl mx-auto" variant="default">
      <CardHeader>
        <CardTitle variant="default">
          <IconLens /> Layer Lens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center w-full justify-between py-2 border-b-[1px] border-gray-50 dark:border-gray-700">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label htmlFor="lensEnabledSwitch" className="m-0 text-sm font-semibold tracking-tight cursor-help">
                    Layer Lens
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Shows a keyboard overlay with the active layer. Toggle it anytime with Ctrl+Alt+L.</p>
                </TooltipContent>
              </Tooltip>
              <Switch
                id="lensEnabledSwitch"
                checked={lensEnabled}
                onCheckedChange={handleLensEnabled}
                variant="default"
                size="sm"
              />
            </div>

            <div className="flex items-center w-full justify-between py-2 border-b-[1px] border-gray-50 dark:border-gray-700">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label htmlFor="layerLensOnChangeSwitch" className="m-0 text-sm font-semibold tracking-tight cursor-help">
                    Layer Lens on layer change
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Automatically shows Layer Lens for a few seconds whenever you switch to a different layer, then hides it
                    again.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Switch
                id="layerLensOnChangeSwitch"
                checked={layerLensOnChange}
                onCheckedChange={handleLayerLensOnChange}
                variant="default"
                size="sm"
              />
            </div>

            <div className="flex items-center w-full justify-between py-2 border-b-[1px] border-gray-50 dark:border-gray-700">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label htmlFor="hoverModeSwitch" className="m-0 text-sm font-semibold tracking-tight cursor-help">
                    Hover mode
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Lets you click, drag, and resize the Layer Lens overlay by hovering your mouse over it, instead of it staying
                    click-through.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Switch id="hoverModeSwitch" checked={hoverMode} onCheckedChange={handleHoverMode} variant="default" size="sm" />
            </div>

            <div className="flex items-center w-full justify-between py-2 border-b-[1px] border-gray-50 dark:border-gray-700">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label htmlFor="runInBackgroundSwitch" className="m-0 text-sm font-semibold tracking-tight cursor-help">
                    Keep running in background
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Keeps Bazecor in the system tray when you close its window (and starts it at login), so Layer Lens stays
                    available at all times.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Switch
                id="runInBackgroundSwitch"
                checked={runInBackground}
                onCheckedChange={handleRunInBackground}
                variant="default"
                size="sm"
              />
            </div>

            <div className="py-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label
                    htmlFor="overlayTransparencySlider"
                    className="block mb-3 text-sm font-semibold tracking-tight cursor-help"
                  >
                    Overlay transparency
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Controls how see-through the Layer Lens overlay is, so it blends with whatever is behind it.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Slider
                id="overlayTransparencySlider"
                value={overlayTransparency}
                onValueChange={handleOverlayTransparency}
                min={10}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{overlayTransparency[0]}%</div>
            </div>
          </TooltipProvider>
        </form>
      </CardContent>
    </Card>
  );
};

export default LayerLensSettings;
