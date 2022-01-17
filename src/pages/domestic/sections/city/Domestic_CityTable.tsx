import React from "react";

import { rem } from "polished";

import useApi from "@hooks/useApi";
import DomesticApi from "@apis/domestic-api";
import { styled } from "@styles/stitches.config";
import { formatObjectValues } from "@utils/object-util";
import { getCityGuNameWithIds } from "@utils/domestic-util";

import Table from "@components/Table";

import type { Stat } from "@_types/common-type";
import type { DomesticTableKey } from "@_types/domestic-type";
import type { TableColumn, TableRow, TableRowValue } from "@components/Table";

const columns: Array<TableColumn<DomesticTableKey | "cityName">> = [
  {
    id: "cityName",
    name: "지역",
    width: rem(46),
  },
  {
    id: "casesLive",
    name: "오늘 확진자",
    width: rem(106),
    sortable: true,
    defaultSortBy: true,
  },
  {
    id: "confirmed",
    name: "총 확진자",
    width: rem(132),
    sortable: true,
  },
  {
    id: "deceased",
    name: "총 사망자",
    width: rem(90),
    sortable: true,
  },
  {
    id: "recovered",
    name: "총 완치자",
    width: rem(126),
    sortable: true,
  },
  {
    id: "per100k",
    name: "10만명당 확진자",
    width: rem(80),
    sortable: true,
  },
];

type ColumnKey = typeof columns[number]["id"];

const statToTableRowValue = (value: Stat | string): TableRowValue => {
  if (typeof value === "string") {
    return { text: value };
  }

  return {
    stat: value[0],
    delta: value[1],
  };
};

const DomesticTable: React.FC = () => {
  const { data: live } = useApi(DomesticApi.live);
  const { data: stat } = useApi(DomesticApi.stat);

  const rows: Array<TableRow<ColumnKey>> = Object.keys(stat.cities).map(
    (_cityId) => {
      const cityId = Number(_cityId);
      const cityName = getCityGuNameWithIds(cityId);
      const { confirmed, deceased, recovered, per100k } = stat.cities[cityId];
      const casesLive = live.cities[cityId];

      const link = cityId !== 17 ? `/city/${cityId}/` : "/";

      return formatObjectValues(
        { cityName, confirmed, deceased, recovered, per100k, casesLive, link },
        statToTableRowValue
      ) as TableRow<ColumnKey>;
    }
  );

  return (
    <Wrapper>
      <Table columns={columns} rows={rows} statUnit="명" />
    </Wrapper>
  );
};

const Wrapper = styled("div", {
  // overflowX: "scroll",
  overflowX: "hidden",
});

export default DomesticTable;