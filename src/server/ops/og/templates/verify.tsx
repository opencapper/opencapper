import { formatUtcDate } from "@/lib/utils/format/date";
import { listAnchors } from "@/server/log/anchor.service";
import { getLogHead } from "@/server/log/log.service";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Col, Frame, Img, Row, Stat } from "../elements/frame";
import { uiIcon } from "../lib/icons";
import { C } from "../lib/theme";

export async function verifyCard(locale: Locale): Promise<ReactNode> {
  const [t, head, anchors, bitcoin] = await Promise.all([
    getTranslations({ locale }),
    getLogHead(),
    listAnchors(),
    uiIcon("bitcoin", 34, C.soft),
  ]);
  const stamp = anchors[0];

  return (
    <Frame label={t("VERIFY.LABEL")}>
      <Col style={{ flexGrow: 1, justifyContent: "space-between" }}>
        <Col style={{ gap: 22 }}>
          <span
            style={{
              fontSize: 76,
              fontWeight: 500,
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            {t("VERIFY.HEADING")}
          </span>
          <span
            style={{
              fontSize: 25,
              lineHeight: 1.4,
              color: C.muted,
              maxWidth: 900,
            }}
          >
            {t("VERIFY.DESCRIPTION")}
          </span>
        </Col>
        <Row style={{ justifyContent: "space-between" }}>
          <Stat
            label={t("OG.PICKS_SEALED")}
            value={new Intl.NumberFormat(locale).format(head.size)}
          />
          <Stat
            label={t("OG.LAST_STAMP")}
            value={
              stamp ? formatUtcDate(stamp.createdAt, locale) : t("OG.NO_STAMP")
            }
            icon={<Img src={bitcoin} size={34} fallback="" />}
          />
          <Stat
            label={t("OG.LOG_ROOT")}
            value={head.root.slice(0, 12)}
            color={C.soft}
          />
        </Row>
      </Col>
    </Frame>
  );
}
