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

import React, { useState, useEffect, useRef } from "react";
import { ipcRenderer } from "electron";
import path from "path";
import os from "os";
import fs from "fs";
import { Card, CardContent, CardHeader, CardTitle } from "@Renderer/components/atoms/Card";
import { Button } from "@Renderer/components/atoms/Button";
import { Switch } from "@Renderer/components/atoms/Switch";
import { Slider } from "@Renderer/components/atoms/slider";
import { IconLens, IconLoader } from "@Renderer/components/atoms/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@Renderer/components/atoms/Tooltip";

const LENS_SETTINGS_PATH = path.join(os.homedir(), ".lens", "settings.json");

function readLensSettings(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(LENS_SETTINGS_PATH, "utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeLensSettings(patch: Record<string, unknown>): void {
  try {
    const current = readLensSettings();
    fs.mkdirSync(path.dirname(LENS_SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(LENS_SETTINGS_PATH, JSON.stringify({ ...current, ...patch }, null, 2));
  } catch (err) {
    console.error("[LayerLens] Failed to write settings:", err);
  }
}

interface LayerLensSettingsProps {}

const POLL_INTERVAL_MS = 600;
const POLL_TIMEOUT_MS = 12000;

const LayerLensSettings = ({}: LayerLensSettingsProps) => {
  const [lensRunning, setLensRunning] = useState(false);
  const [lensStarting, setLensStarting] = useState(false);
  const [layerLensOnChange, setLayerLensOnChange] = useState(false);
  const [hoverMode, setHoverMode] = useState(false);
  const [overlayTransparency, setOverlayTransparency] = useState([80]);
  const [borderTransparency, setBorderTransparency] = useState([50]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    ipcRenderer.invoke("lens:status").then((running: boolean) => {
      setLensRunning(running);
    }).catch(() => {});

    const s = readLensSettings();
    if (typeof s.overlayAutoShow === "boolean") setLayerLensOnChange(s.overlayAutoShow as boolean);
    if (typeof s.hoverMode === "boolean") setHoverMode(s.hoverMode as boolean);
    if (typeof s.opacity === "number") setOverlayTransparency([Math.round((s.opacity as number) * 100)]);

    return () => stopPolling();
  }, []);

  const handleStartLens = async () => {
    setLensStarting(true);
    writeLensSettings({ overlayMode: true });
    await ipcRenderer.invoke("lens:start");

    const deadline = Date.now() + POLL_TIMEOUT_MS;
    pollRef.current = setInterval(async () => {
      const running: boolean = await ipcRenderer.invoke("lens:status").catch(() => false);
      if (running || Date.now() > deadline) {
        stopPolling();
        setLensRunning(running);
        setLensStarting(false);
      }
    }, POLL_INTERVAL_MS);
  };

  const handleStopLens = async () => {
    stopPolling();
    await ipcRenderer.invoke("lens:stop");
    setLensRunning(false);
    setLensStarting(false);
  };

  const handleLayerLensOnChange = (checked: boolean) => {
    setLayerLensOnChange(checked);
    writeLensSettings({ overlayAutoShow: checked });
  };

  const handleHoverMode = (checked: boolean) => {
    setHoverMode(checked);
    writeLensSettings({ hoverMode: checked });
  };

  const handleOverlayTransparency = (value: number[]) => {
    setOverlayTransparency(value);
    writeLensSettings({ opacity: value[0] / 100 });
  };

  const handleBorderTransparency = (value: number[]) => {
    setBorderTransparency(value);
    console.log("Overlay border transparency:", value[0]);
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
                  <label className="m-0 text-sm font-semibold tracking-tight cursor-help">
                    Layer Lens
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Start or stop the Layer Lens overlay process.</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="config"
                size="sm"
                selected={lensRunning}
                disabled={lensStarting}
                onClick={lensRunning ? handleStopLens : handleStartLens}
                icon={lensStarting ? <IconLoader /> : null}
                iconDirection={lensStarting ? "left" : "none"}
              >
                {lensStarting ? "Starting…" : "Start Lens"}
              </Button>
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
                    Automatically shows Layer Lens for a few seconds whenever you switch to a different layer, then
                    hides it again.
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
                    Lets you click, drag, and resize the Layer Lens overlay by hovering your mouse over it, instead of
                    it staying click-through.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Switch
                id="hoverModeSwitch"
                checked={hoverMode}
                onCheckedChange={handleHoverMode}
                variant="default"
                size="sm"
              />
            </div>

            <div className="py-3 border-b-[1px] border-gray-50 dark:border-gray-700">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label htmlFor="overlayTransparencySlider" className="block mb-3 text-sm font-semibold tracking-tight cursor-help">
                    Overlay transparency
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Controls how see-through the Layer Lens overlay is, so it blends with whatever is behind it.</p>
                </TooltipContent>
              </Tooltip>
              <Slider
                id="overlayTransparencySlider"
                value={overlayTransparency}
                onValueChange={handleOverlayTransparency}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {overlayTransparency[0]}%
              </div>
            </div>

            <div className="py-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label htmlFor="borderTransparencySlider" className="block mb-3 text-sm font-semibold tracking-tight cursor-help">
                    Overlay border transparency
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Controls how visible the border drawn around the Layer Lens overlay is.</p>
                </TooltipContent>
              </Tooltip>
              <Slider
                id="borderTransparencySlider"
                value={borderTransparency}
                onValueChange={handleBorderTransparency}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {borderTransparency[0]}%
              </div>
            </div>
          </TooltipProvider>
        </form>
      </CardContent>
    </Card>
  );
};

export default LayerLensSettings;
