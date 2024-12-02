import { Icon } from "antd";
import { useMemo } from "react";
import {
  WindowsIcon,
  MacIcon,
  LinuxIcon,
  UbuntuIcon,
  FreebsdIcon,
  DebianIcon,
} from "@/components/infini/Icons";

export const Platforms = {
  Windows: "windows",
  MacOS: "darwin",
  Linux: "linux",
  Ubuntu: "ubuntu",
  Freebsd: "freebsd",
  Debian: "debian",
};

export const OSPlatformIcon = ({
  platform,
  width = "24px",
  height = "24px",
}) => {
  platform = typeof platform === "string" ? platform.toLowerCase() : "";

  if (platform.indexOf(Platforms.Windows) > -1) {
    return <WindowsIcon width={width} height={height} />;
  } else if (platform.indexOf(Platforms.MacOS) > -1) {
    return <MacIcon width={width} height={height} />;
  } else if (platform.indexOf(Platforms.Ubuntu) > -1) {
    return <UbuntuIcon width={width} height={height} />;
  } else if (platform.indexOf(Platforms.Freebsd) > -1) {
    return <FreebsdIcon width={width} height={height} />;
  } else if (platform.indexOf(Platforms.Debian) > -1) {
    return <DebianIcon width={width} height={height} />;
  } else {
    return <LinuxIcon width={width} height={height} />;
  }
};
