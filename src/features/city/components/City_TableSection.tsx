import React, { useMemo } from "react";

import { rem } from "polished";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import Section from "@components/Section";
import Table, { TableColumn, TableRow, TableRowValue } from "@components/Table";

import useApi from "@hooks/useApi";
import { styled } from "@styles/stitches.config";
import InfoIcon from "@components/icon/Icon_Info";
import { formatObjectValues } from "@utils/object-util";

import CityApi from "@features/city/city-api";
import { getCityGuNameWithIds } from "@features/domestic/domestic-util";

import type { Stat } from "@_types/common-type";

const statToTableRowValue = (value: Stat | string): TableRowValue => {
  if (typeof value === "string" || !value) {
    return { text: (value as string) ?? "0" };
  }

  return {
    stat: value[0],
    delta: value[1],
  };
};

const SHOW_INFO_MESSAGE_CITY_LIST = [0, 1, 2, 3, 4, 5, 8, 9, 11];

export const CityTableSection: React.FC = () => {
  const params = useParams<{ cityId: string }>();

  const { data: live } = useApi(CityApi.live(params.cityId));
  const { data: stat } = useApi(CityApi.stat(params.cityId));

  const { t } = useTranslation();

  const columns: Array<TableColumn<any>> = [
    {
      id: "guName",
      name: t("city"),
      width: rem(66),
    },
    {
      id: "casesLive",
      name: t("stat.confirmed_today"),
      width: rem(100),
      sortable: true,
      defaultSortBy: true,
    },
    {
      id: "confirmed",
      name: t("stat.confirmed"),

      width: rem(132),
      sortable: true,
    },
  ];

  type ColumnKey = typeof columns[number]["id"];

  const rows: Array<TableRow<ColumnKey>> = useMemo(
    () =>
      Object.keys(stat.gus)
        .filter((guId) => Number(guId) > -1)
        .map((_guId) => {
          const guId = Number(_guId);
          const guName =
            getCityGuNameWithIds(params.cityId, guId).split?.(" ")?.[1] ??
            "전체";

          const confirmed = stat.gus[guId];
          const casesLive = live.gus[guId];

          return formatObjectValues(
            { guName, confirmed, casesLive },
            statToTableRowValue
          );
        }),
    [live, stat, params]
  );

  const showInfoMessage = useMemo(
    () => SHOW_INFO_MESSAGE_CITY_LIST.includes(Number(params.cityId)),
    [params]
  );

  if (rows.length === 0) return <></>;

  return (
    <>
      {showInfoMessage && (
        <InfoWrapper>
          <InfoIcon size={16} />
          <InfoContainer>
            최근 확진자 증가세로 인해 일부 지자체에서는 당일 발생 확진자 수를
            당일이 아닌 다음 날 발표하도록 변경하였으므로 "오늘 확진자"가 0명을
            표시된 지역이 있을 수 있습니다
          </InfoContainer>
        </InfoWrapper>
      )}

      <Wrapper>
        <Table
          columns={columns}
          rows={rows}
          statUnit={t("stat.unit")}
          css={{ width: "100%" }}
        />
      </Wrapper>
    </>
  );
};

export const CityTableSectionSkeleton = () => {
  return <Wrapper css={{ height: rem(1605) }}></Wrapper>;
};

const Wrapper = styled(Section, {
  overflowX: "hidden",
  paddingY: rem(20),
});

const InfoWrapper = styled(Section, {
  padding: rem(20),
  columnCentered: true,
});

const InfoContainer = styled("div", {
  body3: true,
  textAlign: "center",
  wordBreak: "keep-all",
  lineHeight: rem(26),
  marginTop: rem(12),

  "@md": {
    body2: true,
  },
});
