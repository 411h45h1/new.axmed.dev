import { isMobile, isTablet } from "./responsive.js";

export function calculateCenteredPositions(wins) {
  const mobile = isMobile();
  const _tablet = isTablet();

  if (mobile) {
    return null;
  }

  const menubarHeight =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--menubar-height"
      )
    ) || 28;
  const dockHeight =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--dock-height"
      )
    ) || 84;

  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight - menubarHeight - dockHeight;

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  const windowData = [];

  const sortedWins = [...wins].sort((a, b) => {
    if (a.dataset.app === "about") return -1;
    if (b.dataset.app === "about") return 1;
    return 0;
  });

  sortedWins.forEach((w) => {
    const originalStyle =
      w.getAttribute("data-original-style") || w.getAttribute("style");

    if (!originalStyle) {
      return;
    }

    const leftMatch = originalStyle.match(/left:\s*(\d+)px/);
    const topMatch = originalStyle.match(/top:\s*(\d+)px/);
    const widthMatch = originalStyle.match(/width:\s*(\d+)px/);
    const heightMatch = originalStyle.match(/height:\s*(\d+)px/);

    if (leftMatch && topMatch) {
      const left = parseInt(leftMatch[1]);
      const top = parseInt(topMatch[1]);
      const width = widthMatch ? parseInt(widthMatch[1]) : 420;
      const height = heightMatch ? parseInt(heightMatch[1]) : 280;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, left + width);
      maxY = Math.max(maxY, top + height);

      windowData.push({ w, left, top, width, height, originalStyle });
    }
  });

  if (windowData.length === 0) {
    return null;
  }

  const groupWidth = maxX - minX;
  const groupHeight = maxY - minY;

  const MARGIN = 24;
  const MIN_SCALE = 0.55;

  let scale = 1;
  if (
    groupWidth + MARGIN * 2 > availableWidth ||
    groupHeight + MARGIN * 2 > availableHeight
  ) {
    const scaleX = (availableWidth - MARGIN * 2) / groupWidth;
    const scaleY = (availableHeight - MARGIN * 2) / groupHeight;
    scale = Math.min(scaleX, scaleY, 1);
    if (scale < MIN_SCALE) {
      scale = MIN_SCALE;
    }
  }

  const scaledWidth = groupWidth * scale;
  const scaledHeight = groupHeight * scale;

  let offsetX = (availableWidth - scaledWidth) / 2 - minX * scale;
  let offsetY =
    (availableHeight - scaledHeight) / 2 + menubarHeight - minY * scale;

  const minOffsetX = MARGIN - minX * scale;
  const maxOffsetX =
    availableWidth - MARGIN - (minX + groupWidth) * scale + minX * scale;
  if (offsetX < minOffsetX) offsetX = minOffsetX;
  if (offsetX > maxOffsetX) offsetX = maxOffsetX;

  const topMargin = menubarHeight + MARGIN;
  const minOffsetY = topMargin - minY * scale;
  const maxOffsetY =
    menubarHeight +
    availableHeight -
    MARGIN -
    (minY + groupHeight) * scale +
    minY * scale;
  if (offsetY < minOffsetY) offsetY = minOffsetY;
  if (offsetY > maxOffsetY) offsetY = maxOffsetY;

  return {
    windowData,
    offsetX,
    offsetY,
    menubarHeight,
    scale,
    margin: MARGIN,
  };
}

