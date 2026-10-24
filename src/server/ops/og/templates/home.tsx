import type { VendorKey } from "@/lib/config/vendor-registry";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Col, Eyebrow, Frame, Img, Row } from "../elements/frame";
import { FONT_MONO, vendorImage } from "../lib/assets";
import { uiIcon, type UiIcon } from "../lib/icons";
import { C } from "../lib/theme";

const ICON = 30;

type Integration = {
  label: "DISCORD" | "TELEGRAM" | "WEB" | "API";
  vendor?: VendorKey;
  icon?: UiIcon;
};

const INTEGRATIONS: Integration[] = [
  { label: "DISCORD", vendor: "discord" },
  { label: "TELEGRAM", vendor: "telegram" },
  { label: "WEB", icon: "monitor" },
  { label: "API", icon: "braces" },
];

export async function homeCard(locale: Locale): Promise<ReactNode> {
  const t = await getTranslations({ locale });
  const icons = await Promise.all(
    INTEGRATIONS.map((item) =>
      item.vendor
        ? vendorImage(item.vendor, ICON, C.text)
        : item.icon
          ? uiIcon(item.icon, ICON, C.text)
          : null,
    ),
  );

  return (
    <Frame
      label={t("OG.HOME_LABEL")}
      footer={<Eyebrow>{t("LANDING.ANNOUNCEMENT")}</Eyebrow>}
    >
      <Col style={{ flexGrow: 1, justifyContent: "space-between" }}>
        <Col style={{ gap: 24 }}>
          <span
            style={{
              fontSize: 68,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 940,
            }}
          >
            {t("LANDING.HEADLINE")}
          </span>
          <span
            style={{
              fontSize: 25,
              lineHeight: 1.4,
              color: C.muted,
              maxWidth: 880,
            }}
          >
            {t("LANDING.SUBHEADLINE")}
          </span>
        </Col>
        <Row style={{ alignItems: "center", gap: 28 }}>
          <Eyebrow>{t("OG.POST_FROM")}</Eyebrow>
          <Row style={{ gap: 12 }}>
            {INTEGRATIONS.map((item, i) => (
              <Row
                key={item.label}
                style={{
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 18px",
                  border: `1px solid ${C.hairline}`,
                  backgroundColor: C.fill,
                }}
              >
                <Img src={icons[i] ?? null} size={ICON} fallback="" />
                <span
                  style={{ fontFamily: FONT_MONO, fontSize: 19, color: C.soft }}
                >
                  {t(`LANDING.SHOWCASE.TABS.${item.label}`)}
                </span>
              </Row>
            ))}
          </Row>
        </Row>
      </Col>
    </Frame>
  );
}
