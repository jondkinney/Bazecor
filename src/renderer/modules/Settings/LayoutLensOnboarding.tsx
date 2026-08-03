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

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@Renderer/components/atoms/Card";
import { IconLens } from "@Renderer/components/atoms/icons";

// Assets
import assignLensKeys from "@Assets/Animation.gif";
import turnItOn from "@Assets/LensOnPic.png";
import showItYourWay from "@Assets/ShotItYourWay.gif";
import moveAndResizeIt from "@Assets/Move&ResizeIt.gif";

interface Step {
  title: string;
  description: string;
  image: string;
}

const steps: Step[] = [
  {
    title: "Assign the Lens Keys",
    description: "Open the layout editor and assign LENS TAP / LENS HOLD to a key to show or hide the keyboard overlay.",
    image: assignLensKeys,
  },
  {
    title: "Turn it on",
    description: "Enable Layout Lens in the Settings below.",
    image: turnItOn,
  },
  {
    title: "Show it your way",
    description:
      'Turn on "Show only on layer change" to automatically reveal the overlay for a few seconds every time you switch layers.',
    image: showItYourWay,
  },
  {
    title: "Move and resize it",
    description: "Enable Resize Mode to click, drag, and resize the overlay exactly where you want it on your screen.",
    image: moveAndResizeIt,
  },
];

// The card is 44% wider than the max-w-2xl (42rem) every other settings card
// uses, so the step GIFs get enough room to be readable. LayerLensSettings is
// widened to match, keeping the two cards of this tab aligned.
const LayoutLensOnboarding = () => (
  <Card className="mt-3 max-w-[60.48rem] mx-auto" variant="default">
    <CardHeader>
      <CardTitle variant="default">
        <IconLens /> First time using Layout Lens
      </CardTitle>
      <CardDescription className="mt-1">
        Layout Lens is an on-screen overlay that shows your keyboard&apos;s active layer. Here&apos;s how to get started.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col gap-2">
            {/* Every asset is ~16:9 (see src/static), so a fixed video ratio keeps the
                four cards aligned no matter which one is a still and which is a GIF. */}
            <img
              src={step.image}
              alt={step.title}
              className="aspect-video w-full rounded-lg border border-gray-100 object-cover dark:border-gray-600"
            />
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500 dark:bg-gray-600 dark:text-gray-100">
                {index + 1}
              </span>
              <div>
                <p className="m-0 text-sm font-semibold tracking-tight">{step.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default LayoutLensOnboarding;