export function createPreferredLayout(
  visibleWins,
  availableWidth,
  availableHeight,
  menubarHeight,
  MARGIN,
  GAP
) {
  const MIN_W = 220;
  const MIN_H = 140;

  if (!visibleWins.length) {
    return null;
  }

  const tablet = isTablet();
  const windowCount = visibleWins.length;

  const windowMap = {};
  visibleWins.forEach((w) => {
    windowMap[w.dataset.app] = w;
  });

  const aboutMe = windowMap["about"];
  const experience = windowMap["experience"];
  const projects = windowMap["projects"];
  const skills = windowMap["skills"];
  const contact = windowMap["contact"];

  if (tablet) {
    if (windowCount === 1) {
      const singleWidth = Math.round(availableWidth * 0.8);
      const singleHeight = Math.round(availableHeight * 0.8);

      if (singleWidth >= MIN_W && singleHeight >= MIN_H) {
        const centerX = (availableWidth - singleWidth) / 2;
        const centerY = (availableHeight - singleHeight) / 2;

        return {
          type: "preferred",
          entries: [
            {
              w: visibleWins[0],
              left: MARGIN + centerX,
              top: menubarHeight + MARGIN + centerY,
              width: singleWidth,
              height: singleHeight,
              priority: 1,
            },
          ],
          menubarHeight,
          margin: MARGIN,
        };
      }
    } else if (windowCount === 2) {
      const colWidth = Math.round((availableWidth - GAP) / 2);
      const rowHeight = Math.round(availableHeight * 0.9);

      if (colWidth >= MIN_W && rowHeight >= MIN_H) {
        // Sort windows to ensure "about" is on the left
        const sortedWins = [...visibleWins].sort((a, b) => {
          if (a.dataset.app === "about") return -1;
          if (b.dataset.app === "about") return 1;
          return 0;
        });

        const entries = [];
        sortedWins.forEach((w, idx) => {
          entries.push({
            w: w,
            left: MARGIN + idx * (colWidth + GAP),
            top: menubarHeight + MARGIN,
            width: colWidth,
            height: rowHeight,
            priority: 1,
          });
        });

        return {
          type: "preferred",
          entries: entries,
          menubarHeight,
          margin: MARGIN,
        };
      }
    } else if (windowCount === 3) {
      const topColWidth = Math.round((availableWidth - GAP) / 2);
      const bottomWidth = Math.round(availableWidth * 0.8);
      const topRowHeight = Math.round((availableHeight - GAP) / 2);
      const bottomHeight = Math.round((availableHeight - GAP) / 2);

      if (
        topColWidth >= MIN_W &&
        topRowHeight >= MIN_H &&
        bottomWidth >= MIN_W &&
        bottomHeight >= MIN_H
      ) {
        // Sort windows to ensure "about" is in the top-left position
        const sortedWins = [...visibleWins].sort((a, b) => {
          if (a.dataset.app === "about") return -1;
          if (b.dataset.app === "about") return 1;
          return 0;
        });

        const entries = [
          {
            w: sortedWins[0],
            left: MARGIN,
            top: menubarHeight + MARGIN,
            width: topColWidth,
            height: topRowHeight,
            priority: 1,
          },
          {
            w: sortedWins[1],
            left: MARGIN + topColWidth + GAP,
            top: menubarHeight + MARGIN,
            width: topColWidth,
            height: topRowHeight,
            priority: 1,
          },
          {
            w: sortedWins[2],
            left: MARGIN + (availableWidth - bottomWidth) / 2,
            top: menubarHeight + MARGIN + topRowHeight + GAP,
            width: bottomWidth,
            height: bottomHeight,
            priority: 1,
          },
        ];

        return {
          type: "preferred",
          entries: entries,
          menubarHeight,
          margin: MARGIN,
        };
      }
    } else {
      const colWidth = Math.round((availableWidth - GAP) / 2);
      const rowHeight = Math.round((availableHeight - GAP) / 2);

      if (colWidth >= MIN_W && rowHeight >= MIN_H) {
        const orderedWindows = [];
        if (aboutMe) orderedWindows.push(aboutMe);
        if (projects) orderedWindows.push(projects);
        if (skills) orderedWindows.push(skills);
        if (contact) orderedWindows.push(contact);

        visibleWins.forEach((w) => {
          if (!orderedWindows.includes(w)) {
            orderedWindows.push(w);
          }
        });

        const entries = [];
        orderedWindows.slice(0, 4).forEach((w, idx) => {
          const row = Math.floor(idx / 2);
          const col = idx % 2;
          entries.push({
            w: w,
            left: MARGIN + col * (colWidth + GAP),
            top: menubarHeight + MARGIN + row * (rowHeight + GAP),
            width: colWidth,
            height: rowHeight,
            priority: idx < 2 ? 1 : 2,
          });
        });

        return {
          type: "preferred",
          entries: entries,
          menubarHeight,
          margin: MARGIN,
        };
      }
    }
  } else {
    if (windowCount === 1) {
      const singleWidth = Math.round(Math.min(availableWidth * 0.6, 800));
      const singleHeight = Math.round(Math.min(availableHeight * 0.8, 600));

      if (singleWidth >= MIN_W && singleHeight >= MIN_H) {
        const centerX = (availableWidth - singleWidth) / 2;
        const centerY = (availableHeight - singleHeight) / 2;

        return {
          type: "preferred",
          entries: [
            {
              w: visibleWins[0],
              left: MARGIN + centerX,
              top: menubarHeight + MARGIN + centerY,
              width: singleWidth,
              height: singleHeight,
              priority: 1,
            },
          ],
          menubarHeight,
          margin: MARGIN,
        };
      }
    } else if (windowCount === 2) {
      const colWidth = Math.round((availableWidth - GAP) / 2);
      const fullHeight = availableHeight;

      if (colWidth >= MIN_W && fullHeight >= MIN_H) {
        // Sort windows to ensure "about" is on the left
        const sortedWins = [...visibleWins].sort((a, b) => {
          if (a.dataset.app === "about") return -1;
          if (b.dataset.app === "about") return 1;
          return 0;
        });

        const entries = [];
        sortedWins.forEach((w, idx) => {
          entries.push({
            w: w,
            left: MARGIN + idx * (colWidth + GAP),
            top: menubarHeight + MARGIN,
            width: colWidth,
            height: fullHeight,
            priority: 1,
          });
        });

        return {
          type: "preferred",
          entries: entries,
          menubarHeight,
          margin: MARGIN,
        };
      }
    } else if (windowCount === 3) {
      const leftColWidth = Math.round(availableWidth * 0.42);
      const rightColWidth = availableWidth - leftColWidth - GAP;
      const halfHeight = Math.round((availableHeight - GAP) / 2);
      const fullHeight = availableHeight;

      if (
        leftColWidth >= MIN_W &&
        rightColWidth >= MIN_W &&
        halfHeight >= MIN_H
      ) {
        const priorityWindows = [];
        const otherWindows = [];

        visibleWins.forEach((w) => {
          if (w.dataset.app === "about") {
            priorityWindows.unshift(w);
          } else if (w.dataset.app === "projects") {
            priorityWindows.push(w);
          } else {
            otherWindows.push(w);
          }
        });

        const orderedWindows = [...priorityWindows, ...otherWindows];

        const hasProjects = visibleWins.some(
          (w) => w.dataset.app === "projects"
        );
        const hasExperience = visibleWins.some(
          (w) => w.dataset.app === "experience"
        );

        if (hasProjects && hasExperience) {
          const thirdWindow = visibleWins.find(
            (w) =>
              w.dataset.app !== "projects" && w.dataset.app !== "experience"
          );
          const projectsWindow = visibleWins.find(
            (w) => w.dataset.app === "projects"
          );
          const experienceWindow = visibleWins.find(
            (w) => w.dataset.app === "experience"
          );

          if (thirdWindow && projectsWindow && experienceWindow) {
            const entries = [
              {
                w: thirdWindow,
                left: MARGIN,
                top: menubarHeight + MARGIN,
                width: leftColWidth,
                height: halfHeight,
                priority: 2,
              },
              {
                w: projectsWindow,
                left: MARGIN,
                top: menubarHeight + MARGIN + halfHeight + GAP,
                width: leftColWidth,
                height: halfHeight,
                priority: 1,
              },
              {
                w: experienceWindow,
                left: MARGIN + leftColWidth + GAP,
                top: menubarHeight + MARGIN,
                width: rightColWidth,
                height: fullHeight,
                priority: 1,
              },
            ];

            return {
              type: "preferred",
              entries: entries,
              menubarHeight,
              margin: MARGIN,
            };
          }
        }

        const entries = [
          {
            w: orderedWindows[0] || visibleWins[0],
            left: MARGIN,
            top: menubarHeight + MARGIN,
            width: leftColWidth,
            height: fullHeight,
            priority: 1,
          },
          {
            w: orderedWindows[1] || visibleWins[1],
            left: MARGIN + leftColWidth + GAP,
            top: menubarHeight + MARGIN,
            width: rightColWidth,
            height: halfHeight,
            priority: 2,
          },
          {
            w: orderedWindows[2] || visibleWins[2],
            left: MARGIN + leftColWidth + GAP,
            top: menubarHeight + MARGIN + halfHeight + GAP,
            width: rightColWidth,
            height: halfHeight,
            priority: 2,
          },
        ];

        return {
          type: "preferred",
          entries: entries,
          menubarHeight,
          margin: MARGIN,
        };
      }
    } else {
      // Handle 5 windows: both projects and experience open - stack them in column 2
      if (aboutMe && projects && experience && skills && contact) {
        const col1Width = Math.round(availableWidth * 0.28);
        const col2Width = Math.round(availableWidth * 0.38);
        const col3Width = availableWidth - col1Width - col2Width - GAP * 2;
        const fullHeight = availableHeight;
        const halfHeightCol2 = Math.round((fullHeight - GAP) / 2);
        const halfHeightCol3 = Math.round((fullHeight - GAP) / 2);

        if (
          col1Width >= MIN_W &&
          col2Width >= MIN_W &&
          col3Width >= MIN_W &&
          halfHeightCol2 >= MIN_H &&
          halfHeightCol3 >= MIN_H
        ) {
          return {
            type: "preferred",
            entries: [
              {
                w: aboutMe,
                left: MARGIN,
                top: menubarHeight + MARGIN,
                width: col1Width,
                height: fullHeight,
                priority: 1,
              },
              {
                w: projects,
                left: MARGIN + col1Width + GAP,
                top: menubarHeight + MARGIN,
                width: col2Width,
                height: halfHeightCol2,
                priority: 1,
              },
              {
                w: experience,
                left: MARGIN + col1Width + GAP,
                top: menubarHeight + MARGIN + halfHeightCol2 + GAP,
                width: col2Width,
                height: halfHeightCol2,
                priority: 1,
              },
              {
                w: skills,
                left: MARGIN + col1Width + GAP + col2Width + GAP,
                top: menubarHeight + MARGIN,
                width: col3Width,
                height: halfHeightCol3,
                priority: 2,
              },
              {
                w: contact,
                left: MARGIN + col1Width + GAP + col2Width + GAP,
                top: menubarHeight + MARGIN + halfHeightCol3 + GAP,
                width: col3Width,
                height: halfHeightCol3,
                priority: 2,
              },
            ],
            menubarHeight,
            margin: MARGIN,
          };
        }
      } else if (aboutMe && projects && skills && contact && !experience) {
        // Handle 4 windows: aboutMe, projects, skills, contact (experience closed)
        const col1Width = Math.round(availableWidth * 0.33);
        const col2Width = Math.round(availableWidth * 0.33);
        const col3Width = availableWidth - col1Width - col2Width - GAP * 2;
        const fullHeight = availableHeight;
        const halfHeight = Math.round((fullHeight - GAP) / 2);

        if (
          col1Width >= MIN_W &&
          col2Width >= MIN_W &&
          col3Width >= MIN_W &&
          halfHeight >= MIN_H
        ) {
          return {
            type: "preferred",
            entries: [
              {
                w: aboutMe,
                left: MARGIN,
                top: menubarHeight + MARGIN,
                width: col1Width,
                height: fullHeight,
                priority: 1,
              },
              {
                w: projects,
                left: MARGIN + col1Width + GAP,
                top: menubarHeight + MARGIN,
                width: col2Width,
                height: fullHeight,
                priority: 1,
              },
              {
                w: skills,
                left: MARGIN + col1Width + GAP + col2Width + GAP,
                top: menubarHeight + MARGIN,
                width: col3Width,
                height: halfHeight,
                priority: 2,
              },
              {
                w: contact,
                left: MARGIN + col1Width + GAP + col2Width + GAP,
                top: menubarHeight + MARGIN + halfHeight + GAP,
                width: col3Width,
                height: halfHeight,
                priority: 2,
              },
            ],
            menubarHeight,
            margin: MARGIN,
          };
        }
      } else if (aboutMe && experience && skills && contact && !projects) {
        // Handle 4 windows: aboutMe, experience, skills, contact (projects closed)
        const col1Width = Math.round(availableWidth * 0.33);
        const col2Width = Math.round(availableWidth * 0.33);
        const col3Width = availableWidth - col1Width - col2Width - GAP * 2;
        const fullHeight = availableHeight;
        const halfHeight = Math.round((fullHeight - GAP) / 2);

        if (
          col1Width >= MIN_W &&
          col2Width >= MIN_W &&
          col3Width >= MIN_W &&
          halfHeight >= MIN_H
        ) {
          return {
            type: "preferred",
            entries: [
              {
                w: aboutMe,
                left: MARGIN,
                top: menubarHeight + MARGIN,
                width: col1Width,
                height: fullHeight,
                priority: 1,
              },
              {
                w: experience,
                left: MARGIN + col1Width + GAP,
                top: menubarHeight + MARGIN,
                width: col2Width,
                height: fullHeight,
                priority: 1,
              },
              {
                w: skills,
                left: MARGIN + col1Width + GAP + col2Width + GAP,
                top: menubarHeight + MARGIN,
                width: col3Width,
                height: halfHeight,
                priority: 2,
              },
              {
                w: contact,
                left: MARGIN + col1Width + GAP + col2Width + GAP,
                top: menubarHeight + MARGIN + halfHeight + GAP,
                width: col3Width,
                height: halfHeight,
                priority: 2,
              },
            ],
            menubarHeight,
            margin: MARGIN,
          };
        }
      } else {
        const cols = windowCount <= 4 ? 2 : 3;
        const rows = Math.ceil(windowCount / cols);
        const colWidth = Math.round((availableWidth - GAP * (cols - 1)) / cols);
        const rowHeight = Math.round(
          (availableHeight - GAP * (rows - 1)) / rows
        );

        if (colWidth >= MIN_W && rowHeight >= MIN_H) {
          // Sort windows to ensure "about" is always on the left (first)
          const sortedWins = [...visibleWins].sort((a, b) => {
            if (a.dataset.app === "about") return -1;
            if (b.dataset.app === "about") return 1;
            return 0;
          });

          const entries = [];
          sortedWins.forEach((w, idx) => {
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            entries.push({
              w: w,
              left: MARGIN + col * (colWidth + GAP),
              top: menubarHeight + MARGIN + row * (rowHeight + GAP),
              width: colWidth,
              height: rowHeight,
              priority: 1,
            });
          });

          return {
            type: "preferred",
            entries: entries,
            menubarHeight,
            margin: MARGIN,
          };
        }
      }
    }
  }

  return null;
}

