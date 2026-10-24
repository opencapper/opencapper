import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Col, Frame, Wordmark } from "../elements/frame";
import { C } from "../lib/theme";

export async function brandCard(locale: Locale): Promise<ReactNode> {
  const t = await getTranslations({ locale });
  return (
    <Frame label={t("OG.HOME_LABEL")}>
      <Col style={{ flexGrow: 1, justifyContent: "center", gap: 36 }}>
        <Wordmark size={64} />
        <span
          style={{
            fontSize: 30,
            lineHeight: 1.35,
            color: C.soft,
            maxWidth: 900,
          }}
        >
          {t("METADATA.DESCRIPTION")}
        </span>
      </Col>
    </Frame>
  );
}