export function smartDistributeWindows(wins) {
  const mobile = isMobile();
  if (mobile) {
    return null;
  }

  const visibleWins = wins.filter(
    (w) => !w.classList.contains("hidden") && !w.classList.contains("maximized")
  );
  if (!visibleWins.length) {
    return null;
  }

  const menubarHeight =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--menubar-height"
      )
    ) || 28;
  const dockHeight =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--dock-height"
      )
    ) || 84;

  const MARGIN = 24;
  const GAP = 24;
  const MIN_W = 220;
  const MIN_H = 140;

  const availableWidth = window.innerWidth - MARGIN * 2;
  const availableHeight =
    window.innerHeight - menubarHeight - dockHeight - MARGIN * 2;

  if (availableWidth < MIN_W || availableHeight < MIN_H) {
    return null;
  }

  const preferredLayout = createPreferredLayout(
    visibleWins,
    availableWidth,
    availableHeight,
    menubarHeight,
    MARGIN,
    GAP
  );
  if (preferredLayout) {
    return preferredLayout;
  }

  const getWindowPriority = (w) => {
    const appId = w.dataset.app;
    switch (appId) {
      case "about":
      case "projects":
      case "experience":
        return 1;
      case "contact":
      case "skills":
        return 2;
      default:
        return 2;
    }
  };

  const getPositionOrder = (w) => {
    const appId = w.dataset.app;
    switch (appId) {
      case "about":
        return 1;
      case "projects":
        return 2;
      case "experience":
        return 3;
      case "skills":
        return 4;
      case "contact":
        return 5;
      default:
        return 6;
    }
  };

  const meta = visibleWins.map((w) => {
    const style =
      w.getAttribute("data-original-style") || w.getAttribute("style") || "";
    const widthMatch = style.match(/width:\s*(\d+)px/);
    const heightMatch = style.match(/height:\s*(\d+)px/);
    let width = widthMatch
      ? parseInt(widthMatch[1])
      : Math.round(w.offsetWidth) || 420;
    let height = heightMatch
      ? parseInt(heightMatch[1])
      : Math.round(w.offsetHeight) || 280;
    width = Math.max(width, MIN_W);
    height = Math.max(height, MIN_H);
    const aspect = width / height;
    const priority = getWindowPriority(w);
    const positionOrder = getPositionOrder(w);
    return {
      w,
      width,
      height,
      aspect,
      baseArea: width * height,
      priority,
      positionOrder,
    };
  });

  meta.sort((a, b) => {
    return a.positionOrder - b.positionOrder;
  });

  const totalBaseArea = meta.reduce((s, m) => s + m.baseArea, 0);

  let best = null;
  const maxCols = Math.min(meta.length, 6);
  for (let cols = 1; cols <= maxCols; cols++) {
    const rows = Math.ceil(meta.length / cols);
    const cellWidth = (availableWidth - GAP * (cols - 1)) / cols;
    const cellHeight = (availableHeight - GAP * (rows - 1)) / rows;
    if (cellWidth < MIN_W || cellHeight < MIN_H) {
      continue;
    }

    let usedArea = 0;
    const layoutEntries = [];
    meta.forEach((m, idx) => {
      const priorityMultiplier = m.priority === 1 ? 1.5 : 0.75;
      const areaShare = (m.baseArea / totalBaseArea) * priorityMultiplier;
      const targetArea = areaShare * (cols * rows * cellWidth * cellHeight);

      let targetWidth = Math.sqrt(targetArea * m.aspect);
      let targetHeight = targetWidth / m.aspect;

      if (m.priority === 1) {
        const widthBonus = 3.4;
        const heightBonus = 1.2;
        targetWidth = Math.min(targetWidth * widthBonus, cellWidth * 0.95);
        targetHeight = Math.min(targetHeight * heightBonus, cellHeight);

        if (targetHeight === cellHeight) {
          targetWidth = Math.min(targetHeight * m.aspect, cellWidth * 0.95);
        }
      }

      const scaleDown = Math.min(
        cellWidth / targetWidth,
        cellHeight / targetHeight,
        1
      );
      targetWidth *= scaleDown;
      targetHeight *= scaleDown;

      if (targetWidth < MIN_W || targetHeight < MIN_H) {
        const minScale = Math.max(MIN_W / targetWidth, MIN_H / targetHeight);
        targetWidth = Math.min(targetWidth * minScale, cellWidth);
        targetHeight = Math.min(targetHeight * minScale, cellHeight);
      }
      usedArea += targetWidth * targetHeight;

      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const left =
        MARGIN + col * (cellWidth + GAP) + (cellWidth - targetWidth) / 2;
      const top =
        menubarHeight +
        MARGIN +
        row * (cellHeight + GAP) +
        (cellHeight - targetHeight) / 2;
      layoutEntries.push({
        w: m.w,

        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(targetWidth),
        height: Math.round(targetHeight),
        priority: m.priority,
      });
    });

    const totalGridArea = cols * rows * cellWidth * cellHeight;
    const wasted = totalGridArea - usedArea;
    const wastedRatio = wasted / totalGridArea;

    if (!best || wastedRatio < best.wastedRatio) {
      best = {
        cols,
        rows,
        cellWidth,
        cellHeight,
        wastedRatio,
        layoutEntries,
      };
    }
  }

  if (!best) {
    return null;
  }

  return {
    type: "grid",
    entries: best.layoutEntries,
    menubarHeight,
    dockHeight,
    margin: MARGIN,
  };
}

export function applyCenteredPositions(positionData) {
  if (!positionData) {
    return;
  }

  const { windowData, offsetX, offsetY, scale = 1, margin = 24 } = positionData;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const menubarHeight =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--menubar-height"
      )
    ) || 28;
  const dockHeight =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--dock-height"
      )
    ) || 84;
  const usableBottom = viewportH - dockHeight - margin;
  const topSafe = menubarHeight + margin;

  const MIN_W = 220;
  const MIN_H = 140;

  windowData.forEach(({ w, left, top, width, height, originalStyle }) => {
    if (w.classList.contains("hidden")) {
      return;
    }

    if (!w.getAttribute("data-original-style")) {
      w.setAttribute("data-original-style", originalStyle);
    }

    const scaledLeft = left * scale;
    const scaledTop = top * scale;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const newLeft = Math.round(scaledLeft + offsetX);
    const newTop = Math.round(scaledTop + offsetY);
    const newWidth = Math.round(scaledWidth);
    const newHeight = Math.round(scaledHeight);

    const finalWidth = Math.max(newWidth, MIN_W);
    const finalHeight = Math.max(newHeight, MIN_H);

    const clampedLeft = Math.min(
      Math.max(newLeft, margin),
      viewportW - margin - finalWidth
    );

    const clampedTop = Math.min(
      Math.max(newTop, topSafe),
      usableBottom - finalHeight
    );

    let newStyle = `left: ${clampedLeft}px; top: ${clampedTop}px;`;
    newStyle += ` width: ${finalWidth}px;`;
    newStyle += ` height: ${finalHeight}px;`;
    w.setAttribute("style", newStyle);
  });
}

export function applySmartLayout(layout) {
  if (!layout || (layout.type !== "grid" && layout.type !== "preferred")) {
    return;
  }

  layout.entries.forEach((entry) => {
    const { w, left, top, width, height } = entry;
    const style = `left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px;`;
    w.setAttribute("style", style);
    w.setAttribute("data-original-style", style);
  });
}
